/* El PALLETERO · entrada e saída de cores
   - texto: acha cores em qualquer texto colado ou arquivo (hex, rgb(), listas do Coolors, CSS…)
   - .ase: Adobe Swatch Exchange (Illustrator, Photoshop, InDesign), leitura e escrita
   Só cálculo: diálogos e arquivos ficam no host (jsx). */
(function (root) {
	'use strict';

	var C = root.PalColor;

	function hex2(n) { n = Math.max(0, Math.min(255, Math.round(n))); return (n < 16 ? '0' : '') + n.toString(16); }
	function rgbHex(r, g, b) { return ('#' + hex2(r) + hex2(g) + hex2(b)).toUpperCase(); }

	// ------------------------------------------------------------ texto
	// Formatos: #RGB, #RRGGBB, #RRGGBBAA, 0xRRGGBB, rgb()/rgba() (vírgulas ou espaços) e hex sem "#"
	// (só quando tem algum dígito, ou quando o texto é só uma lista de hex: "264653-2a9d8f-…").
	// Nome: o que vem antes de ":" ou "=" na mesma linha ("--primaria: #264653" → primaria).
	var RX = /#([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3})(?![0-9a-z])|\b0x([0-9a-f]{6})\b|rgba?\(\s*(\d{1,3}(?:\.\d+)?)\s*[,\s]\s*(\d{1,3}(?:\.\d+)?)\s*[,\s]\s*(\d{1,3}(?:\.\d+)?)|(?:^|[^0-9a-z#_-]|-)([0-9a-f]{6})(?![0-9a-z])/gi;

	function nameBefore(text, at) {
		var line = text.slice(text.lastIndexOf('\n', at - 1) + 1, at);
		var m = /(?:^|[\s;{,"'])[-$@]{0,2}([a-zÀ-ɏ][\wÀ-ɏ -]{0,38}?)["']?\s*[:=]\s*["']?$/i.exec(line);
		var name = m ? m[1].replace(/[-_]+/g, ' ').trim() : '';
		// nomes de propriedade de CSS/SVG não dizem nada da cor
		return /^(colou?r|background( colou?r)?|bg|fill|stroke|border( colou?r)?|outline( colou?r)?|stop colou?r|value|hex|rgba?)$/i.test(name) ? '' : name;
	}

	function parseText(text) {
		text = String(text || '');
		var onlyHex = /^[\s,;|/\-]*([0-9a-f]{6}[\s,;|/\-]*)+$/i.test(text.replace(/^.*\//, '')); // aceita a URL do Coolors
		var out = [], seen = {}, m;
		RX.lastIndex = 0;
		while ((m = RX.exec(text))) {
			var hex = null, at = m.index;
			if (m[1]) {
				var h = m[1];
				if (h.length === 3) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
				hex = '#' + h.slice(0, 6);
			} else if (m[2]) hex = '#' + m[2];
			else if (m[3]) {
				if (+m[3] > 255 || +m[4] > 255 || +m[5] > 255) continue;
				hex = rgbHex(+m[3], +m[4], +m[5]);
			} else if (m[6]) {
				if (!/\d/.test(m[6]) && !onlyHex) continue; // "facade", "decade"… não são cores
				hex = '#' + m[6];
				at = m.index + m[0].length - 6;
			}
			hex = C.normHex(hex);
			if (!hex || seen[hex]) continue;
			seen[hex] = true;
			out.push({ color: hex, label: nameBefore(text, at) });
		}
		return out;
	}

	// ------------------------------------------------------------ .ase
	function hexToBytes(h) {
		var out = new Uint8Array(Math.floor(h.length / 2));
		for (var i = 0; i < out.length; i++) out[i] = parseInt(h.substr(i * 2, 2), 16);
		return out;
	}
	function bytesToHex(b) {
		var out = '';
		for (var i = 0; i < b.length; i++) out += hex2(b[i]);
		return out;
	}

	// → { colors: [{ color, label }], group }
	function parseAse(bytes) {
		var b = bytes, p = 0, dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
		function u16() { var v = dv.getUint16(p); p += 2; return v; }
		function u32() { var v = dv.getUint32(p); p += 4; return v; }
		function f32() { var v = dv.getFloat32(p); p += 4; return v; }
		function str() {
			var n = u16(), s = '';
			for (var i = 0; i < n; i++) { var c = u16(); if (c) s += String.fromCharCode(c); }
			return s;
		}
		if (b.length < 12 || String.fromCharCode(b[0], b[1], b[2], b[3]) !== 'ASEF') throw new Error('não é um arquivo .ase');
		p = 8;
		var blocks = u32(), colors = [], group = '', seen = {};
		for (var k = 0; k < blocks && p + 6 <= b.length; k++) {
			var type = u16(), len = u32(), end = p + len;
			if (type === 0xC001) group = group || str();
			else if (type === 0x0001) {
				var name = str(), model = String.fromCharCode(b[p], b[p + 1], b[p + 2], b[p + 3]); p += 4;
				var rgb = null;
				if (model === 'RGB ') rgb = [f32() * 255, f32() * 255, f32() * 255];
				else if (model === 'CMYK') {
					var cc = f32(), mm = f32(), yy = f32(), kk = f32();
					rgb = [255 * (1 - cc) * (1 - kk), 255 * (1 - mm) * (1 - kk), 255 * (1 - yy) * (1 - kk)];
				} else if (model === 'LAB ') {
					var L = f32(), a = f32(), bb = f32();
					rgb = C.labToRgb([L <= 1.0001 ? L * 100 : L, a, bb]);
				} else if (model === 'Gray') { var g = f32() * 255; rgb = [g, g, g]; }
				if (rgb) {
					var hex = rgbHex(rgb[0], rgb[1], rgb[2]);
					if (!seen[hex]) { seen[hex] = true; colors.push({ color: hex, label: name }); }
				}
			}
			p = end;
		}
		return { colors: colors, group: group };
	}

	// [{ color, label }] → bytes de um .ase (RGB, num grupo com o nome da paleta)
	function buildAse(list, title) {
		var out = [];
		function u16(v) { out.push((v >> 8) & 255, v & 255); }
		function u32(v) { out.push((v >>> 24) & 255, (v >> 16) & 255, (v >> 8) & 255, v & 255); }
		function f32(v) { var t = new DataView(new ArrayBuffer(4)); t.setFloat32(0, v); for (var i = 0; i < 4; i++) out.push(t.getUint8(i)); }
		function strLen(s) { return 2 + (s.length + 1) * 2; }
		function str(s) { u16(s.length + 1); for (var i = 0; i < s.length; i++) u16(s.charCodeAt(i)); u16(0); }
		title = String(title || 'El PALLETERO').slice(0, 60);
		out.push(65, 83, 69, 70); // ASEF
		u16(1); u16(0);
		u32(list.length + 2);
		u16(0xC001); u32(strLen(title)); str(title);
		list.forEach(function (s, i) {
			var name = String(s.label || s.color || 'cor ' + (i + 1)).slice(0, 60), rgb = C.hexToRgb(s.color);
			u16(0x0001); u32(strLen(name) + 4 + 12 + 2);
			str(name);
			out.push(82, 71, 66, 32); // 'RGB '
			f32(rgb[0] / 255); f32(rgb[1] / 255); f32(rgb[2] / 255);
			u16(2); // normal (nem global nem spot)
		});
		u16(0xC002); u32(0);
		return new Uint8Array(out);
	}

	root.PalIO = { parseText: parseText, parseAse: parseAse, buildAse: buildAse, hexToBytes: hexToBytes, bytesToHex: bytesToHex };
})(window);
