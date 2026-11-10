// Executa "INSTALAR El PALLETERO.jsx" em Node com File/Folder/ScriptUI simulados.
// Baseado no installer_mock do ABRIDOR.
// uso: node tools/installer/test-installer.js
const fs = require('fs'), os = require('os'), path = require('path'), vm = require('vm'), assert = require('assert');
const ROOT = path.resolve(__dirname, '..', '..');
const SCRIPT = path.join(ROOT, 'INSTALAR El PALLETERO.jsx');
const EXT = 'Adobe/CEP/extensions';

class Folder {
	constructor(p) { this.fsName = path.resolve(String(p)); }
	get exists() { return fs.existsSync(this.fsName) && fs.statSync(this.fsName).isDirectory(); }
	get name() { return encodeURI(path.basename(this.fsName)); }
	get parent() { return new Folder(path.dirname(this.fsName)); }
	create() { fs.mkdirSync(this.fsName, { recursive: true }); return true; }
	remove() { try { fs.rmdirSync(this.fsName); return true; } catch (e) { return false; } }
	getFiles() { return fs.readdirSync(this.fsName).map(n => { const p = path.join(this.fsName, n); return fs.statSync(p).isDirectory() ? new Folder(p) : new File(p); }); }
}
class File {
	constructor(p) { this.fsName = path.resolve(String(p)); }
	get exists() { return fs.existsSync(this.fsName); }
	get name() { return encodeURI(path.basename(this.fsName)); }
	get parent() { return new Folder(path.dirname(this.fsName)); }
	open() { return true; } close() { }
	read() { return fs.readFileSync(this.fsName, 'utf8'); }
	copy(t) { try { fs.copyFileSync(this.fsName, String(t)); return true; } catch (e) { return false; } }
	remove() { fs.unlinkSync(this.fsName); return true; }
}

// roda o instalador; "clicks" é a sequência de botões ('opção:remover' marca o rádio)
function run(opts) {
	let win, buttons = {};
	const calls = [];
	function ctrl(type, text) {
		return {
			type, text: text || '', visible: true, enabled: true, value: false, children: [],
			preferredSize: { width: 0, height: 0 }, graphics: { newPen: () => ({}), PenType: {} }, layout: { layout() { } },
			add(t, b, txt) { const c = ctrl(t, txt); this.children.push(c); if (t === 'button' || t === 'radiobutton') buttons[txt] = c; return c; },
			addEventListener() { }, center() { }, update() { }, close() { this.closed = true; }, show() { }
		};
	}
	Folder.userData = new Folder(opts.userData);
	Folder.temp = new Folder(os.tmpdir());
	const ctx = {
		$: { os: opts.os || 'Windows', fileName: SCRIPT }, File, Folder, decodeURI, encodeURI,
		app: { version: opts.ae || '25.1.0', isoLanguage: opts.lang || 'pt_BR', preferences: { getPrefAsLong: () => 1 }, executeCommand() { } },
		system: { callSystem: c => { calls.push(c); const m = c.match(/^rm -rf "(.*)"$/); if (m) fs.rmSync(m[1], { recursive: true, force: true }); return ''; } },
		Window: function (t, title) { win = ctrl('window', title); return win; }
	};
	vm.createContext(ctx);
	vm.runInContext(fs.readFileSync(SCRIPT, 'utf8'), ctx);
	const nextBtn = () => Object.values(buttons).find(b => b.type === 'button' && !['cancelar', 'anterior', 'cancel', 'back', 'cancelar', 'anterior'].includes(b.text) && b.onClick);
	const log = [];
	for (const step of opts.clicks) {
		if (step === 'opção:remover') { buttons['remover'].value = true; const i = Object.values(buttons).find(b => b.type === 'radiobutton' && b.text !== 'remover'); i.value = false; continue; }
		const b = nextBtn();
		log.push(b.text);
		if (!b.enabled) { log.push('(bloqueado)'); break; }
		b.onClick();
	}
	const all = []; (function walk(c) { all.push(c); (c.children || []).forEach(walk); })(win);
	const radios = all.filter(c => c.type === 'radiobutton').map(c => c.text + (c.enabled ? '' : ' (desligado)'));
	const texts = all.filter(c => c.type === 'statictext').map(c => c.text).filter(Boolean);
	return { win, log, calls, radios, texts };
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'elpalletero-inst-'));
const ext = (u, id) => path.join(u, EXT, id);
const ok = (msg) => console.log('  ✓ ' + msg);

console.log('1. instalação nova (Windows) · checagem ok: abre direto em instalar');
let u = path.join(tmp, 'win');
let r = run({ userData: u, clicks: ['instalar'] });
assert(r.win.text.includes('El PALLETERO v'), 'título com versão'); ok('janela: ' + r.win.text);
assert(fs.existsSync(path.join(ext(u, 'com.jmbillard.elpalletero'), 'CSXS/manifest.xml'))); ok('manifest copiado');
const n = (function count(d) { return fs.readdirSync(d).reduce((s, f) => s + (fs.statSync(path.join(d, f)).isDirectory() ? count(path.join(d, f)) : 1), 0); })(ext(u, 'com.jmbillard.elpalletero'));
ok(n + ' arquivos copiados (inclui .debug: ' + fs.existsSync(path.join(ext(u, 'com.jmbillard.elpalletero'), '.debug')) + ')');
assert.strictEqual(r.calls.filter(c => /reg add .*PlayerDebugMode/.test(c)).length, 5); ok('PlayerDebugMode: CSXS 9 a 13 (reg add)');
assert(r.texts.some(t => /instalado!/.test(t))); ok('conclusão: "' + r.texts.find(t => /instalado!/.test(t)).split('\n')[0] + '"');

console.log('2. de novo, mesma versão');
r = run({ userData: u, clicks: [] });
assert(r.radios.includes('reinstalar')); ok('opções: ' + r.radios.join(' · '));

console.log('3. O PALETTERO (nome antigo) instalado, El PALLETERO não');
u = path.join(tmp, 'legacy');
fs.mkdirSync(path.join(ext(u, 'com.jmbillard.opalettero'), 'CSXS'), { recursive: true });
fs.writeFileSync(path.join(ext(u, 'com.jmbillard.opalettero'), 'CSXS/manifest.xml'), '<x ExtensionBundleVersion="1.1.0">');
r = run({ userData: u, clicks: ['atualizar'] });
assert(r.texts.some(t => /nome antigo/.test(t))); ok('avisa da troca de nome');
assert(!fs.existsSync(ext(u, 'com.jmbillard.opalettero'))); ok('pasta antiga removida');
assert(fs.existsSync(ext(u, 'com.jmbillard.elpalletero'))); ok('pasta nova instalada');
assert(r.texts.some(t => /atualizado!/.test(t))); ok('conclusão: atualizado');

console.log('4. remover');
r = run({ userData: u, clicks: ['opção:remover', 'remover'] });
assert(!fs.existsSync(ext(u, 'com.jmbillard.elpalletero'))); ok('extensão removida');
assert(r.texts.some(t => /presets continuam/.test(t))); ok('avisa que paletas e presets ficam');

console.log('5. macOS');
u = path.join(tmp, 'mac');
r = run({ userData: u, os: 'Macintosh OS 14', clicks: ['instalar'] });
assert.strictEqual(r.calls.filter(c => /^defaults write com\.adobe\.CSXS\.\d+ PlayerDebugMode 1$/.test(c)).length, 5); ok('PlayerDebugMode via defaults write');
assert(fs.existsSync(ext(u, 'com.jmbillard.elpalletero'))); ok('instalado');
assert(r.texts.some(t => /reinicie o computador/.test(t))); ok('dica de reiniciar o Mac');

console.log('6. After Effects 2021');
r = run({ userData: path.join(tmp, 'old'), ae: '18.4.1', clicks: ['começar', 'próximo'] });
assert(r.log.includes('(bloqueado)')); ok('checagem bloqueia o "próximo"');
assert(r.texts.some(t => /2022/.test(t))); ok('explica: precisa do 2022');

console.log('7. After Effects em inglês e em espanhol');
r = run({ userData: path.join(tmp, 'en'), lang: 'en_US', clicks: ['install'] });
assert(r.radios.includes('install')); ok('opções: ' + r.radios.join(' · '));
assert(r.texts.some(t => /installed!/.test(t))); ok('conclusão: "' + r.texts.find(t => /installed!/.test(t)).split('\n')[0] + '"');
assert(r.texts.some(t => /^restart After Effects/m.test(t))); ok('quebras de linha do CSV viram linhas');
r = run({ userData: path.join(tmp, 'es'), lang: 'es_ES', clicks: [] });
assert(r.radios.includes('instalar') && r.radios.includes('eliminar (desligado)')); ok('opções: ' + r.radios.join(' · '));
assert(r.texts.some(t => /necesita|todo listo/.test(t))); ok('textos em espanhol');
r = run({ userData: path.join(tmp, 'fr'), lang: 'fr_FR', clicks: [] });
assert(r.radios.includes('install')); ok('idioma sem coluna (francês): inglês');

fs.rmSync(tmp, { recursive: true, force: true });
console.log('\ntudo certo.');
