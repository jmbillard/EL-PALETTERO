/* "After Effects de mentira" para o mockup: uma composição com layers selecionáveis,
   dois projetos, presets em duas pastas e frames gerados por canvas. */
(function (root) {
	'use strict';

	var BUILTIN = ['#F13333', '#FF4D4D', '#FE674C', '#FF8F4D', '#FFC44E', '#5DE6A2', '#80C0FE', '#B5ADFF', '#FF8CCD', '#FF739A', '#FF5A68']
		.map(function (c) { return { color: c, label: '', auto: true }; });

	function sw(list) { return list.map(function (c) { return { color: c, label: '', auto: true }; }); }

	var projects = {
		'abertura_v3.aep': {
			palette: { preset: 'Abertura', swatches: sw(['#FF4D4D', '#FFC44E', '#5DE6A2', '#80C0FE', '#B5ADFF', '#FF8CCD', '#1E2A44', '#F2F2F2']) },
			layers: [
				{ id: 'title', name: 'TÍTULO', kind: 'text', color: '#F2F2F2' },
				{ id: 'circle', name: 'círculo', kind: 'shape', color: '#FF4D4D' },
				{ id: 'bar', name: 'faixa', kind: 'shape', color: '#5DE6A2', stroke: '#0E1424' },
				{ id: 'photo', name: 'praia_entardecer.jpg', kind: 'image', scene: 'sunset' },
				{ id: 'bg', name: 'fundo', kind: 'solid', color: '#1E2A44' }
			]
		},
		'vinheta_final.aep': {
			palette: null, // sem paleta salva → usa o preset padrão
			layers: [
				{ id: 'title', name: 'TÍTULO', kind: 'text', color: '#121316' },
				{ id: 'circle', name: 'círculo', kind: 'shape', color: '#FF8F4D' },
				{ id: 'bar', name: 'faixa', kind: 'shape', color: '#2E5BFF', stroke: '#F7E8D0' },
				{ id: 'photo', name: 'floresta_drone.mp4', kind: 'video', scene: 'forest' },
				{ id: 'bg', name: 'fundo', kind: 'solid', color: '#F7E8D0' }
			]
		}
	};

	var folders = {
		'/Users/voce/Library/Application Support/El PALLETERO/presets': [
			{ id: 'el-palletero', name: 'El PALLETERO', swatches: BUILTIN },
			{ id: 'abertura', name: 'Abertura', swatches: sw(['#FF4D4D', '#FFC44E', '#5DE6A2', '#80C0FE', '#B5ADFF', '#FF8CCD', '#1E2A44', '#F2F2F2']) },
			{ id: 'exemplo-monocromatico', name: 'Monocromático', swatches: sw(['#111111', '#333333', '#555555', '#888888', '#BBBBBB', '#EEEEEE']) },
			{ id: 'verao', name: 'Verão', swatches: sw(['#FF7518', '#FFC72C', '#40E0D0', '#00B2A9', '#FA8072', '#FFF1A8']) },
			// as mesmas paletas de exemplo que o host.jsx cria na pasta padrão
			{ id: 'exemplo-por-do-sol', name: 'Pôr do sol', swatches: sw(['#2B1B4A', '#6A2C70', '#C2456B', '#F08A4B', '#FFD27A', '#FFF1C9']) },
			{ id: 'exemplo-sorveteria', name: 'Sorveteria', swatches: sw(['#F7C6D9', '#FDE2B8', '#F6EAC2', '#B8E0D2', '#A7C7E7', '#D9C2F0']) },
			{ id: 'exemplo-neon', name: 'Neon', swatches: sw(['#0D0221', '#FF2A6D', '#F706CF', '#05D9E8', '#01FFC3', '#FFF338']) },
			{ id: 'exemplo-oceano', name: 'Oceano', swatches: sw(['#03045E', '#0077B6', '#00B4D8', '#48CAE4', '#90E0EF', '#CAF0F8']) },
			{ id: 'exemplo-floresta', name: 'Floresta', swatches: sw(['#0B2B1C', '#1F4D2B', '#3A7D44', '#7FB069', '#C9D99E', '#F2E8CF']) },
			{ id: 'exemplo-terroso', name: 'Terroso', swatches: sw(['#3D2B1F', '#7A4E2D', '#B5703F', '#D9A273', '#E8D2B0', '#6B7F4F']) },
			{ id: 'exemplo-tropical', name: 'Tropical', swatches: sw(['#FF5E5B', '#FFAA4C', '#FFED66', '#00CECB', '#0B7A75', '#2E294E']) },
			{ id: 'exemplo-retro-70', name: 'Retrô 70', swatches: sw(['#8C3B19', '#D9622B', '#F2A541', '#F2D16B', '#6B8F71', '#2E4A3F']) },
			{ id: 'exemplo-noite-urbana', name: 'Noite urbana', swatches: sw(['#0F1020', '#2A2D5E', '#4F5BD5', '#E03E7E', '#FFB86B', '#F7F7FF']) },
			{ id: 'exemplo-brasil', name: 'Brasil', swatches: sw(['#009C3B', '#FFDF00', '#002776', '#FFFFFF']) },
			{ id: 'exemplo-pastel', name: 'Pastel', swatches: sw(['#FFD6E0', '#FFEFCF', '#D4F4DD', '#CDE7FF', '#E5D9FF', '#FCE1F5']) }
		],
		'/Volumes/equipe/design/paletas': [
			{ id: 'jornal', name: 'Jornal da noite', swatches: sw(['#0B1F4B', '#1560BD', '#80C0FE', '#E53935', '#FFFFFF']) },
			{ id: 'esporte', name: 'Esporte', swatches: sw(['#009C3B', '#FFE01B', '#0047AB', '#FFFFFF', '#111111']) }
		]
	};
	// terceira pasta: volume de rede que começa desmontado (Montar resolve)
	var OFFLINE = '/Volumes/PROMO/paletas';
	var mounted = false;
	folders[OFFLINE] = [
		{ id: 'promo', name: 'Promo 2026', swatches: sw(['#FF1493', '#7F00FF', '#00B7EB', '#FFE01B', '#111111']) }
	];
	var folderNames = Object.keys(folders);

	var prefs = { showColorLabels: true, showColorInfo: true, labelType: '#HEX', defaultPreset: 'el-palletero', presetFolder: folderNames[0] };
	var current = 'abertura_v3.aep';
	var orders = {}; // ordem dos presets por pasta
	var listeners = [];

	function proj() { return projects[current]; }
	function emit() { listeners.forEach(function (f) { f(); }); }
	function presets() { return folders[prefs.presetFolder]; }

	// ---------------------------------------------------------------- cenas desenhadas (o "frame" da imagem/vídeo)
	function scene(kind, w, h) {
		var cv = document.createElement('canvas');
		cv.width = w; cv.height = h;
		var g = cv.getContext('2d'), gr;
		if (kind === 'sunset') {
			gr = g.createLinearGradient(0, 0, 0, h * 0.62);
			gr.addColorStop(0, '#2B1B4A'); gr.addColorStop(0.45, '#C2456B'); gr.addColorStop(0.8, '#FF8A4C'); gr.addColorStop(1, '#FFD27A');
			g.fillStyle = gr; g.fillRect(0, 0, w, h);
			g.fillStyle = '#FFE9A8'; g.beginPath(); g.arc(w * 0.62, h * 0.6, h * 0.13, 0, 7); g.fill();
			gr = g.createLinearGradient(0, h * 0.62, 0, h);
			gr.addColorStop(0, '#2E4C7A'); gr.addColorStop(1, '#0E1A33');
			g.fillStyle = gr; g.fillRect(0, h * 0.62, w, h);
			g.fillStyle = 'rgba(255,190,120,.55)';
			for (var i = 0; i < 9; i++) g.fillRect(w * 0.62 - (60 - i * 6) * w / 640, h * (0.65 + i * 0.03), (120 - i * 12) * w / 640, 2);
			g.fillStyle = '#E8C9A0'; g.beginPath(); g.moveTo(0, h * 0.86); g.quadraticCurveTo(w * 0.3, h * 0.78, w * 0.55, h); g.lineTo(0, h); g.fill();
			g.fillStyle = '#1B1420'; g.beginPath(); g.moveTo(w * 0.05, h); g.lineTo(w * 0.12, h * 0.55); g.lineTo(w * 0.14, h); g.fill();
			g.beginPath(); g.ellipse(w * 0.12, h * 0.52, w * 0.07, h * 0.05, -0.4, 0, 7); g.fill();
		} else if (kind === 'forest') {
			gr = g.createLinearGradient(0, 0, 0, h);
			gr.addColorStop(0, '#CFE3D1'); gr.addColorStop(1, '#8FB59A');
			g.fillStyle = gr; g.fillRect(0, 0, w, h);
			var rows = [['#5F8575', 0.42], ['#3A6B4A', 0.55], ['#1F4D2B', 0.7], ['#12301C', 0.86]];
			rows.forEach(function (r, k) {
				g.fillStyle = r[0];
				for (var x = -20; x < w + 20; x += w / (10 + k * 3)) {
					var th = h * (0.18 + ((x * 7 + k * 13) % 9) / 60);
					g.beginPath(); g.moveTo(x, h * r[1]); g.lineTo(x + w / 28, h * r[1] - th); g.lineTo(x + w / 14, h * r[1]); g.fill();
				}
				g.fillRect(0, h * r[1] - 1, w, h);
			});
			g.fillStyle = '#C68E17'; g.fillRect(w * 0.47, h * 0.62, w * 0.06, h * 0.38);
			g.fillStyle = '#E8A33D'; g.fillRect(w * 0.49, h * 0.62, w * 0.02, h * 0.38);
		} else {
			var L = proj().layers, by = {};
			L.forEach(function (l) { by[l.id] = l; });
			g.fillStyle = by.bg.color; g.fillRect(0, 0, w, h);
			g.fillStyle = by.bar.color; g.strokeStyle = by.bar.stroke; g.lineWidth = h * 0.02;
			g.beginPath(); g.rect(-10, h * 0.69, w * 0.68, h * 0.15); g.fill(); g.stroke();
			g.fillStyle = by.circle.color; g.beginPath(); g.arc(w * 0.76, h * 0.38, h * 0.27, 0, 7); g.fill();
			g.fillStyle = by.title.color; g.font = '800 ' + Math.round(h * 0.19) + 'px sans-serif';
			g.fillText('ABER', w * 0.07, h * 0.43); g.fillText('TURA', w * 0.07, h * 0.62);
		}
		return cv.toDataURL('image/png');
	}

	var AE = root.MockAE = {
		get project() { return current; },
		projects: Object.keys(projects),
		layers: function () { return proj().layers; },
		selected: {},
		thumb: function (l) { return scene(l.scene, 64, 36); },
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
	function defaultPreset() {
		var p = presets().filter(function (x) { return x.id === prefs.defaultPreset; })[0];
		return p || { name: '', swatches: BUILTIN };
	}

	root.PalMockHost = {
		projectKey: function () { return current; },
		loadPalette: function () {
			var name = current.replace(/\.aep$/, ''), p = proj().palette;
			if (p) return { source: 'project', project: name, preset: p.preset || '', swatches: p.swatches };
			var d = defaultPreset();
			return { source: 'default', project: name, preset: d.name, swatches: d.swatches };
		},
		savePalette: function (json, preset) {
			var p = proj().palette || (proj().palette = {});
			p.swatches = JSON.parse(json);
			if (preset !== undefined) p.preset = preset;
			return { ok: true };
		},
		loadPrefs: function () { return prefs; },
		savePrefs: function (json) {
			var n = JSON.parse(json);
			for (var k in n) prefs[k] = n[k];
			return { ok: true };
		},
		savePresetOrder: function (json) { orders[prefs.presetFolder] = JSON.parse(json); return { ok: true }; },
		listPresets: function () {
			if (prefs.presetFolder === OFFLINE && !mounted) return { folder: OFFLINE, offline: true, volume: 'PROMO', canMount: true, presets: [] };
			var list = presets().slice().sort(function (a, b) { return a.name.localeCompare(b.name); });
			var order = orders[prefs.presetFolder];
			if (order) {
				var known = list.filter(function (p) { return order.indexOf(p.id) >= 0; }).sort(function (a, b) { return order.indexOf(a.id) - order.indexOf(b.id); });
				list = known.concat(list.filter(function (p) { return order.indexOf(p.id) < 0; }));
			}
			return { folder: prefs.presetFolder, presets: list };
		},
		savePreset: function (json) {
			var p = JSON.parse(json), list = presets();
			var id = p.id || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);
			var cur = list.filter(function (x) { return x.id === id; })[0];
			if (cur) { cur.name = p.name; cur.swatches = p.swatches; } else list.push({ id: id, name: p.name, swatches: p.swatches });
			return { ok: true, id: id };
		},
		deletePreset: function (id) {
			folders[prefs.presetFolder] = presets().filter(function (x) { return x.id !== id; });
			return { ok: true };
		},
		choosePresetFolder: function () {
			// no mockup, "escolher pasta" alterna entre a pasta pessoal e uma pasta de rede da equipe
			prefs.presetFolder = folderNames[(folderNames.indexOf(prefs.presetFolder) + 1) % folderNames.length];
			return { ok: true, folder: prefs.presetFolder };
		},
		revealPresetFolder: function () { return { ok: true }; },
		mountPresetVolume: function () { mounted = true; return this.listPresets(); },
		resetPresetFolder: function () { prefs.presetFolder = folderNames[0]; return this.listPresets(); },
		inspect: function () {
			var sel = selLayers();
			if (!sel.length) return { mode: 'image', source: 'comp', label: 'MAIN_COMP' };
			var flat = sel.filter(function (l) { return !l.scene; });
			if (flat.length) return { mode: 'layers', count: flat.length };
			return { mode: 'image', source: 'layer', label: sel[0].name };
		},
		grabFrame: function () {
			var l = selLayers().filter(function (x) { return x.scene; })[0];
			// vídeo simula um render demorado (mostra o aviso de espera); imagem é lida na hora
			if (l && l.scene) return { ok: true, url: scene(l.scene, 640, 360), label: l.name, kind: l.kind, temp: l.kind === 'video', readyAt: l.kind === 'video' ? Date.now() + 2600 : 0 };
			return { ok: true, url: scene('comp', 640, 360), label: 'MAIN_COMP', kind: 'comp', temp: true, readyAt: Date.now() + 400 };
		},
		releaseFrame: function () { return { ok: true }; },
		apply: function (hex, optsJson) {
			var sel = selLayers().filter(function (l) { return !l.scene; });
			if (!sel.length) return { ok: false, reason: 'nosel' };
			var opts = optsJson ? JSON.parse(optsJson) : {};
			if (opts.stroke) {
				// contorno: só shapes com traço e textos
				var st = sel.filter(function (l) { return l.stroke || l.kind === 'text'; });
				if (!st.length) return { ok: false, reason: 'nostroke' };
				st.forEach(function (l) { l.stroke = hex; l.flash = Date.now(); });
				emit();
				return { ok: true, mode: 'stroke', count: st.length };
			}
			sel.forEach(function (l) { l.color = hex; l.flash = Date.now(); });
			emit();
			return { ok: true, mode: 'fill', count: sel.length };
		},
		// importar: no mockup, um .ase de exemplo (como se viesse do Illustrator)
		importColors: function () {
			var bytes = window.PalIO.buildAse([
				{ color: '#0B132B', label: 'Azul noite' }, { color: '#1C2541', label: 'Marinho' }, { color: '#3A506B', label: 'Aço' },
				{ color: '#5BC0BE', label: 'Turquesa' }, { color: '#F2E9E4', label: 'Areia' }
			], 'Cliente');
			return { ok: true, kind: 'ase', name: 'Cliente', hex: window.PalIO.bytesToHex(bytes) };
		},
		exportAse: function (hex, name) {
			window.PalMockHost.lastAse = hex;
			return { ok: true, path: '~/Desktop/' + name + '.ase', name: name + '.ase' };
		},
		capture: function (scope) {
			var src = scope === 'project' ? proj().layers : selLayers();
			if (scope !== 'project' && !src.length) return { ok: false, reason: 'nosel', colors: [] };
			var out = [];
			src.forEach(function (l) {
				[l.color, l.stroke].forEach(function (c) { if (c && out.indexOf(c) < 0) out.push(c); });
			});
			return { ok: true, colors: out };
		}
	};
})(window);
