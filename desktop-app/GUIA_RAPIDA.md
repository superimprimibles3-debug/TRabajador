# 🚀 Guía Rápida de Uso

## ¿Cómo ejecutar la aplicación?

### Método 1: Doble click en `Ejecutar.bat`
1. Busca el archivo `Ejecutar.bat` en esta carpeta
2. Haz doble click
3. ¡Listo! La app se abrirá

### Método 2: Desde terminal
```bash
cd "F:\Trabajador - (Multiplicador)\desktop-app"
python main.py
```

---

## ❓ ¿Qué pasa con la extensión del navegador?

### Opción A: **No usar la extensión** (Recomendado)

La aplicación desktop **reemplaza completamente** la extensión. Ya no necesitas:
- ❌ La extensión de Chrome
- ❌ Inyectar scripts en la página
- ❌ Depender del navegador

**Ventajas:**
- ✅ Funciona con cualquier navegador (Chrome, Firefox, Edge, Opera)
- ✅ No se rompe si el sitio cambia
- ✅ Más rápido y estable
- ✅ Independiente de la página web

### Opción B: **Usar ambos en paralelo** (Para comparar)

Puedes usar la extensión Y la app desktop al mismo tiempo para comparar:

**Extensión:**
- Maneja la lógica de apuestas
- Se conecta al backend Python

**Desktop App:**
- Solo captura multiplicadores
- Muestra overlay visual
- Envía datos al mismo backend

---

## 🔌 Conexión al Backend

### Estado Actual del Prototipo

La app desktop **NO está conectada al backend todavía**. Por ahora:

✅ **Funciona:**
- Overlay transparente
- Captura de pantalla
- OCR de multiplicadores
- Log en tiempo real
- Auto-click (opcional)

❌ **No funciona aún:**
- Envío de datos al backend Python
- Sincronización con base de datos
- Estrategias de apuesta automáticas

### Para conectar al backend (próximo paso):

Necesitarías agregar en `main.py`:

```python
def send_to_backend(self, multiplier):
    """Enviar multiplicador al backend"""
    try:
        response = requests.post(
            'http://localhost:5000/api/multiplier',
            json={'value': multiplier}
        )
        if response.ok:
            self.control_panel.log(f"✅ Enviado al backend: {multiplier}x")
    except Exception as e:
        self.control_panel.log(f"❌ Error backend: {e}")
```

---

## 🎯 Flujo Recomendado

### Para Probar el Prototipo (Ahora):

1. **Cierra la extensión** (o déjala, no interfiere)
2. **Ejecuta la app desktop**: `python main.py` o doble click en `Ejecutar.bat`
3. **Abre el juego Aviator** en tu navegador favorito
4. **Calibra la región** del multiplicador
5. **Inicia captura** y observa el log

### Para Producción (Futuro):

**Opción 1: Solo Desktop App**
```
Desktop App → Backend Python → Base de Datos
```
- La app captura multiplicadores
- Envía al backend
- Backend ejecuta estrategias
- Backend hace las apuestas (vía API del juego)

**Opción 2: Híbrido**
```
Desktop App → Captura multiplicadores
     ↓
Backend Python → Estrategias y lógica
     ↓
Extensión → Solo para hacer clicks en la página
```

---

## 📊 Comparación de Arquitecturas

### Arquitectura Actual (Extensión)
```
Extensión Chrome
    ↓
Captura desde DOM
    ↓
Envía a Backend Python
    ↓
Backend procesa
    ↓
Responde a extensión
    ↓
Extensión hace click
```

### Arquitectura Nueva (Desktop App)
```
Desktop App
    ↓
Captura desde pantalla (OCR)
    ↓
Procesa localmente
    ↓
(Opcional) Envía a Backend
    ↓
Desktop App hace click
```

**Diferencia clave:** La desktop app es **independiente** del navegador.

---

## 🛠️ Configuración Inicial

### Primera vez que ejecutas:

1. **Verifica Tesseract instalado:**
   - Debe estar en: `C:\Program Files\Tesseract-OCR\tesseract.exe`
   - Si no, descarga de: https://github.com/UB-Mannheim/tesseract/wiki

2. **Ejecuta la app:**
   ```bash
   python main.py
   ```

3. **Calibra:**
   - Click en "🎯 Calibrar Región"
   - Captura posición del multiplicador
   - Ajusta tamaño
   - Guarda

4. **Prueba:**
   - Click en "▶️ Iniciar Captura"
   - Observa el log
   - Verifica que detecta multiplicadores

---

## ⚙️ Configuración del Backend (Opcional)

Si quieres conectar al backend Python existente:

1. **Edita `config.json`** (se crea automáticamente):
```json
{
  "api": {
    "endpoint": "http://localhost:5000",
    "enabled": true
  }
}
```

2. **Asegúrate que el backend esté corriendo:**
```bash
cd "F:\Trabajador - (Multiplicador)\aviator-tracker\backend"
python app.py
```

3. **La app enviará datos automáticamente** (cuando implementemos esa función)

---

## 🎮 Uso Diario

### Rutina simple:

1. **Abre el juego** en tu navegador
2. **Ejecuta `Ejecutar.bat`**
3. **Click en "▶️ Iniciar Captura"**
4. **Deja que trabaje**
5. **Observa el log** para ver multiplicadores capturados

### Para detener:

1. Click en "⏹️ Detener Captura"
2. Cierra la ventana

---

## 💡 Preguntas Frecuentes

### ¿Necesito tener Chrome abierto?
No, funciona con cualquier navegador.

### ¿Necesito la extensión instalada?
No, la desktop app la reemplaza.

### ¿Funciona con múltiples monitores?
Sí, calibra en el monitor donde esté el juego.

### ¿Puedo usar ambos (extensión + desktop)?
Sí, pero no es necesario. La desktop app es suficiente.

### ¿Se conecta al backend automáticamente?
No todavía, es un prototipo. Esa función se agregará después.

---

## 🔄 Próximos Pasos

1. ✅ **Probar el prototipo** (captura y OCR)
2. ⏳ **Integrar con backend** (envío de datos)
3. ⏳ **Sincronizar con base de datos**
4. ⏳ **Implementar estrategias de apuesta**
5. ⏳ **Empaquetar como .exe** (para distribución fácil)

---

**¡Empieza probando el prototipo con `Ejecutar.bat`!** 🚀
