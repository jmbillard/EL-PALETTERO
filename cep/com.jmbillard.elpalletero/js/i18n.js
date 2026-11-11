/* El PALLETERO · idiomas
   Os textos vêm de i18n/strings.csv (uma coluna por idioma) e os nomes automáticos das cores
   de i18n/colors.csv. Um idioma novo é só uma coluna nova nos dois arquivos.
   No CEP os .csv são lidos do disco (Node); no mockup vêm embutidos (window.PAL_CSV). */
(function (root) {
	'use strict';

	// CSV (RFC 4180): campos entre aspas podem ter vírgula, quebra de linha e "" para aspas.
	// Linhas vazias e linhas que começam com # são ignoradas.
	function parseCSV(text) {
		var rows = [], row = [], cell = '', q = false, i, c;
		text = String(text || '').replace(/^﻿/, '');
		for (i = 0; i < text.length; i++) {
			c = text.charAt(i);
			// linha de comentário (# no começo, fora de aspas): pula inteira, sem ler aspas dela
			if (!q && cell === '' && !row.length && c === '#' && !/^#[0-9a-f]{6}\b/i.test(text.substr(i, 8))) {
				while (i < text.length && text.charAt(i) !== '\n') i++;
				continue;
			}
			if (q) {
				if (c === '"') { if (text.charAt(i + 1) === '"') { cell += '"'; i++; } else q = false; }
				else cell += c;
			} else if (c === '"' && cell === '') q = true;
			else if (c === ',') { row.push(cell); cell = ''; }
			else if (c === '\n' || c === '\r') {
				if (c === '\r' && text.charAt(i + 1) === '\n') i++;
				row.push(cell); rows.push(row); row = []; cell = '';
			} else cell += c;
		}
		if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
		return rows.filter(function (r) { return r.length > 1 || (r[0] && r[0].trim()); })
			.filter(function (r) { return String(r[0]).trim().charAt(0) !== '#' || /^#[0-9a-f]{6}$/i.test(String(r[0]).trim()); });
	}

	// colunas de idioma: códigos como pt, en, es, pt-BR (outras colunas, como "notas", são ignoradas)
	function table(text) {
		var rows = parseCSV(text), head = rows.shift() || [], cols = [];
		head.forEach(function (h, i) { h = String(h).trim(); if (i > 0 && /^[a-z]{2}(-[A-Za-z]{2,4})?$/.test(h)) cols.push({ code: h, i: i }); });
		return { cols: cols, rows: rows };
	}

	var DB = { langs: [], t: {}, colors: [] };
	var lang = 'pt';

	function load(stringsCsv, colorsCsv) {
		var s = table(stringsCsv);
		DB.langs = s.cols.map(function (c) { return c.code; });
		DB.t = {};
		s.rows.forEach(function (r) {
			var k = String(r[0]).trim(), row = {};
			if (!k) return;
			s.cols.forEach(function (c) { if (r[c.i] !== undefined && r[c.i] !== '') row[c.code] = r[c.i]; });
			DB.t[k] = row;
		});
		var c = table(colorsCsv);
		DB.colors = c.rows.map(function (r) {
			var names = {};
			c.cols.forEach(function (col) { if (r[col.i]) names[col.code] = String(r[col.i]).trim(); });
			return { hex: String(r[0]).trim(), names: names };
		}).filter(function (e) { return /^#[0-9a-f]{6}$/i.test(e.hex); });
		if (DB.langs.indexOf(lang) < 0) lang = DB.langs[0] || 'pt';
	}

	function setLang(code) {
		lang = DB.langs.indexOf(code) >= 0 ? code : (DB.langs[0] || 'pt');
		root.document.documentElement.lang = lang;
		return lang;
	}

	// idioma do After Effects (app.isoLanguage: "pt_BR", "en_US", "es_ES"…) ou do navegador.
	// Sem tradução para o idioma pedido, usa inglês (se houver); senão, a primeira coluna.
	function detect(hint) {
		var h = String(hint || '').replace('_', '-').toLowerCase();
		for (var i = 0; i < DB.langs.length; i++) if (DB.langs[i].toLowerCase() === h) return DB.langs[i];
		for (i = 0; i < DB.langs.length; i++) if (DB.langs[i].slice(0, 2).toLowerCase() === h.slice(0, 2)) return DB.langs[i];
		return DB.langs.indexOf('en') >= 0 ? 'en' : (DB.langs[0] || 'pt');
	}

	function t(key, vars) {
		var row = DB.t[key], s = row ? (row[lang] !== undefined ? row[lang] : row[DB.langs[0]]) : undefined;
		if (s === undefined) s = key;
		if (vars) s = s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] !== undefined ? vars[k] : m; });
		return s;
	}
	// singular / plural: chave.one e chave.other, com {n}
	function n(key, count, vars) {
		var v = {}, k;
		for (k in vars || {}) v[k] = vars[k];
		v.n = count;
		return t(key + (count === 1 ? '.one' : '.other'), v);
	}

	// nomes de referência das cores no idioma atual: [[nome, hex], …]
	function colors() {
		return DB.colors.map(function (e) { return [e.names[lang] || e.names[DB.langs[0]] || e.hex, e.hex]; });
	}

	// textos que o After Effects usa (desfazer, diálogos, presets de exemplo): chaves host.*
	function hostStrings() {
		var out = {};
		for (var k in DB.t) if (k.indexOf('host.') === 0) out[k.slice(5)] = t(k);
		return out;
	}

	// lê um .csv ao lado do index.html: embutido (mockup) → Node (CEP) → XHR
	function readFile(rel) {
		if (root.PAL_CSV && root.PAL_CSV[rel]) return root.PAL_CSV[rel];
		try {
			var req = root.cep_node ? root.cep_node.require : (typeof root.require === 'function' ? root.require : null);
			if (req) {
				var path = decodeURIComponent(root.location.pathname).replace(/^\/([A-Za-z]:)/, '$1');
				return req('fs').readFileSync(path.replace(/[\/\\][^\/\\]*$/, '') + '/' + rel, 'utf8');
			}
		} catch (e) {}
		try {
			var x = new XMLHttpRequest();
			x.open('GET', rel, false);
			x.send();
			if (x.status === 200 || (x.status === 0 && x.responseText)) return x.responseText;
		} catch (e) {}
		return '';
	}

	// antes de montar o painel: carrega os textos, escolhe o idioma (preferência → After → sistema)
	// e passa ao After os textos dele
	function boot(Host) {
		load(readFile('i18n/strings.csv'), readFile('i18n/colors.csv'));
		return Host.loadPrefs().then(function (p) { return p || {}; }, function () { return {}; }).then(function (p) {
			setLang(p.lang && p.lang !== 'auto' ? p.lang : detect(p.aeLang || root.navigator.language));
			return Host.setStrings(hostStrings()).catch(function () {});
		});
	}

	root.PalI18n = {
		boot: boot, load: load, parseCSV: parseCSV, t: t, n: n, setLang: setLang, detect: detect, colors: colors,
		lang: function () { return lang; },
		langs: function () { return DB.langs.slice(); },
		name: function (code) { var r = DB.t['lang.name']; return (r && r[code]) || code.toUpperCase(); }
	};
})(window);
