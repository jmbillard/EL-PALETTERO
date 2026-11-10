/* El PALLETERO · nomes automáticos de cor (evocativos, no idioma do painel)
   Escolhe o nome da referência mais próxima em CIELAB e evita repetir nomes na mesma paleta. */
(function (root) {
	'use strict';
	var C = root.PalColor;

	// referências no idioma atual, de i18n/colors.csv (montadas no primeiro uso, depois do boot)
	var LIST = null;
	function list() {
		if (!LIST) {
			LIST = root.PalI18n.colors().map(function (e) { return { name: e[0], lab: C.rgbToLab(C.hexToRgb(e[1])) }; });
			if (!LIST.length) LIST = [{ name: '?', lab: [50, 0, 0] }];
		}
		return LIST;
	}
	function T(k) { return root.PalI18n.t(k); }

	var cache = {};
	function ranked(hex) {
		hex = C.normHex(hex) || '#000000';
		if (cache[hex]) return cache[hex];
		var lab = C.rgbToLab(C.hexToRgb(hex));
		var ranks = list().map(function (e) {
			// peso menor na luminosidade: o matiz importa mais para o nome
			var d = Math.pow((lab[0] - e.lab[0]) * 0.7, 2) + Math.pow(lab[1] - e.lab[1], 2) + Math.pow(lab[2] - e.lab[2], 2);
			return { name: e.name, lab: e.lab, d: d };
		}).sort(function (a, b) { return a.d - b.d; });
		return (cache[hex] = { lab: lab, list: ranks });
	}

	function nearest(hex) { return ranked(hex).list[0].name; }

	function unique(base, taken) {
		if (taken.indexOf(base) < 0) return base;
		for (var n = 2; ; n++) if (taken.indexOf(base + ' ' + n) < 0) return base + ' ' + n;
	}

	// nome livre dentro da paleta: o mais próximo; se já existe, um vizinho parecido;
	// depois "suave"/"forte" conforme a luminosidade; por último, um número
	function pick(hex, taken) {
		var r = ranked(hex), best = r.list[0];
		if (taken.indexOf(best.name) < 0) return best.name;
		for (var i = 1; i < 4; i++) {
			var alt = r.list[i];
			if (alt.d <= Math.max(best.d * 2.5, 220) && taken.indexOf(alt.name) < 0) return alt.name;
		}
		var mod = best.name + ' ' + (r.lab[0] >= best.lab[0] ? T('names.lighter') : T('names.deeper'));
		if (taken.indexOf(mod) < 0) return mod;
		return unique(best.name, taken);
	}

	// rótulos do script antigo ("cor 3", vazio ou o próprio hex) contam como automáticos
	function isGeneric(label, hex) {
		var l = String(label || '').trim();
		return !l || /^(cor|color|colou?r) \d+$/i.test(l) || l.toUpperCase() === String(hex).toUpperCase();
	}

	root.PalNames = { nearest: nearest, pick: pick, unique: unique, isGeneric: isGeneric };
})(window);
