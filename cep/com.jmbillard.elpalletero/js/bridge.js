/* El PALLETERO · ponte entre o painel (HTML) e o After Effects (ExtendScript).
   Fora do After Effects (navegador), usa window.PalMockHost — o "AE de mentira" do mockup. */
(function (root) {
	'use strict';

	var cep = root.__adobe_cep__;

	function evalScript(fn, args) {
		// U+2028/2029 são quebras de linha para o ExtendScript (ES3): dentro de uma string, quebram o script
		var script = fn + '(' + (args || []).map(function (a) { return a === undefined ? 'undefined' : JSON.stringify(a).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029'); }).join(',') + ')';
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

	// Com o painel em foco, o After Effects fica com as teclas para os próprios atalhos
	// (Ctrl/⌘+Z desfaria algo no projeto, Delete apagaria layers…). Aqui o painel pede essas teclas.
	// Os códigos são do sistema: virtual-key no Windows, kVK no Mac.
	var IS_MAC = /Mac/i.test(root.navigator.platform || root.navigator.userAgent);
	var KEYS = IS_MAC ? [
		{ keyCode: 53 }, { keyCode: 36 }, { keyCode: 76 }, { keyCode: 51 }, { keyCode: 117 }, { keyCode: 49 },  // esc, return, enter, delete, del, espaço
		{ keyCode: 123 }, { keyCode: 124 }, { keyCode: 125 }, { keyCode: 126 }, { keyCode: 120 }, { keyCode: 14 }, // setas, F2, E
		{ keyCode: 6, metaKey: true }, { keyCode: 58 }, { keyCode: 61 }, { keyCode: 55 }, { keyCode: 56 }, { keyCode: 60 }, // ⌘Z, ⌥, ⌘, ⇧
		{ keyCode: 9, metaKey: true }, { keyCode: 44, shiftKey: true }, { keyCode: 94, shiftKey: true }  // ⌘V, ? (US e ABNT)
	] : [
		{ keyCode: 27 }, { keyCode: 13 }, { keyCode: 46 }, { keyCode: 8 }, { keyCode: 32 },
		{ keyCode: 37 }, { keyCode: 38 }, { keyCode: 39 }, { keyCode: 40 }, { keyCode: 113 }, { keyCode: 69 },
		{ keyCode: 90, ctrlKey: true }, { keyCode: 18 }, { keyCode: 17 }, { keyCode: 16 },
		{ keyCode: 86, ctrlKey: true }, { keyCode: 191, shiftKey: true }, { keyCode: 193, shiftKey: true } // Ctrl+V, ? (US e ABNT)
	];
	if (cep && cep.registerKeyEventsInterest) {
		try { cep.registerKeyEventsInterest(JSON.stringify(KEYS)); } catch (e) {}
	}

	// área de transferência pelo sistema (pbpaste / Get-Clipboard): no CEP o evento de colar nem
	// sempre chega ao painel. Fora do CEP, a API do navegador.
	function readClipboard() {
		try {
			var req = root.cep_node ? root.cep_node.require : root.require;
			if (cep && req) {
				var cp = req('child_process');
				// saída em UTF-8: o PowerShell usa a página de código do console (acentos viravam �), e o
				// pbpaste aberto pelo After pode vir sem LANG
				var cmd = IS_MAC ? 'pbpaste' : 'powershell -NoProfile -NonInteractive -Command "[Console]::OutputEncoding=[Text.Encoding]::UTF8; Get-Clipboard -Raw"';
				var env = {}, k, proc = req('process');
				for (k in proc.env) env[k] = proc.env[k];
				if (IS_MAC) env.LANG = env.LC_ALL = 'en_US.UTF-8';
				return Promise.resolve(String(cp.execSync(cmd, { encoding: 'utf8', timeout: 4000, windowsHide: true, env: env })));
			}
		} catch (e) {}
		if (root.navigator.clipboard && root.navigator.clipboard.readText) return root.navigator.clipboard.readText();
		return Promise.reject(new Error('sem área de transferência'));
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
		setStrings: function (map) { return call('setStrings', JSON.stringify(map)); },
		apply: function (hex, opts) { return call('apply', hex, JSON.stringify(opts || {})); },
		capture: function (scope) { return call('capture', scope); },
		inspect: function () { return call('inspect'); },
		listPresets: function () { return call('listPresets'); },
		savePreset: function (preset) { return call('savePreset', JSON.stringify(preset)); },
		deletePreset: function (id) { return call('deletePreset', id); },
		savePresetOrder: function (ids) { return call('savePresetOrder', JSON.stringify(ids)); },
		choosePresetFolder: function () { return call('choosePresetFolder'); },
		revealPresetFolder: function () { return call('revealPresetFolder'); },
		mountPresetVolume: function () { return call('mountPresetVolume'); },
		resetPresetFolder: function () { return call('resetPresetFolder'); },
		grabFrame: function () { return call('grabFrame'); },
		releaseFrame: function (r) { return r && r.temp ? call('releaseFrame', r.tmpId || 0, r.path) : Promise.resolve(); },
		importColors: function () { return call('importColors'); },
		exportAse: function (hex, name) { return call('exportAse', hex, name); },
		readClipboard: readClipboard,
		loadImage: loadImage,
		openURL: openURL
	};
})(window);
