// Gera mockup/O-PALETTERO-mockup.html: o painel real + o "After Effects de mentira", num arquivo só.
// uso: node tools/build-mockup.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const ext = path.join(root, 'cep', 'com.jmbillard.opalettero');
const read = (p) => fs.readFileSync(p, 'utf8');

const css = read(path.join(ext, 'css', 'panel.css'));
const js = [
	path.join(ext, 'js', 'color.js'),
	path.join(root, 'mockup', 'mock-host.js'),
	path.join(ext, 'js', 'bridge.js'),
	path.join(ext, 'js', 'panel.js')
].map(read).join('\n');

const out = read(path.join(root, 'mockup', 'showcase.html'))
	.replace('{{PANEL_CSS}}', () => css)
	.replace('{{PANEL_JS}}', () => js.replace(/<\/script/gi, '<\\/script'));

fs.writeFileSync(path.join(root, 'mockup', 'O-PALETTERO-mockup.html'), out);
console.log('ok → mockup/O-PALETTERO-mockup.html', (out.length / 1024).toFixed(1) + 'KB');
