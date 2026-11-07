/* O PALETTERO · ponte entre o painel (HTML) e o After Effects (ExtendScript).
   Fora do After Effects (navegador), usa window.PalMockHost — o "AE de mentira" do mockup. */
(function (root) {
	'use strict';

	var cep = root.__adobe_cep__;

	function evalScript(fn, args) {
		var script = fn + '(' + (args || []).map(function (a) { return a === undefined ? 'undefined' : JSON.stringify(a); }).join(',') + ')';
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

	// carrega a imagem do frame. No CEP lê o arquivo pelo Node (data: URL não "suja" o canvas);
	// o PNG pode demorar um pouco para existir, então tenta de novo por alguns segundos.
	function loadImage(r) {
		return new Promise(function (resolve, reject) {
			var tries = 0;
			function attempt() {
				var src = r.url;
				if (!src && r.path) {
					var fs = root.require ? root.require('fs') : null;
					if (fs) {
						try {
							var ext = (r.path.match(/\.(\w+)$/) || [, 'png'])[1].toLowerCase().replace('jpg', 'jpeg');
							src = 'data:image/' + ext + ';base64,' + fs.readFileSync(r.path).toString('base64');
						} catch (e) { src = null; }
					} else {
						src = encodeURI('file:///' + r.path.replace(/\\/g, '/').replace(/^\/+/, '')) + '?t=' + Date.now();
					}
				}
				if (!src) return retry();
				var img = new Image();
				img.onload = function () { resolve(img); };
				img.onerror = retry;
				img.src = src;
			}
			function retry() {
				if (++tries > 30) return reject(new Error('frame não encontrado'));
				setTimeout(attempt, 200);
			}
			attempt();
		});
	}

	root.PalHost = {
		isCEP: !!cep,
		projectKey: function () { return call('projectKey'); },
		loadPalette: function () { return call('loadPalette'); },
		savePalette: function (swatches, preset) { return call('savePalette', JSON.stringify(swatches), preset); },
		loadPrefs: function () { return call('loadPrefs'); },
		savePrefs: function (prefs) { return call('savePrefs', JSON.stringify(prefs)); },
		apply: function (hex, opts) { return call('apply', hex, JSON.stringify(opts || {})); },
		capture: function (scope) { return call('capture', scope); },
		listPresets: function () { return call('listPresets'); },
		savePreset: function (preset) { return call('savePreset', JSON.stringify(preset)); },
		deletePreset: function (id) { return call('deletePreset', id); },
		choosePresetFolder: function () { return call('choosePresetFolder'); },
		revealPresetFolder: function () { return call('revealPresetFolder'); },
		grabFrame: function () { return call('grabFrame'); },
		releaseFrame: function (r) { return r && r.temp ? call('releaseFrame', r.tmpId || 0, r.path) : Promise.resolve(); },
		loadImage: loadImage,
		openURL: openURL
	};
})(window);
