#!/bin/bash
# El PALLETERO - instalador da extensão CEP para After Effects (macOS)
# Copia a pasta cep/com.jmbillard.elpalletero para a pasta de extensões do usuário,
# remove a versão com o nome antigo (O PALETTERO) e habilita extensões não assinadas (PlayerDebugMode).
# Baseado no instalador do ABRIDOR.

SRC="$(cd "$(dirname "$0")" && pwd)/cep/com.jmbillard.elpalletero"
EXT="$HOME/Library/Application Support/Adobe/CEP/extensions"
DEST="$EXT/com.jmbillard.elpalletero"

if [ ! -f "$SRC/CSXS/manifest.xml" ]; then
	echo "Pasta cep/com.jmbillard.elpalletero não encontrada ao lado deste arquivo."
	exit 1
fi

echo "Habilitando extensões não assinadas..."
for v in 9 10 11 12 13; do
	defaults write "com.adobe.CSXS.$v" PlayerDebugMode 1
done

if [ -d "$EXT/com.jmbillard.opalettero" ]; then
	echo "Removendo a versão com o nome antigo (O PALETTERO)..."
	rm -rf "$EXT/com.jmbillard.opalettero"
fi

echo "Copiando para $DEST ..."
rm -rf "$DEST"
mkdir -p "$EXT"
cp -R "$SRC" "$DEST"
find "$DEST" -name ".DS_Store" -delete

echo
echo "Pronto! Reinicie o After Effects e abra: Window > Extensions > El PALLETERO"
echo "Se não aparecer, reinicie o computador."
