@echo off
REM El PALLETERO - instalador da extensao CEP para After Effects (Windows)
REM Copia a pasta cep\com.jmbillard.elpalletero para a pasta de extensoes do usuario,
REM remove a versao com o nome antigo (O PALETTERO) e habilita extensoes nao assinadas (PlayerDebugMode).
REM Baseado no instalador do ABRIDOR.

setlocal
set "SRC=%~dp0cep\com.jmbillard.elpalletero"
set "EXT=%APPDATA%\Adobe\CEP\extensions"
set "DEST=%EXT%\com.jmbillard.elpalletero"

if not exist "%SRC%\CSXS\manifest.xml" (
	echo Pasta cep\com.jmbillard.elpalletero nao encontrada ao lado deste arquivo.
	pause
	exit /b 1
)

echo Habilitando extensoes nao assinadas...
for %%V in (9 10 11 12 13) do (
	reg add "HKCU\Software\Adobe\CSXS.%%V" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul
)

if exist "%EXT%\com.jmbillard.opalettero" (
	echo Removendo a versao com o nome antigo ^(O PALETTERO^)...
	rmdir /s /q "%EXT%\com.jmbillard.opalettero"
)

echo Copiando para "%DEST%"...
if exist "%DEST%" rmdir /s /q "%DEST%"
xcopy "%SRC%" "%DEST%\" /e /i /q /y >nul

echo.
echo Pronto! Reinicie o After Effects e abra: Window ^> Extensions ^> El PALLETERO
pause
