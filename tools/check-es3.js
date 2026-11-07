// Procura palavras reservadas do ES3 (ExtendScript) usadas como identificadores nos arquivos .jsx.
// O JavaScript moderno aceita várias delas (native, int, char, class…), por isso passam no Node e quebram no After Effects.
// uso: node tools/check-es3.js
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const RESERVED = ['abstract', 'boolean', 'byte', 'char', 'class', 'const', 'debugger', 'double', 'enum', 'export', 'extends',
	'final', 'float', 'goto', 'implements', 'import', 'int', 'interface', 'let', 'long', 'native', 'package', 'private',
	'protected', 'public', 'short', 'static', 'super', 'synchronized', 'throws', 'transient', 'volatile', 'yield'];
const FILES = ['INSTALAR El PALLETERO.jsx', 'cep/com.jmbillard.elpalletero/jsx/host.jsx'];

// tira comentários, strings e regex simples, mantendo as quebras de linha (para o número da linha bater)
function strip(src) {
	let out = '', i = 0, q = null;
	while (i < src.length) {
		const c = src[i], n = src[i + 1];
		if (q) {
			if (c === '\\') { out += '  '; i += 2; continue; }
			if (c === q) q = null;
			out += c === '\n' ? '\n' : ' '; i++; continue;
		}
		if (c === '/' && n === '/') { while (i < src.length && src[i] !== '\n') { out += ' '; i++; } continue; }
		if (c === '/' && n === '*') { while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) { out += src[i] === '\n' ? '\n' : ' '; i++; } out += '  '; i += 2; continue; }
		if (c === '"' || c === "'") { q = c; out += ' '; i++; continue; }
		if (c === '/' && /[=(,:;!&|?{}[\n]\s*$/.test(out.slice(-20))) { // regex literal
			out += ' '; i++;
			while (i < src.length && src[i] !== '/') { if (src[i] === '\\') { out += ' '; i++; } out += ' '; i++; }
			out += ' '; i++; continue;
		}
		out += c; i++;
	}
	return out;
}

let problems = 0;
for (const f of FILES) {
	const lines = strip(fs.readFileSync(path.join(ROOT, f), 'utf8')).split('\n');
	lines.forEach((line, n) => {
		for (const w of RESERVED) {
			// palavra solta (não precedida de "." nem seguida de ":" em objeto literal também é proibida em ES3)
			const re = new RegExp('(^|[^\\w$])' + w + '(?![\\w$])', 'g');
			if (re.test(line)) { problems++; console.log(`${f}:${n + 1}  "${w}"  →  ${line.trim().slice(0, 90)}`); }
		}
	});
}
console.log(problems ? `\n${problems} uso(s) de palavra reservada do ES3` : 'nenhuma palavra reservada do ES3 encontrada');
process.exit(problems ? 1 : 0);
