// Gera mockup/El-PALLETERO-mockup.html: o painel real + o "After Effects de mentira", num arquivo só.
// uso: node tools/build-mockup.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const ext = path.join(root, 'cep', 'com.jmbillard.elpalletero');
const read = (p) => fs.readFileSync(p, 'utf8');

const css = read(path.join(ext, 'css', 'panel.css'));
const js = [
	path.join(ext, 'js', 'color.js'),
	path.join(ext, 'js', 'names.js'),
	path.join(ext, 'js', 'extract.js'),
	path.join(root, 'mockup', 'mock-host.js'),
	path.join(ext, 'js', 'bridge.js'),
	path.join(ext, 'js', 'panel.js')
].map(read).join('\n');

const logo = 'data:image/svg+xml;base64,' + fs.readFileSync(path.join(root, 'docs', 'img', 'logo.svg')).toString('base64');
const out = read(path.join(root, 'mockup', 'showcase.html'))
	.split('{{LOGO_URI}}').join(logo)
	.replace('{{PANEL_CSS}}', () => css)
	.replace('{{PANEL_JS}}', () => js.replace(/<\/script/gi, '<\\/script'));

fs.writeFileSync(path.join(root, 'mockup', 'El-PALLETERO-mockup.html'), out);
console.log('ok → mockup/El-PALLETERO-mockup.html', (out.length / 1024).toFixed(1) + 'KB');
