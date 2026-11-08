/* El PALLETERO · painel
   Estado → render com animações FLIP. Tudo que muda de lugar, anima. */
(function (root) {
	'use strict';

	var C = root.PalColor;
	var Host = root.PalHost;
	var N = root.PalNames;
	var X = root.PalExtract;
	var VERSION = 'v1.2.6';
	var DOCS = 'https://github.com/jmbillard/O-PALETTERO#readme';
	var EASE = 'cubic-bezier(.2,.8,.2,1)';

	// Windows × Mac: no Mac o "Ctrl" do painel é ⌘ (Ctrl+clique lá é clique direito) e as teclas
	// aparecem com os símbolos do sistema
	var IS_MAC = /Mac/i.test(root.navigator.platform || root.navigator.userAgent);
	var KEY = IS_MAC ? { ctrl: '⌘', alt: '⌥', shift: '⇧' } : { ctrl: 'Ctrl', alt: 'Alt', shift: 'Shift' };
	function cmd(e) { return IS_MAC ? !!e.metaKey : !!e.ctrlKey; }
	function macRightClick(e) { return IS_MAC && e.ctrlKey && !e.metaKey; }
	var SPRING = 'cubic-bezier(.34,1.56,.64,1)';

	// ícones de traço (24×24), baseados no Lucide (ISC)
	var ICONS = {
		plus: '<path d="M12 5v14M5 12h14"/>',
		pipette: '<path class="i-drop" d="M3 21.5h.01"/><path d="m2 22 1-1h3l9-9"/><path d="M3 21v-3l9-9"/><path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3l.4.4Z"/>',
		layers: '<path class="i-l1" d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path class="i-l3" d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path class="i-l2" d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
		sort: '<g class="i-a1"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/></g><g class="i-a2"><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/></g>',
		more: '<circle class="i-d1" cx="5" cy="12" r="1"/><circle class="i-d2" cx="12" cy="12" r="1"/><circle class="i-d3" cx="19" cy="12" r="1"/>',
		x: '<path d="M18 6 6 18M6 6l12 12"/>',
		check: '<path class="i-draw" pathLength="1" d="M20 6 9 17l-5-5"/>',
		pencil: '<path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"/>',
		bucket: '<path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z"/><path d="m5 2 5 5"/><path d="M2 13h15"/><path d="M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.4 2-4 .3 1.6 2 2.4 2 4Z"/>',
		copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
		trash: '<g class="i-lid"><path d="M3 6h18"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></g><g class="i-can"><path d="M5 6h14"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M10 11v6"/><path d="M14 11v6"/></g>',
		eye: '<g class="i-eye"><path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/></g>',
		tag: '<path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
		bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
		reset: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
		help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
		undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
		alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
		image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
		library: '<path d="M11 17a4 4 0 0 1-8 0V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2Z"/><path d="M16.7 13H19a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H7"/><path d="M7 17h.01"/><path d="m11 8 2.3-2.3a2.4 2.4 0 0 1 3.4 0l1.9 1.9a2.4 2.4 0 0 1 0 3.4L9.9 19.8"/>',
		star: '<path d="M11.5 2.3a.5.5 0 0 1 .9 0l2.3 4.7a2 2 0 0 0 1.5 1.1l5.2.8a.5.5 0 0 1 .3.9l-3.8 3.7a2 2 0 0 0-.6 1.8l.9 5.2a.5.5 0 0 1-.7.5l-4.6-2.4a2 2 0 0 0-1.9 0l-4.6 2.4a.5.5 0 0 1-.7-.5l.9-5.2a2 2 0 0 0-.6-1.8L2.2 9.8a.5.5 0 0 1 .3-.9l5.2-.8a2 2 0 0 0 1.5-1.1z"/>',
		folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
		sparkle: '<path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.13-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.13a.5.5 0 0 1 .96 0L14.06 8.5A2 2 0 0 0 15.5 9.94l6.13 1.58a.5.5 0 0 1 0 .96L15.5 14.06a2 2 0 0 0-1.44 1.44l-1.58 6.13a.5.5 0 0 1-.96 0z"/>',
		minus: '<path d="M5 12h14"/>',
		unplug: '<path d="m19 5 3-3"/><path d="m2 22 3-3"/><path d="M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z"/><path d="M7.5 13.5 10 11"/><path d="M10.5 16.5 13 14"/><path d="m12 6 6 6 2.3-2.3a2.4 2.4 0 0 0 0-3.4l-2.6-2.6a2.4 2.4 0 0 0-3.4 0Z"/>',
		file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>'
	};

	// logo (picolé com mordida) para o estado de paleta vazia · mesmo desenho de docs/img/logo.svg
	var LOGO = '<svg class="empty-logo" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="9.12 9.12 101.76 101.76"><defs><linearGradient id="pal-lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF4D4D"/><stop offset=".25" stop-color="#FF8F4D"/><stop offset=".5" stop-color="#FFC44E"/><stop offset=".75" stop-color="#5DE6A2"/><stop offset="1" stop-color="#80C0FE"/></linearGradient><mask id="pal-lm"><rect x="-20" y="-20" width="160" height="160" fill="#fff"/><g fill="#000"><circle cx="90.5" cy="32" r="13"/></g></mask></defs><rect x="53.0" y="80" width="14" height="28" rx="7.0" fill="#E9CFA0"/><g mask="url(#pal-lm)"><path d="M33.0,77 L37.0,21 Q37.0,12 46.0,12 L74.0,12 Q83.0,12 83.0,21 L87.0,77 Q87.0,86 78.0,86 L42.0,86 Q33.0,86 33.0,77 Z" fill="url(#pal-lg)"/><path d="M42.0,26 L41.0,58" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".35"/></g></svg>';

	// pontinhos do puxador: SVG (como no O PADEIRO). Grid dentro de <button> não funciona no Chromium do CEP.
	var GRIP = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>';

	function ic(name, cls) {
		return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + ICONS[name] + '</svg>';
	}

	function esc(s) {
		return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
	}

	var uid = 0;
	function newId() { return 's' + (++uid); }

	function store(key, val) {
		try {
			if (val === undefined) return localStorage.getItem(key);
			localStorage.setItem(key, val);
		} catch (e) { return null; }
	}

	// ==================================================================================

	function mount(el) {
		var S = {
			swatches: [],
			prefs: { format: 'HEX', names: true, info: true, defaultPreset: '' },
			project: '',
			preset: '',       // preset de origem da paleta do projeto
			presets: [],
			folder: '',
			offline: null,    // { volume, canMount } quando a pasta de presets não está acessível
			last: null,
			undo: [],
			key: null
		};
		var mods = { alt: false, ctrl: false, shift: false };

		el.classList.add('pal');
		el.tabIndex = -1;
		el.innerHTML = [
			'<div class="dock dock-a">',
			'  <button class="tool" data-act="add" aria-label="Nova cor">' + ic('plus') + '</button>',
			'  <button class="tool" data-act="capture" aria-label="Capturar cores"><span class="swap">' + ic('pipette') + ic('image') + ic('layers') + '</span></button>',
			'</div>',
			'<div class="strip" role="list" aria-label="Paleta"></div>',
			'<div class="empty" hidden>' + LOGO + '<span>Paleta vazia</span>',
			'  <button class="row-btn" data-act="capture">' + ic('pipette') + '<span class="lbl">Capturar</span></button>',
			'  <button class="row-btn" data-act="add">' + ic('plus') + '<span class="lbl">Nova cor</span></button>',
			'</div>',
			'<div class="dock dock-b">',
			'  <button class="tool" data-act="library" aria-label="Presets"><span class="swap">' + ic('library') + ic('x') + '</span></button>',
			'  <button class="tool" data-act="menu" aria-label="Ajustes"><span class="swap">' + ic('more') + ic('x') + '</span></button>',
			'</div>',
			'<div class="sheet settings" hidden>',
			'  <div class="grp"><span class="grp-title">Exibir</span>',
			'    <div class="seg" data-tip="Formato dos valores"><span class="seg-pill"></span>',
			'      <button data-fmt="HEX">HEX</button><button data-fmt="RGB">RGB</button><button data-fmt="HSB">HSB</button></div>',
			'    <button class="row-btn" data-act="toggle-info" data-tip="Valores sempre visíveis">' + ic('eye') + '<span class="lbl">Valores sempre visíveis</span></button>',
			'    <button class="row-btn" data-act="toggle-names" data-tip="Mostrar nomes">' + ic('tag') + '<span class="lbl">Mostrar nomes</span></button>',
			'  </div>',
			'  <span class="vr"></span>',
			'  <div class="grp"><span class="grp-title">Paleta</span>',
			'    <button class="row-btn" data-act="sort" data-tip="Ordenar por matiz">' + ic('sort') + '<span class="lbl">Ordenar por matiz</span></button>',
			'    <button class="row-btn danger" data-act="clear" data-tip="Segure para limpar">' + ic('trash') + '<span class="lbl">Segure para limpar</span><i class="hold"></i></button>',
			'  </div>',
			'  <span class="vr"></span>',
			'  <div class="grp"><button class="row-btn" data-act="help" data-tip="Ajuda e documentação">' + ic('help') + '<span class="lbl">Ajuda</span></button><span class="ver">' + VERSION + '</span></div>',
			'</div>',
			'<div class="sheet library" hidden>',
			'  <div class="lib-list" role="list"></div>',
			'  <button class="lib-folder" data-act="folder">' + ic('folder') + '<span class="lib-path"></span></button>',
			'</div>',
			'<div class="sheet extract" hidden tabindex="-1" role="dialog" aria-label="Extrair cores">',
			'  <div class="ed-flood"></div>',
			'  <div class="ex-img"><div class="ex-stage"><img alt=""><div class="ex-marks"></div><span class="ex-loupe"><i></i></span></div><span class="ex-wait"><span class="ex-wait-txt"></span></span></div>',
			'  <div class="ex-side">',
			'    <div class="ex-head">' + ic('image') + '<span class="ex-label"></span></div>',
			'    <div class="ex-chips"></div>',
			'    <div class="ex-ctrl">',
			'      <div class="ex-count"><button class="ex-step" data-d="-1" data-tip="Menos cores">' + ic('minus') + '</button><span class="ex-n">6</span><button class="ex-step" data-d="1" data-tip="Mais cores">' + ic('plus') + '</button></div>',
			'      <button class="ed-btn cancel" data-tip="Cancelar" data-kbd="Esc">' + ic('x') + '</button>',
			'      <button class="ed-btn ok" data-tip="Adicionar à paleta" data-kbd="Enter">' + ic('check') + '</button>',
			'    </div>',
			'  </div>',
			'</div>',
			'<div class="sheet editor" hidden tabindex="-1" role="dialog" aria-label="Editor de cor">',
			'  <div class="ed-flood"></div>',
			'  <div class="ed-prev"><button class="ed-old" data-tip="Voltar à cor original">' + ic('undo') + '</button>',
			'    <div class="ed-new"><input class="ed-name" id="pal-ed-name" placeholder="nome da cor" maxlength="40" spellcheck="false" autocomplete="off"><button class="ed-auto" type="button" data-tip="Nome automático">' + ic('sparkle') + '</button></div></div>',
			'  <div class="ed-sv" tabindex="0" aria-label="Saturação e brilho"><span class="knob"></span></div>',
			'  <div class="ed-hue" tabindex="0" aria-label="Matiz"><span class="knob"></span></div>',
			'  <div class="ed-ctrl">',
			'    <div class="ed-field"><button class="ed-fmt" type="button" data-tip="Alternar HEX · RGB · HSB">HEX</button><input class="ed-val" id="pal-ed-val" spellcheck="false" autocomplete="off" aria-label="Valor da cor"></div>',
			'    <div class="ed-actions">',
			'      <button class="ed-btn del" data-tip="Excluir cor">' + ic('trash') + '</button>',
			'      <button class="ed-btn cancel" data-tip="Cancelar" data-kbd="Esc">' + ic('x') + '</button>',
			'      <button class="ed-btn ok" data-tip="Aplicar" data-kbd="Enter">' + ic('check') + '</button>',
			'    </div>',
			'  </div>',
			'</div>',
			'<div class="toast" role="status"><span class="chip"></span><span class="toast-ic"></span><span class="toast-msg"></span><button type="button">desfazer</button></div>',
			'<div class="tip"></div>'
		].join('\n');

		function q(s) { return el.querySelector(s); }
		var strip = q('.strip');
		var empty = q('.empty');
		var settings = q('.settings');
		var library = q('.library');
		var exSheet = q('.extract');
		var ed = q('.editor');
		var toastEl = q('.toast');
		var tipEl = q('.tip');
		var nodes = {}; // id → elemento

		// ------------------------------------------------------------------ layout responsivo
		function measure() {
			var w = el.clientWidth, h = el.clientHeight;
			var orient = (h < 110 || w > h * 2) ? 'row' : (w < 170 ? 'col' : 'grid');
			el.dataset.orient = orient;
			el.dataset.thin = h < 70 ? '1' : '0';
			el.dataset.narrow = w < 160 ? '1' : '0';
			el.dataset.short = h < 110 ? '1' : '0';
			el.dataset.shape = (h < 220 && w > h) ? 'wide' : 'tall';
			roomy();
			if (!settings.hidden) placePill(false);
			if (!exSheet.hidden) fitStage();
			if (!library.hidden) libFade();
		}

		function roomy() {
			var n = S.swatches.length || 1, o = el.dataset.orient, r;
			if (o === 'row') r = strip.clientWidth / n >= 58 && strip.clientHeight >= 40;
			else if (o === 'col') r = strip.clientHeight / n >= 22;
			else r = true;
			el.dataset.roomy = r ? '1' : '0';
			// amostra baixa: não cabe o balde acima dos rótulos, então ele vai para a direita
			el.dataset.tight = o === 'row' && strip.clientHeight < (S.prefs.names ? 60 : 46) ? '1' : '0';
		}

		if (root.ResizeObserver) new ResizeObserver(measure).observe(el);
		else root.addEventListener('resize', measure);

		// ------------------------------------------------------------------ swatches
		function makeSwatch(sw) {
			var n = document.createElement('div');
			n.className = 'sw';
			n.dataset.id = sw.id;
			n.tabIndex = 0;
			n.setAttribute('role', 'listitem');
			n.innerHTML = '<button class="sw-edit" tabindex="-1" aria-label="Editar cor">' + ic('pencil') + '</button>' +
				'<span class="sw-glyph">' + ic('bucket', 'g-fill') + ic('copy', 'g-copy') + ic('x', 'g-del') + ic('check', 'g-ok') + '</span>' +
				'<span class="sw-meta"><span class="sw-name"></span><span class="sw-val"></span></span><i class="sw-dot"></i>';
			return n;
		}

		// rótulos automáticos: nome mais próximo, sem repetir dentro da paleta
		function nameAll() {
			var taken = S.swatches.filter(function (s) { return !s.auto; }).map(function (s) { return s.label; });
			S.swatches.forEach(function (s) {
				if (!s.auto) return;
				s.label = N.pick(s.color, taken);
				taken.push(s.label);
			});
		}
		function autoNameFor(hex, exceptId) {
			var taken = [];
			S.swatches.forEach(function (s) { if (s.id !== exceptId) taken.push(s.label); });
			return N.pick(hex, taken);
		}

		function paint(n, sw) {
			n.style.setProperty('--c', sw.color);
			n.style.setProperty('--ink', C.ink(sw.color));
			n.querySelector('.sw-name').textContent = sw.label;
			n.querySelector('.sw-val').textContent = C.format(sw.color, S.prefs.format);
			n.setAttribute('aria-label', (sw.label ? sw.label + ' ' : '') + sw.color);
			n.classList.toggle('last', sw.id === S.last);
		}

		function rect(n) { return n.getBoundingClientRect(); }
		function liveNodes() { return Array.prototype.slice.call(strip.querySelectorAll('.sw:not(.leaving)')); }

		// render com FLIP: quem fica desliza, quem sai encolhe, quem entra surge
		function render(opts) {
			opts = opts || {};
			var first = {}, id;
			nameAll();
			for (id in nodes) first[id] = rect(nodes[id]);

			var keep = {};
			S.swatches.forEach(function (sw) { keep[sw.id] = true; });

			var sr = rect(strip);
			for (id in nodes) {
				if (keep[id]) continue;
				leave(nodes[id], first[id], sr);
				delete nodes[id];
			}

			var entering = [];
			S.swatches.forEach(function (sw) {
				var n = nodes[sw.id];
				if (!n) { n = nodes[sw.id] = makeSwatch(sw); entering.push(n); }
				paint(n, sw);
				strip.appendChild(n);
			});

			empty.hidden = S.swatches.length > 0;
			strip.hidden = !S.swatches.length && !strip.querySelector('.leaving');
			roomy();

			S.swatches.forEach(function (sw) {
				var n = nodes[sw.id], f = first[sw.id];
				if (!f) return;
				var l = rect(n);
				var dx = f.left - l.left, dy = f.top - l.top;
				var sx = f.width / (l.width || 1), sy = f.height / (l.height || 1);
				if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sx - 1) < 0.01 && Math.abs(sy - 1) < 0.01) return;
				n.animate([
					{ transformOrigin: '0 0', transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')' },
					{ transformOrigin: '0 0', transform: 'none' }
				], { duration: opts.slow ? 520 : 380, easing: EASE });
			});

			entering.forEach(function (n, i) {
				if (n.dataset.id === opts.noEnter) return;
				if (opts.from) {
					var l = rect(n);
					var dx = (opts.from.left + opts.from.width / 2) - (l.left + l.width / 2);
					var dy = (opts.from.top + opts.from.height / 2) - (l.top + l.height / 2);
					n.animate([
						{ transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.15)', opacity: 0, borderRadius: '50%' },
						{ opacity: 1, offset: 0.3 },
						{ transform: 'none', opacity: 1 }
					], { duration: 560, delay: i * 55, easing: SPRING, fill: 'backwards' });
				} else {
					n.animate([
						{ transform: 'scale(.4)', opacity: 0 },
						{ transform: 'none', opacity: 1 }
					], { duration: 460, delay: i * 30, easing: SPRING, fill: 'backwards' });
				}
			});
		}

		function leave(n, r, sr) {
			n.classList.add('leaving');
			n.style.position = 'absolute';
			n.style.left = (r.left - sr.left + strip.scrollLeft) + 'px';
			n.style.top = (r.top - sr.top + strip.scrollTop) + 'px';
			n.style.width = r.width + 'px';
			n.style.height = r.height + 'px';
			n.style.pointerEvents = 'none';
			n.animate([
				{ transform: 'none', opacity: 1 },
				{ transform: 'scale(.2) rotate(-8deg)', opacity: 0 }
			], { duration: 280, easing: EASE, fill: 'forwards' }).onfinish = function () {
				n.remove();
				if (!S.swatches.length) strip.hidden = true;
			};
		}

		function repaintAll() {
			S.swatches.forEach(function (sw) { if (nodes[sw.id]) paint(nodes[sw.id], sw); });
			roomy();
		}

		function find(id) {
			for (var i = 0; i < S.swatches.length; i++) if (S.swatches[i].id === id) return S.swatches[i];
			return null;
		}

		// ------------------------------------------------------------------ persistência + desfazer
		var saveTimer;
		function save() {
			clearTimeout(saveTimer);
			saveTimer = setTimeout(function () {
				Host.savePalette(plain(S.swatches), S.preset)
					.catch(function () { toast('Não foi possível salvar no projeto', { icon: 'alert' }); });
			}, 200);
		}

		function plain(list) { return list.map(function (s) { return { color: s.color, label: s.label, auto: !!s.auto }; }); }
		function snapshot() { return S.swatches.map(function (s) { return { id: s.id, color: s.color, label: s.label, auto: s.auto }; }); }
		function pushUndo(entry) {
			S.undo.push(entry || { palette: snapshot(), preset: S.preset });
			if (S.undo.length > 40) S.undo.shift();
		}
		function undo() {
			var prev = S.undo.pop();
			if (!prev) return toast('Nada para desfazer');
			if (prev.restorePreset) {
				return Host.savePreset(prev.restorePreset).then(function () {
					loadPresets(prev.restorePreset.id);
					toast('Preset restaurado', { icon: 'undo' });
				});
			}
			S.swatches = prev.palette;
			S.preset = prev.preset;
			render({ slow: true });
			save();
			if (!library.hidden) renderLibrary();
			toast('Desfeito', { icon: 'undo' });
		}

		function toSwatches(list) {
			return (list || []).map(function (s) {
				var hex = C.normHex(s.color) || '#000000';
				var auto = s.auto !== undefined ? !!s.auto : N.isGeneric(s.label, hex);
				return { id: newId(), color: hex, label: auto ? '' : s.label, auto: auto };
			});
		}

		function setSwatches(list, opts) {
			S.swatches = toSwatches(list);
			render(opts);
		}

		// ------------------------------------------------------------------ toast
		var toastTimer;
		function toast(msg, o) {
			o = o || {};
			var chip = toastEl.querySelector('.chip');
			chip.style.display = o.color ? '' : 'none';
			toastEl.style.setProperty('--tc', o.color || 'transparent');
			toastEl.querySelector('.toast-ic').innerHTML = o.icon ? ic(o.icon) : '';
			toastEl.querySelector('.toast-msg').textContent = msg;
			var btn = toastEl.querySelector('button');
			btn.hidden = !o.undo;
			btn.onclick = function () { hideToast(); undo(); };
			toastEl.classList.remove('on');
			void toastEl.offsetWidth;
			toastEl.classList.add('on');
			clearTimeout(toastTimer);
			toastTimer = setTimeout(hideToast, o.undo ? 4200 : 2200);
		}
		function hideToast() { toastEl.classList.remove('on'); }

		// ------------------------------------------------------------------ dicas (tooltip)
		var tipTimer = null, tipTarget = null;
		var learned = parseInt(store('pal.tips') || '0', 10) || 0;

		function kbd(k, label, hot) { return '<span' + (hot ? ' class="hot"' : '') + '><kbd>' + k + '</kbd>' + label + '</span>'; }

		function tipHtml(t) {
			if (t.classList.contains('sw')) {
				// as dicas das amostras somem depois que você já viu algumas vezes
				if (learned >= 6 && !mods.alt && !mods.ctrl) return '';
				return [
					kbd('clique', 'aplicar', !mods.alt && !mods.ctrl),
					kbd('botão dir.', 'editar'),
					kbd(KEY.ctrl, 'copiar', mods.ctrl),
					kbd(KEY.alt, 'excluir', mods.alt)
				].join('');
			}
			var act = t.dataset.act;
			if (act === 'add' && t.classList.contains('tool')) return '<b>Nova cor</b>';
			if (act === 'capture' && t.classList.contains('tool')) return captureTip();
			if (act === 'menu') return el.classList.contains('menu-open') ? '<b>Fechar ajustes</b>' : '<b>Ajustes</b>';
			if (act === 'library') return el.classList.contains('lib-open') ? '<b>Fechar presets</b>' : '<b>Presets</b>';
			if (act === 'folder') return '<b>' + esc(S.folder) + '</b>' + kbd('clique', 'trocar pasta') + kbd(KEY.alt, 'abrir');
			if (t.dataset.pid) {
				var pr = presetById(t.dataset.pid);
				return '<b>' + esc(pr ? pr.name : '') + '</b>' + kbd('clique', 'substituir', !mods.shift) + kbd(KEY.shift, 'adicionar', mods.shift);
			}
			if (t.dataset.tip) {
				// em layouts largos os rótulos estão escondidos: a dica assume o papel
				var lbl = t.querySelector('.lbl');
				if (lbl && lbl.offsetParent !== null) return '';
				return '<b>' + esc(t.dataset.tip) + '</b>' + (t.dataset.kbd ? ' <kbd>' + t.dataset.kbd + '</kbd>' : '');
			}
			return '';
		}

		function showTip(t) {
			var html = tipHtml(t);
			if (!html) return hideTip();
			if (t.classList.contains('sw') && learned < 6) store('pal.tips', String(++learned));
			tipEl.innerHTML = html;
			var pr = rect(el), tr = rect(t), w = tipEl.offsetWidth, h = tipEl.offsetHeight;
			var x = tr.left - pr.left + tr.width / 2 - w / 2;
			var y = tr.bottom - pr.top + 6;
			if (y + h > pr.height - 2) y = tr.top - pr.top - h - 6;
			if (y < 2) {
				// sem espaço em cima nem embaixo (faixa fina): ao lado do alvo, sem cobri-lo
				y = Math.max(2, (pr.height - h) / 2);
				x = tr.right - pr.left + 6;
				if (x + w > pr.width - 4) x = tr.left - pr.left - w - 6;
			}
			x = Math.max(4, Math.min(pr.width - w - 4, x));
			tipEl.style.transform = '';
			tipEl.style.left = x + 'px';
			tipEl.style.top = y + 'px';
			tipEl.classList.add('on');
		}
		function hideTip() { clearTimeout(tipTimer); tipEl.classList.remove('on'); }

		el.addEventListener('pointerover', function (e) {
			var t = e.target.closest('.sw, .tool, [data-tip], [data-pid], [data-act="folder"]');
			if (t === tipTarget) return;
			hideTip();
			tipTarget = t;
			if (!t || el.classList.contains('dragging')) return;
			tipTimer = setTimeout(function () { showTip(t); }, t.classList.contains('sw') ? 700 : 320);
		});
		el.addEventListener('pointerleave', function () { tipTarget = null; hideTip(); setMods({}); });
		el.addEventListener('pointerdown', hideTip);

		// ------------------------------------------------------------------ teclas modificadoras (a UI reage em tempo real)
		function setMods(e) {
			var next = { alt: !!e.altKey, ctrl: cmd(e), shift: !!e.shiftKey };
			if (next.alt === mods.alt && next.ctrl === mods.ctrl && next.shift === mods.shift) return;
			mods = next;
			el.classList.toggle('alt', mods.alt && !isSheetOpen());
			el.classList.toggle('ctrl', mods.ctrl && !mods.alt && !isSheetOpen());
			el.classList.toggle('shift', mods.shift);
			if (tipEl.classList.contains('on') && tipTarget) showTip(tipTarget);
		}
		el.addEventListener('pointermove', setMods);
		root.addEventListener('keydown', setMods);
		root.addEventListener('keyup', setMods);
		root.addEventListener('blur', function () { setMods({}); });

		// ------------------------------------------------------------------ ações nas amostras
		function ripple(n, x, y) {
			var r = rect(n), s = document.createElement('span');
			s.className = 'ripple';
			s.style.left = (x == null ? r.width / 2 : x - r.left) + 'px';
			s.style.top = (y == null ? r.height / 2 : y - r.top) + 'px';
			n.appendChild(s);
			setTimeout(function () { s.remove(); }, 650);
		}

		function flash(n, cls, ms) {
			n.classList.remove(cls);
			void n.offsetWidth;
			n.classList.add(cls);
			setTimeout(function () { n.classList.remove(cls); }, ms || 900);
		}

		function setAccent(hex) {
			el.style.setProperty('--accent', hex);
			el.style.setProperty('--accent-ink', C.ink(hex));
		}

		var REASONS = {
			nocomp: 'Abra uma composição primeiro',
			nosel: 'Selecione um layer ou uma propriedade de cor',
			error: 'O After Effects recusou a cor'
		};

		function applySwatch(sw, e) {
			var n = nodes[sw.id];
			ripple(n, e && e.clientX, e && e.clientY);
			Host.apply(sw.color).then(function (r) {
				if (r && r.ok) {
					var prev = S.last && nodes[S.last];
					if (prev) prev.classList.remove('last');
					S.last = sw.id;
					n.classList.add('last');
					setAccent(sw.color);
					flash(n, 'ok', 900);
				} else {
					flash(n, 'nope', 420);
					toast(REASONS[r && r.reason] || REASONS.error, { icon: 'alert' });
				}
			}).catch(function () {
				flash(n, 'nope', 420);
				toast(REASONS.error, { icon: 'alert' });
			});
		}

		function removeSwatch(sw) {
			pushUndo();
			S.swatches = S.swatches.filter(function (s) { return s !== sw; });
			render();
			save();
			toast((sw.label || sw.color) + ' removida', { color: sw.color, undo: true });
		}

		function copyText(text) {
			var done = false;
			try {
				var ta = document.createElement('textarea');
				ta.value = text;
				ta.style.position = 'fixed';
				ta.style.opacity = '0';
				document.body.appendChild(ta);
				ta.select();
				done = document.execCommand('copy');
				ta.remove();
			} catch (e) {}
			if (!done && navigator.clipboard) navigator.clipboard.writeText(text).catch(function () {});
		}

		function clickSwatch(sw, e) {
			if (macRightClick(e)) return; // o contextmenu abre o editor
			if (e.altKey) return removeSwatch(sw);
			if (cmd(e)) {
				var v = C.format(sw.color, S.prefs.format);
				copyText(v);
				flash(nodes[sw.id], 'ok', 700);
				return toast(v + ' copiado', { color: sw.color, icon: 'copy' });
			}
			applySwatch(sw, e);
		}

		// arrastar para reordenar (pointer capture fica na faixa, que nunca se move)
		var D = null;
		// destaque da amostra sob o mouse, decidido pela POSIÇÃO do mouse (não pelo elemento sob ele):
		// - ignora os cantos arredondados e o vão entre amostras (o destaque fica "preso");
		// - histerese: para trocar, o mouse precisa entrar HOT_IN px na outra amostra, então tremores
		//   perto da fronteira não trocam nada (era o que fazia a faixa inteira sambar);
		// - espera curta ao trocar, para uma passada rápida não sacudir tudo.
		var hot = null, hotTimer = null, hotNext = null, HOT_IN = 6;
		function setHot(n) {
			hotNext = null;
			if (hot === n) return;
			if (hot) hot.classList.remove('hot');
			hot = n;
			if (n) n.classList.add('hot');
		}
		function pickHot(e) {
			if (el.classList.contains('dragging') || D) return;
			var o = el.dataset.orient, x = e.clientX, y = e.clientY, cand = null, r = null;
			var list = liveNodes();
			for (var i = 0; i < list.length; i++) {
				var b = rect(list[i]);
				var inX = x >= b.left - 2 && x <= b.right + 2, inY = y >= b.top - 2 && y <= b.bottom + 2;
				if ((o === 'row' && inX) || (o === 'col' && inY) || (o === 'grid' && inX && inY)) { cand = list[i]; r = b; break; }
			}
			if (!cand) return; // no vão: mantém o destaque atual
			if (cand === hot) { clearTimeout(hotTimer); hotNext = null; return; }
			if (!hot || !hot.isConnected) { clearTimeout(hotTimer); return setHot(cand); }
			var depth = o === 'row' ? Math.min(x - r.left, r.right - x) : o === 'col' ? Math.min(y - r.top, r.bottom - y) : HOT_IN;
			if (depth < Math.min(HOT_IN, (o === 'col' ? r.height : r.width) / 4)) return;
			if (cand === hotNext) return; // já agendado
			clearTimeout(hotTimer);
			hotNext = cand;
			hotTimer = setTimeout(function () { setHot(cand); }, 45);
		}
		strip.addEventListener('pointermove', pickHot);
		strip.addEventListener('pointerover', pickHot);
		strip.addEventListener('pointerleave', function () {
			clearTimeout(hotTimer);
			hotNext = null;
			hotTimer = setTimeout(function () { setHot(null); }, 60);
		});

		strip.addEventListener('pointerdown', function (e) {
			var n = e.target.closest('.sw');
			if (!n || n.classList.contains('leaving') || e.button !== 0 || macRightClick(e) || e.target.closest('.sw-edit')) return;
			D = { n: n, x: e.clientX, y: e.clientY, started: false, before: snapshot() };
			strip.setPointerCapture(e.pointerId);
		});

		strip.addEventListener('pointermove', function (e) {
			if (!D) return;
			if (!D.started) {
				if (Math.abs(e.clientX - D.x) + Math.abs(e.clientY - D.y) < 6 || e.altKey) return;
				D.started = true;
				el.classList.add('dragging');
				setHot(null);
				D.n.classList.add('drag');
				hideTip();
				var r0 = rect(D.n);
				D.gx = Math.max(0, Math.min(r0.width, D.x - r0.left));
				D.gy = Math.max(0, Math.min(r0.height, D.y - r0.top));
			}
			dragMove(e);
		});

		function dragMove(e) {
			var n = D.n, o = el.dataset.orient;
			var others = liveNodes().filter(function (x) { return x !== n; });
			var idx = 0;
			others.forEach(function (x, i) {
				var r = rect(x), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
				var after = o === 'row' ? e.clientX > cx : o === 'col' ? e.clientY > cy :
					(e.clientY > r.bottom || (e.clientY >= r.top && e.clientX > cx));
				if (after) idx = i + 1;
			});
			var cur = liveNodes().indexOf(n);
			if (idx !== cur) {
				var firsts = others.map(rect);
				// move os vizinhos, nunca o elemento arrastado
				while (cur < idx) { var nx = n.nextElementSibling; while (nx && nx.classList.contains('leaving')) nx = nx.nextElementSibling; strip.insertBefore(nx, n); cur++; }
				while (cur > idx) { var pv = n.previousElementSibling; while (pv && pv.classList.contains('leaving')) pv = pv.previousElementSibling; strip.insertBefore(pv, n.nextSibling); cur--; }
				others.forEach(function (x, i) {
					var l = rect(x), f = firsts[i];
					var dx = f.left - l.left, dy = f.top - l.top;
					if (dx || dy) x.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: 220, easing: EASE });
				});
			}
			n.style.transform = '';
			var nat = rect(n);
			var tx = e.clientX - D.gx - nat.left, ty = e.clientY - D.gy - nat.top;
			if (o === 'row') ty = Math.max(-8, Math.min(8, ty * 0.3));
			if (o === 'col') tx = Math.max(-8, Math.min(8, tx * 0.3));
			n.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(1.04)';
		}

		function endPress(e, cancel) {
			if (!D) return;
			var d = D;
			D = null;
			if (!d.started) {
				if (!cancel) {
					var sw = find(d.n.dataset.id);
					if (sw) clickSwatch(sw, e);
				}
				return;
			}
			var from = d.n.style.transform;
			d.n.style.transform = '';
			d.n.animate([{ transform: from }, { transform: 'none' }], { duration: 320, easing: SPRING });
			d.n.classList.remove('drag');
			el.classList.remove('dragging');
			setHot(d.n);
			var order = liveNodes().map(function (x) { return x.dataset.id; });
			var changed = order.join() !== d.before.map(function (s) { return s.id; }).join();
			if (changed) {
				pushUndo({ palette: d.before, preset: S.preset });
				S.swatches = order.map(find);
				save();
			}
		}
		strip.addEventListener('pointerup', function (e) { endPress(e, false); });
		strip.addEventListener('pointercancel', function (e) { endPress(e, true); });

		strip.addEventListener('contextmenu', function (e) {
			var n = e.target.closest('.sw');
			if (!n) return;
			e.preventDefault();
			openEditor(find(n.dataset.id), n);
		});
		strip.addEventListener('click', function (e) {
			var b = e.target.closest('.sw-edit');
			if (!b) return;
			var n = b.closest('.sw');
			openEditor(find(n.dataset.id), n);
		});
		strip.addEventListener('keydown', function (e) {
			var n = e.target.closest('.sw');
			if (!n) return;
			var sw = find(n.dataset.id);
			if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); clickSwatch(sw, e); }
			else if (e.key === 'F2' || e.key === 'e') { e.preventDefault(); openEditor(sw, n); }
			else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeSwatch(sw); }
		});

		// ------------------------------------------------------------------ ferramentas
		function busy(btn, on) { btn.classList.toggle('busy', on); }

		// ---------------------------------------------------------------- conta-gotas contextual
		// No hover, pergunta ao AE o que está selecionado e o ícone vira o que vai acontecer:
		// conta-gotas (propriedades/layers), imagem (layer raster ou frame da comp), camadas (Shift).
		var capTool = q('.tool[data-act="capture"]');
		var INSPECT = null;

		function setMode(m) {
			INSPECT = m || null;
			capTool.dataset.mode = (m && m.mode) || '';
			if (tipEl.classList.contains('on') && tipTarget === capTool) showTip(capTool);
		}
		function inspect() { return Host.inspect().then(function (m) { setMode(m); return m; }, function () { setMode(null); return null; }); }

		capTool.addEventListener('pointerenter', inspect);

		function captureTip() {
			var shift = kbd(KEY.shift, 'projeto inteiro');
			if (mods.shift) return '<b>Capturar do projeto inteiro</b>';
			var m = INSPECT ? INSPECT.mode : '';
			if (m === 'image') {
				return INSPECT.source === 'comp' ?
					'<b>Extrair cores do frame</b><span>nada selecionado: usa a comp</span>' + shift :
					'<b>Extrair cores da imagem</b><span>' + esc(INSPECT.label || '') + '</span>' + shift;
			}
			if (m === 'props') return '<b>Capturar as propriedades selecionadas</b>' + shift;
			if (m === 'layers') return '<b>Capturar as cores dos layers</b>' + shift;
			if (m === 'none') return '<b>Abra uma composição</b>' + shift;
			return '<b>Capturar cores</b>' + shift;
		}

		function capture(btn, e) {
			if (e.shiftKey) return captureColors(btn, 'project');
			inspect().then(function (m) {
				if (m && m.mode === 'image') return openExtract(btn);
				if (m && m.mode === 'none') { flash(capTool, 'nope', 420); return toast(REASONS.nocomp, { icon: 'alert' }); }
				captureColors(btn, 'selection');
			});
		}

		function captureColors(btn, scope) {
			var tool = capTool;
			busy(tool, true);
			Host.capture(scope).then(function (r) {
				busy(tool, false);
				var have = {};
				S.swatches.forEach(function (s) { have[s.color] = true; });
				var fresh = ((r && r.colors) || []).filter(function (c) { c = C.normHex(c); if (!c || have[c]) return false; have[c] = true; return true; });
				if (!fresh.length) {
					flash(tool, 'nope', 420);
					return toast(r && r.ok ? 'Nenhuma cor nova encontrada' : 'Selecione layers ou propriedades com cor', { icon: 'pipette' });
				}
				pushUndo();
				fresh.forEach(function (c) { S.swatches.push({ id: newId(), color: C.normHex(c), label: '', auto: true }); });
				render({ from: rect(btn) });
				save();
				toast('+' + fresh.length + (fresh.length > 1 ? ' cores' : ' cor') + (scope === 'project' ? ' do projeto' : ''), { color: C.normHex(fresh[0]), undo: true });
			}).catch(function () { busy(tool, false); toast('Falha ao capturar cores', { icon: 'alert' }); });
		}

		function sortPalette() {
			var sorted = C.sortSwatches(S.swatches.slice());
			if (sorted.every(function (s, i) { return s === S.swatches[i]; })) return toast('A paleta já está em ordem', { icon: 'sort' });
			pushUndo();
			S.swatches = sorted;
			render({ slow: true });
			save();
			toast('Ordenada por matiz', { icon: 'sort', undo: true });
		}

		el.addEventListener('click', function (e) {
			var b = e.target.closest('[data-act]');
			if (!b || !el.contains(b)) return;
			var act = b.dataset.act;
			if (act === 'add') openEditor(null, b);
			else if (act === 'capture') capture(b, e);
			else if (act === 'sort') { closeSettings(); sortPalette(); }
			else if (act === 'menu') toggleSide('settings');
			else if (act === 'library') toggleSide('library');
			else if (act === 'save-preset') savePreset();
			else if (act === 'folder') chooseFolder(e);
			else if (act === 'toggle-info') setPref('info', !S.prefs.info);
			else if (act === 'toggle-names') setPref('names', !S.prefs.names);
			else if (act === 'help') Host.openURL(DOCS);
		});

		// ------------------------------------------------------------------ ajustes
		function isSheetOpen() { return !settings.hidden || !library.hidden || !ed.hidden || !exSheet.hidden; }
		function anyFull() { return !ed.hidden || !exSheet.hidden; }

		// ajustes e presets ocupam a faixa; as docas continuam visíveis e o ícone vira ×
		var SIDES = { settings: [settings, 'menu-open'], library: [library, 'lib-open'] };
		function openSide(name) {
			if (anyFull()) return;
			closeSide(name === 'settings' ? 'library' : 'settings', true);
			var sh = SIDES[name][0];
			sh.hidden = false;
			el.classList.add(SIDES[name][1], 'sheet-open');
			if (name === 'settings') { syncSettings(); placePill(false); }
			else { renderLibrary(); loadPresets(); }
			sh.animate([{ opacity: 0, transform: 'translateY(6px) scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: EASE });
		}
		function closeSide(name, instant) {
			var sh = SIDES[name][0];
			if (sh.hidden) return;
			el.classList.remove(SIDES[name][1]);
			var other = SIDES[name === 'settings' ? 'library' : 'settings'][0];
			if (!anyFull() && other.hidden) el.classList.remove('sheet-open');
			if (instant) { sh.hidden = true; return; }
			sh.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(6px) scale(.98)' }], { duration: 180, easing: EASE }).onfinish = function () {
				if (!el.classList.contains(SIDES[name][1])) sh.hidden = true;
			};
		}
		function toggleSide(name) { if (SIDES[name][0].hidden) openSide(name); else closeSide(name); }
		function closeSettings() { closeSide('settings'); closeSide('library'); }

		function syncSettings() {
			q('[data-act="toggle-info"]').setAttribute('aria-pressed', S.prefs.info);
			q('[data-act="toggle-names"]').setAttribute('aria-pressed', S.prefs.names);
			Array.prototype.forEach.call(settings.querySelectorAll('[data-fmt]'), function (b) {
				b.setAttribute('aria-pressed', b.dataset.fmt === S.prefs.format);
			});
			el.classList.toggle('show-info', S.prefs.info);
			el.classList.toggle('show-names', S.prefs.names);
		}

		function placePill(animate) {
			var b = settings.querySelector('[data-fmt="' + S.prefs.format + '"]');
			var pill = settings.querySelector('.seg-pill');
			if (!b) return;
			if (!animate) pill.style.transition = 'none';
			pill.style.width = b.offsetWidth + 'px';
			pill.style.transform = 'translateX(' + b.offsetLeft + 'px)';
			if (!animate) { void pill.offsetWidth; pill.style.transition = ''; }
		}

		settings.addEventListener('click', function (e) {
			var b = e.target.closest('[data-fmt]');
			if (!b) return;
			setPref('format', b.dataset.fmt);
			placePill(true);
		});

		function setPref(k, v) {
			S.prefs[k] = v;
			syncSettings();
			repaintAll();
			roomy();
			Host.savePrefs({
				labelType: S.prefs.format === 'HEX' ? '#HEX' : S.prefs.format,
				showColorInfo: S.prefs.info,
				showColorLabels: S.prefs.names
			}).catch(function () {});
		}

		// segurar para limpar
		(function () {
			var btn = q('[data-act="clear"]'), t;
			function cancel() { clearTimeout(t); btn.classList.remove('holding'); }
			btn.addEventListener('pointerdown', function (e) {
				if (e.button !== 0) return;
				btn.classList.add('holding');
				t = setTimeout(function () {
					cancel();
					closeSettings();
					if (!S.swatches.length) return;
					pushUndo();
					S.swatches = [];
					render();
					save();
					toast('Paleta limpa', { icon: 'trash', undo: true });
				}, 900);
			});
			btn.addEventListener('pointerup', cancel);
			btn.addEventListener('pointerleave', cancel);
		})();

		// ------------------------------------------------------------------ presets
		var libList = q('.lib-list');

		function presetById(id) {
			for (var i = 0; i < S.presets.length; i++) if (S.presets[i].id === id) return S.presets[i];
			return null;
		}
		function cardOf(id) {
			return Array.prototype.filter.call(libList.querySelectorAll('[data-pid]'), function (c) { return c.dataset.pid === id; })[0];
		}
		function shortPath(p) {
			p = String(p || '');
			var parts = p.split(/[\\/]/).filter(Boolean);
			return parts.length > 2 ? '…/' + parts.slice(-2).join('/') : p;
		}
		function bars(list) {
			return '<span class="pc-bars">' + (list || []).slice(0, 18).map(function (c) {
				return '<i style="background:' + esc(c.color) + '"></i>';
			}).join('') + '</span>';
		}

		function loadPresets(focusId, rename) {
			return Host.listPresets().then(function (r) { gotPresets(r, focusId, rename); })
				.catch(function () { toast('Não foi possível ler a pasta de presets', { icon: 'alert' }); });
		}
		function gotPresets(r, focusId, rename) {
			{
				S.presets = (r && r.presets) || [];
				S.folder = (r && r.folder) || S.folder;
				S.offline = r && r.offline ? { volume: r.volume || '', canMount: !!r.canMount } : null;
				if (!library.hidden) renderLibrary(focusId, rename);
			}
		}

		function renderLibrary(focusId, rename) {
			var html = '<div class="pcard is-project" role="listitem" data-tip="Paleta deste projeto · salva no .aep">' + bars(S.swatches) +
				'<span class="pc-name">' + ic('file') + '<span>' + esc(S.project || 'projeto') + '</span></span></div>' +
				'<button class="pcard add" data-act="save-preset" data-tip="Salvar a paleta do projeto como preset">' + ic('plus') + '<span class="pc-name">Salvar preset</span></button>';
			if (S.offline) {
				// volume de rede desmontado / unidade desconectada: explica e oferece saída
				html += '<div class="pcard offline" role="listitem">' +
					'<span class="off-ic">' + ic('unplug') + '</span>' +
					'<span class="off-txt"><b>' + esc(S.offline.volume || 'pasta') + '</b> não está acessível</span>' +
					'<span class="off-acts">' +
					(S.offline.canMount ? '<button class="off-btn" data-off="mount">Montar</button>' : '') +
					'<button class="off-btn" data-off="retry" data-tip="Tentar de novo">' + ic('reset') + '</button>' +
					'<button class="off-btn" data-off="local" data-tip="Usar a pasta local">' + ic('folder') + '</button>' +
					'</span></div>';
			}
			S.presets.forEach(function (p, i) {
				var cls = 'pcard' + (p.id === S.prefs.defaultPreset ? ' is-default' : '') + (p.name === S.preset ? ' is-origin' : '');
				html += '<div class="' + cls + '" role="listitem" tabindex="0" data-pid="' + esc(p.id) + '" style="--i:' + i + '">' + bars(p.swatches) +
					'<span class="pc-row"><span class="pc-name">' + esc(p.name) + '</span>' +
					'<button type="button" class="pc-grip" aria-label="Arraste para reordenar (ou use as setas)" data-tip="Arraste para reordenar">' + GRIP + '</button></span>' +
					'<span class="pc-acts"><button class="pc-btn pc-ren" data-tip="Renomear">' + ic('pencil') + '</button>' +
					'<button class="pc-btn pc-star" data-tip="Padrão para projetos sem paleta">' + ic('star') + '</button>' +
					'<button class="pc-btn pc-del" data-tip="Excluir preset">' + ic('trash') + '</button></span></div>';
			});
			libList.innerHTML = html;
			q('.lib-path').textContent = shortPath(S.folder);
			libFade();
			if (focusId) {
				var c = cardOf(focusId);
				if (!c) return;
				c.scrollIntoView({ block: 'nearest', inline: 'nearest' });
				c.animate([{ transform: 'scale(.85)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 420, easing: SPRING });
				if (rename) startRename(c);
			}
		}

		function applyPreset(p, merge, card) {
			var from = rect(card.querySelector('.pc-bars'));
			pushUndo();
			var added = 0;
			if (merge) {
				var have = {};
				S.swatches.forEach(function (s) { have[s.color] = true; });
				toSwatches(p.swatches).forEach(function (s) { if (!have[s.color]) { have[s.color] = true; S.swatches.push(s); added++; } });
			} else {
				S.swatches = toSwatches(p.swatches);
				S.preset = p.name;
			}
			closeSettings();
			render({ from: from });
			save();
			toast(merge ? '+' + added + (added === 1 ? ' cor de ' : ' cores de ') + p.name : p.name + ' aplicado ao projeto', { color: (p.swatches[0] || {}).color, undo: true });
		}

		function savePreset() {
			if (!S.swatches.length) return toast('A paleta do projeto está vazia', { icon: 'alert' });
			if (S.offline) return toast((S.offline.volume || 'A pasta') + ' não está acessível', { icon: 'unplug' });
			var name = N.unique(S.project && S.project !== 'sem título' ? S.project : 'minha paleta', S.presets.map(function (p) { return p.name; }));
			Host.savePreset({ name: name, swatches: plain(S.swatches) }).then(function (r) {
				if (!r || !r.ok) return toast(r && r.reason === 'offline' ? 'A pasta de presets não está acessível' : 'A pasta de presets não aceita gravação', { icon: 'alert' });
				S.preset = name;
				save();
				loadPresets(r.id, true);
			});
		}

		// renomear no próprio cartão
		function startRename(card) {
			var p = presetById(card.dataset.pid), nameEl = card.querySelector('.pc-name');
			if (!p || card.querySelector('.pc-input')) return;
			var input = document.createElement('input');
			input.className = 'pc-input';
			input.value = p.name;
			input.maxLength = 48;
			input.spellcheck = false;
			nameEl.replaceWith(input);
			input.focus();
			input.select();
			var done = false;
			function finishRename(ok) {
				if (done) return;
				done = true;
				var v = input.value.trim();
				if (ok && v && v !== p.name) {
					if (S.preset === p.name) { S.preset = v; save(); }
					p.name = v;
					Host.savePreset({ id: p.id, name: v, swatches: p.swatches });
				}
				nameEl.textContent = p.name;
				input.replaceWith(nameEl);
				nameEl.animate([{ opacity: 0, transform: 'translateY(3px)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: EASE });
			}
			input.addEventListener('keydown', function (e) {
				e.stopPropagation();
				if (e.key === 'Enter') finishRename(true);
				else if (e.key === 'Escape') finishRename(false);
			});
			input.addEventListener('blur', function () { finishRename(true); });
		}

		function toggleDefault(p, card) {
			var on = S.prefs.defaultPreset !== p.id;
			S.prefs.defaultPreset = on ? p.id : '';
			Array.prototype.forEach.call(libList.querySelectorAll('[data-pid]'), function (c) {
				c.classList.toggle('is-default', c.dataset.pid === S.prefs.defaultPreset);
			});
			card.querySelector('.pc-star').animate([{ transform: 'scale(.4) rotate(-72deg)' }, { transform: 'none' }], { duration: 480, easing: SPRING });
			Host.savePrefs({ defaultPreset: S.prefs.defaultPreset }).catch(function () {});
			toast(on ? p.name + ' é o padrão para projetos sem paleta' : 'Sem preset padrão', { icon: 'star' });
		}

		function deletePreset(p, card) {
			Host.deletePreset(p.id).then(function (r) {
				if (!r || !r.ok) return toast('Não foi possível excluir o preset', { icon: 'alert' });
				pushUndo({ restorePreset: { id: p.id, name: p.name, swatches: p.swatches } });
				S.presets = S.presets.filter(function (x) { return x !== p; });
				if (S.prefs.defaultPreset === p.id) { S.prefs.defaultPreset = ''; Host.savePrefs({ defaultPreset: '' }); }
				var r0 = rect(card), vertical = el.dataset.orient !== 'row';
				card.style.pointerEvents = 'none';
				card.animate(vertical ?
					[{ opacity: 1, height: r0.height + 'px' }, { opacity: 0, height: '0px', marginTop: '-6px', transform: 'scale(.9)' }] :
					[{ opacity: 1, width: r0.width + 'px' }, { opacity: 0, width: '0px', marginLeft: '-6px', transform: 'scale(.9)' }],
					{ duration: 300, easing: EASE }).onfinish = function () { card.remove(); };
				toast(p.name + ' excluído', { icon: 'trash', undo: true });
			});
		}

		function chooseFolder(e) {
			if (e.altKey) return Host.revealPresetFolder().then(function (r) { if (!r || !r.ok) toast('A pasta não está acessível', { icon: 'unplug' }); });
			Host.choosePresetFolder().then(function (r) {
				if (!r || !r.ok) return;
				S.folder = r.folder;
				q('.lib-path').textContent = shortPath(S.folder);
				return Host.listPresets().then(function (l) {
					gotPresets(l);
					if (S.offline) toast((S.offline.volume || 'A pasta') + ' não está acessível', { icon: 'unplug' });
					else toast('Presets de ' + shortPath(S.folder), { icon: 'folder' });
				});
			});
		}

		// gradiente nas bordas da lista: os cartões se esvaem onde a lista é cortada
		function libFade() {
			var row = el.dataset.orient === 'row';
			var pos = row ? libList.scrollLeft : libList.scrollTop;
			var max = row ? libList.scrollWidth - libList.clientWidth : libList.scrollHeight - libList.clientHeight;
			libList.classList.toggle('fade-start', pos > 2);
			libList.classList.toggle('fade-end', pos < max - 2);
		}
		libList.addEventListener('scroll', libFade);

		// arrastar presets pela alça (área vazia à direita do nome) para reordenar.
		// Mesmo padrão do sortable.js do O PADEIRO, que funciona no CEP do After Effects:
		// captura no próprio puxador (um <button>), nada muda no DOM durante o arrasto (só transforms
		// calculados das posições iniciais) e a lista é reordenada uma vez, ao soltar.
		function presetCards() { return Array.prototype.slice.call(libList.querySelectorAll('.pcard[data-pid]')); }

		function movePreset(from, to) {
			var all = presetCards();
			if (from === to || !all[from] || !all[to]) return;
			var card = all[from];
			libList.insertBefore(card, to > from ? all[to].nextSibling : all[to]);
			var ids = presetCards().map(function (c) { return c.dataset.pid; });
			S.presets = ids.map(presetById);
			Host.savePresetOrder(ids).catch(function () { toast('Não foi possível salvar a ordem', { icon: 'alert' }); });
			return card;
		}

		libList.addEventListener('pointerdown', function (e) {
			var grip = e.target.closest('.pc-grip');
			if (!grip || e.button !== 0) return;
			var all = presetCards();
			var card = grip.closest('.pcard');
			var from = all.indexOf(card);
			if (from < 0 || all.length < 2) return;
			e.preventDefault();

			var row = el.dataset.orient === 'row';
			var start = row ? e.clientX : e.clientY;
			var scroll0 = row ? libList.scrollLeft : libList.scrollTop;
			var boxes = all.map(rect);
			var step = row ? boxes[1].left - boxes[0].left : boxes[1].top - boxes[0].top;
			var to = from, started = false, last = e, raf = 0;

			grip.setPointerCapture(e.pointerId);

			function scrolled() { return (row ? libList.scrollLeft : libList.scrollTop) - scroll0; }

			function update() {
				var d = (row ? last.clientX : last.clientY) - start + scrolled();
				if (!started) {
					if (Math.abs(d) < 4) return;
					started = true;
					hideTip();
					card.classList.add('drag');
					libList.classList.add('sorting');
				}
				var b0 = boxes[from];
				var center = (row ? b0.left + b0.width / 2 : b0.top + b0.height / 2) + d;
				to = from;
				for (var i = 0; i < boxes.length; i++) {
					var mid = row ? boxes[i].left + boxes[i].width / 2 : boxes[i].top + boxes[i].height / 2;
					if (i < from && center < mid) { to = i; break; }
					if (i > from && center > mid) to = i;
				}
				card.style.transform = row ? 'translateX(' + d + 'px)' : 'translateY(' + d + 'px)';
				all.forEach(function (c, i) {
					if (c === card) return;
					var shift = 0;
					if (from < to && i > from && i <= to) shift = -step;
					if (from > to && i < from && i >= to) shift = step;
					c.style.transform = shift ? (row ? 'translateX(' : 'translateY(') + shift + 'px)' : '';
				});
			}

			// rola sozinho perto das bordas da lista
			function autoscroll() {
				raf = 0;
				if (!started) return;
				var lr = rect(libList), edge = 28, v = 0;
				var p = row ? last.clientX : last.clientY, lo = row ? lr.left : lr.top, hi = row ? lr.right : lr.bottom;
				if (p < lo + edge) v = -Math.ceil((lo + edge - p) / 4);
				else if (p > hi - edge) v = Math.ceil((p - hi + edge) / 4);
				if (!v) return;
				if (row) libList.scrollLeft += v; else libList.scrollTop += v;
				update();
				raf = requestAnimationFrame(autoscroll);
			}

			function move(ev) {
				last = ev;
				update();
				if (!raf) raf = requestAnimationFrame(autoscroll);
			}

			function end() {
				grip.removeEventListener('pointermove', move);
				grip.removeEventListener('pointerup', end);
				grip.removeEventListener('pointercancel', end);
				grip.removeEventListener('lostpointercapture', end);
				if (raf) cancelAnimationFrame(raf);
				libList.classList.remove('sorting');
				card.classList.remove('drag');
				all.forEach(function (c) { c.style.transform = ''; });
				if (started && to !== from) movePreset(from, to);
			}

			grip.addEventListener('pointermove', move);
			grip.addEventListener('pointerup', end);
			grip.addEventListener('pointercancel', end);
			grip.addEventListener('lostpointercapture', end);
		});

		// teclado: com o puxador em foco, ↑ ↓ (← → na faixa) mudam a ordem
		libList.addEventListener('keydown', function (e) {
			var grip = e.target.closest && e.target.closest('.pc-grip');
			if (!grip) return;
			var back = e.key === 'ArrowUp' || e.key === 'ArrowLeft', fwd = e.key === 'ArrowDown' || e.key === 'ArrowRight';
			if (!back && !fwd) return;
			e.preventDefault();
			e.stopPropagation();
			var all = presetCards(), from = all.indexOf(grip.closest('.pcard')), to = from + (back ? -1 : 1);
			if (from < 0 || to < 0 || to >= all.length) return;
			var moved = movePreset(from, to);
			if (!moved) return;
			moved.animate([{ transform: 'scale(.96)' }, { transform: 'none' }], { duration: 260, easing: SPRING });
			moved.querySelector('.pc-grip').focus({ preventScroll: true });
			moved.scrollIntoView({ block: 'nearest', inline: 'nearest' });
		});

		libList.addEventListener('click', function (e) {
			if (e.target.closest('.pc-input') || e.target.closest('.pc-grip')) return;
			var off = e.target.closest('[data-off]');
			if (off) {
				var card0 = off.closest('.pcard');
				off.classList.add('busy');
				var job = off.dataset.off === 'mount' ? Host.mountPresetVolume() : off.dataset.off === 'local' ? Host.resetPresetFolder() : Host.listPresets();
				return job.then(function (r) {
					gotPresets(r);
					if (S.offline) {
						card0 = libList.querySelector('.offline');
						if (card0) card0.animate([{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], { duration: 300 });
						toast((S.offline.volume || 'A pasta') + ' continua inacessível', { icon: 'unplug' });
					} else {
						toast('Presets de ' + shortPath(S.folder), { icon: 'folder' });
					}
				});
			}
			var card = e.target.closest('[data-pid]');
			if (!card) { if (e.target.closest('.is-project')) closeSettings(); return; }
			var p = presetById(card.dataset.pid);
			if (!p) return;
			if (e.target.closest('.pc-ren')) startRename(card);
			else if (e.target.closest('.pc-star')) toggleDefault(p, card);
			else if (e.target.closest('.pc-del')) deletePreset(p, card);
			else applyPreset(p, e.shiftKey, card);
		});
		libList.addEventListener('keydown', function (e) {
			var card = e.target.closest('[data-pid]');
			if (!card || e.target !== card) return;
			var p = presetById(card.dataset.pid);
			if (e.key === 'Enter') applyPreset(p, e.shiftKey, card);
			else if (e.key === 'F2') startRename(card);
			else if (e.key === 'Delete') deletePreset(p, card);
		});
		// rolar com a roda do mouse na faixa horizontal
		libList.addEventListener('wheel', function (e) {
			if (el.dataset.orient !== 'row' || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
			libList.scrollLeft += e.deltaY;
			e.preventDefault();
		}, { passive: false });

		// ------------------------------------------------------------------ extrair cores de uma imagem
		var XS = null;
		var exStage = q('.ex-stage'), exImg = exSheet.querySelector('img'), exMarks = q('.ex-marks'), exChips = q('.ex-chips');
		var exLoupe = q('.ex-loupe'), exFlood = exSheet.querySelector('.ed-flood');
		var exCount = parseInt(store('pal.excount') || '6', 10) || 6;

		function openExtract(btn) {
			if (anyFull()) return;
			closeSettings();
			hideTip();
			var tool = capTool;
			busy(tool, true);
			Host.grabFrame().then(function (r) {
				if (!r || !r.ok) {
					busy(tool, false);
					flash(tool, 'nope', 420);
					return toast(REASONS[r && r.reason] || 'Não foi possível ler o frame', { icon: 'alert' });
				}
				var job = XS = { grab: r, chips: [], data: null };
				q('.ex-label').textContent = r.label || 'frame';
				exSheet.classList.add('loading');
				exSheet.classList.remove('slow');
				exImg.removeAttribute('src');
				exMarks.innerHTML = exChips.innerHTML = '';
				exSheet.hidden = false;
				el.classList.add('sheet-open');
				el.classList.remove('alt', 'ctrl');
				var rr = relRect(rect(btn));
				exSheet.animate([{ clipPath: clip(rr, 8) }, { clipPath: 'inset(0px 0px 0px 0px round 0px)' }], { duration: 420, easing: EASE });
				exFlood.animate([{ opacity: 1 }, { opacity: 1, offset: 0.35 }, { opacity: 0 }], { duration: 520, easing: 'ease-out', fill: 'forwards' });
				exSheet.focus({ preventScroll: true });

				// o esqueleto basta para esperas curtas; se demorar, explica o que está acontecendo
				var t0 = Date.now(), waitTxt = q('.ex-wait-txt');
				var ticker = setInterval(function () {
					if (XS !== job) return clearInterval(ticker);
					var sec = (Date.now() - t0) / 1000;
					if (sec < 0.7) return;
					exSheet.classList.add('slow');
					waitTxt.textContent = (r.kind === 'image' && !r.temp ? 'lendo imagem' : 'renderizando frame') + (sec >= 2 ? ' · ' + Math.floor(sec) + 's' : '…');
				}, 250);

				function done() {
					clearInterval(ticker);
					busy(tool, false);
					Host.releaseFrame(r); // remove PNG e comp temporários, dê certo ou não
				}

				return Host.loadImage(r, { timeout: 60000, cancelled: function () { return XS !== job; } }).then(function (img) {
					done();
					if (XS !== job) return;
					XS.data = X.sample(img, 160);
					XS.ratio = img.naturalWidth / img.naturalHeight;
					exImg.src = img.src;
					exSheet.classList.remove('loading', 'slow');
					fitStage();
					exStage.animate([{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 360, easing: EASE });
					computeChips();
				}, function (err) {
					done();
					if (XS !== job) return; // cancelado com Esc/×: sem aviso
					closeExtract();
					toast(/tempo/.test(err && err.message) ? 'O frame demorou demais para renderizar' : 'Não foi possível ler o frame', { icon: 'alert' });
				});
			}).catch(function () {
				busy(tool, false);
				toast('Não foi possível ler o frame', { icon: 'alert' });
			});
		}

		function fitStage() {
			if (!XS || !XS.ratio) return;
			var box = q('.ex-img'), w = box.clientWidth, h = box.clientHeight;
			if (w / h > XS.ratio) w = h * XS.ratio; else h = w / XS.ratio;
			exStage.style.width = Math.floor(w) + 'px';
			exStage.style.height = Math.floor(h) + 'px';
		}

		function computeChips() {
			var custom = XS.chips.filter(function (c) { return c.custom; });
			var auto = X.palette(XS.data, exCount).map(function (c) { return { color: c.color, x: c.x, y: c.y, on: true }; });
			XS.chips = auto.concat(custom);
			q('.ex-n').textContent = exCount;
			renderChips(true);
		}

		function renderChips(animate, popIndex) {
			exChips.innerHTML = XS.chips.map(function (c, i) {
				return '<button class="ex-chip' + (c.on ? ' on' : '') + '" data-i="' + i + '" data-tip="' + esc(N.nearest(c.color) + ' · ' + c.color) + '" style="--c:' + c.color + ';--ink:' + C.ink(c.color) + ';--i:' + i + '">' + ic('check') + '</button>';
			}).join('');
			exMarks.innerHTML = XS.chips.map(function (c, i) {
				return '<span class="ex-mark' + (c.on ? ' on' : '') + '" data-i="' + i + '" style="left:' + (c.x * 100) + '%;top:' + (c.y * 100) + '%;--c:' + c.color + ';--i:' + i + '"></span>';
			}).join('');
			exSheet.classList.toggle('enter', !!animate);
			if (popIndex != null) {
				var ch = exChips.children[popIndex], mk = exMarks.children[popIndex];
				if (ch) ch.animate([{ transform: 'scale(0)' }, { transform: 'none' }], { duration: 420, easing: SPRING });
				if (mk) mk.animate([{ transform: 'translate(-50%,-50%) scale(2.4)', opacity: 0 }, { transform: 'translate(-50%,-50%)', opacity: 1 }], { duration: 420, easing: EASE });
			}
		}

		function toggleChip(i) {
			var c = XS.chips[i];
			c.on = !c.on;
			exChips.children[i].classList.toggle('on', c.on);
			exMarks.children[i].classList.toggle('on', c.on);
		}

		function hot(i, on) {
			if (exChips.children[i]) exChips.children[i].classList.toggle('hot', on);
			if (exMarks.children[i]) exMarks.children[i].classList.toggle('hot', on);
		}

		exChips.addEventListener('click', function (e) {
			var b = e.target.closest('.ex-chip');
			if (b) toggleChip(+b.dataset.i);
		});
		[exChips, exMarks].forEach(function (box) {
			box.addEventListener('pointerover', function (e) { var t = e.target.closest('[data-i]'); if (t) hot(+t.dataset.i, true); });
			box.addEventListener('pointerout', function (e) { var t = e.target.closest('[data-i]'); if (t) hot(+t.dataset.i, false); });
		});

		// lupa: mostra a cor sob o cursor; clique adiciona
		exStage.addEventListener('pointermove', function (e) {
			if (!XS || !XS.data) return;
			if (e.target.closest('.ex-mark')) { exLoupe.classList.remove('on'); return; }
			var r = rect(exStage), fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
			var hex = X.pixel(XS.data, fx, fy);
			exLoupe.style.left = (fx * 100) + '%';
			exLoupe.style.top = (fy * 100) + '%';
			exLoupe.style.setProperty('--c', hex);
			exLoupe.classList.add('on');
		});
		exStage.addEventListener('pointerleave', function () { exLoupe.classList.remove('on'); });
		exStage.addEventListener('click', function (e) {
			if (!XS || !XS.data) return;
			var m = e.target.closest('.ex-mark');
			if (m) return toggleChip(+m.dataset.i);
			var r = rect(exStage), fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
			var hex = X.pixel(XS.data, fx, fy);
			for (var i = 0; i < XS.chips.length; i++) {
				if (XS.chips[i].color === hex) { XS.chips[i].on = true; renderChips(false, i); return; }
			}
			XS.chips.push({ color: hex, x: fx, y: fy, on: true, custom: true });
			renderChips(false, XS.chips.length - 1);
		});

		Array.prototype.forEach.call(exSheet.querySelectorAll('.ex-step'), function (b) {
			b.addEventListener('click', function () {
				if (!XS || !XS.data) return;
				var n = C.clamp(exCount + parseInt(b.dataset.d, 10), 2, 12);
				if (n === exCount) return flash(b, 'nope', 420);
				exCount = n;
				store('pal.excount', String(n));
				computeChips();
			});
		});

		function confirmExtract() {
			if (!XS || !XS.data) return;
			var have = {}, fresh = [];
			S.swatches.forEach(function (s) { have[s.color] = true; });
			XS.chips.forEach(function (c) { if (c.on && !have[c.color]) { have[c.color] = true; fresh.push(c.color); } });
			if (!fresh.length) return toast('Nenhuma cor nova selecionada', { icon: 'image' });
			var from = rect(exStage), label = XS.grab.label;
			closeExtract();
			pushUndo();
			fresh.forEach(function (c) { S.swatches.push({ id: newId(), color: c, label: '', auto: true }); });
			setTimeout(function () {
				render({ from: from });
				save();
			}, 120);
			toast('+' + fresh.length + (fresh.length > 1 ? ' cores de ' : ' cor de ') + label, { color: fresh[0], undo: true });
		}

		function closeExtract() {
			if (!XS) return;
			XS = null;
			exLoupe.classList.remove('on');
			exSheet.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.97)' }], { duration: 220, easing: EASE }).onfinish = function () {
				exSheet.hidden = true;
				exSheet.getAnimations().forEach(function (a) { a.cancel(); });
				exFlood.getAnimations().forEach(function (a) { a.cancel(); });
				if (!isSheetOpen()) el.classList.remove('sheet-open');
				el.focus({ preventScroll: true });
			};
		}

		exSheet.querySelector('.ed-btn.ok').addEventListener('click', confirmExtract);
		exSheet.querySelector('.ed-btn.cancel').addEventListener('click', closeExtract);
		exSheet.addEventListener('keydown', function (e) {
			if (e.key === 'Enter') { e.preventDefault(); confirmExtract(); }
			else if (e.key === 'Escape') { e.preventDefault(); closeExtract(); }
		});

		// ------------------------------------------------------------------ editor de cor
		var E = null;
		var edName = q('.ed-name'), edVal = q('.ed-val'), edFmt = q('.ed-fmt'), sv = q('.ed-sv'), hue = q('.ed-hue');
		var flood = ed.querySelector('.ed-flood');
		var edAuto = q('.ed-auto');

		function relRect(r) {
			var p = rect(el);
			return { t: r.top - p.top, l: r.left - p.left, b: p.bottom - r.bottom, r: p.right - r.right };
		}
		function clip(r, rad) {
			return 'inset(' + Math.max(0, r.t) + 'px ' + Math.max(0, r.r) + 'px ' + Math.max(0, r.b) + 'px ' + Math.max(0, r.l) + 'px round ' + rad + 'px)';
		}

		function suggestColor() {
			var last = S.swatches[S.swatches.length - 1];
			if (!last) return '#FFC44E';
			var h = C.rgbToHsb(C.hexToRgb(last.color));
			return C.rgbToHex(C.hsbToRgb([h[0] + 137.5, C.clamp(h[1], 45, 80), C.clamp(h[2], 80, 96)]));
		}

		function openEditor(sw, fromEl) {
			if (!sw && !fromEl) return;
			closeSettings();
			hideTip();
			var hex = sw ? sw.color : suggestColor();
			E = { id: sw ? sw.id : null, old: hex, fmt: S.prefs.format, hsb: C.rgbToHsb(C.hexToRgb(hex)), auto: sw ? !!sw.auto : true };
			edName.value = sw ? sw.label : '';
			ed.querySelector('.ed-btn.del').hidden = !sw;
			q('.ed-prev').classList.toggle('is-new', !sw);
			ed.style.setProperty('--old', hex);
			ed.style.setProperty('--old-ink', C.ink(hex));
			ed.style.setProperty('--from', sw ? hex : '#262930');
			ed.hidden = false;
			el.classList.add('sheet-open', 'editing');
			el.classList.remove('alt', 'ctrl');
			updateEditor();

			var r = relRect(rect(fromEl));
			ed.animate([{ clipPath: clip(r, 7) }, { clipPath: 'inset(0px 0px 0px 0px round 0px)' }], { duration: 420, easing: EASE });
			flood.style.opacity = 1;
			flood.animate([{ opacity: 1 }, { opacity: 1, offset: 0.4 }, { opacity: 0 }], { duration: 560, easing: 'ease-out', fill: 'forwards' });
			setTimeout(function () { (sw ? ed : edName).focus({ preventScroll: true }); }, 60);
		}

		function closeEditor(commit) {
			if (!E) return;
			var hex = currentHex();
			var target = null;
			if (commit === 'delete') {
				var dsw = find(E.id);
				E = null;
				ed.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.94)' }], { duration: 220, easing: EASE }).onfinish = finish;
				if (dsw) removeSwatch(dsw);
				return;
			}
			if (commit) {
				var label = edName.value.trim();
				var auto = E.auto || !label;
				pushUndo();
				if (E.id) {
					var sw = find(E.id);
					if (sw) { sw.color = hex; sw.label = auto ? '' : label; sw.auto = auto; }
					render({ noEnter: E.id });
				} else {
					var nsw = { id: newId(), color: hex, label: auto ? '' : label, auto: auto };
					S.swatches.push(nsw);
					render({ noEnter: nsw.id });
					E.id = nsw.id;
					toast('Cor adicionada', { color: hex, undo: true });
				}
				save();
				target = nodes[E.id];
			} else {
				target = E.id ? nodes[E.id] : q('.tool[data-act="add"]');
			}
			E = null;
			if (target && target.scrollIntoView) target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
			var r = target ? relRect(rect(target)) : { t: 0, l: 0, r: 0, b: 0 };
			flood.style.background = commit ? hex : '';
			flood.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out', fill: 'forwards' });
			ed.animate([{ clipPath: 'inset(0px 0px 0px 0px round 0px)' }, { clipPath: clip(r, 7) }], { duration: 380, easing: EASE, fill: 'forwards' }).onfinish = function () {
				finish();
				if (commit && target) {
					target.animate([{ transform: 'scale(1.12)' }, { transform: 'none' }], { duration: 420, easing: SPRING });
				}
			};
		}

		function finish() {
			ed.hidden = true;
			ed.getAnimations().forEach(function (a) { a.cancel(); });
			flood.getAnimations().forEach(function (a) { a.cancel(); });
			flood.style.background = '';
			if (!isSheetOpen()) el.classList.remove('sheet-open');
			el.classList.remove('editing');
			el.focus({ preventScroll: true });
		}

		function currentHex() { return C.rgbToHex(C.hsbToRgb(E.hsb)); }

		function updateEditor(skipVal) {
			var hex = currentHex(), o = el.dataset.shape;
			ed.style.setProperty('--h', Math.round(E.hsb[0]));
			ed.style.setProperty('--new', hex);
			ed.style.setProperty('--new-ink', C.ink(hex));
			var k = sv.querySelector('.knob');
			k.style.left = E.hsb[1] + '%';
			k.style.top = (100 - E.hsb[2]) + '%';
			var hk = hue.querySelector('.knob');
			if (o === 'tall') { hk.style.left = (E.hsb[0] / 360 * 100) + '%'; hk.style.top = '50%'; }
			else { hk.style.top = (E.hsb[0] / 360 * 100) + '%'; hk.style.left = '50%'; }
			edFmt.textContent = E.fmt;
			ed.classList.toggle('is-auto', E.auto);
			if (E.auto) {
				var nm = autoNameFor(hex, E.id);
				if (nm !== edName.value) {
					edName.value = nm;
					if (!ed.getAnimations().length) edName.animate([{ opacity: .3, transform: 'translateY(3px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: EASE });
				}
			}
			if (!skipVal) edVal.value = C.format(hex, E.fmt);
			edVal.parentNode.classList.remove('bad');
		}

		function drag(area, onMove) {
			area.addEventListener('pointerdown', function (e) {
				if (e.button !== 0) return;
				area.setPointerCapture(e.pointerId);
				area.classList.add('grab');
				onMove(e);
				function mv(ev) { onMove(ev); }
				function up() {
					area.classList.remove('grab');
					area.removeEventListener('pointermove', mv);
					area.removeEventListener('pointerup', up);
					area.removeEventListener('pointercancel', up);
				}
				area.addEventListener('pointermove', mv);
				area.addEventListener('pointerup', up);
				area.addEventListener('pointercancel', up);
			});
		}

		drag(sv, function (e) {
			if (!E) return;
			var r = rect(sv);
			E.hsb[1] = C.clamp((e.clientX - r.left) / r.width, 0, 1) * 100;
			E.hsb[2] = (1 - C.clamp((e.clientY - r.top) / r.height, 0, 1)) * 100;
			updateEditor();
		});
		drag(hue, function (e) {
			if (!E) return;
			var r = rect(hue);
			var t = el.dataset.shape === 'tall' ? (e.clientX - r.left) / r.width : (e.clientY - r.top) / r.height;
			E.hsb[0] = C.clamp(t, 0, 0.9999) * 360;
			updateEditor();
		});

		sv.addEventListener('keydown', function (e) {
			if (!E) return;
			var d = e.shiftKey ? 10 : 2, k = e.key;
			if (k === 'ArrowLeft') E.hsb[1] -= d; else if (k === 'ArrowRight') E.hsb[1] += d;
			else if (k === 'ArrowUp') E.hsb[2] += d; else if (k === 'ArrowDown') E.hsb[2] -= d; else return;
			e.preventDefault();
			E.hsb[1] = C.clamp(E.hsb[1], 0, 100); E.hsb[2] = C.clamp(E.hsb[2], 0, 100);
			updateEditor();
		});
		hue.addEventListener('keydown', function (e) {
			if (!E) return;
			var d = (e.shiftKey ? 15 : 3) * (/Right|Down/.test(e.key) ? 1 : /Left|Up/.test(e.key) ? -1 : 0);
			if (!d) return;
			e.preventDefault();
			E.hsb[0] = (E.hsb[0] + d + 360) % 360;
			updateEditor();
		});

		edFmt.addEventListener('click', function () {
			if (!E) return;
			E.fmt = { HEX: 'RGB', RGB: 'HSB', HSB: 'HEX' }[E.fmt];
			edFmt.animate([{ transform: 'rotateX(90deg)' }, { transform: 'none' }], { duration: 260, easing: EASE });
			updateEditor();
		});

		function readVal(strict) {
			var hex = C.parse(edVal.value, E.fmt);
			if (hex) {
				E.hsb = C.rgbToHsb(C.hexToRgb(hex));
				updateEditor(!strict);
				return true;
			}
			if (strict) {
				var f = edVal.parentNode;
				f.classList.remove('bad'); void f.offsetWidth; f.classList.add('bad');
			}
			return false;
		}
		edVal.addEventListener('input', function () { if (E) readVal(false); });
		edVal.addEventListener('blur', function () { if (E && !readVal(true)) updateEditor(); });

		q('.ed-old').addEventListener('click', function () {
			if (!E) return;
			E.hsb = C.rgbToHsb(C.hexToRgb(E.old));
			q('.ed-new').animate([{ filter: 'brightness(1.6)' }, { filter: 'none' }], { duration: 300 });
			updateEditor();
		});
		ed.querySelector('.ed-btn.ok').addEventListener('click', function () { closeEditor(true); });
		ed.querySelector('.ed-btn.cancel').addEventListener('click', function () { closeEditor(false); });
		ed.querySelector('.ed-btn.del').addEventListener('click', function () { closeEditor('delete'); });

		// nome automático: acompanha a cor até você digitar um nome seu
		edName.addEventListener('input', function () {
			if (!E) return;
			E.auto = false;
			ed.classList.remove('is-auto');
		});
		edAuto.addEventListener('click', function () {
			if (!E) return;
			E.auto = true;
			edAuto.animate([{ transform: 'rotate(-90deg) scale(.6)' }, { transform: 'none' }], { duration: 420, easing: SPRING });
			updateEditor();
		});

		ed.addEventListener('keydown', function (e) {
			if (e.key === 'Enter') {
				if (e.target === edVal && !readVal(true)) return;
				e.preventDefault();
				closeEditor(true);
			} else if (e.key === 'Escape') { e.preventDefault(); closeEditor(false); }
		});
		// colar qualquer cor (#hex, rgb, hsb) dentro do editor
		ed.addEventListener('paste', function (e) {
			if (!E || e.target === edName) return;
			var txt = (e.clipboardData || root.clipboardData).getData('text');
			var hex = C.parse(txt, E.fmt);
			if (!hex) return;
			e.preventDefault();
			E.hsb = C.rgbToHsb(C.hexToRgb(hex));
			updateEditor();
		});

		// ------------------------------------------------------------------ teclado global
		root.addEventListener('keydown', function (e) {
			if (!ed.hidden || !exSheet.hidden) return;
			if (cmd(e) && !e.shiftKey && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
			else if (e.key === 'Escape') closeSettings();
		});

		// ------------------------------------------------------------------ carregar + acompanhar o projeto
		function loadProject(stagger) {
			return Host.loadPalette().then(function (r) {
				S.undo = [];
				S.last = null;
				S.project = (r && r.project) || '';
				S.preset = (r && r.preset) || '';
				setSwatches((r && r.swatches) || [], { stagger: stagger });
				if (!library.hidden) renderLibrary();
			});
		}

		function poll() {
			Host.projectKey().then(function (k) {
				if (S.key !== null && k !== S.key) {
					S.key = k;
					closeSettings();
					if (E) closeEditor(false);
					if (XS) closeExtract();
					loadProject(true);
				}
				S.key = k;
			}).catch(function () {});
		}

		Host.loadPrefs().then(function (p) {
			p = p || {};
			S.prefs.format = String(p.labelType || '#HEX').replace('#', '');
			S.prefs.info = p.showColorInfo !== false;
			S.prefs.names = p.showColorLabels !== false;
			S.prefs.defaultPreset = p.defaultPreset || '';
			S.folder = p.presetFolder || '';
			syncSettings();
		}).catch(function () {}).then(function () {
			measure();
			return loadProject(true);
		}).then(function () {
			measure();
			poll();
			setInterval(function () { if (!document.hidden) poll(); }, 2000);
			root.addEventListener('focus', poll);
			root.addEventListener('focus', function () { if (S.offline && !library.hidden) loadPresets(); });
		});

		measure();
		return { undo: undo, reload: function () { return loadProject(true); } };
	}

	root.PalApp = { mount: mount, isMac: IS_MAC, keys: KEY };
})(window);
