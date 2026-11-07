// Gera o banner (PNG 360x84) do instalador e grava a string ExtendScript em "INSTALAR El PALLETERO.jsx".
// Também salva docs/img/banner.png. Baseado no make_banner do ABRIDOR.
// uso: node tools/installer/make-banner.js
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const SWATCHES = ['#F13333', '#FF4D4D', '#FE674C', '#FF8F4D', '#FFC44E', '#5DE6A2', '#80C0FE', '#B5ADFF', '#FF8CCD', '#FF739A', '#FF5A68'];

(async () => {
	const b = await chromium.launch();
	const p = await b.newPage({ viewport: { width: 360, height: 84 }, deviceScaleFactor: 1 });
	await p.setContent(`<body style="margin:0;width:360px;height:84px;background:#131418;font-family:'Segoe UI',Inter,'DejaVu Sans',sans-serif;position:relative;overflow:hidden">
		<div style="position:absolute;left:18px;top:14px;width:40px;height:40px;border-radius:50%;
			background:conic-gradient(#FF4D4D,#FFC44E,#5DE6A2,#80C0FE,#B5ADFF,#FF8CCD,#FF4D4D);box-shadow:0 6px 18px rgba(255,140,205,.25)"></div>
		<div style="position:absolute;left:70px;top:12px;color:#8A8F9A;font-size:12px;font-weight:600">El</div>
		<div style="position:absolute;left:87px;top:9px;color:#ECEDEF;font-weight:800;font-size:25px;letter-spacing:.5px">PALLETERO</div>
		<div style="position:absolute;left:71px;top:42px;color:#8A8F9A;font-size:11.5px">a paleta do projeto, como painel do After Effects</div>
		<div style="position:absolute;left:0;right:0;bottom:0;height:6px;display:flex;gap:2px;padding:0 2px">
			${SWATCHES.map(c => `<i style="flex:1;background:${c};border-radius:2px 2px 0 0"></i>`).join('')}</div>
	</body>`);
	const png = await p.screenshot({ type: 'png' });
	await b.close();
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
