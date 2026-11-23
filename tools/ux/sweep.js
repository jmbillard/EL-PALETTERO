// Varredura visual: cada tela do painel em vários tamanhos, com auditoria de cortes e estouros.
// uso: node tools/ux/sweep.js [tamanho…]   · PLANG=es para outro idioma · telas em <tmp>/elpalletero-ux/shots
const { chromium } = require('playwright'); const fs = require('fs'); const os = require('os'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const D = path.join(os.tmpdir(), 'elpalletero-ux'); fs.mkdirSync(D, { recursive: true });
fs.writeFileSync(D + '/page.html', '<!doctype html><html><head><meta charset="utf-8"><style>[hidden]{display:none!important}body{margin:0}</style></head><body>' + fs.readFileSync(path.join(ROOT, 'mockup', 'El-PALLETERO-mockup.html'), 'utf8') + '</body></html>');
const SIZES = { 'faixa-1000x102': [1000, 102], 'faixa-fina-1000x66': [1000, 66], 'faixa-curta-430x102': [430, 102], 'larga-600x170': [600, 170], 'grade-320x420': [320, 420], 'grade-peq-250x300': [250, 300], 'coluna-168x420': [168, 420], 'mini-200x200': [200, 200] };
const only = process.argv.slice(2);
const LANG = (process.env.PLANG || 'pt');
(async () => {
  const b = await chromium.launch();
  const report = [];
  for (const [name, [W, H]] of Object.entries(SIZES)) {
    if (only.length && !only.includes(name)) continue;
    const p = await b.newPage({ viewport: { width: 1140, height: 900 } });
    await p.addInitScript(() => { ['pointerdown', 'pointerup', 'pointercancel'].forEach(t => window.addEventListener(t, e => e.stopImmediatePropagation(), true)); });
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + D + '/page.html?lang=' + LANG); await p.waitForTimeout(1200);
    await p.addStyleTag({ content: `.frame{position:fixed!important;left:20px;top:20px;width:${W}px!important;height:${H + 24}px!important;max-width:none!important;flex:none!important;z-index:999}` });
    await p.waitForTimeout(500);
    const dir = D + '/shots/' + name; fs.mkdirSync(dir, { recursive: true });
    const shot = async (st) => { await p.screenshot({ path: dir + '/' + st + '.png', clip: { x: 16, y: 16, width: W + 8, height: H + 32 } }); };
    // auditoria: elementos visíveis fora do painel, texto cortado, botões minúsculos
    const audit = async (st) => {
      const r = await p.evaluate(() => {
        const pal = document.querySelector('.pal'), pr = pal.getBoundingClientRect(), out = [];
        const vis = n => { const s = getComputedStyle(n); return s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05 && n.offsetParent !== null; };
        const scrollParent = n => { for (let a = n.parentElement; a && a !== pal; a = a.parentElement) { const s = getComputedStyle(a); if (/(auto|scroll)/.test(s.overflowX + s.overflowY)) return a; } return null; };
        pal.querySelectorAll('button, input, .sw, .hm-mk, .knob, .ver, .grp-title, .pc-name, .sw-name, .sw-val, .k-row, .toast.on, .empty span').forEach(n => {
          if (!vis(n)) return;
          let anc = n; while (anc && anc !== pal) { if (!vis(anc)) return; anc = anc.parentElement; }
          const r = n.getBoundingClientRect(); if (!r.width || !r.height) return;
          const sp = scrollParent(n);
          const id = (n.className && n.className.baseVal === undefined ? String(n.className).split(' ').slice(0, 2).join('.') : n.tagName) + (n.dataset && (n.dataset.act || n.dataset.tip) ? '[' + (n.dataset.act || n.dataset.tip).slice(0, 18) + ']' : '') + (n.textContent && n.children.length === 0 ? ' "' + n.textContent.trim().slice(0, 18) + '"' : '');
          if (!sp && (r.left < pr.left - 1 || r.right > pr.right + 1 || r.top < pr.top - 1 || r.bottom > pr.bottom + 1)) out.push('FORA ' + id + ' ' + Math.round(r.right - pr.right) + '/' + Math.round(r.bottom - pr.bottom));
          if (n.children.length === 0 && n.scrollWidth > n.clientWidth + 1 && getComputedStyle(n).overflow !== 'visible' && n.textContent.trim()) out.push('CORTE ' + id);
          if (n.tagName === 'BUTTON' && (r.width < 16 || r.height < 14)) out.push('MIÚDO ' + id + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
        });
        return [...new Set(out)];
      });
      if (r.length) report.push(name + ' · ' + st + ': ' + r.join(' | '));
    };
    const step = async (st) => { await p.waitForTimeout(650); await shot(st); await audit(st); };
    const esc = async () => { await p.keyboard.press('Escape'); await p.waitForTimeout(450); };
    try {
      await step('01-paleta');
      const s2 = await p.locator('.strip .sw').nth(2).boundingBox();
      await p.mouse.move(s2.x + s2.width / 2, s2.y + s2.height / 2); await p.waitForTimeout(900); await step('02-hover');
      await p.mouse.move(5, 880);
      await p.click('.pal .tool[data-act="menu"]'); await step('03-ajustes'); await p.click('.pal .tool[data-act="menu"]'); await p.waitForTimeout(350);
      await p.click('.pal .tool[data-act="library"]'); await p.waitForSelector('.pcard[data-pid]'); await step('04-presets'); await p.click('.pal .tool[data-act="library"]'); await p.waitForTimeout(350);
      await p.locator('.strip .sw').nth(1).click({ button: 'right' }); await step('05-editor'); await esc();
      await p.locator('.strip .sw').nth(1).click({ button: 'right' }); await p.waitForTimeout(500); await p.click('.pal .editor .ed-btn.mode'); await step('06-harmonia');
      await p.click('.hm-rule[data-rule="ana"]'); await p.waitForTimeout(200); await p.click('.hm-steps button[data-steps="3"]'); await step('07-harmonia-analoga-3'); await esc();
      await p.evaluate(() => { MockAE.selected = { photo: true }; }); await p.click('.pal .tool[data-act="capture"]'); await p.waitForTimeout(2300); await step('08-extrair'); await esc();
      await p.evaluate(() => { MockAE.selected = {}; });
      await p.locator('.pal').focus(); await p.keyboard.press('Shift+?'); await step('09-atalhos'); await esc();
      const s0 = await p.locator('.strip .sw').nth(0).boundingBox(); await p.keyboard.down('Alt'); await p.mouse.click(s0.x + s0.width / 2, s0.y + s0.height / 2); await p.keyboard.up('Alt'); await step('10-aviso');
      await p.click('.pal .tool[data-act="menu"]'); await p.waitForTimeout(350);
      const hb = await p.locator('.pal [data-act="clear"]').boundingBox();
      if (hb) { await p.evaluate(() => document.querySelector('.pal [data-act="clear"]').scrollIntoView({ block: 'nearest' })); const h2 = await p.locator('.pal [data-act="clear"]').boundingBox(); await p.mouse.move(h2.x + 8, h2.y + 8); await p.mouse.down(); await p.waitForTimeout(1250); await p.mouse.up(); }
      await p.waitForTimeout(2600); await step('11-vazio');
    } catch (e) { report.push(name + ': ERRO NO ROTEIRO ' + e.message.split('\n')[0]); }
    if (errs.length) report.push(name + ': ERROS JS ' + errs.join(' ; '));
    await p.close();
  }
  console.log(report.join('\n') || 'auditoria: nada encontrado'); await b.close();
})();
