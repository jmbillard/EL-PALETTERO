/* El PALLETERO · host (ExtendScript)
   Todas as funções públicas começam com PAL_ e devolvem uma string JSON para o painel.
   Antes se chamava O PALETTERO: o host lê os locais antigos (pasta de preferências,
   namespace XMP e o xmp:Label do script clássico) e migra para os novos. */

if (typeof ExternalObject.AdobeXMPScript == 'undefined' || ExternalObject.AdobeXMPScript == undefined) {
	try { ExternalObject.AdobeXMPScript = new ExternalObject('lib:AdobeXMPScript'); } catch (e) {}
}

var PAL_PREFS_FOLDER = Folder.userData.fullName + '/El PALLETERO';
var PAL_OLD_PREFS_FOLDER = Folder.userData.fullName + '/O PALETTERO script'; // nome antigo (e do script clássico)
var PAL_DEFAULT_SWATCHES = [
	'#F13333', '#FF4D4D', '#FE674C', '#FF8F4D', '#FFC44E', '#5DE6A2',
	'#80C0FE', '#B5ADFF', '#FF8CCD', '#FF739A', '#FF5A68'
];

// ---------------------------------------------------------------- utilidades (ES3)

function PAL_json(v) {
	if (v === null || v === undefined) return 'null';
	var t = typeof v;
	if (t == 'number') return isFinite(v) ? String(v) : 'null';
	if (t == 'boolean') return v ? 'true' : 'false';
	if (t == 'string') {
		return '"' + v.replace(/[\\"\u0000-\u001f\u2028\u2029]/g, function (c) {
			var m = { '"': '\\"', '\\': '\\\\', '\n': '\\n', '\r': '\\r', '\t': '\\t' };
			if (m[c]) return m[c];
			var h = c.charCodeAt(0).toString(16);
			return '\\u' + '0000'.substr(h.length) + h;
		}) + '"';
	}
	var out = [], k;
	if (v instanceof Array) {
		for (k = 0; k < v.length; k++) out.push(PAL_json(v[k]));
		return '[' + out.join(',') + ']';
	}
	for (k in v) if (v.hasOwnProperty(k)) out.push(PAL_json(k) + ':' + PAL_json(v[k]));
	return '{' + out.join(',') + '}';
}

function PAL_parse(s) {
	// entrada vem do próprio painel ou do preferences.json do usuário
	return eval('(' + s + ')');
}

function PAL_has(arr, v) {
	for (var i = 0; i < arr.length; i++) if (arr[i] == v) return true;
	return false;
}

function PAL_hex(c) {
	var s = '#';
	for (var i = 0; i < 3; i++) {
		var h = Math.round(Math.max(0, Math.min(1, c[i])) * 255).toString(16);
		s += h.length < 2 ? '0' + h : h;
	}
	return s.toUpperCase();
}

function PAL_rgb(hex) {
	hex = hex.replace('#', '');
	return [parseInt(hex.substr(0, 2), 16) / 255, parseInt(hex.substr(2, 2), 16) / 255, parseInt(hex.substr(4, 2), 16) / 255];
}

function PAL_readFile(path) {
	var f = new File(path);
	if (!f.exists) return null;
	f.encoding = 'UTF-8';
	f.open('r');
	var s = f.read();
	f.close();
	return s;
}

function PAL_writeFile(path, content) {
	var folder = new Folder(PAL_PREFS_FOLDER);
	if (!folder.exists) folder.create();
	var f = new File(path);
	f.encoding = 'UTF-8';
	f.open('w');
	f.write(content);
	f.close();
}

// ---------------------------------------------------------------- projeto
// A paleta do projeto vive num grupo de metadados próprio (namespace El PALLETERO).
// Lidos só para migrar: o namespace do O PALETTERO e o xmp:Label do script clássico.
// No primeiro salvamento, a paleta passa para o namespace novo e o antigo é apagado.

var PAL_NS = 'https://github.com/jmbillard/El-PALLETERO/ns/1.0/';
var PAL_NS_OLD = 'https://github.com/jmbillard/O-PALETTERO/ns/1.0/';
var PAL_NS_FIELDS = ['palette', 'preset', 'version', 'updated'];
try { XMPMeta.registerNamespace(PAL_NS, 'elpalletero'); } catch (e) {}
try { XMPMeta.registerNamespace(PAL_NS_OLD, 'opalettero'); } catch (e) {}

function PAL_projectKey() {
	if (!app.project) return PAL_json('');
	var f = app.project.file;
	return PAL_json(f ? f.fsName : 'sem título');
}

function PAL_projectName() {
	var f = app.project.file;
	return f ? decodeURI(f.name).replace(/\.aep[x]?$/i, '') : 'sem título';
}

function PAL_legacyPalette(meta) {
	var out = [];
	var ns = XMPMeta.getNamespaceURI('xmp');
	if (!meta.doesPropertyExist(ns, 'xmp:Label')) return out;
	var items = meta.getProperty(ns, 'xmp:Label').toString().split('-');
	for (var i = 0; i < items.length; i++) {
		var p = items[i].split(':');
		if (!/^#[0-9A-F]{6}$/i.test(p[0])) continue;
		out.push({ color: p[0].toUpperCase(), label: p.length > 1 ? p[1] : '' });
	}
	return out;
}

function PAL_loadPalette() {
	var name = PAL_projectName();
	try {
		var meta = new XMPMeta(app.project.xmpPacket);
		var spaces = [PAL_NS, PAL_NS_OLD];
		for (var n = 0; n < spaces.length; n++) {
			var ns = spaces[n];
			if (!meta.doesPropertyExist(ns, 'palette')) continue;
			var data = PAL_parse(meta.getProperty(ns, 'palette').toString());
			var from = meta.doesPropertyExist(ns, 'preset') ? meta.getProperty(ns, 'preset').toString() : '';
			return PAL_json({ source: ns == PAL_NS ? 'project' : 'migrate', project: name, preset: from, swatches: data });
		}
		var legacy = PAL_legacyPalette(meta);
		if (legacy.length) return PAL_json({ source: 'legacy', project: name, swatches: legacy });
	} catch (e) {}
	var def = PAL_defaultPreset();
	return PAL_json({ source: 'default', project: name, preset: def.name, swatches: def.swatches });
}

// swatchesJson: [{color, label, auto}] · preset: nome do preset de origem (opcional)
function PAL_savePalette(swatchesJson, preset) {
	var meta = new XMPMeta(app.project.xmpPacket);
	// preset não informado: mantém o que já havia (inclusive no namespace antigo)
	if (preset === undefined) {
		if (meta.doesPropertyExist(PAL_NS, 'preset')) preset = meta.getProperty(PAL_NS, 'preset').toString();
		else if (meta.doesPropertyExist(PAL_NS_OLD, 'preset')) preset = meta.getProperty(PAL_NS_OLD, 'preset').toString();
	}
	for (var i = 0; i < PAL_NS_FIELDS.length; i++) {
		try { meta.deleteProperty(PAL_NS_OLD, PAL_NS_FIELDS[i]); } catch (e) {}
	}
	meta.setProperty(PAL_NS, 'version', '1');
	meta.setProperty(PAL_NS, 'palette', swatchesJson);
	meta.setProperty(PAL_NS, 'updated', new Date().toUTCString());
	if (preset !== undefined) {
		if (preset) meta.setProperty(PAL_NS, 'preset', preset);
		else meta.deleteProperty(PAL_NS, 'preset');
	}
	app.project.xmpPacket = meta.serialize();
	return PAL_json({ ok: true });
}

// ---------------------------------------------------------------- preferências

function PAL_readPrefs() {
	var raw = PAL_readFile(PAL_PREFS_FOLDER + '/preferences.json');
	if (!raw) return {};
	try { return PAL_parse(raw); } catch (e) { return {}; }
}

function PAL_loadPrefs() {
	var p = PAL_readPrefs();
	return PAL_json({
		showColorLabels: p.showColorLabels !== false,
		showColorInfo: p.showColorInfo !== false,
		labelType: p.labelType || '#HEX',
		defaultPreset: p.defaultPreset || '',
		presetFolder: PAL_presetLocation().path
	});
}

function PAL_savePrefs(json) {
	var next = PAL_parse(json);
	var cur = PAL_readPrefs();
	for (var k in next) if (next.hasOwnProperty(k)) cur[k] = next[k];
	PAL_writeFile(PAL_PREFS_FOLDER + '/preferences.json', PAL_json(cur));
	return PAL_json({ ok: true });
}

// ---------------------------------------------------------------- caminhos de rede (Windows × Mac)
// Adaptado do O PADEIRO (file system lib / acessorista): sufixos de volume no Mac,
// leitura do "mount" e montagem via osascript. Aqui o mapa servidor ↔ unidade ↔ volume
// é descoberto na hora ("net use" no Windows, "mount" no Mac), sem lista fixa de servidores.
//
// A pasta de presets é guardada em duas formas:
//   presetFolder    → como foi escolhida nesta máquina (C:\..., L:\..., /Volumes/VFX-1/...)
//   presetFolderNet → forma neutra de rede "//servidor/share/resto" (vazia se for pasta local)
// Em qualquer sistema, a forma neutra é convertida para o caminho que existe agora.

var PAL_OS = $.os.indexOf('Win') >= 0 ? 'Win' : 'Mac';
var PAL_MOUNTS = null, PAL_MOUNTS_AT = 0;

function PAL_slash(p) { return String(p || '').replace(/\\/g, '/'); }
function PAL_trim(s) { return String(s || '').replace(/^\s+|\s+$/g, ''); }

// "//servidor/share/a/b" → { server, share, rest: '/a/b' }
function PAL_splitUNC(p) {
	var m = PAL_slash(p).replace(/^smb:/i, '').match(/^\/\/(?:[^@\/]*@)?([^\/]+)\/([^\/]+)(\/.*)?$/);
	if (!m) return null;
	return { server: m[1], share: m[2], rest: (m[3] || '').replace(/\/+$/, '') };
}

// servidores iguais? compara o nome completo ou só o primeiro rótulo (vfx-ml-sp ≈ vfx-ml-sp.servicos.corp…)
function PAL_sameServer(a, b) {
	a = String(a).toLowerCase(); b = String(b).toLowerCase();
	return a == b || a.split('.')[0] == b.split('.')[0];
}

// Windows: unidades mapeadas → UNC, lendo "net use" (uma vez por sessão do AE)
function PAL_winDrives() {
	if (PAL_MOUNTS) return PAL_MOUNTS;
	PAL_MOUNTS = {};
	try {
		var lines = String(system.callSystem('cmd.exe /c net use')).split(/\r?\n/);
		for (var i = 0; i < lines.length; i++) {
			var m = lines[i].match(/\s([A-Z]):\s+(\\\\\S.*?)(\s{2,}|\s*$)/i);
			if (m) PAL_MOUNTS[m[1].toUpperCase()] = PAL_slash(PAL_trim(m[2]));
		}
	} catch (e) {}
	return PAL_MOUNTS;
}

// Mac: volumes SMB/AFP montados → [{ server, share, mount }], lendo "/sbin/mount" (cache de 20 s)
function PAL_macMounts() {
	var now = new Date().getTime();
	if (PAL_MOUNTS && now - PAL_MOUNTS_AT < 20000) return PAL_MOUNTS;
	PAL_MOUNTS = [];
	PAL_MOUNTS_AT = now;
	try {
		var lines = String(system.callSystem('/sbin/mount')).split(/\r?\n/);
		for (var i = 0; i < lines.length; i++) {
			var m = lines[i].match(/^\/\/(?:[^@\/]*@)?([^\/]+)\/(.+?) on (\/Volumes\/.+?) \((smbfs|afpfs|nfs)/);
			if (!m) continue;
			var share = m[2];
			try { share = decodeURIComponent(share); } catch (e) {}
			PAL_MOUNTS.push({ server: m[1], share: share, mount: m[3].replace(/\\040/g, ' ').replace(/\/+$/, '') });
		}
	} catch (e) {}
	return PAL_MOUNTS;
}

// Mac: /Volumes/VFX/... que virou /Volumes/VFX-1 ... -5 ao ser montado de novo (do O PADEIRO)
function PAL_resolveVolume(path) {
	var m = path.match(/^\/Volumes\/([^\/]+)(\/.*)?$/);
	if (!m || new Folder(path).exists) return path;
	var base = m[1].replace(/-[1-5]$/, ''), rest = m[2] || '';
	var names = [m[1]];
	for (var i = 0; i <= 5; i++) { var n = i ? base + '-' + i : base; if (n != m[1]) names.push(n); }
	var best = path, bestDepth = -1;
	var parts = rest.split('/');
	for (var c = 0; c < names.length; c++) {
		var cur = '/Volumes/' + names[c];
		if (!new Folder(cur).exists) continue;
		var depth = 0;
		for (var p = 0; p < parts.length; p++) {
			if (!parts[p]) continue;
			cur += '/' + parts[p];
			if (!new Folder(cur).exists) break;
			depth++;
		}
		if (cur == '/Volumes/' + names[c] + rest) return cur;
		if (depth > bestDepth) { bestDepth = depth; best = '/Volumes/' + names[c] + rest; }
	}
	return best;
}

// caminho desta máquina → forma neutra de rede (ou '' se for local)
function PAL_toNet(path) {
	path = PAL_slash(path);
	if (PAL_splitUNC(path)) return path.replace(/^smb:/i, '');
	if (PAL_OS == 'Win') {
		var d = path.match(/^([A-Z]):(\/.*)?$/i);
		if (d) {
			var unc = PAL_winDrives()[d[1].toUpperCase()];
			if (unc) return unc + (d[2] || '').replace(/\/+$/, '');
		}
		return '';
	}
	var v = path.match(/^(\/Volumes\/[^\/]+)(\/.*)?$/);
	if (!v) return '';
	var mounts = PAL_macMounts();
	for (var i = 0; i < mounts.length; i++) {
		if (mounts[i].mount == v[1]) return '//' + mounts[i].server + '/' + mounts[i].share + (v[2] || '').replace(/\/+$/, '');
	}
	return '';
}

// forma neutra de rede → caminho que existe nesta máquina (ou o melhor palpite)
function PAL_fromNet(net) {
	var u = PAL_splitUNC(net);
	if (!u) return net;
	if (PAL_OS == 'Win') {
		// prefere a letra de unidade, se existir uma mapeada para esse share
		var drives = PAL_winDrives();
		for (var d in drives) {
			var du = PAL_splitUNC(drives[d]);
			if (!du || !PAL_sameServer(du.server, u.server) || du.share.toLowerCase() != u.share.toLowerCase()) continue;
			if ((u.rest + '/').toLowerCase().indexOf((du.rest + '/').toLowerCase()) == 0) {
				return d + ':' + (u.rest.substr(du.rest.length) || '/');
			}
		}
		return '//' + u.server + '/' + u.share + u.rest;
	}
	var mounts = PAL_macMounts();
	for (var i = 0; i < mounts.length; i++) {
		var m = mounts[i];
		var ms = m.share.split('/'), us = (u.share + u.rest).split('/');
		if (!PAL_sameServer(m.server, u.server)) continue;
		// o share montado pode ser um subcaminho (//srv/VFX/imagem montado como /Volumes/imagem)
		var ok = true;
		for (var k = 0; k < ms.length; k++) if (!us[k] || us[k].toLowerCase() != ms[k].toLowerCase()) { ok = false; break; }
		if (ok) return m.mount + (us.length > ms.length ? '/' + us.slice(ms.length).join('/') : '');
	}
	return PAL_resolveVolume('/Volumes/' + u.share + u.rest);
}

// caminho guardado (de qualquer sistema) → caminho desta máquina
function PAL_localPath(native, net) {
	if (net) return PAL_fromNet(net);
	native = String(native || '');
	if (PAL_splitUNC(native)) return PAL_fromNet(native);
	if (PAL_OS == 'Mac') {
		if (/^[A-Z]:[\\\/]/i.test(native)) return '';                     // unidade do Windows sem forma de rede: impossível resolver
		if (/^\/Volumes\//.test(native)) return PAL_resolveVolume(native);
	} else if (/^\/Volumes\//.test(native)) {
		return '';                                                         // volume do Mac sem forma de rede
	}
	return native;
}

// raiz do volume/unidade (para saber se está montado)
function PAL_volumeRoot(path) {
	path = PAL_slash(path);
	var m = path.match(/^(\/Volumes\/[^\/]+)/) || path.match(/^(\/\/[^\/]+\/[^\/]+)/) || path.match(/^([A-Z]:)/i);
	return m ? m[1] : '';
}

// ---------------------------------------------------------------- presets (um .json por preset)

function PAL_defaultPresetPath() { return PAL_PREFS_FOLDER + '/presets'; }

// { folder: Folder|null, path, offline, volume, net }
function PAL_presetLocation() {
	var p = PAL_readPrefs();
	var native = p.presetFolder || PAL_defaultPresetPath();
	var net = p.presetFolderNet || '';
	var path = PAL_localPath(native, net);
	var u = PAL_splitUNC(net || native);
	var volume = u ? u.share : (PAL_volumeRoot(native).replace(/^\/Volumes\//, '') || native);

	if (!path) return { folder: null, path: native, offline: true, volume: volume, net: net };
	var f = new Folder(path);
	if (f.exists) return { folder: f, path: f.fsName, offline: false, volume: volume, net: net };

	// só cria a pasta se o volume existir (nunca cria nada dentro de /Volumes por engano)
	var root = PAL_volumeRoot(path);
	if (root && !new Folder(root).exists) return { folder: null, path: path, offline: true, volume: volume, net: net };
	if (f.create()) return { folder: f, path: f.fsName, offline: false, volume: volume, net: net };
	return { folder: null, path: path, offline: true, volume: volume, net: net };
}

function PAL_presetFolder() {
	var loc = PAL_presetLocation();
	if (!loc.folder) throw new Error('offline');
	return loc.folder;
}

// Mac: tenta montar o share da pasta de presets (o Finder pede a senha se precisar)
function PAL_mountPresetVolume() {
	if (PAL_OS != 'Mac') return PAL_json({ ok: false });
	var p = PAL_readPrefs();
	var u = PAL_splitUNC(p.presetFolderNet || p.presetFolder);
	if (!u) return PAL_json({ ok: false, reason: 'local' });
	try {
		system.callSystem('osascript -e \'mount volume "smb://' + u.server + '/' + encodeURI(u.share).replace(/'/g, '') + '"\'');
	} catch (e) {}
	PAL_MOUNTS = null;
	return PAL_listPresets();
}

function PAL_builtinSwatches() {
	var list = [];
	for (var d = 0; d < PAL_DEFAULT_SWATCHES.length; d++) list.push({ color: PAL_DEFAULT_SWATCHES[d], label: '', auto: true });
	return list;
}

function PAL_readPresets() {
	var loc = PAL_presetLocation();
	if (!loc.folder) return [];
	var files = loc.folder.getFiles('*.json'), out = [];
	for (var i = 0; i < files.length; i++) {
		try {
			var data = PAL_parse(PAL_readFile(files[i].fsName));
			if (!data || !(data.swatches instanceof Array)) continue;
			out.push({ id: decodeURI(files[i].name).replace(/\.json$/i, ''), name: data.name || decodeURI(files[i].name), swatches: data.swatches, updated: data.updated || 0 });
		} catch (e) {}
	}
	out.sort(function (a, b) { return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1; });
	return out;
}

function PAL_defaultPreset() {
	var id = PAL_readPrefs().defaultPreset;
	if (id) {
		var all = PAL_readPresets();
		for (var i = 0; i < all.length; i++) if (all[i].id == id) return all[i];
	}
	// o "preferences.json" do script antigo podia guardar uma paleta padrão
	var old = PAL_readPrefs().swatches;
	if (old instanceof Array && old.length) return { name: '', swatches: old };
	return { name: '', swatches: PAL_builtinSwatches() };
}

function PAL_listPresets() {
	var loc = PAL_presetLocation();
	if (!loc.folder) return PAL_json({ folder: loc.path, offline: true, volume: loc.volume, canMount: PAL_OS == 'Mac' && !!loc.net, presets: [] });
	// cria um primeiro preset para a biblioteca nunca começar vazia (só na pasta padrão)
	var list = PAL_readPresets();
	if (!list.length && !PAL_readPrefs().presetsSeeded) {
		PAL_savePreset(PAL_json({ name: 'El PALLETERO', swatches: PAL_builtinSwatches() }));
		PAL_savePrefs(PAL_json({ presetsSeeded: true }));
		list = PAL_readPresets();
	}
	return PAL_json({ folder: loc.path, offline: false, presets: list });
}

function PAL_slug(s) {
	s = String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
	return (s || 'paleta').substr(0, 32);
}

// presetJson: {id?, name, swatches}
function PAL_savePreset(presetJson) {
	var p = PAL_parse(presetJson);
	var id = p.id || (PAL_slug(p.name) + '-' + new Date().getTime().toString(36));
	var loc = PAL_presetLocation();
	if (!loc.folder) return PAL_json({ ok: false, reason: 'offline' });
	var f = new File(loc.folder.fsName + '/' + id + '.json');
	f.encoding = 'UTF-8';
	if (!f.open('w')) return PAL_json({ ok: false, reason: 'readonly' });
	f.write(PAL_json({ name: p.name, swatches: p.swatches, updated: new Date().getTime() }));
	f.close();
	return PAL_json({ ok: true, id: id });
}

function PAL_deletePreset(id) {
	var loc = PAL_presetLocation();
	if (!loc.folder) return PAL_json({ ok: false, reason: 'offline' });
	var f = new File(loc.folder.fsName + '/' + id + '.json');
	return PAL_json({ ok: f.exists ? f.remove() : false });
}

function PAL_choosePresetFolder() {
	var loc = PAL_presetLocation();
	var start = loc.folder || new Folder(Folder.myDocuments);
	var f = Folder.selectDialog('Pasta de presets do El PALLETERO', start);
	if (!f) return PAL_json({ ok: false });
	PAL_MOUNTS = null;
	var net = PAL_toNet(f.fsName);
	PAL_savePrefs(PAL_json({ presetFolder: f.fsName, presetFolderNet: net }));
	return PAL_json({ ok: true, folder: f.fsName, net: net });
}

function PAL_resetPresetFolder() {
	PAL_savePrefs(PAL_json({ presetFolder: '', presetFolderNet: '' }));
	return PAL_listPresets();
}

// abre a pasta no Explorer/Finder
function PAL_revealPresetFolder() {
	var loc = PAL_presetLocation();
	if (!loc.folder) return PAL_json({ ok: false, reason: 'offline' });
	try {
		if (PAL_OS == 'Win') system.callSystem('explorer "' + loc.folder.fsName + '"');
		else system.callSystem('open "' + loc.folder.fsName.replace(/"/g, '\\"') + '"');
	} catch (e) { loc.folder.execute(); }
	return PAL_json({ ok: true });
}

// ---------------------------------------------------------------- frame do layer selecionado

// no Windows um PNG ainda aberto não pode ser apagado: o que sobrar sai na próxima extração
function PAL_sweepTemp() {
	try {
		var old = Folder.temp.getFiles('elpalletero_*.png').concat(Folder.temp.getFiles('opalettero_*.png'));
		var limit = new Date().getTime() - 60000;
		for (var i = 0; i < old.length; i++) if (old[i].modified && old[i].modified.getTime() < limit) old[i].remove();
	} catch (e) {}
}

function PAL_releaseFrame(tmpId, path) {
	try {
		if (tmpId) {
			var item = app.project.itemByID(tmpId);
			if (item) { app.beginUndoGroup('El PALLETERO · extrair frame'); item.remove(); app.endUndoGroup(); }
		}
		if (path) { var f = new File(path); if (f.exists) f.remove(); }
	} catch (e) {}
	return PAL_json({ ok: true });
}

var PAL_IMAGE_EXT = /\.(png|jpe?g|gif|bmp|webp)$/i;

// devolve o caminho de um PNG (ou da própria imagem) para o painel ler as cores
function PAL_grabFrame() {
	var comp = app.project.activeItem;
	if (!(comp instanceof CompItem)) return PAL_json({ ok: false, reason: 'nocomp' });
	var layer = comp.selectedLayers.length ? comp.selectedLayers[0] : null;
	PAL_sweepTemp();
	var out = new File(Folder.temp.fsName + '/elpalletero_' + new Date().getTime() + '.png');
	var src = layer && layer.source ? layer.source : null;

	try {
		if (src instanceof FootageItem && src.mainSource instanceof FileSource && src.mainSource.isStill && src.file && PAL_IMAGE_EXT.test(src.file.name)) {
			// imagem comum: lê direto do arquivo, sem renderizar
			return PAL_json({ ok: true, path: src.file.fsName, temp: false, label: src.name, kind: 'image' });
		}
		if (src instanceof CompItem) {
			src.saveFrameToPng(layer.sourceTime(comp.time), out);
			return PAL_json({ ok: true, path: out.fsName, temp: true, label: src.name, kind: 'comp' });
		}
		if (src instanceof FootageItem && !(src.mainSource instanceof SolidSource)) {
			// vídeo, PSD, sequência…: renderiza o frame numa comp temporária
			app.beginUndoGroup('El PALLETERO · extrair frame');
			var fps = src.frameRate || comp.frameRate;
			var dur = Math.max(src.duration || 0, 1 / fps);
			var tmp = app.project.items.addComp('El PALLETERO tmp', src.width, src.height, src.pixelAspect || 1, dur, fps);
			tmp.layers.add(src);
			var t = src.mainSource.isStill ? 0 : Math.max(0, Math.min(dur - 1 / fps, layer.sourceTime(comp.time)));
			tmp.saveFrameToPng(t, out);
			app.endUndoGroup();
			// a comp temporária só sai depois que o painel ler o PNG (PAL_releaseFrame)
			return PAL_json({ ok: true, path: out.fsName, temp: true, tmpId: tmp.id, label: src.name, kind: src.mainSource.isStill ? 'image' : 'video' });
		}
		// sem fonte de imagem (shape, texto, sólido) ou nada selecionado: frame atual da composição
		comp.saveFrameToPng(comp.time, out);
		return PAL_json({ ok: true, path: out.fsName, temp: true, label: comp.name, kind: 'comp' });
	} catch (e) {
		return PAL_json({ ok: false, reason: 'error', message: e.message });
	}
}

// ---------------------------------------------------------------- aplicar cor

function PAL_isColor(prop) {
	try { return prop.propertyValueType == PropertyValueType.COLOR; } catch (e) { return false; }
}

function PAL_setProp(prop, value, time) {
	if (prop.numKeys > 0) prop.setValueAtTime(time, value);
	else prop.setValue(value);
}

function PAL_apply(hex, optsJson) {
	var comp = app.project.activeItem;
	if (!(comp instanceof CompItem)) return PAL_json({ ok: false, reason: 'nocomp' });
	var layers = comp.selectedLayers;
	if (!layers.length) return PAL_json({ ok: false, reason: 'nosel' });

	var c = PAL_rgb(hex);
	var color = [c[0], c[1], c[2], 1];
	var props = [], texts = [], i, p;

	// 1) propriedades de cor selecionadas têm prioridade
	for (i = 0; i < layers.length; i++) {
		var sel = layers[i].selectedProperties;
		for (p = 0; p < sel.length; p++) {
			if (PAL_isColor(sel[p])) props.push(sel[p]);
			else if (sel[p].matchName == 'ADBE Text Document') texts.push(sel[p]);
		}
	}

	app.beginUndoGroup('El PALLETERO · aplicar ' + hex);
	try {
		if (props.length || texts.length) {
			for (p = 0; p < props.length; p++) PAL_setProp(props[p], color, comp.time);
			for (p = 0; p < texts.length; p++) {
				var doc = texts[p].value;
				doc.applyFill = true;
				doc.fillColor = c;
				PAL_setProp(texts[p], doc, comp.time);
			}
			return PAL_json({ ok: true, mode: 'props', count: props.length + texts.length });
		}

		// 2) senão, efeito Fill — reaproveita o último Fill criado pelo painel
		for (i = 0; i < layers.length; i++) {
			var fx = layers[i].property('ADBE Effect Parade');
			if (!fx) continue;
			var last = fx.numProperties ? fx.property(fx.numProperties) : null;
			var fill = last && last.matchName == 'ADBE Fill' && /^#[0-9A-F]{6}$/.test(last.name) ? last : fx.addProperty('ADBE Fill');
			fill.name = hex;
			PAL_setProp(fill.property('ADBE Fill-0002'), color, comp.time);
		}
		return PAL_json({ ok: true, mode: 'fill', count: layers.length });
	} catch (e) {
		return PAL_json({ ok: false, reason: 'error', message: e.message });
	} finally {
		app.endUndoGroup();
	}
}

// ---------------------------------------------------------------- capturar cores

var PAL_SKIP_GROUPS = ['ADBE Material Options Group', 'ADBE Plane Options Group', 'ADBE Vector Materials Group'];

function PAL_collect(prop, out) {
	if (!prop) return out;
	if (prop.numProperties !== undefined && prop.numProperties > 0) {
		for (var i = 1; i <= prop.numProperties; i++) {
			var child = prop.property(i);
			if (PAL_has(PAL_SKIP_GROUPS, child.matchName)) continue;
			try { if (!child.enabled) continue; } catch (e) {}
			PAL_collect(child, out);
		}
		return out;
	}
	try {
		if (PAL_isColor(prop)) {
			var hex = PAL_hex(prop.value);
			// vermelho padrão de efeitos nunca alterado não conta
			if (!(hex == '#FF0000' && !prop.isModified) && !PAL_has(out, hex)) out.push(hex);
		} else if (prop.matchName == 'ADBE Text Document') {
			var d = prop.value;
			if (d.applyFill && !PAL_has(out, PAL_hex(d.fillColor))) out.push(PAL_hex(d.fillColor));
			if (d.applyStroke && !PAL_has(out, PAL_hex(d.strokeColor))) out.push(PAL_hex(d.strokeColor));
		}
	} catch (e) {}
	return out;
}

function PAL_layerColors(layer, out) {
	try {
		if (layer.source && layer.source.mainSource instanceof SolidSource) {
			var h = PAL_hex(layer.source.mainSource.color);
			if (!PAL_has(out, h)) out.push(h);
		}
	} catch (e) {}
	PAL_collect(layer.property('ADBE Effect Parade'), out);
	if (layer instanceof ShapeLayer) PAL_collect(layer.property('ADBE Root Vectors Group'), out);
	if (layer instanceof TextLayer) PAL_collect(layer.property('ADBE Text Properties'), out);
	return out;
}

// scope: 'selection' (propriedades selecionadas → layers selecionados) | 'project'
function PAL_capture(scope) {
	var out = [], i, l;
	if (scope == 'project') {
		for (i = 1; i <= app.project.numItems; i++) {
			var item = app.project.item(i);
			if (!(item instanceof CompItem)) continue;
			for (l = 1; l <= item.numLayers; l++) PAL_layerColors(item.layer(l), out);
		}
		return PAL_json({ ok: true, colors: out });
	}

	var comp = app.project.activeItem;
	if (!(comp instanceof CompItem) || !comp.selectedLayers.length) return PAL_json({ ok: false, reason: 'nosel', colors: [] });
	var layers = comp.selectedLayers;

	for (i = 0; i < layers.length; i++) {
		var sel = layers[i].selectedProperties;
		for (var p = 0; p < sel.length; p++) PAL_collect(sel[p], out);
	}
	if (!out.length) for (i = 0; i < layers.length; i++) PAL_layerColors(layers[i], out);
	return PAL_json({ ok: true, colors: out });
}

// ---------------------------------------------------------------- migração O PALETTERO → El PALLETERO
// Na primeira vez, copia preferences.json e os presets da pasta antiga para a nova.
// A pasta antiga fica intacta: o script clássico continua usando ela.

function PAL_copyFile(from, toPath) {
	var src = new File(from);
	if (!src.exists) return false;
	src.encoding = 'UTF-8';
	src.open('r');
	var data = src.read();
	src.close();
	var dst = new File(toPath);
	dst.encoding = 'UTF-8';
	dst.open('w');
	dst.write(data);
	dst.close();
	return true;
}

function PAL_migrateFolders() {
	var nf = new Folder(PAL_PREFS_FOLDER), of = new Folder(PAL_OLD_PREFS_FOLDER);
	if (nf.exists) return;
	nf.create();
	if (!of.exists) return;

	var raw = PAL_readFile(of.fsName + '/preferences.json');
	if (raw) {
		var p = {};
		try { p = PAL_parse(raw); } catch (e) {}
		// se a pasta de presets era a padrão antiga, passa a ser a padrão nova; pastas de rede ficam como estão
		var oldDefault = PAL_slash(of.fsName + '/presets').toLowerCase();
		if (!p.presetFolder || PAL_slash(p.presetFolder).toLowerCase().replace(/\/+$/, '') == oldDefault) {
			p.presetFolder = '';
			p.presetFolderNet = '';
		}
		PAL_writeFile(PAL_PREFS_FOLDER + '/preferences.json', PAL_json(p));
	}

	var op = new Folder(of.fsName + '/presets');
	if (op.exists) {
		var np = new Folder(PAL_PREFS_FOLDER + '/presets');
		if (!np.exists) np.create();
		var files = op.getFiles('*.json');
		for (var i = 0; i < files.length; i++) PAL_copyFile(files[i].fsName, np.fsName + '/' + files[i].name);
	}
}

try { PAL_migrateFolders(); } catch (e) {}
