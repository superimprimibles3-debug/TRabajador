<#
.SYNOPSIS
    Script de RESTAURACION para deshacer cambios de optimizacion.
    
.DESCRIPTION
    Este script revierte los cambios hechos por optimize_ultimate.ps1.
    1. Vuelve a habilitar SysMain y Windows Search.
    
.NOTES
    Requiere permisos de ADMINISTRADOR.
#>

# Verificar permisos de Administrador
if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Warning "Este script necesita permisos de Administrador!"
    Write-Warning "Por favor, ejecutalo como Administrador."
    Start-Sleep -Seconds 3
    Exit
}

Clear-Host
Write-Host "==========================================" -ForegroundColor Magenta
Write-Host "   RESTAURAR PC - MODO FABRICA" -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Magenta
Write-Host "..."

# 1. RESTAURAR SERVICIOS
# ----------------------
Write-Host "[1/1] Restaurando Servicios de Windows..." -ForegroundColor Yellow

$services = @("SysMain", "WSearch", "Themes")
foreach ($srv in $services) {
    if (Get-Service $srv -ErrorAction SilentlyContinue) {
        Write-Host "   - Habilitando $srv..." -NoNewline
        Set-Service $srv -StartupType Automatic -ErrorAction SilentlyContinue
        Start-Service $srv -ErrorAction SilentlyContinue
        Write-Host " [OK]" -ForegroundColor Green
    }
}

Write-Host "`n==========================================" -ForegroundColor Magenta
Write-Host "   RESTAURACION COMPLETADA" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Magenta
Write-Host "Los servicios de Windows han vuelto a la normalidad."
Start-Sleep -Seconds 3
