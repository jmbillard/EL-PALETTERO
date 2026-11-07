// Roteiro de cada GIF da documentação.
// uso: node tools/gifs/record.js            → todos
//      node tools/gifs/record.js editor     → só alguns
const { scene, WS, DOCK, clipEl } = require('./rec');
const only = process.argv.slice(2);
const S = {};

// 1. aplicar cor (herói do README)
S.aplicar = () => scene('aplicar', { clip: WS, width: 900, speed: 1.3 }, async (p, H) => {
  await H.click('.layer[data-id="circle"]'); await H.wait(300);
  await H.to(H.sw(3), .5, .45, 700); await H.wait(500);
  await H.click(null); await H.wait(900);
  await H.click('.layer[data-id="bar"]'); await H.wait(300);
  await H.to(H.sw(0), .5, .45, 800); await H.wait(300);
  await H.click(null); await H.wait(800);
  await H.click('.layer[data-id="title"]'); await H.wait(300);
  await H.to(H.sw(1), .5, .45, 600); await H.wait(200);
  await H.click(null); await H.wait(900);
});

// 2. editor + nome automático
S.editor = () => scene('editor', { clip: DOCK, layout: 'grid', dsf: 2, width: 420, fps: 12, speed: 1.3 }, async (p, H) => {
  await H.to(H.sw(4), .5, .45, 500); await H.wait(200);
  await H.click(null, { button: 'right' }); await H.wait(600);
  const sv = await p.locator('.editor .ed-sv').boundingBox();
  await H.glide(sv.x + sv.width * .5, sv.y + sv.height * .3, 350);
  await p.mouse.down();
  await H.glide(sv.x + sv.width * .82, sv.y + sv.height * .2, 600);
  await p.mouse.up(); await H.wait(200);
  const hue = await p.locator('.editor .ed-hue').boundingBox();
  await H.glide(hue.x + hue.width * .72, hue.y + hue.height / 2, 400);
  await p.mouse.down();
  await H.glide(hue.x + hue.width * .2, hue.y + hue.height / 2, 900);
  await H.glide(hue.x + hue.width * .52, hue.y + hue.height / 2, 600);
  await p.mouse.up(); await H.wait(500);
  await H.click('#pal-ed-name', { fx: .4 }); await H.wait(150);
  await p.keyboard.press('Control+a');
  await p.keyboard.type('cor da marca', { delay: 55 }); await H.wait(400);
  await H.click('.editor .ed-btn.ok'); await H.wait(800);
});

// 3. arrastar, copiar, excluir com Alt + desfazer
S.organizar = () => scene('organizar', { clip: DOCK, dsf: 2, width: 900 }, async (p, H) => {
  const a = await H.sw(0).boundingBox(), c = await H.sw(4).boundingBox();
  await H.glide(a.x + a.width / 2, a.y + a.height / 2, 600); await H.wait(200);
  await p.mouse.down(); await H.wait(100);
  await H.glide(c.x + c.width * .7, a.y + a.height / 2, 1200); await H.wait(200);
  await p.mouse.up(); await H.wait(700);
  await H.to(H.sw(6), .5, .5, 600);
  await p.keyboard.down('Control'); await H.wait(400);
  await H.click(null); await H.wait(900);
  await p.keyboard.up('Control'); await H.wait(300);
  await H.to(H.sw(2), .5, .5, 600);
  await p.keyboard.down('Alt'); await H.wait(900);
  await H.click(null); await H.wait(600);
  await p.keyboard.up('Alt'); await H.wait(400);
  await H.click('.toast button'); await H.wait(900);
});

// 4. capturar da seleção e do projeto
S.capturar = () => scene('capturar', {
  clip: WS, width: 900,
  setup: async p => { await p.selectOption('#proj', 'vinheta_final.aep'); await p.waitForTimeout(2600); }
}, async (p, H) => {
  await H.click('.layer[data-id="bar"]'); await H.wait(300);
  await H.click('.tool[data-act="capture"]', { ms: 800 }); await H.wait(1500);
  await p.keyboard.down('Shift'); await H.wait(700);
  await H.click(null); await H.wait(1400);
  await p.keyboard.up('Shift'); await H.wait(500);
});

// 5. extrair cores de imagem
S.imagem = () => scene('imagem', { clip: WS, layout: 'grid', dsf: 2, width: 900 }, async (p, H) => {
  await H.click('.layer[data-id="photo"]'); await H.wait(300);
  await H.to('.tool[data-act="capture"]', .5, .5, 800); await H.wait(700); // o ícone vira imagem
  await H.click(null); await H.wait(1400);
  await H.click('.ex-step[data-d="1"]'); await H.wait(700);
  const st = await p.locator('.ex-stage').boundingBox();
  await H.glide(st.x + st.width * .2, st.y + st.height * .2, 500);
  await H.glide(st.x + st.width * .55, st.y + st.height * .35, 600);
  await H.glide(st.x + st.width * .62, st.y + st.height * .6, 500); await H.wait(300);
  await H.click(null); await H.wait(600);
  await H.click(p.locator('.ex-chip').nth(1)); await H.wait(500);
  await H.click('.extract .ed-btn.ok'); await H.wait(1500);
});

// 6. presets
S.presets = () => scene('presets', { clip: DOCK, layout: 'grid', dsf: 2, width: 440, dither: 'bayer' }, async (p, H) => {
  await H.click('.tool[data-act="library"]'); await H.wait(800);
  await H.to('.pcard[data-pid="neutros"]', .5, .4, 700); await H.wait(600);
  await H.click(null); await H.wait(1300);
  await H.click('.tool[data-act="library"]'); await H.wait(700);
  await H.to('.pcard[data-pid="verao"]', .5, .4, 700);
  await p.keyboard.down('Shift'); await H.wait(500);
  await H.click(null); await H.wait(400);
  await p.keyboard.up('Shift'); await H.wait(1200);
  await H.click('.tool[data-act="library"]'); await H.wait(700);
  await H.click('.pcard.add'); await H.wait(500);
  await p.keyboard.press('Control+a');
  await p.keyboard.type('Esporte noite', { delay: 70 }); await p.keyboard.press('Enter'); await H.wait(1000);
});

// 7. layouts
S.layouts = () => scene('layouts', {
  clip: WS, width: 900,
  // altura fixa: os três formatos cabem no mesmo quadro
  setup: p => p.addStyleTag({ content: '.ws .ws-body, .ws[data-layout] .ws-body { height: 430px; grid-template-rows: minmax(0,1fr) auto; } .ws[data-layout="column"] .ws-body, .ws[data-layout="grid"] .ws-body { grid-template-rows: minmax(0,1fr); }' })
}, async (p, H) => {
  await H.wait(400);
  await H.click('.layouts button[data-layout="column"]'); await H.wait(1300);
  await H.to('.strip .sw >> nth=2', .5, .5, 700); await H.wait(700);
  await H.click('.layouts button[data-layout="grid"]'); await H.wait(1300);
  await H.to('.strip .sw >> nth=5', .5, .5, 700); await H.wait(700);
  await H.click('.layouts button[data-layout="strip"]'); await H.wait(1300);
});

// 8. pasta de rede desmontada
S.rede = () => scene('rede', { clip: DOCK, layout: 'grid', dsf: 2, width: 480, dither: 'bayer' }, async (p, H) => {
  const path = () => p.locator('.lib-path').textContent();
  await H.click('.tool[data-act="library"]'); await p.waitForSelector('.pcard[data-pid]'); await H.wait(600);
  for (const want of ['equipe', 'PROMO']) {
    await H.click('.lib-folder');
    await p.waitForFunction(w => (document.querySelector('.lib-path').textContent + (document.querySelector('.pcard.offline') ? 'PROMO' : '')).includes(w === 'equipe' ? 'design' : 'PROMO'), want);
    await H.wait(1300);
  }
  await H.to('.pcard.offline', .5, .4, 500); await H.wait(900);
  await H.click('[data-off="mount"]'); await p.waitForSelector('.pcard[data-pid="promo"]'); await H.wait(1600);
});

(async () => { for (const k of Object.keys(S)) if (!only.length || only.includes(k)) await S[k](); })();
