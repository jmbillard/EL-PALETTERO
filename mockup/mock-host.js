/* "After Effects de mentira" para o mockup: uma composição com layers selecionáveis
   e dois projetos, para testar o painel no navegador sem o After Effects. */
(function (root) {
	'use strict';

	var DEFAULTS = ['#F13333', '#FF4D4D', '#FE674C', '#FF8F4D', '#FFC44E', '#5DE6A2', '#80C0FE', '#B5ADFF', '#FF8CCD', '#FF739A', '#FF5A68']
		.map(function (c, i) { return { color: c, label: 'cor ' + (i + 1) }; });

	var projects = {
		'abertura_v3.aep': {
			palette: [
				{ color: '#FF4D4D', label: 'vermelho' }, { color: '#FFC44E', label: 'mostarda' }, { color: '#5DE6A2', label: 'menta' },
				{ color: '#80C0FE', label: 'céu' }, { color: '#B5ADFF', label: 'lavanda' }, { color: '#FF8CCD', label: 'chiclete' },
				{ color: '#1E2A44', label: 'noite' }, { color: '#F2F2F2', label: 'papel' }
			],
			layers: [
				{ id: 'title', name: 'TÍTULO', kind: 'text', color: '#F2F2F2' },
				{ id: 'circle', name: 'círculo', kind: 'shape', color: '#FF4D4D' },
				{ id: 'bar', name: 'faixa', kind: 'shape', color: '#5DE6A2', stroke: '#0E1424' },
				{ id: 'bg', name: 'fundo', kind: 'solid', color: '#1E2A44' }
			]
		},
		'vinheta_final.aep': {
			palette: null, // sem paleta salva → usa a paleta padrão
			layers: [
				{ id: 'title', name: 'TÍTULO', kind: 'text', color: '#121316' },
				{ id: 'circle', name: 'círculo', kind: 'shape', color: '#FF8F4D' },
				{ id: 'bar', name: 'faixa', kind: 'shape', color: '#2E5BFF', stroke: '#F7E8D0' },
				{ id: 'bg', name: 'fundo', kind: 'solid', color: '#F7E8D0' }
			]
		}
	};

	var prefs = { showColorLabels: false, showColorInfo: true, labelType: '#HEX', swatches: DEFAULTS };
	var current = 'abertura_v3.aep';
	var listeners = [];

	function proj() { return projects[current]; }
	function emit() { listeners.forEach(function (f) { f(); }); }

	var AE = root.MockAE = {
		get project() { return current; },
		projects: Object.keys(projects),
		layers: function () { return proj().layers; },
		selected: {},
		switchProject: function (name) { current = name; AE.selected = {}; emit(); },
		select: function (id, additive) {
			if (!additive) { var was = AE.selected[id] && Object.keys(AE.selected).length === 1; AE.selected = {}; if (!was) AE.selected[id] = true; }
			else if (AE.selected[id]) delete AE.selected[id];
			else AE.selected[id] = true;
			emit();
		},
		onChange: function (f) { listeners.push(f); }
	};

	function selLayers() { return proj().layers.filter(function (l) { return AE.selected[l.id]; }); }

	root.PalMockHost = {
		projectKey: function () { return current; },
		loadPalette: function () {
			var p = proj().palette;
			return p && p.length ? { source: 'project', swatches: p } : { source: 'default', swatches: prefs.swatches };
		},
		savePalette: function (json) { proj().palette = JSON.parse(json); return { ok: true }; },
		loadPrefs: function () { return prefs; },
		savePrefs: function (json) {
			var n = JSON.parse(json);
			for (var k in n) prefs[k] = n[k];
			return { ok: true };
		},
		apply: function (hex) {
			var sel = selLayers();
			if (!sel.length) return { ok: false, reason: 'nosel' };
			sel.forEach(function (l) { l.color = hex; l.flash = Date.now(); });
			emit();
			return { ok: true, mode: 'fill', count: sel.length };
		},
		capture: function (scope) {
			var src = scope === 'project' ? [].concat.apply([], Object.keys(projects).map(function (k) { return k === current ? projects[k].layers : []; })) : selLayers();
			if (scope !== 'project' && !src.length) return { ok: false, reason: 'nosel', colors: [] };
			var out = [];
			src.forEach(function (l) {
				[l.color, l.stroke].forEach(function (c) { if (c && out.indexOf(c) < 0) out.push(c); });
			});
			return { ok: true, colors: out };
		}
	};
})(window);
