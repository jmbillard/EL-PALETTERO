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

function PAL_projectKey() {
	if (!app.project) return PAL_json('');
	var f = app.project.file;
	return PAL_json(f ? f.fsName : 'sem título');
}

// nomes não podem conter '-' nem ':' (separadores do formato legado)
function PAL_cleanLabel(s) {
	return String(s || '').replace(/-/g, '‐').replace(/:/g, '∶');
}

function PAL_loadPalette() {
	var swatches = [];
	try {
		var meta = new XMPMeta(app.project.xmpPacket);
		var ns = XMPMeta.getNamespaceURI('xmp');
		if (meta.doesPropertyExist(ns, 'xmp:Label')) {
			var items = meta.getProperty(ns, 'xmp:Label').toString().split('-');
			for (var i = 0; i < items.length; i++) {
				var p = items[i].split(':');
				if (!/^#[0-9A-F]{6}$/i.test(p[0])) continue;
				swatches.push({ color: p[0].toUpperCase(), label: p.length > 1 ? p[1] : '' });
			}
		}
	} catch (e) {}

	if (swatches.length) return PAL_json({ source: 'project', swatches: swatches });
	return PAL_json({ source: 'default', swatches: PAL_defaultSwatches() });
}

function PAL_savePalette(json) {
	var swatches = PAL_parse(json);
	var meta = new XMPMeta(app.project.xmpPacket);
	var ns = XMPMeta.getNamespaceURI('xmp');
	var parts = [];
	for (var i = 0; i < swatches.length; i++) {
		parts.push(swatches[i].color + ':' + PAL_cleanLabel(swatches[i].label));
	}
	meta.deleteProperty(ns, 'xmp:Label');
	if (parts.length) meta.setProperty(ns, 'xmp:Label', parts.join('-'));
	app.project.xmpPacket = meta.serialize();
	return PAL_json({ ok: true });
}

// ---------------------------------------------------------------- preferências

function PAL_readPrefs() {
	var raw = PAL_readFile(PAL_PREFS_FOLDER + '/preferences.json');
	if (!raw) return {};
	try { return PAL_parse(raw); } catch (e) { return {}; }
}

function PAL_defaultSwatches() {
	var prefs = PAL_readPrefs();
	var list = [];
	if (prefs.swatches instanceof Array) {
		for (var i = 0; i < prefs.swatches.length; i++) {
			var s = prefs.swatches[i];
			if (s && s.color) list.push({ color: String(s.color).toUpperCase(), label: s.label || '' });
		}
	}
	if (!list.length) {
		for (var d = 0; d < PAL_DEFAULT_SWATCHES.length; d++) list.push({ color: PAL_DEFAULT_SWATCHES[d], label: 'cor ' + (d + 1) });
	}
	return list;
}

function PAL_loadPrefs() {
	var p = PAL_readPrefs();
	return PAL_json({
		showColorLabels: p.showColorLabels === true,
		showColorInfo: p.showColorInfo !== false,
		labelType: p.labelType || '#HEX',
		swatches: PAL_defaultSwatches()
	});
}

function PAL_savePrefs(json) {
	var next = PAL_parse(json);
	var cur = PAL_readPrefs();
	for (var k in next) if (next.hasOwnProperty(k)) cur[k] = next[k];
	PAL_writeFile(PAL_PREFS_FOLDER + '/preferences.json', PAL_json(cur));
	return PAL_json({ ok: true });
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
