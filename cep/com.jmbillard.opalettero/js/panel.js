/* O PALETTERO · painel
   Estado → render com animações FLIP. Tudo que muda de lugar, anima. */
(function (root) {
	'use strict';

	var C = root.PalColor;
	var Host = root.PalHost;
	var VERSION = 'v1.0';
	var DOCS = 'https://github.com/jmbillard/O-PALETTERO#readme';
	var EASE = 'cubic-bezier(.2,.8,.2,1)';
	var SPRING = 'cubic-bezier(.34,1.56,.64,1)';

	// ícones de traço (24×24), baseados no Lucide (ISC)
	var ICONS = {
		plus: '<path d="M12 5v14M5 12h14"/>',
		pipette: '<path d="m2 22 1-1h3l9-9"/><path d="M3 21v-3l9-9"/><path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3l.4.4Z"/>',
		layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
		sort: '<path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/>',
		more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
		x: '<path d="M18 6 6 18M6 6l12 12"/>',
		check: '<path d="M20 6 9 17l-5-5"/>',
		pencil: '<path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"/>',
		bucket: '<path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z"/><path d="m5 2 5 5"/><path d="M2 13h15"/><path d="M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.4 2-4 .3 1.6 2 2.4 2 4Z"/>',
		copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
		trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
		eye: '<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/>',
		tag: '<path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
		bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
		reset: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
		help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
		undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
		alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>'
	};

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
			prefs: { format: 'HEX', names: false, info: true, defaults: [] },
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
			'  <button class="tool" data-act="capture" aria-label="Capturar cores"><span class="swap">' + ic('pipette') + ic('layers') + '</span></button>',
			'</div>',
			'<div class="strip" role="list" aria-label="Paleta"></div>',
			'<div class="empty" hidden><span class="empty-dots"><i></i><i></i><i></i></span><span>Paleta vazia</span>',
			'  <button class="row-btn" data-act="capture">' + ic('pipette') + '<span class="lbl">Capturar</span></button>',
			'  <button class="row-btn" data-act="add">' + ic('plus') + '<span class="lbl">Nova cor</span></button>',
			'</div>',
			'<div class="dock dock-b">',
			'  <button class="tool" data-act="sort" aria-label="Ordenar">' + ic('sort') + '</button>',
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
			'    <button class="row-btn" data-act="save-default" data-tip="Salvar como paleta padrão">' + ic('bookmark') + '<span class="lbl">Salvar como padrão</span></button>',
			'    <button class="row-btn" data-act="load-default" data-tip="Usar a paleta padrão">' + ic('reset') + '<span class="lbl">Usar paleta padrão</span></button>',
			'    <button class="row-btn danger" data-act="clear" data-tip="Segure para limpar">' + ic('trash') + '<span class="lbl">Segure para limpar</span><i class="hold"></i></button>',
			'  </div>',
			'  <span class="vr"></span>',
			'  <div class="grp"><button class="row-btn" data-act="help" data-tip="Ajuda e documentação">' + ic('help') + '<span class="lbl">Ajuda</span></button><span class="ver">' + VERSION + '</span></div>',
			'</div>',
			'<div class="sheet editor" hidden tabindex="-1" role="dialog" aria-label="Editor de cor">',
			'  <div class="ed-flood"></div>',
			'  <div class="ed-prev"><button class="ed-old" data-tip="Voltar à cor original">' + ic('undo') + '</button>',
			'    <div class="ed-new"><input class="ed-name" id="pal-ed-name" placeholder="nome da cor" maxlength="40" spellcheck="false" autocomplete="off"></div></div>',
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
			el.dataset.shape = (h < 220 && w > h) ? 'wide' : 'tall';
			roomy();
			if (!settings.hidden) placePill(false);
		}

		function roomy() {
			var n = S.swatches.length || 1, o = el.dataset.orient, r;
			if (o === 'row') r = strip.clientWidth / n >= 58 && strip.clientHeight >= 40;
			else if (o === 'col') r = strip.clientHeight / n >= 22;
			else r = true;
			el.dataset.roomy = r ? '1' : '0';
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
			n.innerHTML = '<span class="sw-glyph">' + ic('bucket', 'g-fill') + ic('copy', 'g-copy') + ic('x', 'g-del') + ic('check', 'g-ok') + '</span>' +
				'<span class="sw-meta"><span class="sw-name"></span><span class="sw-val"></span></span>' +
				'<button class="sw-edit" tabindex="-1" aria-label="Editar cor">' + ic('pencil') + '</button><i class="sw-dot"></i>';
			return n;
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
				Host.savePalette(S.swatches.map(function (s) { return { color: s.color, label: s.label }; }))
					.catch(function () { toast('Não foi possível salvar no projeto', { icon: 'alert' }); });
			}, 200);
		}

		function snapshot() { return S.swatches.map(function (s) { return { id: s.id, color: s.color, label: s.label }; }); }
		function pushUndo() {
			S.undo.push(snapshot());
			if (S.undo.length > 40) S.undo.shift();
		}
		function undo() {
			var prev = S.undo.pop();
			if (!prev) return toast('Nada para desfazer');
			S.swatches = prev;
			render({ slow: true });
			save();
			toast('Desfeito', { icon: 'undo' });
		}

		function setSwatches(list, opts) {
			S.swatches = list.map(function (s) { return { id: newId(), color: C.normHex(s.color) || '#000000', label: s.label || '' }; });
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
					kbd('Ctrl', 'copiar', mods.ctrl),
					kbd('Alt', 'excluir', mods.alt)
				].join('');
			}
			var act = t.dataset.act;
			if (act === 'add' && t.classList.contains('tool')) return '<b>Nova cor</b>';
			if (act === 'capture' && t.classList.contains('tool')) {
				return mods.shift ? '<b>Capturar do projeto inteiro</b>' : '<b>Capturar da seleção</b>' + kbd('Shift', 'projeto inteiro');
			}
			if (act === 'sort') return '<b>Ordenar por matiz</b>';
			if (act === 'menu') return el.classList.contains('menu-open') ? '<b>Fechar ajustes</b>' : '<b>Ajustes</b>';
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
			var t = e.target.closest('.sw, .tool, [data-tip]');
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
			var next = { alt: !!e.altKey, ctrl: !!(e.ctrlKey || e.metaKey), shift: !!e.shiftKey };
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
			if (e.altKey) return removeSwatch(sw);
			if (e.ctrlKey || e.metaKey) {
				var v = C.format(sw.color, S.prefs.format);
				copyText(v);
				flash(nodes[sw.id], 'ok', 700);
				return toast(v + ' copiado', { color: sw.color, icon: 'copy' });
			}
			applySwatch(sw, e);
		}

		// arrastar para reordenar (pointer capture fica na faixa, que nunca se move)
		var D = null;
		strip.addEventListener('pointerdown', function (e) {
			var n = e.target.closest('.sw');
			if (!n || n.classList.contains('leaving') || e.button !== 0 || e.target.closest('.sw-edit')) return;
			D = { n: n, x: e.clientX, y: e.clientY, started: false, before: snapshot() };
			strip.setPointerCapture(e.pointerId);
		});

		strip.addEventListener('pointermove', function (e) {
			if (!D) return;
			if (!D.started) {
				if (Math.abs(e.clientX - D.x) + Math.abs(e.clientY - D.y) < 6 || e.altKey) return;
				D.started = true;
				el.classList.add('dragging');
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
			var order = liveNodes().map(function (x) { return x.dataset.id; });
			var changed = order.join() !== d.before.map(function (s) { return s.id; }).join();
			if (changed) {
				S.undo.push(d.before);
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

		function capture(btn, e) {
			var scope = e.shiftKey ? 'project' : 'selection';
			var tool = q('.tool[data-act="capture"]');
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
				fresh.forEach(function (c) { S.swatches.push({ id: newId(), color: C.normHex(c), label: '' }); });
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
			else if (act === 'menu') toggleSettings();
			else if (act === 'toggle-info') setPref('info', !S.prefs.info);
			else if (act === 'toggle-names') setPref('names', !S.prefs.names);
			else if (act === 'save-default') saveDefault(b);
			else if (act === 'load-default') loadDefault();
			else if (act === 'help') Host.openURL(DOCS);
		});

		// ------------------------------------------------------------------ ajustes
		function isSheetOpen() { return !settings.hidden || !ed.hidden; }

		function toggleSettings() { if (settings.hidden) openSettings(); else closeSettings(); }
		function openSettings() {
			if (!ed.hidden) return;
			settings.hidden = false;
			el.classList.add('menu-open', 'sheet-open');
			syncSettings();
			placePill(false);
			settings.animate([{ opacity: 0, transform: 'translateY(6px) scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: EASE });
		}
		function closeSettings() {
			if (settings.hidden) return;
			el.classList.remove('menu-open');
			if (ed.hidden) el.classList.remove('sheet-open');
			settings.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(6px) scale(.98)' }], { duration: 180, easing: EASE }).onfinish = function () {
				settings.hidden = true;
			};
		}

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
			Host.savePrefs({
				labelType: S.prefs.format === 'HEX' ? '#HEX' : S.prefs.format,
				showColorInfo: S.prefs.info,
				showColorLabels: S.prefs.names
			}).catch(function () {});
		}

		function saveDefault(b) {
			var list = S.swatches.map(function (s) { return { color: s.color, label: s.label }; });
			Host.savePrefs({ swatches: list }).then(function () {
				S.prefs.defaults = list;
				b.animate([{ transform: 'scale(.9)' }, { transform: 'none' }], { duration: 380, easing: SPRING });
				toast('Paleta padrão salva · ' + list.length + ' cores', { icon: 'bookmark' });
			}).catch(function () { toast('Não foi possível salvar a paleta padrão', { icon: 'alert' }); });
		}

		function loadDefault() {
			closeSettings();
			pushUndo();
			setSwatches(S.prefs.defaults);
			save();
			toast('Paleta padrão carregada', { icon: 'reset', undo: true });
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

		// ------------------------------------------------------------------ editor de cor
		var E = null;
		var edName = q('.ed-name'), edVal = q('.ed-val'), edFmt = q('.ed-fmt'), sv = q('.ed-sv'), hue = q('.ed-hue');
		var flood = q('.ed-flood');

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
			E = { id: sw ? sw.id : null, old: hex, fmt: S.prefs.format, hsb: C.rgbToHsb(C.hexToRgb(hex)) };
			edName.value = sw ? sw.label : '';
			q('.ed-btn.del').hidden = !sw;
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
				pushUndo();
				if (E.id) {
					var sw = find(E.id);
					if (sw) { sw.color = hex; sw.label = label; }
					render({ noEnter: E.id });
				} else {
					var nsw = { id: newId(), color: hex, label: label };
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
			if (settings.hidden) el.classList.remove('sheet-open');
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
		q('.ed-btn.ok').addEventListener('click', function () { closeEditor(true); });
		q('.ed-btn.cancel').addEventListener('click', function () { closeEditor(false); });
		q('.ed-btn.del').addEventListener('click', function () { closeEditor('delete'); });

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
			if (!ed.hidden) return;
			if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
			else if (e.key === 'Escape') closeSettings();
		});

		// ------------------------------------------------------------------ carregar + acompanhar o projeto
		function loadProject(stagger) {
			return Host.loadPalette().then(function (r) {
				S.undo = [];
				S.last = null;
				setSwatches((r && r.swatches) || [], { stagger: stagger });
			});
		}

		function poll() {
			Host.projectKey().then(function (k) {
				if (S.key !== null && k !== S.key) {
					S.key = k;
					closeSettings();
					if (E) closeEditor(false);
					loadProject(true);
				}
				S.key = k;
			}).catch(function () {});
		}

		Host.loadPrefs().then(function (p) {
			p = p || {};
			S.prefs.format = String(p.labelType || '#HEX').replace('#', '');
			S.prefs.info = p.showColorInfo !== false;
			S.prefs.names = !!p.showColorLabels;
			S.prefs.defaults = p.swatches || [];
			syncSettings();
		}).catch(function () {}).then(function () {
			measure();
			return loadProject(true);
		}).then(function () {
			measure();
			poll();
			setInterval(function () { if (!document.hidden) poll(); }, 2000);
			root.addEventListener('focus', poll);
		});

		measure();
		return { undo: undo, reload: function () { return loadProject(true); } };
	}

	root.PalApp = { mount: mount };
})(window);
