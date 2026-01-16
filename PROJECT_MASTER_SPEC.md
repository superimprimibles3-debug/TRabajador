# 🏆 PROJECT MASTER SPEC: Aviator Tracker v5.5

## 1. Misión y Arquitectura
Este documento es la **fuente de verdad definitiva**. El sistema opera con un **Cerebro Backend (Python)** para OCR y lógica, y un **Sidepanel (Frontend)** para control y monitoreo.

---

## 2. El Corazón del Sistema: OCR & Captura
*Propósito: Transformar la imagen del juego en datos puros con precisión milimétrica.*

### Elementos:
- **Zona de Captura**: Rectángulo `(x, y, w, h)` definido por el usuario.
- **Pre-procesado**: Filtro rojo, escala de grises, contraste 2.0x.
- **Motor Tesseract**: Configurado en modo `--psm 7` (Single Line).
- **Preview Real-Time**: Ventana que muestra la imagen que "ve" Python.

### Optimizaciones:
- **Adaptive FPS**: Si el valor no cambia durante 10 segundos, bajar frecuencia de 1Hz a 0.5Hz para ahorrar recursos.
- **Pixel Jitter (Sigilo)**: Mover el área de captura 1-2px al azar en cada toma para evitar firmas de captura idénticas.

---

## 3. Dashboard: Los 8 Contadores Maestros
*Propósito: Visualización instantánea del rendimiento de la sesión.*

### Elementos:
1. **Rondas Totales**: Suma de todas las rondas capturadas.
2. **Partidas**: Sesión actual (incremental).
3. **Clicks Apostar**: Disparos exitosos del Sniper.
4. **Clicks Falsa Apuesta**: Presencia (Anti-AFK).
5. **Clicks Exponenciales**: Disparos del Sistema 2.
6. **Wins**: Rondas con click donde `OCR >= Target`.
7. **Losses**: Rondas con click donde `OCR < Target`.
8. **Rondas sin apostar**: Rondas sin acción registrada.
- **Health Indicators**: Luces LED de estado (Servidor, DOM, Iframe).

### Optimizaciones:
- **Optimistic UI**: Incrementar el contador en el panel en cuanto se da la orden de click, sin esperar a la confirmación de la DB.
- **Color Coded Thresholds**: Cambiar color de los contadores (Verde/Rojo) según el porcentaje de acierto en tiempo real.

---

## 4. Calibración Independiente (Multi-Punto)
*Propósito: Enseñar al sistema dónde tocar de forma humana e indetectable.*

### Elementos:
- **Botón 1 (Apostar/Falso)**: Recolecta múltiples puntos `(x, y)`.
- **Botón 2 (Exponencial)**: Punto de disparo sistema Post-Win.
- **Botón 3 (Reload)**: Punto de emergencia para F5.
- **Máscara Invisible**: Capa táctil sin carteles invasivos.

### Optimizaciones:
- **Cluster Randomization**: Al disparar, Python elige un punto al azar de la lista y le añade un "jitter" de +/- 3px para que nunca el click sea en el mismo lugar físico.
- **Input Cleanup**: Eliminar cualquier rastro de la máscara en el DOM 100ms después de calibrar.

---

## 5. Inteligencia Estratégica: Kernel V5.2
*Propósito: Validar el estado del juego antes de arriesgar capital.*

### Elementos (11 Filtros):
1. **Canal Central** (1.65-2.85).
2. **Continuidad** (>1.25).
3. **Densidad Roja** (Máx 1 < 1.30 en 5r).
4. **Anti-Rosa** (Bloqueo si >40x en 10r).
5. **Soporte** (50% > 1.50).
... (ver detalle en sección técnica).

### Optimizaciones:
- **Decision Matrix Cache**: El backend mantiene la decisión pre-calculada basándose en las últimas 5 rondas para que el tiempo de ejecución tras el OCR sea de < 5ms.

---

## 6. Sistema Anti-AFK (Falsa Apuesta)
*Propósito: Evitar que el casino desconecte al usuario por inactividad.*

### Elementos:
- **Intervalo Aleatorio**: Entre 2 y 4 rondas (dado interno).
- **Secuencia Bet-Cancel**: Dos clicks coordinados en el Botón 1.
- **Mecanismo de Bloqueo**: Se cancela automáticamente si el Sniper detecta una entrada inminente.

### Optimizaciones:
- **Ping Mitigation**: Si se detecta lag > 200ms, aumentar el tiempo entre el click de "Bet" y "Cancel" para asegurar que la orden llegue al servidor del juego.

---

## 7. Sección Base de Datos (Auditoría)
*Propósito: Registro legal y persistente de todas las acciones.*

### Elementos:
- **Tabla Histórica**: Columnas P/R, Multi, Click, Result, Hora.
- **Export UI**: Botón de descarga TXT/CSV.
- **Clear DB**: Opción de borrado seguro.

### Optimizaciones:
- **Lazy Loading**: El panel solo carga las últimas 20 entradas por defecto, cargando el resto solo si el usuario hace scroll hacia abajo para evitar lentitud.

---

## 8. Bypass y Seguridad
*Propósito: Mantener el sistema corriendo 24/7 sin intervención humana.*

### Elementos:
- **Dialog Closer**: Scanner de popups (Error, Inactividad).
- **Alertas Sonoras**: 3 frecuencias distintas (Sniper, Bypass, Test).

### Optimizaciones:
- **MutationObserver Profiling**: Usar un observador de cambios en el DOM optimizado para buscar IDs específicos de error en lugar de recorrer todo el árbol cada milisegundo.

---

## 9. Diseño Visual & Estética (Premium Look & Feel)
El panel no solo es funcional, sino que ofrece una experiencia visual de alta tecnología ("WOW effect"):

### 💎 Estilo Visual
- **Glassmorphism**: Fondo oscuro semi-transparente con desenfoque (`backdrop-filter: blur(8px)`) para una sensación de profundidad.
- **Paleta de Colores Neon**: Azul Eléctrico (`#3b82f6`), Verde Esmeralda (`#10b981`), Rojo Rubí (`#ef4444`).
- **Modern Typography**: Fuenta **Inter** para la UI y **JetBrains Mono** para los valores digitales.

### 🎬 Animaciones y Micro-interacciones
- **Glow Pulse**: Luces de estado con brillo pulsante.
- **Counters Roll**: Animación de conteo rápido al actualizar valores.
- **Alert Overlays**: Destellos visuales en los bordes ante eventos críticos.
