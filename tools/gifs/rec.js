// Grava cenas do mockup como GIF para a documentação.
// 1x: screencast do Chromium; 2x: screenshots em sequência. Depois, ffmpeg com paleta otimizada.
// Requer: playwright (com Chromium) e ffmpeg no PATH.
const { chromium } = require('playwright');
const fs = require('fs'), os = require('os'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(ROOT, 'docs', 'gifs');
const D = fs.mkdtempSync(path.join(os.tmpdir(), 'elpalletero-gifs-'));
fs.mkdirSync(OUT, { recursive: true });
const src = fs.readFileSync(path.join(ROOT, 'mockup', 'El-PALLETERO-mockup.html'), 'utf8');
fs.writeFileSync(D + '/page.html', '<!doctype html><html><head><meta charset="utf-8"><style>[hidden]{display:none!important}body{margin:0}</style></head><body>' + src + '</body></html>');

// cursor falso + selo de teclas (o headless não desenha o ponteiro)
const OVERLAY = `
addEventListener('DOMContentLoaded', () => {
  const st = document.createElement('style');
  st.textContent = '#fc{position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;width:22px;height:22px;transition:transform .12s;transform-origin:3px 2px}' +
    '#fc.down{transform:scale(.82)}#fc i{position:absolute;left:-13px;top:-14px;width:30px;height:30px;border-radius:50%;border:2px solid #fff;opacity:0}' +
    '#fc.down i{animation:fcr .45s ease-out}@keyframes fcr{from{opacity:.9;transform:scale(.3)}to{opacity:0;transform:scale(1.3)}}' +
    '#fk{position:fixed;z-index:2147483647;pointer-events:none;font:700 12px/1 ui-monospace,Menlo,Consolas,monospace;color:#121316;background:#FFC44E;padding:4px 7px;border-radius:6px;box-shadow:0 4px 14px rgba(0,0,0,.5);opacity:0;transform:translateY(4px);transition:opacity .15s,transform .2s}' +
    '#fk.on{opacity:1;transform:none}';
  document.head.appendChild(st);
  const c = document.createElement('div'); c.id = 'fc';
  c.innerHTML = '<i></i><svg width="22" height="22" viewBox="0 0 24 24"><path d="M3 2l7.5 19 2.6-7.8L21 10.6z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  const k = document.createElement('div'); k.id = 'fk';
  document.body.append(c, k);
  let x = -50, y = -50;
  const pos = () => { c.style.left = x + 'px'; c.style.top = y + 'px'; k.style.left = (x + 18) + 'px'; k.style.top = (y + 20) + 'px'; };
  addEventListener('mousemove', e => { x = e.clientX; y = e.clientY; pos(); }, true);
  addEventListener('mousedown', () => { c.classList.remove('down'); void c.offsetWidth; c.classList.add('down'); }, true);
  addEventListener('mouseup', () => setTimeout(() => c.classList.remove('down'), 120), true);
  const held = new Set();
  const show = () => { k.textContent = [...held].join(' + '); k.classList.toggle('on', held.size > 0); };
  addEventListener('keydown', e => { if (['Alt','Shift','Control','Meta'].includes(e.key)) { held.add(e.key === 'Control' ? 'Ctrl' : e.key); show(); } }, true);
  addEventListener('keyup', e => { held.delete(e.key === 'Control' ? 'Ctrl' : e.key); show(); }, true);
  pos();
});`;

async function scene(name, opts, fn) {
  const b = await chromium.launch();
  const dsf = opts.dsf || 1;
  let box;
  const ctx = await b.newContext({ viewport: { width: 1140, height: 820 }, deviceScaleFactor: dsf });
  const p = await ctx.newPage();
  await p.addInitScript(OVERLAY);
  await p.goto('file://' + D + '/page.html');
  await p.addStyleTag({ content: 'body{padding-top:20px!important}.hero{display:none!important}' });
  await p.waitForTimeout(1400);
  await p.evaluate(() => { MockAE.selected = {}; MockAE.select('__none__'); delete MockAE.selected.__none__; MockAE.select('__none__', true); delete MockAE.selected.__none__; });
  if (opts.layout) { await p.click('.layouts button[data-layout="' + opts.layout + '"]'); await p.waitForTimeout(900); }
  if (opts.setup) await opts.setup(p);
  await p.mouse.move(600, 790);
  box = await opts.clip(p);
  const cdp = await ctx.newCDPSession(p);
  const frames = [];
  const dir = path.join(D, 'rec', name); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  cdp.on('Page.screencastFrame', async f => {
    frames.push({ t: f.metadata.timestamp, data: f.data });
    try { await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch (e) {}
  });
  // 1x: screencast (quadros reais); 2x: sequência de screenshots já recortados (o screencast headless ignora a escala)
  let shooting = dsf > 1, loop = null;
  if (shooting) {
    loop = (async () => {
      while (shooting) {
        const t = Date.now() / 1000;
        try { frames.push({ t, data: (await p.screenshot({ clip: box, scale: 'device' })).toString('base64') }); } catch (e) {}
      }
    })();
  } else {
    await cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1 });
  }
  const H = helpers(p);
  await p.waitForTimeout(500);
  await fn(p, H);
  await p.waitForTimeout(1200);
  if (shooting) { shooting = false; await loop; } else await cdp.send('Page.stopScreencast');
  await b.close();

  // PNGs + lista de durações para o ffmpeg (a cena "recorta" o quadro)
  let list = '';
  frames.forEach((f, i) => {
    const file = path.join(dir, String(i).padStart(5, '0') + '.png');
    fs.writeFileSync(file, Buffer.from(f.data, 'base64'));
    const next = frames[i + 1] ? frames[i + 1].t : f.t + 1.6; // segura o último quadro antes do loop
    list += `file '${file}'\nduration ${Math.max(0.02, Math.min(next - f.t, 2)).toFixed(3)}\n`;
  });
  list += `file '${path.join(dir, String(frames.length - 1).padStart(5, '0') + '.png')}'\n`;
  fs.writeFileSync(dir + '/list.txt', list);
  const W = opts.width || 860;
  const crop = dsf > 1 ? 'null' : `crop=${Math.round(box.width)}:${Math.round(box.height)}:${Math.round(box.x)}:${Math.round(box.y)}`;
  const vf = `${crop},setpts=PTS/${opts.speed || 1.2},fps=${opts.fps || 20},scale=${W}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=200:stats_mode=diff[p];[b][p]paletteuse=dither=${opts.dither === 'bayer' ? 'bayer:bayer_scale=4' : 'sierra2_4a'}:diff_mode=rectangle`;
  const out = path.join(OUT, name + '.gif');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', dir + '/list.txt', '-vf', vf, '-loop', '0', out]);
  console.log(name.padEnd(12), frames.length + ' quadros', (fs.statSync(out).size / 1024).toFixed(0) + 'KB');
}

function helpers(p) {
  let cx = 600, cy = 700;
  const H = {
    async glide(x, y, ms = 450) {
      const steps = Math.max(8, Math.round(ms / 16));
      const x0 = cx, y0 = cy;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps, e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        await p.mouse.move(x0 + (x - x0) * e, y0 + (y - y0) * e);
        await p.waitForTimeout(16);
      }
      cx = x; cy = y;
    },
    async to(sel, fx = .5, fy = .5, ms) {
      const loc = typeof sel === 'string' ? p.locator(sel).first() : sel;
      await loc.scrollIntoViewIfNeeded().catch(() => {});
      const b = await loc.boundingBox();
      await H.glide(b.x + b.width * fx, b.y + b.height * fy, ms);
    },
    async click(sel, o = {}) {
      if (sel) await H.to(sel, o.fx, o.fy, o.ms);
      await p.waitForTimeout(o.pause ?? 180);
      await p.mouse.down({ button: o.button || 'left' }); await p.waitForTimeout(90); await p.mouse.up({ button: o.button || 'left' });
    },
    async drag(sel, dx, dy, ms = 700) {
      await H.to(sel); await p.mouse.down(); await p.waitForTimeout(120);
      await H.glide(cx + dx, cy + dy, ms); await p.waitForTimeout(150); await p.mouse.up();
    },
    wait: ms => p.waitForTimeout(ms),
    sw: i => p.locator('.strip .sw').nth(i),
  };
  return H;
}

const clipEl = (sel, pad = 0, extra = {}) => async p => {
  const b = await p.locator(sel).first().boundingBox();
  return { x: b.x - pad + (extra.x || 0), y: b.y - pad + (extra.y || 0), width: b.width + pad * 2 + (extra.w || 0), height: b.height + pad * 2 + (extra.h || 0) };
};
const WS = clipEl('.ws', 0);
const DOCK = clipEl('.dockslot', 0);

module.exports = { scene, WS, DOCK, clipEl };

// limpa os quadros temporários ao terminar
process.on('exit', () => { try { fs.rmSync(D, { recursive: true, force: true }); } catch (e) {} });
