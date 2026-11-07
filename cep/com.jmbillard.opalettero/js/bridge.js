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

	// Carrega a imagem do frame só quando o arquivo está completo.
	// saveFrameToPng pode devolver o controle antes de terminar de gravar, então:
	//  1) espera o arquivo existir com tamanho > 0;
	//  2) espera o tamanho parar de mudar entre duas leituras;
	//  3) para PNG, confere o bloco final IEND (prova de arquivo inteiro);
	//  4) só então decodifica. Se a decodificação falhar, volta a esperar.
	// opts: { timeout (ms), cancelled() → true para desistir }
	var IEND = [0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82];

	function isPng(path) { return /\.png$/i.test(path); }

	function pngComplete(buf) {
		if (buf.length < 20) return false;
		var tail = buf.slice(buf.length - 8);
		for (var i = 0; i < 8; i++) if (tail[i] !== IEND[i]) return false;
		return true;
	}

	function decode(src) {
		return new Promise(function (resolve, reject) {
			var img = new Image();
			img.onload = function () { resolve(img); };
			img.onerror = function () { reject(new Error('imagem inválida')); };
			img.src = src;
		});
	}

	function loadImage(r, opts) {
		opts = opts || {};
		var timeout = opts.timeout || 60000;
		var t0 = Date.now();
		var fs = root.require ? root.require('fs') : null;
		var lastSize = -1;

		return new Promise(function (resolve, reject) {
			function again() {
				if (opts.cancelled && opts.cancelled()) return reject(new Error('cancelado'));
				if (Date.now() - t0 > timeout) return reject(new Error('tempo esgotado'));
				setTimeout(step, 150);
			}

			function step() {
				if (opts.cancelled && opts.cancelled()) return reject(new Error('cancelado'));

				// mockup (navegador): imagem já vem como URL; readyAt simula o tempo de render
				if (r.url) {
					if (r.readyAt && Date.now() < r.readyAt) return again();
					return decode(r.url).then(resolve, again);
				}

				if (!fs) {
					// sem Node: não há como checar o arquivo, só tentar decodificar
					return decode(encodeURI('file:///' + r.path.replace(/\\/g, '/').replace(/^\/+/, '')) + '?t=' + Date.now()).then(resolve, again);
				}

				var size;
				try { size = fs.statSync(r.path).size; } catch (e) { return again(); }   // ainda não existe
				if (!size || size !== lastSize) { lastSize = size; return again(); }    // vazio ou crescendo

				var buf;
				try { buf = fs.readFileSync(r.path); } catch (e) { return again(); }    // ainda travado pelo AE
				if (buf.length !== size) { lastSize = buf.length; return again(); }
				if (isPng(r.path) && !pngComplete(buf)) return again();

				var ext = (r.path.match(/\.(\w+)$/) || [, 'png'])[1].toLowerCase().replace('jpg', 'jpeg');
				decode('data:image/' + ext + ';base64,' + buf.toString('base64')).then(resolve, function () {
					lastSize = -1;
					again();
				});
			}

			step();
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
