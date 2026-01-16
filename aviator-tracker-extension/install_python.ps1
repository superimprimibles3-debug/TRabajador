$installer = "$env:TEMP\python-installer.exe"
Write-Host "Descargando Python 3.12..."
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
try {
    Invoke-WebRequest -Uri "https://www.python.org/ftp/python/3.12.1/python-3.12.1-amd64.exe" -OutFile $installer
} catch {
    Write-Error "Error al descargar: $_"
    exit
}

Write-Host "Instalando Python (esto puede tardar unos minutos, por favor espera)..."
$proc = Start-Process -FilePath $installer -ArgumentList "/quiet InstallAllUsers=1 PrependPath=1" -Wait -PassThru
if ($proc.ExitCode -eq 0) {
    Write-Host "¡Instalación exitosa!"
} else {
    Write-Host "La instalación terminó con código: $($proc.ExitCode)"
}

Remove-Item $installer
