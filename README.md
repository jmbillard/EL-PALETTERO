# 🧾 O PALETTERO *extensão* + *script*

🗨️ **pt-BR** ⚡ uma paleta de cores simples para o After Effects ⚡

## 🎨 extensão CEP (novo)

O PALETTERO agora também existe como **painel nativo** (CEP) para o After Effects 2022 ou mais recente.
Mesma ideia, interface nova: menos texto, mais ícones, animações em cada mudança de estado e dicas que aparecem só quando o mouse pode fazer alguma coisa.

> 🧪 **mockup interativo:** abra `mockup/O-PALETTERO-mockup.html` no navegador. É o mesmo código do painel, ligado a uma composição de mentira.

| ação | o que faz |
| --- | --- |
| `◖ clique` numa cor | aplica nos layers selecionados. Se houver **propriedades de cor selecionadas**, muda só elas; senão usa um efeito **Fill** (e reaproveita o último Fill criado pelo painel em vez de empilhar). |
| `◗ botão direito` ou ✏️ | abre o editor, que nasce da própria amostra. Aceita colar `#hex`, `rgb` ou `hsb`. `Enter` aplica, `Esc` cancela. |
| arrastar | reordena as cores. |
| `Alt` | modo excluir: as amostras tremem, clique para remover. |
| `Ctrl` + clique | copia o valor (HEX, RGB ou HSB). |
| ➕ | nova cor. |
| conta-gotas | captura as cores da seleção (propriedades → layers). Com `Shift`, do **projeto inteiro**. |
| ⇅ | ordena por matiz → luminosidade → saturação (cinzas no fim). |
| ⋯ | ajustes: formato dos valores, nomes, valores sempre visíveis, salvar/usar paleta padrão, **segurar** para limpar. |
| `Ctrl + Z` | desfaz qualquer mudança na paleta. Toda ação destrutiva mostra um "desfazer". |

O painel se reorganiza sozinho: **faixa** (largo e baixo), **lista** (estreito e alto) ou **grade** (espaçoso).
A paleta continua salva nos metadados do projeto (`xmp:Label`) e as preferências no mesmo `preferences.json` do script, então os dois convivem.
Ao trocar de projeto, o painel recarrega a paleta automaticamente.

### instalação

1. copie a pasta `cep/com.jmbillard.opalettero` para a pasta de extensões:
   - **Windows:** `%APPDATA%\Adobe\CEP\extensions\`
   - **macOS:** `~/Library/Application Support/Adobe/CEP/extensions/`
2. libere extensões não assinadas (uma vez só):
   - **Windows:** `reg add HKCU\Software\Adobe\CSXS.11 /v PlayerDebugMode /t REG_SZ /d 1 /f` (repita com `CSXS.12` para o AE 2025+)
   - **macOS:** `defaults write com.adobe.CSXS.11 PlayerDebugMode 1` (repita com `com.adobe.CSXS.12`)
3. reinicie o After Effects e abra **Janela → Extensões → O PALETTERO**.

> 🛠️ depuração: com o painel aberto, acesse `http://localhost:8099` no Chrome.\
> 🔁 depois de mudar o código do painel, rode `node tools/build-mockup.js` para atualizar o mockup.

```text
cep/com.jmbillard.opalettero/
├── CSXS/manifest.xml   → registro da extensão (AEFT 22+)
├── index.html          → painel
├── css/panel.css       → visual + animações
├── js/color.js         → conversões de cor
├── js/bridge.js        → ponte painel ↔ ExtendScript (ou mock no navegador)
├── js/panel.js         → estado, interações e animações
└── jsx/host.jsx        → lado After Effects: paleta no XMP, aplicar, capturar
```

<br>

---

<br>

## 📜 script (versão clássica)

> 📂 **arquivos:**\
> • **O PALETEIRO beta.jsx** → aquivo que deve ser executado ou instalado no after effects.\
> • **O_PALETTERO_SOURCE_beta.jsxbin** → arquivo que contém o binário do script.

esse script ainda está em fase *beta*, então, em caso de bugs, sugestões e ajuda, é só chamar...

<br>

---

<br>

> 📟 *interface da paleta:*
>
> ![ui](docs/images/ui_1.png)

a interface é responsiva e exibirá todas as informações da forma mais eficiente possível.

- **botão +**:\
`◖ clique esquerdo` → adiciona um nova cor.\
`◗ clique direito` → adiciona todas as cores de qualquer propriedade ou efeito de todos os layers selecionados.\
`Ctrl + ◗ clique direito` → limpa a paleta e adiciona todas as cores de qualquer propriedade ou efeito do projeto.
  >

> 🚩 *obs:*\
> • caso não exista uma propriedade ou efeito selecionado, ou a cor do mesmo já exista na paleta, o botão + abrirá o editor de cores.

<br><br>

- **botão ⇅**:\
`◖ clique esquerdo` → puxa a paleta do projeto.\
`◗ clique direito` → ordena a paleta, usando os critérios: *1 - matiz*, *2 - brilho*, *3 - saturação*.\
`Alt + ◗ clique direito` → excluir todas as cores da paleta.
  >

> 🚩 *obs:*\
> • as paletas são salvas dentro dos metadados do projeto.\
> • caso não exista nenhuma paleta salva no projeto, as cores iniciais serão puxadas.

<br><br>

- **botões de cor**:\
`◖ clique esquerdo` → aplica o efeito **Fill** em todos os layers selecionados.\
`◗ clique direito` → editar a cor clicada.\
`Alt + ◗ clique direito` → excluir a cor clicada.
  >

<br>

---

<br>

> 📟 *interface do editor de cores:*
>
> ![ui](docs/images/ui_2.png)

- **cancelar**:\
`◖ clique esquerdo` → cancela a alteração ou adição da cor atual.

- **aplicar**:\
`◖ clique esquerdo` → aplica a alteração ou adição da cor atual.

<br>

---

<br>

> 📟 *interface do editor de cores:*
>
> ![ui](docs/images/ui_3.png)

**EXIBIR**:

- **botão 𝒊**:\
`◖ clique esquerdo` → abre a documentação do script no repositório do GitHub.
- **informação de cor** → habilita / desabilita a exibição de textos nas amostras de cor.
- **nome personalizado** → habilita / desabilita a exibição do nome da cor.
- **#HEX**, **RGB**, **HSB** → exibem seus respectivos valores nas amostras de cor.

> 🚩 *obs:*\
> • as alterações feitas nessa seção são salvas automaticamente.

<br><br>

**PALETA**:

- **definir como paleta padrão** → define a lista de cores ao lado como a paleta padrão.

> 🚩 *obs:*\
> • a paleta padrão é sempre puxada caso não exista nenhuma paleta salva no projeto o clicar no botão ' *⇅* '.

<br><br>

**CORES**:

- **botão ⇅**:\
`◖ clique esquerdo` → puxa a paleta do projeto.\
`◗ clique direito` → ordena a paleta, usando os critérios: *1 - matiz*, *2 - brilho*, *3 - saturação*.\
`Alt + ◗ clique direito` → excluir todas as cores da paleta.
  >

- **botão +**:\
`◖ clique esquerdo` → adiciona um nova cor.\
  >

- **botões de cor**:\
`◖ clique esquerdo` → editar a cor clicada.
  >

- **nomes de cor**:\
`◖ clique esquerdo` → editar o nome clicado.
  >

- **X**:\
`◖ clique esquerdo` → remove a cor da lista.

> 🚩 *obs:*\
> • as alterações feitas nessa seção só serão salvas após clicar no botão '*salvar paleta*'.

<br><br>

**BOTÕES**:

- **cancelar**:\
`◖ clique esquerdo` → cancela o salvamento da paleta no projeto.

- **salvar paleta**:\
`◖ clique esquerdo` → salva a paleta no projeto.
