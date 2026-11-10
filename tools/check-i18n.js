// Confere as traduções: chaves usadas no código que faltam no CSV, chaves sobrando,
// células vazias e {variáveis} diferentes entre os idiomas.
// uso: node tools/check-i18n.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const ext = path.join(root, 'cep', 'com.jmbillard.elpalletero');
global.window = global;
global.document = { documentElement: {} };
require(path.join(ext, 'js', 'i18n.js'));
const I = global.PalI18n;

function table(file) {
	const rows = I.parseCSV(fs.readFileSync(file, 'utf8'));
	const head = rows.shift().map((h) => h.trim());
	const langs = head.filter((h, i) => i > 0 && /^[a-z]{2}(-[A-Za-z]{2,4})?$/.test(h));
	return { head, langs, rows };
}

let bad = 0;
const fail = (msg) => { bad++; console.log('  ✗ ' + msg); };

// ------------------------------------------------------------ strings.csv
const st = table(path.join(ext, 'i18n', 'strings.csv'));
const keys = {};
st.rows.forEach((r) => {
	const k = r[0].trim();
	if (keys[k]) fail('chave repetida: ' + k);
	keys[k] = r;
	const vars0 = (r[1].match(/\{\w+\}/g) || []).sort().join();
	st.langs.forEach((l) => {
		const v = r[st.head.indexOf(l)];
		if (!v) fail(k + ': falta ' + l);
		else if ((v.match(/\{\w+\}/g) || []).sort().join() !== vars0) fail(k + ' (' + l + '): variáveis diferentes de ' + st.langs[0] + ' → ' + v);
	});
});

// chaves usadas no código
const used = {};
const src = {
	panel: fs.readFileSync(path.join(ext, 'js', 'panel.js'), 'utf8') + fs.readFileSync(path.join(ext, 'js', 'names.js'), 'utf8'),
	host: fs.readFileSync(path.join(ext, 'jsx', 'host.jsx'), 'utf8'),
	inst: fs.readFileSync(path.join(root, 'INSTALAR El PALLETERO.jsx'), 'utf8')
};
const add = (k, where) => { used[k] = used[k] || where; };
for (const m of src.panel.matchAll(/\bT\('([\w.-]+)'/g)) add(m[1], 'painel');
for (const m of src.panel.matchAll(/\bTn\('([\w.-]+)'/g)) { add(m[1] + '.one', 'painel'); add(m[1] + '.other', 'painel'); }
for (const m of src.panel.matchAll(/\{\{([\w.-]+)\}\}/g)) add(m[1], 'painel');
for (const m of src.host.matchAll(/PAL_T\('([\w.-]+)'/g)) add('host.' + m[1], 'host.jsx');
for (const m of src.inst.matchAll(/\bL\('([\w.-]+)'/g)) add('inst.' + m[1], 'instalador');
// chaves montadas no código
['ana', 'mono', 'comp', 'split', 'tri', 'tet', 'sq'].forEach((r) => add('rule.' + r, 'harmonia'));
add('lang.name', 'ajustes');
for (const m of src.host.matchAll(/\['exemplo-([\w-]+)'/g)) add('host.ex.' + m[1], 'host.jsx');

Object.keys(used).forEach((k) => { if (/\.$/.test(k)) return; if (!keys[k]) fail('falta no CSV: ' + k + ' (usada em ' + used[k] + ')'); });
Object.keys(keys).forEach((k) => { if (!used[k]) fail('sobrando no CSV (não usada): ' + k); });

// ------------------------------------------------------------ colors.csv
const co = table(path.join(ext, 'i18n', 'colors.csv'));
if (co.langs.join() !== st.langs.join()) fail('colors.csv e strings.csv com idiomas diferentes: ' + co.langs + ' × ' + st.langs);
co.langs.forEach((l) => {
	const i = co.head.indexOf(l), seen = {};
	co.rows.forEach((r) => {
		if (!/^#[0-9A-F]{6}$/i.test(r[0])) fail('hex inválido: ' + r[0]);
		if (!r[i]) fail('cor ' + r[0] + ': falta ' + l);
		else if (seen[r[i]]) fail('nome repetido em ' + l + ': ' + r[i]);
		seen[r[i]] = true;
	});
});

console.log('idiomas: ' + st.langs.join(', ') + ' · ' + Object.keys(keys).length + ' textos · ' + co.rows.length + ' nomes de cor');
if (bad) { console.log(bad + ' problema(s).'); process.exit(1); }
console.log('tudo certo.');
