/* El PALLETERO · harmonias
   Regras básicas de harmonia a partir de uma cor base (matiz, saturação e brilho de 0 a 1).
   Só cálculo: a interface fica no panel.js. */
(function (root) {
	'use strict';

	var C = root.PalColor;

	// offs: deslocamentos de matiz em graus · open: usa a abertura · mono: varia só saturação/brilho
	var RULES = [
		{ id: 'ana', name: 'análoga', open: true, offs: function (a) { return [-2 * a, -a, 0, a, 2 * a]; } },
		{ id: 'mono', name: 'monocromática', mono: true, offs: function () { return [0, 0, 0, 0, 0]; } },
		{ id: 'comp', name: 'complementar', offs: function () { return [0, 180]; } },
		{ id: 'split', name: 'complementar dividida', open: true, offs: function (a) { return [0, 180 - a, 180 + a]; } },
		{ id: 'tri', name: 'tríade', offs: function () { return [0, 120, 240]; } },
		{ id: 'tet', name: 'tétrade', offs: function () { return [0, 60, 180, 240]; } },
		{ id: 'sq', name: 'quadrado', offs: function () { return [0, 90, 180, 270]; } }
	];
	// monocromática: fatores de [saturação, brilho] de cada tom; o do meio é a base
	var MONO = [[0.35, 1.15], [0.65, 1.07], [1, 1], [1.06, 0.7], [1, 0.45]];
	var OPEN_MIN = 10, OPEN_MAX = 60;

	function clamp(x) { return Math.max(0, Math.min(1, x)); }
	function norm(h) { return ((h % 360) + 360) % 360; }
	function rule(id) {
		for (var i = 0; i < RULES.length; i++) if (RULES[i].id === id) return RULES[i];
		return null;
	}

	// pontos na roda: deslocamento de matiz + fatores de saturação/brilho
	function points(st) {
		var r = rule(st.rule) || RULES[4];
		return r.offs(st.open).map(function (o, i) {
			var m = r.mono ? MONO[i] : [1, 1];
			return { off: o, sk: m[0], bk: m[1], base: r.mono ? i === 2 : o === 0 };
		});
	}

	// degraus de brilho: 1 (só o tom), 2 (+ escuro) ou 3 (claro, tom, escuro)
	function variants(st) {
		var same = function (s, b) { return [s, b]; };
		if ((rule(st.rule) || {}).mono || st.steps <= 1) return [same];
		var dark = function (s, b) { return [Math.min(1, s * 1.05), b * 0.6]; };
		var lite = function (s, b) { return [s * 0.55, b + (1 - b) * 0.65]; };
		return st.steps === 2 ? [same, dark] : [lite, same, dark];
	}

	// colunas (uma por ponto) com os tons de cada uma: [{ key, hex, base }]
	function grid(st) {
		var vs = variants(st), mid = vs.length === 3 ? 1 : 0;
		return points(st).map(function (p, i) {
			var s = clamp(st.s * p.sk), b = clamp(st.b * p.bk);
			return vs.map(function (fn, j) {
				var v = fn(s, b);
				return {
					key: i + '.' + j,
					hex: C.rgbToHex(C.hsbToRgb([norm(st.h + p.off), clamp(v[0]) * 100, clamp(v[1]) * 100])),
					base: p.base && j === mid
				};
			});
		});
	}

	// mini-roda com os pontos na posição da regra (20 × 20)
	function icon(r) {
		var offs = r.offs(r.id === 'ana' ? 34 : 30), out = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle class="hr-ring" cx="10" cy="10" r="8"/><g class="hr-dots">';
		offs.forEach(function (o, i) {
			var rr = r.mono ? 2 + i * 1.5 : 8, a = o * Math.PI / 180;
			var x = (10 + Math.sin(a) * rr).toFixed(2), y = (10 - Math.cos(a) * rr).toFixed(2);
			if (!r.mono) out += '<line class="hr-spoke" x1="10" y1="10" x2="' + x + '" y2="' + y + '"/>';
			out += '<circle class="hr-dot" data-i="' + i + '" cx="' + x + '" cy="' + y + '" r="' + (o === 0 && !r.mono ? 2.4 : 1.9) + '"/>';
		});
		return out + '</g></svg>';
	}

	// degraus: barras empilhadas (14 × 14)
	function stepsIcon(n) {
		var h = 12 / n, out = '<svg viewBox="0 0 14 14" aria-hidden="true">';
		for (var i = 0; i < n; i++) out += '<rect x="2" y="' + (1 + i * h + 0.6).toFixed(2) + '" width="10" height="' + (h - 1.2).toFixed(2) + '" rx="1" fill="currentColor" opacity="' + (1 - i * 0.28).toFixed(2) + '"/>';
		return out + '</svg>';
	}

	root.PalHarmony = {
		RULES: RULES, OPEN_MIN: OPEN_MIN, OPEN_MAX: OPEN_MAX,
		rule: rule, points: points, grid: grid, icon: icon, stepsIcon: stepsIcon, norm: norm
	};
})(window);
