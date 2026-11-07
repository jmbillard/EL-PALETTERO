// Gera o banner (PNG 360x84) do instalador e grava a string ExtendScript em "INSTALAR El PALLETERO.jsx".
// Também salva docs/img/banner.png. O logo vem de docs/img/logo.svg. Baseado no make_banner do ABRIDOR.
// uso: node tools/installer/make-banner.js      → banner 1× gravado no instalador
//      node tools/installer/make-banner.js 2    → prévia 2× em docs/img/banner@2x.png
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const LOGO = fs.readFileSync(path.join(ROOT, 'docs/img/logo.svg'), 'utf8');
const LOGO_URI = 'data:image/svg+xml;base64,' + Buffer.from(LOGO).toString('base64');
const GRADIENT = 'linear-gradient(90deg,#FF4D4D,#FF8F4D,#FFC44E,#5DE6A2,#80C0FE)';

(async () => {
	const scale = Number(process.argv[2]) || 1; // 2 = prévia em 2× (não grava no instalador)
	const b = await chromium.launch();
	const p = await b.newPage({ viewport: { width: 360, height: 84 }, deviceScaleFactor: scale });
	// opção A: picolé inteiro à esquerda, nome, frase e um fio de gradiente embaixo
	await p.setContent(`<body style="margin:0;width:360px;height:84px;background:#131418;font-family:'Segoe UI',Inter,'DejaVu Sans',sans-serif;position:relative;overflow:hidden">
		<img src="${LOGO_URI}" style="position:absolute;left:4px;top:5px;width:72px;height:72px">
		<div style="position:absolute;left:70px;top:13px;color:#A3A7B0;font-size:13px;font-weight:800;letter-spacing:.5px">EL</div>
		<div style="position:absolute;left:92px;top:10px;color:#ECEDEF;font-weight:800;font-size:25px;letter-spacing:.5px">PALLETERO</div>
		<div style="position:absolute;left:71px;top:43px;color:#8A8F9A;font-size:11.5px">um projeto de paleta</div>
		<div style="position:absolute;left:0;right:0;bottom:0;height:2px;background:${GRADIENT}"></div>
	</body>`);
	await p.waitForTimeout(150);
	const png = await p.screenshot({ type: 'png' });
	await b.close();
	if (scale !== 1) {
		fs.writeFileSync(path.join(ROOT, 'docs/img/banner@2x.png'), png);
		return console.log('prévia 2×: docs/img/banner@2x.png');
	}
	fs.mkdirSync(path.join(ROOT, 'docs/img'), { recursive: true });
	fs.writeFileSync(path.join(ROOT, 'docs/img/banner.png'), png);

	let lit = "'";
	for (const byte of png) {
		const c = String.fromCharCode(byte);
		if (c === "'" || c === '\\') lit += '\\' + c;
		else if (byte >= 32 && byte < 127) lit += c;
		else lit += '\\x' + byte.toString(16).toUpperCase().padStart(2, '0');
	}
	lit += "'";
	const file = path.join(ROOT, 'INSTALAR El PALLETERO.jsx');
	let src = fs.readFileSync(file, 'utf8');
	if (!/var BANNER = '(?:[^'\\]|\\.)*';/.test(src)) throw new Error('marcador "var BANNER" não encontrado');
	src = src.replace(/var BANNER = '(?:[^'\\]|\\.)*';/, () => 'var BANNER = ' + lit + ';');
	fs.writeFileSync(file, src);
	console.log('banner:', png.length, 'bytes');
})();
