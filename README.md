# 🧾 O PALETTERO *extensão* + *script*

🗨️ **pt-BR** ⚡ uma paleta de cores simples para o After Effects ⚡

## 🎨 extensão CEP (novo)

O PALETTERO agora também existe como **painel nativo** (CEP) para o After Effects 2022 ou mais recente.
Mesma ideia, interface nova: menos texto, mais ícones, animações em cada mudança de estado e dicas que aparecem só quando o mouse pode fazer alguma coisa.

> 🧪 **mockup interativo:** abra `mockup/O-PALETTERO-mockup.html` no navegador. É o mesmo código do painel, ligado a uma composição de mentira.

> ⌨️ as teclas abaixo estão como no **Windows**. No **Mac**: `Ctrl` → `⌘ Cmd`, `Alt` → `⌥ Option`, `Shift` → `⇧`. No Mac, `Ctrl` + clique continua sendo clique direito (abre o editor). As dicas do painel já mostram os símbolos do sistema em uso.

| ação | o que faz |
| --- | --- |
| `◖ clique` numa cor | aplica nos layers selecionados. Se houver **propriedades de cor selecionadas**, muda só elas; senão usa um efeito **Fill** (e reaproveita o último Fill criado pelo painel em vez de empilhar). |
| `◗ botão direito` ou ✏️ | abre o editor, que nasce da própria amostra. Aceita colar `#hex`, `rgb` ou `hsb`. `Enter` aplica, `Esc` cancela. |
| arrastar | reordena as cores. |
| `Alt` | modo excluir: as amostras tremem, clique para remover. |
| `Ctrl` + clique | copia o valor (HEX, RGB ou HSB). |
| ➕ | nova cor. |
| conta-gotas | captura as cores da seleção (propriedades → layers). Com `Shift`, do **projeto inteiro**. |
| 🖼️ imagem | extrai as cores principais do **frame atual do layer selecionado** (imagem, vídeo ou precomp; sem layer, usa a comp). Clique nas amostras para ligar/desligar, `−`/`+` muda a quantidade e clicar na imagem pega a cor daquele ponto. |
| 📚 presets | biblioteca de paletas. Clique **substitui** a paleta do projeto, `Shift` + clique **adiciona**; ✏️ renomeia, ★ define o preset usado em projetos sem paleta, 🗑️ exclui (com desfazer). O botão de pasta troca a pasta dos presets (`Alt` abre no sistema). |
| ⋯ | ajustes: formato dos valores, nomes, valores sempre visíveis, ordenar por matiz, **segurar** para limpar. |
| `Ctrl + Z` | desfaz qualquer mudança na paleta. Toda ação destrutiva mostra um "desfazer". |

O painel se reorganiza sozinho: **faixa** (largo e baixo), **lista** (estreito e alto) ou **grade** (espaçoso).
Ao trocar de projeto, o painel recarrega a paleta automaticamente.

**nomes automáticos** → cada cor recebe um nome em português (*menta*, *tijolo*, *céu*, *berinjela*…), escolhido pela cor de referência mais próxima. Nomes repetidos viram um vizinho parecido ou ganham *suave*/*forte*. No editor, o nome acompanha a cor enquanto você mexe; ao digitar um nome seu ele fica fixo, e o ✦ devolve o automático.

**paleta do projeto × presets**

- a **paleta do projeto** fica num grupo de metadados próprio dentro do `.aep` (namespace `https://github.com/jmbillard/O-PALETTERO/ns/1.0/`, propriedades `palette`, `preset`, `version`, `updated`). Paletas antigas salvas pelo script em `xmp:Label` são lidas uma vez e migram no primeiro salvamento; o painel não grava mais em `xmp:Label`.
- os **presets** são arquivos `.json` (um por preset) numa pasta configurável, por padrão `O PALETTERO script/presets` dentro da pasta de dados do usuário. Apontar para uma pasta de rede deixa a equipe inteira com a mesma biblioteca.
- projetos sem paleta mostram o preset marcado com ★ (ou a paleta embutida).

### instalação

1. copie a pasta `cep/com.jmbillard.opalettero` para a pasta de extensões:
   - **Windows:** `%APPDATA%\Adobe\CEP\extensions\`
   - **macOS:** `~/Library/Application Support/Adobe/CEP/extensions/`
2. libere extensões não assinadas (uma vez só):
   - **Windows:** `reg add HKCU\Software\Adobe\CSXS.11 /v PlayerDebugMode /t REG_SZ /d 1 /f` (repita com `CSXS.12` para o AE 2025+)
   - **macOS:** `defaults write com.adobe.CSXS.11 PlayerDebugMode 1` (repita com `com.adobe.CSXS.12`)
   - no Mac, se o painel não aparecer depois disso, rode `killall cfprefsd` (o macOS guarda as preferências em cache) e abra o AE de novo.
3. reinicie o After Effects e abra **Janela → Extensões → O PALETTERO** (no Mac: **Window → Extensions** se o AE estiver em inglês).

### windows × mac

| | Windows | macOS |
| --- | --- | --- |
| pasta de extensões | `%APPDATA%\Adobe\CEP\extensions\` (só o seu usuário) ou `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\` (todos) | `~/Library/Application Support/Adobe/CEP/extensions/` ou `/Library/Application Support/Adobe/CEP/extensions/` |
| preferências e presets | `%APPDATA%\O PALETTERO script\` | `~/Library/Application Support/O PALETTERO script/` |
| pasta de presets em rede | caminho UNC (`\\servidor\paletas`) ou unidade mapeada | volume montado (`/Volumes/paletas`) |
| frame temporário | `%TEMP%\opalettero_*.png` | pasta temporária do sistema |

- o painel pede ao After Effects as teclas que usa (`Esc`, `Enter`, `Delete`, setas, `Ctrl/⌘ + Z`…) enquanto está em foco, com os códigos de tecla de cada sistema. Assim `Ctrl/⌘ + Z` desfaz a paleta, e não o projeto, e `Delete` não apaga layers.
- no Windows, um PNG que ainda está aberto não pode ser apagado; o que sobrar é limpo na próxima extração.
- um mesmo preset funciona nos dois sistemas: são arquivos `.json` em UTF-8 com nomes só em ASCII.

**pasta de presets em rede** (lógica adaptada do *O PADEIRO*)

- ao escolher a pasta, o painel guarda o caminho desta máquina e também uma forma neutra de rede (`//servidor/share/pasta`). A tradução é descoberta na hora, sem lista fixa de servidores:
  - **Windows:** uma unidade mapeada (`L:\paletas`) vira o caminho de rede lendo o `net use`.
  - **Mac:** um volume (`/Volumes/VFX-1/paletas`) vira o caminho de rede lendo o `mount`.
- ao abrir, a forma de rede é convertida para o caminho que existe agora:
  - **Windows:** usa a letra de unidade, se houver uma mapeada; senão, o UNC.
  - **Mac:** usa o volume montado com aquele servidor/share. Isso cobre subpastas montadas como volume, nomes com espaço e o servidor com nome curto ou completo.
- no Mac, se o share foi montado de novo como `VFX-1` … `VFX-5`, o painel encontra a variante certa.
- se o volume não estiver montado ou a unidade estiver desconectada, o painel **não cria nada**. A biblioteca mostra o aviso com **Montar** (Mac), **tentar de novo** e **usar a pasta local**, e tenta de novo sozinha quando o painel volta a ter foco.

> 🧩 o painel usa o Node.js do CEP (`--enable-nodejs`) só para ler o PNG do frame. O frame é gerado com `saveFrameToPng`, um método que existe no After Effects mas não está na documentação oficial.\
> 🛠️ depuração: com o painel aberto, acesse `http://localhost:8099` no Chrome.\
> 🔁 depois de mudar o código do painel, rode `node tools/build-mockup.js` para atualizar o mockup.

```text
cep/com.jmbillard.opalettero/
├── CSXS/manifest.xml   → registro da extensão (AEFT 22+)
├── index.html          → painel
├── css/panel.css       → visual + animações
├── js/color.js         → conversões de cor (HSB, CIELAB…)
├── js/names.js         → nomes automáticos
├── js/extract.js       → extração de cores (k-means em CIELAB)
├── js/bridge.js        → ponte painel ↔ ExtendScript (ou mock no navegador)
├── js/panel.js         → estado, interações e animações
└── jsx/host.jsx        → lado After Effects: metadados, presets, aplicar, capturar, frames
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
