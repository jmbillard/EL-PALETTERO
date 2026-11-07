// Gera os ícones do painel (manifest) a partir de docs/img/logo.svg: icon.png (23 px) e icon@2x.png (46 px).
// uso: node tools/installer/make-icons.js
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'cep', 'com.jmbillard.elpalletero', 'icons');
const uri = 'data:image/svg+xml;base64,' + fs.readFileSync(path.join(ROOT, 'docs/img/logo.svg')).toString('base64');

(async () => {
	fs.mkdirSync(OUT, { recursive: true });
	const b = await chromium.launch();
	for (const [name, scale] of [['icon.png', 1], ['icon@2x.png', 2]]) {
		const p = await b.newPage({ viewport: { width: 23, height: 23 }, deviceScaleFactor: scale });
		await p.setContent(`<body style="margin:0;background:transparent"><img src="${uri}" style="width:23px;height:23px;display:block"></body>`);
		await p.waitForTimeout(100);
		await p.screenshot({ path: path.join(OUT, name), omitBackground: true });
		await p.close();
	}
	await b.close();
	console.log('ícones:', fs.readdirSync(OUT).join(', '));
})();
