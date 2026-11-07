/* O PALETTERO · ponte entre o painel (HTML) e o After Effects (ExtendScript).
   Fora do After Effects (navegador), usa window.PalMockHost — o "AE de mentira" do mockup. */
(function (root) {
	'use strict';

	var cep = root.__adobe_cep__;

	function evalScript(fn, args) {
		var script = fn + '(' + (args || []).map(function (a) { return JSON.stringify(a); }).join(',') + ')';
		return new Promise(function (resolve, reject) {
			cep.evalScript(script, function (res) {
				if (res === 'EvalScript error.') return reject(new Error(fn + ' falhou'));
				try { resolve(res ? JSON.parse(res) : null); } catch (e) { resolve(res); }
			});
		});
	}

	function call(fn) {
		var args = Array.prototype.slice.call(arguments, 1);
		if (cep) return evalScript('PAL_' + fn, args);
		var mock = root.PalMockHost;
		if (!mock || !mock[fn]) return Promise.reject(new Error('host indisponível: ' + fn));
		return new Promise(function (resolve) {
			// pequeno atraso para simular a ida e volta do evalScript
			setTimeout(function () { resolve(JSON.parse(JSON.stringify(mock[fn].apply(mock, args)))); }, 60);
		});
	}

	function openURL(url) {
		if (root.cep && root.cep.util) root.cep.util.openURLInDefaultBrowser(url);
		else root.open(url, '_blank', 'noopener');
	}

	root.PalHost = {
		isCEP: !!cep,
		projectKey: function () { return call('projectKey'); },
		loadPalette: function () { return call('loadPalette'); },
		savePalette: function (swatches) { return call('savePalette', JSON.stringify(swatches)); },
		loadPrefs: function () { return call('loadPrefs'); },
		savePrefs: function (prefs) { return call('savePrefs', JSON.stringify(prefs)); },
		apply: function (hex, opts) { return call('apply', hex, JSON.stringify(opts || {})); },
		capture: function (scope) { return call('capture', scope); },
		openURL: openURL
	};
})(window);
