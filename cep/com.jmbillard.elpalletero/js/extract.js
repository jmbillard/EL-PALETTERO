/* El PALLETERO · extração de cores de uma imagem (k-means em CIELAB, sem dependências) */
(function (root) {
	'use strict';
	var C = root.PalColor;

	// lê os pixels de uma imagem já carregada, reduzida para ~maxSide px
	function sample(img, maxSide) {
		maxSide = maxSide || 120;
		var s = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
		var w = Math.max(1, Math.round(img.naturalWidth * s)), h = Math.max(1, Math.round(img.naturalHeight * s));
		var cv = document.createElement('canvas');
		cv.width = w; cv.height = h;
		var ctx = cv.getContext('2d');
		ctx.drawImage(img, 0, 0, w, h);
		var d = ctx.getImageData(0, 0, w, h).data, px = [];
		for (var i = 0, p = 0; i < d.length; i += 4, p++) {
			if (d[i + 3] < 128) continue; // ignora transparência
			px.push({ lab: C.rgbToLab([d[i], d[i + 1], d[i + 2]]), x: (p % w) / w, y: Math.floor(p / w) / h });
		}
		return { px: px, w: w, h: h, ctx: ctx };
	}

	// gerador previsível: a mesma imagem sempre dá o mesmo resultado
	function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

	function kmeans(px, k) {
		var rand = rng(7), cents = [px[Math.floor(rand() * px.length)].lab.slice()], i, j;
		// k-means++
		while (cents.length < k) {
			var dist = px.map(function (p) {
				var m = Infinity;
				for (j = 0; j < cents.length; j++) m = Math.min(m, C.deltaE(p.lab, cents[j]));
				return m * m;
			});
			var sum = dist.reduce(function (a, b) { return a + b; }, 0), r = rand() * sum;
			for (i = 0; i < px.length && (r -= dist[i]) > 0; i++);
			cents.push(px[Math.min(i, px.length - 1)].lab.slice());
		}
		var assign = new Array(px.length);
		for (var it = 0; it < 12; it++) {
			var acc = cents.map(function () { return [0, 0, 0, 0]; });
			for (i = 0; i < px.length; i++) {
				var best = 0, bd = Infinity;
				for (j = 0; j < k; j++) { var d = C.deltaE(px[i].lab, cents[j]); if (d < bd) { bd = d; best = j; } }
				assign[i] = best;
				var a = acc[best]; a[0] += px[i].lab[0]; a[1] += px[i].lab[1]; a[2] += px[i].lab[2]; a[3]++;
			}
			cents = acc.map(function (a, n) { return a[3] ? [a[0] / a[3], a[1] / a[3], a[2] / a[3]] : cents[n]; });
		}
		return cents.map(function (c, n) {
			// marcador: pixel parecido com a cor do grupo e perto do "meio" da região onde ela aparece
			var count = 0, mx = 0, my = 0;
			for (i = 0; i < px.length; i++) if (assign[i] === n) { count++; mx += px[i].x; my += px[i].y; }
			mx /= count || 1; my /= count || 1;
			var best = null, bd = Infinity;
			for (i = 0; i < px.length; i++) {
				if (assign[i] !== n) continue;
				var dx = px[i].x - mx, dy = px[i].y - my;
				var d = C.deltaE(px[i].lab, c) + 40 * Math.sqrt(dx * dx + dy * dy);
				if (d < bd) { bd = d; best = px[i]; }
			}
			return { lab: c, count: count, x: best ? best.x : 0.5, y: best ? best.y : 0.5 };
		}).filter(function (c) { return c.count > 0; });
	}

	// paleta com "count" cores bem distintas, das mais presentes para as menos
	function palette(data, count) {
		if (!data.px.length) return [];
		var groups = kmeans(data.px, Math.min(data.px.length, count * 2 + 2)).sort(function (a, b) { return b.count - a.count; });
		var out = [];
		[18, 12, 7, 0].forEach(function (minDist) {
			groups.forEach(function (g) {
				if (out.length >= count || out.indexOf(g) >= 0) return;
				if (out.every(function (o) { return C.deltaE(o.lab, g.lab) >= minDist; })) out.push(g);
			});
		});
		return out.map(function (g) {
			return { color: C.rgbToHex(C.labToRgb(g.lab)), x: g.x, y: g.y, share: g.count / data.px.length };
		});
	}

	function pixel(data, fx, fy) {
		var x = Math.min(data.w - 1, Math.max(0, Math.floor(fx * data.w)));
		var y = Math.min(data.h - 1, Math.max(0, Math.floor(fy * data.h)));
		var d = data.ctx.getImageData(x, y, 1, 1).data;
		if (d[3] < 128) return null; // transparente: não é uma cor da imagem
		return C.rgbToHex([d[0], d[1], d[2]]);
	}

	root.PalExtract = { sample: sample, palette: palette, pixel: pixel };
})(window);
