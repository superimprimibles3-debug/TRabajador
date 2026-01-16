$WshShell = New-Object -comObject WScript.Shell
$Desktop = [Environment]::GetFolderPath("Desktop")

# Función para crear acceso directo con auto-elevación
function Create-AdminShortcut {
    param (
        [string]$ShortcutName,
        [string]$TargetScript,
        [string]$Description,
        [string]$IconPath = "shell32.dll,43" # Icono por defecto (estrella/favorito)
    )

    $ShortcutPath = Join-Path $Desktop $ShortcutName
    $Shortcut = $WshShell.CreateShortcut($ShortcutPath)
    
    # El truco: Lanzar PowerShell, que a su vez lanza OTRO PowerShell como admin
    $Shortcut.TargetPath = "powershell.exe"
    
    # Argumentos complejos para asegurar elevación
    # Start-Process powershell -Verb RunAs ...
    $cleanPath = $TargetScript -replace "'", "''"
    $args = "-WindowStyle Hidden -Command ""Start-Process powershell.exe -Verb RunAs -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File ''$cleanPath'''"""
    
    $Shortcut.Arguments = $args
    $Shortcut.Description = $Description
    $Shortcut.IconLocation = $IconPath
    $Shortcut.Save()
    
    Write-Host "Acceso directo creado: $ShortcutName" -ForegroundColor Green
}

$baseDir = "d:\Trabajador\aviator-tracker-extension"

# 1. Shortcut Optimizador (Icono de chip/rayo)
Create-AdminShortcut `
    -ShortcutName "⚡ OPTIMIZAR PC (Modo Juegos).lnk" `
    -TargetScript "$baseDir\optimize_ultimate.ps1" `
    -Description "Libera RAM y Acelera el PC" `
    -IconPath "shell32.dll,238" # Icono de acción/rayo

# 2. Shortcut Restaurar (Icono de deshacer)
Create-AdminShortcut `
    -ShortcutName "🔙 RESTAURAR PC (Fabrica).lnk" `
    -TargetScript "$baseDir\restore_pc.ps1" `
    -Description "Deshacer todos los cambios" `
    -IconPath "shell32.dll,239" # Icono de refrescar/undo

Write-Host "Accesos directos creados en el Escritorio."
