"""
⚠️ DEPRECADO - Este archivo ya no se usa ⚠️

El sistema de calibración PyQt5 ha sido integrado en el servidor unificado:
📍 Ubicación: aviator-tracker-extension/python_backend/server.py

Este servidor incluye:
✅ Calibración con overlays PyQt5 nativos
✅ OCR con Tesseract
✅ Base de datos SQLite
✅ Kernel V5.2 con filtros
✅ Dashboard API
✅ Sistema de clicks sigilosos mejorado

Para iniciar el servidor unificado:
1. cd aviator-tracker-extension/python_backend
2. python server.py

Endpoints disponibles:
- POST /calibrate/button/<id> - Calibrar botón con overlay PyQt5
- POST /calibrate/exponential/<id> - Calibrar sistema exponencial
- POST /calibrate/ocr - Calibrar región OCR
- POST /click/button/<id> - Ejecutar click
- POST /reset/button/<id> - Resetear calibración
- GET /api/dashboard - Obtener estadísticas
- POST /ocr/control - Controlar OCR (start/stop)
- GET /ocr/status - Estado del OCR
- GET /ocr/logs - Logs de debugging

Fecha de deprecación: 2026-01-10
"""

# Este archivo se mantiene solo para referencia histórica
# NO EJECUTAR - Usar server.py en python_backend/
