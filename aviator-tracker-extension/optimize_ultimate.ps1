<#
.SYNOPSIS
    Script de Optimizacion Extrema para PCs con poca RAM (2GB o menos).
    
.DESCRIPTION
    Este script realiza cambios agresivos para liberar memoria y priorizar 
    el rendimiento en primer plano. 
    1. Deshabilita Windows Search y SysMain.
    2. Limpia archivos temporales.
    3. Purga la memoria RAM (Working Set) de todos los procesos.
    4. Establece prioridad ALTA para procesos criticos (Python, Navegadores).
    
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
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   OPTIMIZADOR DE PC - MODO BAJA LATENCIA " -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "..."

# 1. GESTION DE SERVICIOS (Agresivo)
# ----------------------------------
Write-Host "[1/4] Optimizando Servicios de Windows..." -ForegroundColor Yellow

$services = @("SysMain", "WSearch", "Themes") # Themes es opcional, pero ayuda
foreach ($srv in $services) {
    if (Get-Service $srv -ErrorAction SilentlyContinue) {
        Write-Host "   - Deshabilitando $srv..." -NoNewline
        Stop-Service $srv -Force -ErrorAction SilentlyContinue
        Set-Service $srv -StartupType Disabled -ErrorAction SilentlyContinue
        Write-Host " [OK]" -ForegroundColor Green
    }
}

# 2. LIMPIEZA DE ARCHIVOS
# -----------------------
Write-Host "[2/4] Limpiando Archivos Temporales..." -ForegroundColor Yellow

$folders = @(
    $env:TEMP,
    "C:\Windows\Temp",
    "C:\Windows\Prefetch"
)

foreach ($folder in $folders) {
    if (Test-Path $folder) {
        Get-ChildItem -Path $folder -Recurse -Force -ErrorAction SilentlyContinue | 
            Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    }
}
Write-Host "   - Temporales eliminados." -ForegroundColor Green

# 3. OPTIMIZACION DE MEMORIA (RAM WIPER)
# --------------------------------------
Write-Host "[3/4] Purgando Memoria RAM..." -ForegroundColor Yellow

# Definimos la funcion C# para llamar a EmptyWorkingSet
$code = @"
using System;
using System.Runtime.InteropServices;
public class MemoryCleaner {
    [DllImport("psapi.dll")]
    public static extern int EmptyWorkingSet(IntPtr hwProc);
}
"@

try {
    Add-Type -TypeDefinition $code -Language CSharp -ErrorAction SilentlyContinue
} catch {
    # Si ya esta cargado el tipo, ignoramos el error
}

$processes = Get-Process
$count = 0
foreach ($proc in $processes) {
    try {
        if ($proc.Handle) {
            [MemoryCleaner]::EmptyWorkingSet($proc.Handle) | Out-Null
            $count++
        }
    } catch { }
}
Write-Host "   - Memoria liberada en $count procesos." -ForegroundColor Green

# 4. PRIORIZACION DE PROCESOS (BOOST)
# -----------------------------------
Write-Host "[4/4] Acelerando Procesos Clave..." -ForegroundColor Yellow

# Lista de procesos a priorizar, incluye navegadores comunes y python
$targets = @("python", "node", "chrome", "msedge", "brave", "firefox")

foreach ($target in $targets) {
    $procs = Get-Process $target -ErrorAction SilentlyContinue
    foreach ($p in $procs) {
        try {
            $p.PriorityClass = [System.Diagnostics.ProcessPriorityClass]::High
            Write-Host "   - BOOST: $($p.Name) (PID: $($p.Id)) -> ALTA PRIORITY" -ForegroundColor Cyan
        } catch { }
    }
}

# 5. FLUSH NETWORK
# ----------------
ipconfig /flushdns | Out-Null

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "   OPTIMIZACION COMPLETADA CON EXITO" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Tu PC deberia sentirse mas rapida ahora."
Write-Host "Nota: Si reinicias, los servicios seguiran desactivados."
Write-Host "Usa 'restore_pc.ps1' si quieres deshacer los cambios."
Start-Sleep -Seconds 3
