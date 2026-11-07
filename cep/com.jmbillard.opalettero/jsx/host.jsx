/* O PALETTERO · host (ExtendScript)
   Todas as funções públicas começam com PAL_ e devolvem uma string JSON para o painel.
   Compatível com o script O PALETTERO: mesma chave XMP (xmp:Label) e mesmo preferences.json. */

if (typeof ExternalObject.AdobeXMPScript == 'undefined' || ExternalObject.AdobeXMPScript == undefined) {
	try { ExternalObject.AdobeXMPScript = new ExternalObject('lib:AdobeXMPScript'); } catch (e) {}
}

var PAL_PREFS_FOLDER = Folder.userData.fullName + '/O PALETTERO script';
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
// A paleta do projeto vive num grupo de metadados próprio (namespace O PALETTERO).
// O xmp:Label do script antigo só é lido, para migrar paletas existentes.

var PAL_NS = 'https://github.com/jmbillard/O-PALETTERO/ns/1.0/';
try { XMPMeta.registerNamespace(PAL_NS, 'opalettero'); } catch (e) {}

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
		if (meta.doesPropertyExist(PAL_NS, 'palette')) {
			var data = PAL_parse(meta.getProperty(PAL_NS, 'palette').toString());
			var from = meta.doesPropertyExist(PAL_NS, 'preset') ? meta.getProperty(PAL_NS, 'preset').toString() : '';
			return PAL_json({ source: 'project', project: name, preset: from, swatches: data });
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
		presetFolder: PAL_presetFolder().fsName
	});
}

function PAL_savePrefs(json) {
	var next = PAL_parse(json);
	var cur = PAL_readPrefs();
	for (var k in next) if (next.hasOwnProperty(k)) cur[k] = next[k];
	PAL_writeFile(PAL_PREFS_FOLDER + '/preferences.json', PAL_json(cur));
	return PAL_json({ ok: true });
}

// ---------------------------------------------------------------- presets (um .json por preset)

function PAL_presetFolder() {
	var p = PAL_readPrefs();
	var f = new Folder(p.presetFolder || (PAL_PREFS_FOLDER + '/presets'));
	if (!f.exists) f.create();
	return f;
}

function PAL_builtinSwatches() {
	var list = [];
	for (var d = 0; d < PAL_DEFAULT_SWATCHES.length; d++) list.push({ color: PAL_DEFAULT_SWATCHES[d], label: '', auto: true });
	return list;
}

function PAL_readPresets() {
	var files = PAL_presetFolder().getFiles('*.json'), out = [];
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
	// cria um primeiro preset para a biblioteca nunca começar vazia
	var list = PAL_readPresets();
	if (!list.length && !PAL_readPrefs().presetsSeeded) {
		PAL_savePreset(PAL_json({ name: 'O PALETTERO', swatches: PAL_builtinSwatches() }));
		PAL_savePrefs(PAL_json({ presetsSeeded: true }));
		list = PAL_readPresets();
	}
	return PAL_json({ folder: PAL_presetFolder().fsName, presets: list });
}

function PAL_slug(s) {
	s = String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
	return (s || 'paleta').substr(0, 32);
}

// presetJson: {id?, name, swatches}
function PAL_savePreset(presetJson) {
	var p = PAL_parse(presetJson);
	var id = p.id || (PAL_slug(p.name) + '-' + new Date().getTime().toString(36));
	var f = new File(PAL_presetFolder().fsName + '/' + id + '.json');
	f.encoding = 'UTF-8';
	if (!f.open('w')) return PAL_json({ ok: false, reason: 'readonly' });
	f.write(PAL_json({ name: p.name, swatches: p.swatches, updated: new Date().getTime() }));
	f.close();
	return PAL_json({ ok: true, id: id });
}

function PAL_deletePreset(id) {
	var f = new File(PAL_presetFolder().fsName + '/' + id + '.json');
	return PAL_json({ ok: f.exists ? f.remove() : false });
}

function PAL_choosePresetFolder() {
	var f = Folder.selectDialog('Pasta de presets do O PALETTERO', PAL_presetFolder());
	if (!f) return PAL_json({ ok: false });
	PAL_savePrefs(PAL_json({ presetFolder: f.fsName }));
	return PAL_json({ ok: true, folder: f.fsName });
}

function PAL_revealPresetFolder() {
	PAL_presetFolder().execute();
	return PAL_json({ ok: true });
}

// ---------------------------------------------------------------- frame do layer selecionado

// no Windows um PNG ainda aberto não pode ser apagado: o que sobrar sai na próxima extração
function PAL_sweepTemp() {
	try {
		var old = Folder.temp.getFiles('opalettero_*.png');
		var limit = new Date().getTime() - 60000;
		for (var i = 0; i < old.length; i++) if (old[i].modified && old[i].modified.getTime() < limit) old[i].remove();
	} catch (e) {}
}

function PAL_releaseFrame(tmpId, path) {
	try {
		if (tmpId) {
			var item = app.project.itemByID(tmpId);
			if (item) { app.beginUndoGroup('O PALETTERO · extrair frame'); item.remove(); app.endUndoGroup(); }
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
	var out = new File(Folder.temp.fsName + '/opalettero_' + new Date().getTime() + '.png');
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
			app.beginUndoGroup('O PALETTERO · extrair frame');
			var fps = src.frameRate || comp.frameRate;
			var dur = Math.max(src.duration || 0, 1 / fps);
			var tmp = app.project.items.addComp('O PALETTERO tmp', src.width, src.height, src.pixelAspect || 1, dur, fps);
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

	app.beginUndoGroup('O PALETTERO · aplicar ' + hex);
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
