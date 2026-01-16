# Aviator Tracker Desktop

Aplicación de escritorio para captura automática de multiplicadores del juego Aviator.

## Características

- 🎯 **Overlay transparente**: Máscara visual sobre cualquier navegador
- 📸 **Captura de pantalla**: Captura rápida de regiones específicas
- 🔍 **OCR avanzado**: Extracción de multiplicadores con Tesseract
- 🖱️ **Auto-click**: Automatización de apuestas (opcional)
- ⚙️ **Configuración persistente**: Guarda calibración y preferencias
- 🌐 **Independiente del navegador**: Funciona con Chrome, Firefox, Edge, etc.

## Requisitos

- Python 3.10+
- Tesseract OCR instalado en el sistema
- Windows 10/11

## Instalación

1. **Instalar Tesseract OCR**:
   - Descargar desde: https://github.com/UB-Mannheim/tesseract/wiki
   - Instalar en: `C:\Program Files\Tesseract-OCR\`

2. **Instalar dependencias de Python**:
   ```bash
   cd "F:\Trabajador - (Multiplicador)\desktop-app"
   pip install -r requirements.txt
   ```

## Uso

1. **Ejecutar la aplicación**:
   ```bash
   python main.py
   ```

2. **Calibrar región de captura**:
   - Click en "🎯 Calibrar Región"
   - Click en "🖱️ Capturar Posición del Mouse"
   - Espera 3 segundos y mueve el mouse a la esquina superior izquierda del multiplicador
   - Ajusta ancho y alto según sea necesario
   - Click en "✅ Guardar"

3. **Iniciar captura**:
   - Click en "▶️ Iniciar Captura"
   - El overlay mostrará la región siendo capturada
   - Los multiplicadores aparecerán en el log

4. **Configuración**:
   - **Intervalo de captura**: Frecuencia de captura (ms)
   - **Confianza mínima**: Umbral de confianza para aceptar resultados
   - **Mostrar Overlay**: Mostrar/ocultar máscara visual
   - **Auto-Click**: Habilitar clicks automáticos

## Estructura del Proyecto

```
desktop-app/
├── main.py                 # Punto de entrada
├── requirements.txt        # Dependencias
├── config.json            # Configuración (generado automáticamente)
├── ui/
│   ├── control_panel.py   # Panel de control principal
│   ├── overlay_window.py  # Ventana de overlay transparente
│   └── calibration_dialog.py  # Diálogo de calibración
└── core/
    ├── config_manager.py  # Gestor de configuración
    ├── screen_capture.py  # Captura de pantalla
    ├── ocr_engine.py      # Motor OCR
    └── auto_clicker.py    # Sistema de auto-click
```

## Atajos de Teclado

- **Ctrl+C** en la terminal: Cerrar aplicación

## Troubleshooting

### "Error cargando Tesseract"
- Verifica que Tesseract esté instalado en `C:\Program Files\Tesseract-OCR\`
- O actualiza la ruta en `config.json` → `ocr.tesseract_path`

### "Baja confianza en OCR"
- Ajusta la región de calibración para capturar solo el multiplicador
- Aumenta el tamaño de la región si el texto se ve cortado
- Reduce el umbral de confianza mínima

### "Overlay no visible"
- Verifica que "Mostrar Overlay" esté marcado
- El overlay es transparente, busca el rectángulo verde

## Próximas Características

- [ ] Integración con backend Python (API)
- [ ] Estrategias de apuesta configurables
- [ ] Historial de capturas
- [ ] Estadísticas en tiempo real
- [ ] Exportar a .exe standalone

## Licencia

Uso personal
