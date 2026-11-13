// Sessão de uso real, de ponta a ponta, no mockup com o CEP simulado (sem pointerdown/pointerup).
// uso: node tools/ux/journey.js   (depois de node tools/build-mockup.js; precisa do Playwright)
const { chromium } = require('playwright'); const fs = require('fs'); const os = require('os'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const D = path.join(os.tmpdir(), 'elpalletero-ux'); fs.mkdirSync(D, { recursive: true });
fs.writeFileSync(D + '/page.html', '<!doctype html><html><head><meta charset="utf-8"><style>[hidden]{display:none!important}body{margin:0}</style></head><body>' + fs.readFileSync(path.join(ROOT, 'mockup', 'El-PALLETERO-mockup.html'), 'utf8') + '</body></html>');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1140, height: 900 } });
  await p.addInitScript(() => { ['pointerdown', 'pointerup', 'pointercancel'].forEach(t => window.addEventListener(t, e => e.stopImmediatePropagation(), true)); });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push('console: ' + m.text()));
  await p.goto('file://' + D + '/page.html?lang=pt'); await p.waitForTimeout(1300);
  let pass = 0, fail = 0; const log = [];
  const ok = (name, cond, extra) => { (cond ? pass++ : fail++); log.push((cond ? '  ✓ ' : '  ✗ ') + name + (extra !== undefined ? ' → ' + extra : '')); };
  const names = () => p.evaluate(() => [...document.querySelectorAll('.strip .sw:not(.leaving)')].map(n => n.getAttribute('aria-label').replace(/ #\w+$/, '')));
  const hexes = () => p.evaluate(() => [...document.querySelectorAll('.strip .sw:not(.leaving)')].map(n => n.getAttribute('aria-label').match(/#\w+$/)[0]));
  const toast = () => p.evaluate(() => document.querySelector('.toast').classList.contains('on') ? document.querySelector('.toast-msg').textContent : '');
  const layer = id => p.evaluate(id => MockAE.layers().find(l => l.id === id), id);
  const sel = ids => p.evaluate(ids => { MockAE.selected = {}; ids.forEach(i => MockAE.selected[i] = true); }, ids);
  const center = async loc => { const r = await loc.boundingBox(); return [r.x + r.width / 2, r.y + r.height / 2]; };
  const clickSw = async (i, mods = [], btn = 'left') => { const [x, y] = await center(p.locator('.strip .sw').nth(i)); for (const m of mods) await p.keyboard.down(m); await p.mouse.move(x, y); await p.waitForTimeout(120); await p.mouse.click(x, y, { button: btn }); for (const m of mods) await p.keyboard.up(m); await p.waitForTimeout(500); };
  const sheetOpen = () => p.evaluate(() => [...document.querySelectorAll('.pal .sheet')].filter(s => !s.hidden).map(s => s.className.split(' ')[1]).join(','));
  const wait = ms => p.waitForTimeout(ms);
  const sec = t => log.push(t);

  try {
  sec('1. começar um projeto sem paleta');
  await p.selectOption('#proj', 'vinheta_final.aep'); await wait(2800);
  ok('projeto novo abre com o preset padrão', (await names()).length > 0, (await names()).length + ' cores');
  await sel([]);
  await clickSw(0); ok('aplicar sem nada selecionado explica', /Selecione/.test(await toast()), await toast());

  sec('2. capturar as cores que já estão nos layers');
  await sel(['bar', 'circle']);
  const n0 = (await names()).length;
  await p.click('.pal .tool[data-act="capture"]'); await wait(900);
  ok('conta-gotas traz cores novas com nome', (await names()).length > n0, await toast());
  await p.locator('.pal').focus(); await p.keyboard.press('Control+z'); await wait(600);
  ok('Ctrl+Z desfaz a captura', (await names()).length === n0);

  sec('3. aplicar cores');
  await sel(['circle']); const c0 = (await layer('circle')).color;
  await clickSw(6); ok('clique aplica no layer', (await layer('circle')).color !== c0, c0 + ' → ' + (await layer('circle')).color);
  ok('amostra aplicada fica marcada', await p.evaluate(() => !!document.querySelector('.strip .sw.last')));
  await sel(['bar']); const s0 = (await layer('bar')).stroke;
  await clickSw(1, ['Shift']); ok('Shift aplica no contorno', (await layer('bar')).stroke !== s0 && true);
  await clickSw(2, ['Control']); ok('Ctrl copia o valor', /copiado/.test(await toast()), await toast());

  sec('4. editar uma cor e dar nome');
  const before = await names();
  await clickSw(4, [], 'right'); ok('botão direito abre o editor', (await sheetOpen()) === 'editor');
  const sv = await p.locator('.editor .ed-sv').boundingBox();
  await p.mouse.move(sv.x + 20, sv.y + 20); await p.mouse.down(); await p.mouse.move(sv.x + sv.width * .7, sv.y + sv.height * .3, { steps: 5 }); await p.mouse.up();
  const autoName = await p.inputValue('#pal-ed-name');
  await p.click('#pal-ed-name'); await p.keyboard.press('Control+a'); await p.keyboard.type('cor da marca'); await p.keyboard.press('Enter'); await wait(800);
  ok('nome digitado fica na amostra', (await names())[4] === 'cor da marca', before[4] + ' → ' + (await names())[4] + ' (automático era "' + autoName + '")');
  ok('editor fechou', (await sheetOpen()) === '');
  // teclado: foco na amostra, F2 edita, Esc cancela
  await p.locator('.strip .sw').nth(2).focus(); await p.keyboard.press('F2'); await wait(600);
  ok('F2 abre o editor da amostra em foco', (await sheetOpen()) === 'editor');
  await p.keyboard.press('Escape'); await wait(600); ok('Esc fecha sem mudar', (await sheetOpen()) === '' && (await names())[4] === 'cor da marca');
  // digitar um valor inválido e um válido
  await clickSw(0, [], 'right'); await p.click('#pal-ed-val'); await p.keyboard.press('Control+a'); await p.keyboard.type('zzz'); await p.keyboard.press('Enter'); await wait(400);
  ok('valor inválido não fecha o editor', (await sheetOpen()) === 'editor');
  await p.keyboard.press('Control+a'); await p.keyboard.type('#12abef'); await p.keyboard.press('Enter'); await wait(800);
  ok('hex digitado vale', (await hexes())[0] === '#12ABEF', (await hexes())[0]);

  sec('5. organizar');
  const o0 = await hexes();
  const [ax, ay] = await center(p.locator('.strip .sw').nth(0)), [cx] = await center(p.locator('.strip .sw').nth(3));
  await p.mouse.move(ax, ay); await p.mouse.down(); for (let k = 1; k <= 10; k++) await p.mouse.move(ax + (cx - ax + 25) * k / 10, ay); await p.mouse.up(); await wait(600);
  const o1 = await hexes(); ok('arrastar reordena', o1.join() !== o0.join() && o1.indexOf(o0[0]) === 3, 'a 1ª foi para a posição ' + (o1.indexOf(o0[0]) + 1));
  await clickSw(1, ['Alt']); ok('Alt+clique exclui e avisa', /removid/.test(await toast()) && (await hexes()).length === o1.length - 1, await toast());
  await p.click('.toast button'); await wait(600); ok('desfazer do aviso traz de volta', (await hexes()).join() === o1.join());
  await p.locator('.pal').focus(); await p.keyboard.press('Control+z'); await wait(600); ok('Ctrl+Z desfaz a reordenação', (await hexes()).join() === o0.join());

  sec('6. harmonia');
  const h0 = (await hexes()).length;
  await p.click('.pal .tool[data-act="add"]'); await wait(700);
  if ((await sheetOpen()) === 'editor') { await p.click('.pal .editor .ed-btn.mode'); await wait(600); }
  ok('harmonia aberta', (await sheetOpen()) === 'harmony');
  await p.click('.hm-rule[data-rule="comp"]'); await wait(300);
  ok('complementar: 2 cores', (await p.textContent('.hm-n')) === '2');
  await p.locator('.harmony .hm-map').focus(); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await wait(300);
  await p.keyboard.press('Enter'); await wait(900);
  ok('Enter adiciona as cores da harmonia', (await hexes()).length === h0 + 2, await toast());

  sec('7. extrair de uma imagem');
  await sel(['photo']);
  const e0 = (await hexes()).length;
  await p.locator('.pal .tool[data-act="capture"]').hover(); await wait(700);
  ok('ícone do conta-gotas vira imagem', (await p.getAttribute('.pal .tool[data-act="capture"]', 'data-mode')) === 'image');
  await p.click('.pal .tool[data-act="capture"]'); await p.waitForSelector('.ex-chip', { timeout: 15000 }); await wait(600);
  ok('extração aberta com sugestões', (await sheetOpen()) === 'extract' && (await p.locator('.ex-chip').count()) >= 2, (await p.locator('.ex-chip').count()) + ' cores');
  await p.locator('.ex-chip').nth(0).click(); await wait(200);
  await p.keyboard.press('Enter'); await wait(1000);
  ok('Enter adiciona as ligadas', (await hexes()).length > e0, await toast());

  sec('8. colar uma lista do cliente');
  const p0 = (await hexes()).length;
  await p.locator('.pal').focus();
  await p.evaluate(() => { const dt = new DataTransfer(); dt.setData('text/plain', 'Primária: #0A6CFF\nSecundária: #FF7A00\ntexto qualquer'); document.querySelector('.pal').dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })); });
  await wait(700); ok('cola 2 cores com os nomes', (await hexes()).length === p0 + 2 && (await names()).slice(-2).join() === 'Primária,Secundária', (await names()).slice(-2).join(' · '));

  sec('9. presets: salvar, renomear, padrão, aplicar em outro projeto, excluir');
  await p.click('.pal .tool[data-act="library"]'); await p.waitForSelector('.pcard[data-pid]'); await wait(700);
  ok('cartão do projeto oferece salvar', await p.evaluate(() => /st-(new|changed)/.test(document.querySelector('.is-project').className) && !!document.querySelector('.lib-sep')));
  await p.locator('.pcard.is-project').click(); await wait(900);
  await p.keyboard.press('Control+a'); await p.keyboard.type('Vinheta cliente'); await p.keyboard.press('Enter'); await wait(800);
  ok('preset salvo com o nome digitado', await p.evaluate(() => [...document.querySelectorAll('.pcard[data-pid] .pc-name')].some(n => n.textContent === 'Vinheta cliente')));
  ok('paleta agora consta como salva', await p.evaluate(() => /st-saved/.test(document.querySelector('.is-project').className) && !document.querySelector('.lib-sep')));
  const pc = p.locator('.pcard[data-pid]', { hasText: 'Vinheta cliente' });
  await pc.hover(); await wait(300); await pc.locator('.pc-star').click(); await wait(500);
  ok('estrela define o padrão', /padrão/.test(await toast()), await toast());
  await p.keyboard.press('Escape'); await wait(500);
  const saved = await hexes();
  await p.selectOption('#proj', 'abertura_v3.aep'); await wait(2800);
  ok('outro projeto tem a própria paleta', (await hexes()).join() !== saved.join());
  await p.click('.pal .tool[data-act="library"]'); await p.waitForSelector('.pcard[data-pid]'); await wait(700);
  await p.locator('.pcard[data-pid]', { hasText: 'Vinheta cliente' }).click(); await wait(1000);
  ok('clique no preset substitui a paleta', (await hexes()).join() === saved.join(), await toast());
  await p.locator('.pal').focus(); await p.keyboard.press('Control+z'); await wait(700);
  ok('Ctrl+Z volta a paleta anterior', (await hexes()).join() !== saved.join());
  if (!(await p.locator('.pal .library').isVisible())) { await p.click('.pal .tool[data-act="library"]'); await p.waitForSelector('.pcard[data-pid]'); await wait(700); }
  const pc2 = p.locator('.pcard[data-pid]', { hasText: 'Vinheta cliente' });
  await pc2.hover(); await wait(300); await pc2.locator('.pc-del').click(); await wait(700);
  ok('excluir preset avisa com desfazer', /exclu/.test(await toast()), await toast());
  await p.click('.toast button'); await wait(900);
  ok('desfazer restaura o preset', await p.evaluate(() => [...document.querySelectorAll('.pcard[data-pid] .pc-name')].some(n => n.textContent === 'Vinheta cliente')));
  await p.keyboard.press('Escape'); await wait(500);

  sec('10. a paleta fica no projeto');
  await p.selectOption('#proj', 'vinheta_final.aep'); await wait(2800);
  ok('voltar ao primeiro projeto traz a paleta dele', (await hexes()).join() === saved.join());
  ok('nome digitado continua', (await names()).includes('cor da marca'));

  sec('11. ajustes');
  await p.click('.pal .tool[data-act="menu"]'); await wait(500);
  await p.click('.pal [data-fmt="RGB"]'); await wait(400);
  ok('formato RGB nas amostras', /^\d+ \d+ \d+$/.test(await p.evaluate(() => document.querySelector('.strip .sw .sw-val').textContent)), await p.evaluate(() => document.querySelector('.strip .sw .sw-val').textContent));
  await p.click('.pal [data-fmt="HEX"]');
  await p.click('.pal [data-act="sort"]'); await wait(900);
  ok('ordenar fecha os ajustes e avisa', (await sheetOpen()) === '' && /Ordenada|ordem/.test(await toast()), await toast());

  sec('12. teclado de ponta a ponta');
  await p.locator('.strip .sw').nth(0).focus();
  await sel(['bg']); const bg0 = (await layer('bg')).color;
  await p.keyboard.press('Enter'); await wait(500);
  ok('Enter na amostra em foco aplica', (await layer('bg')).color !== bg0);
  const k0 = (await hexes()).length;
  await p.keyboard.press('Delete'); await wait(600);
  ok('Delete exclui a amostra em foco', (await hexes()).length === k0 - 1);
  const focusAfter = await p.evaluate(() => { const a = document.activeElement; return a ? (a.className || a.tagName) : 'nada'; });
  ok('o foco continua no painel depois de excluir', await p.evaluate(() => document.querySelector('.pal').contains(document.activeElement)), String(focusAfter).slice(0, 30));
  await p.keyboard.press('Control+z'); await wait(600);
  ok('Ctrl+Z depois do Delete funciona sem clicar de novo', (await hexes()).length === k0);

  } catch (e) { log.push('  ✗ ROTEIRO PAROU: ' + e.message.split('\n')[0] + ' · folhas abertas: ' + await sheetOpen()); fail++; await p.screenshot({ path: D + '/journey-fail.png' }); }
  console.log(log.join('\n')); console.log('\n' + pass + ' passaram, ' + fail + ' falharam'); console.log('erros JS:', errs);
  await b.close();
})();
