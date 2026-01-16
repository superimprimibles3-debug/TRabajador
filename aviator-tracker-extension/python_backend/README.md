# 🚀 Servidor Python Unificado - Aviator Tracker

## Descripción

Servidor Flask con integración PyQt5 que proporciona:
- ✨ **Calibración visual** con overlays nativos de pantalla completa
- 🎯 **Sistema de clicks** con movimientos humanos y jitter aleatorio
- 🔍 **OCR en tiempo real** con Tesseract
- 💾 **Base de datos SQLite** para persistencia
- 🧠 **Kernel V5.2** con 11 filtros de validación estratégica
- 📊 **Dashboard API** con estadísticas en tiempo real

---

## 🛠️ Instalación

### 1. Instalar dependencias

```bash
cd aviator-tracker-extension/python_backend
pip install -r requirements.txt
```

### 2. Instalar Tesseract OCR

**Windows:**
- Descargar desde: https://github.com/UB-Mannheim/tesseract/wiki
- Instalar en `C:\Program Files\Tesseract-OCR\`
- O crear archivo `tesseract_path.txt` con la ruta personalizada

---

## 🚀 Uso

### Iniciar servidor

```bash
python server.py
```

El servidor estará disponible en: `http://localhost:5000`

### Verificar estado

```bash
curl http://localhost:5000/status
```

---

## 📡 API Endpoints

### Calibración

#### Calibrar Botón
```http
POST /calibrate/button/<button_id>
Content-Type: application/json

{
  "target_points": 3
}
```

**Respuesta:**
```json
{
  "success": true,
  "points": [[x1, y1], [x2, y2], [x3, y3]],
  "count": 3
}
```

#### Calibrar Sistema Exponencial
```http
POST /calibrate/exponential/<sys_id>
Content-Type: application/json

{
  "target_points": 3
}
```

#### Calibrar Región OCR
```http
POST /calibrate/ocr
```

**Respuesta:**
```json
{
  "success": true,
  "region": {
    "x": 100,
    "y": 200,
    "width": 300,
    "height": 50
  }
}
```

### Clicks

#### Ejecutar Click
```http
POST /click/button/<button_id>
```

**Respuesta:**
```json
{
  "success": true
}
```

### OCR Control

#### Iniciar/Detener OCR
```http
POST /ocr/control
Content-Type: application/json

{
  "action": "start"  // o "stop"
}
```

#### Estado del OCR
```http
GET /ocr/status
```

**Respuesta:**
```json
{
  "running": true,
  "value": "2.45x",
  "region": {
    "x": 100,
    "y": 200,
    "width": 300,
    "height": 50
  }
}
```

#### Logs de OCR
```http
GET /ocr/logs
```

### Dashboard

#### Obtener Estadísticas
```http
GET /api/dashboard
```

**Respuesta:**
```json
{
  "session_id": 1,
  "target": 2.0,
  "counters": {
    "total_rounds": 150,
    "wins": 45,
    "losses": 15,
    "click_apostar": 60,
    "click_falso": 20,
    "click_exp": 10,
    "rounds_no_bet": 90
  },
  "filter": {
    "ok": true,
    "msg": "🎯 DISPARO OK"
  },
  "history": [2.45, 1.85, 3.20, ...]
}
```

### Configuración

#### Actualizar Target
```http
POST /api/config
Content-Type: application/json

{
  "target": 2.0
}
```

#### Nueva Sesión
```http
POST /api/new_session
```

### Reset

#### Resetear Calibración de Botón
```http
POST /reset/button/<button_id>
```

#### Resetear Calibración OCR
```http
POST /reset/ocr
```

---

## 🎨 Características Visuales

### Overlays de Calibración

Los overlays PyQt5 incluyen:
- **Fondo glassmorphism** con gradientes suaves
- **Animaciones de fade-in/fade-out**
- **Efectos de glow** en puntos capturados
- **Pulsos animados** al hacer click
- **Contador visual** con cambio de color
- **Instrucciones HTML** con formato rico

### Sistema de Clicks

- **Curvas de movimiento humanas** con easing
- **Jitter gaussiano** para naturalidad
- **Micro-variaciones** simulando temblor de mano
- **Duración variable** de presión del botón
- **Cluster randomization** de puntos calibrados

---

## 🔧 Configuración Avanzada

### Archivo config.json

El servidor genera automáticamente un archivo `config.json` con:

```json
{
  "calibration": {
    "multiplier_region": null,
    "button1_points": [],
    "button2_points": [],
    "exp1_points": [],
    "exp2_points": []
  },
  "ocr": {
    "interval_ms": 1000,
    "confidence_threshold": 0.7,
    "debug": false
  },
  "sniper": {
    "enabled": false,
    "target_multiplier": 2.0
  },
  "anti_afk": {
    "enabled": true,
    "interval_min": 2,
    "interval_max": 4
  }
}
```

---

## 🐛 Debugging

### Logs en Consola

El servidor muestra logs en tiempo real con códigos de color:
- 🟢 **SUCCESS** - Operaciones exitosas
- 🔵 **INFO** - Información general
- 🟡 **WARN** - Advertencias
- 🔴 **ERROR** - Errores

### Endpoint de Logs

```bash
curl http://localhost:5000/ocr/logs
```

---

## 📊 Base de Datos

### Estructura

**Tabla `rounds`:**
- `id` - ID autoincremental
- `session_id` - ID de sesión
- `multiplier` - Valor del multiplicador
- `timestamp` - Fecha y hora
- `click_type` - Tipo de click ('apostar', 'falso', 'exponencial')
- `result` - Resultado ('ganada', 'perdida')
- `target_used` - Target usado

**Tabla `calibration`:**
- `slot_id` - ID del slot (btn1, btn2, ocr, exp1, exp2)
- `coords` - Coordenadas en JSON

**Tabla `config`:**
- `key` - Clave de configuración
- `value` - Valor

---

## 🔐 Seguridad

- **CORS habilitado** para localhost
- **Threading seguro** con locks
- **Timeouts** en calibraciones (120s)
- **Validación** de parámetros
- **Manejo de errores** robusto

---

## 🚨 Troubleshooting

### Tesseract no encontrado
```
ERROR CRITICO: Tesseract OCR no encontrado.
```

**Solución:**
1. Instalar Tesseract desde https://github.com/UB-Mannheim/tesseract/wiki
2. O crear `tesseract_path.txt` con la ruta del ejecutable

### PyQt5 no funciona
```
ImportError: No module named 'PyQt5'
```

**Solución:**
```bash
pip install PyQt5>=5.15.0
```

### Puerto 5000 en uso
```
OSError: [Errno 98] Address already in use
```

**Solución:**
- Cerrar otros procesos en puerto 5000
- O cambiar puerto en `server.py` línea final

---

## 📝 Notas

- El servidor usa **threading** para manejar PyQt5 y Flask simultáneamente
- Las calibraciones se guardan en **3 lugares**: memoria, config.json, y SQLite
- El OCR usa **filtro de color rojo** para detectar multiplicadores
- Los clicks incluyen **jitter de ±4px** por defecto
- El sistema Anti-AFK se activa automáticamente cada 2-4 rondas

---

## 🎯 Integración con Extensión

La extensión de navegador se conecta automáticamente a `http://localhost:5000`.

Ver `sidepanel.js` línea 18:
```javascript
this.pythonServer = "http://localhost:5000";
```

---

## 📚 Referencias

- [PROJECT_MASTER_SPEC.md](../../PROJECT_MASTER_SPEC.md) - Especificaciones completas
- [PLAN_MASCARAS_PYTHON.md](../../PLAN_MASCARAS_PYTHON.md) - Plan de migración
- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) - Motor OCR
- [PyQt5 Docs](https://www.riverbankcomputing.com/static/Docs/PyQt5/) - Documentación PyQt5
