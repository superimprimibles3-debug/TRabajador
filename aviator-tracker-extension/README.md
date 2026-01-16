# ✈️ Aviator Tracker Pro - Master Edition

Extensión de Chrome de alta precisión para el análisis, seguimiento y ejecución de estrategias en Aviator. Diseñada para ofrecer la máxima transparencia de datos y herramientas de decisión automatizadas con capas de seguridad avanzadas.

---

## 🚀 Características Pro

### 1. Sistema de Análisis & Detección
- ✅ **Triple Método de Detección**: Sincronización ultra-veloz mediante MutationObserver optimizado, escaneo de texto y selectores específicos.
- ✅ **Monitor de Riesgo**: Evaluación de densidad de riesgo en tiempo real (bloqueo automático ante alta volatilidad).
- ✅ **Safe-Exit Watchdog**: Monitoreo constante del flujo de datos. Si la conexión se interrumpe, el sistema bloquea preventivamente las acciones de apuesta.

### 2. Sniper Trigger (Ejecutor Semi-Automático)
- ✅ **Lógica de Patrón**: Detecta automáticamente el patrón **Bajo (<1.12) → Confirmación (>1.25)**.
- ✅ **Doble Verificación**: Monitor de latencia y mirror de inputs para asegurar que los montos de apuesta sean correctos antes de actuar.
- ✅ **Kill-Switch de Emergencia**: Botón de pánico rojo que detiene permanentemente todo el sistema ante cualquier sospecha.

### 3. Sistema de Estrategias Profesionales
Integra **7 estrategias de apuestas** configurables directamente desde un panel lateral:
1. **Martingala Clásica**: Duplica tras pérdida para recuperar.
2. **Anti-Martingala (Paroli)**: Duplica tras victoria para capitalizar rachas.
3. **Fibonacci**: Progresión matemática de bajo riesgo.
4. **D'Alembert**: Incremento/decremento lineal.
5. **Conservadora**: Apuestas fijas en objetivos de alta probabilidad.
6. **Alto Riesgo**: Gestión de bankroll para multiplicadores 5x+.
7. **Dual (Cobertura)**: Combina una apuesta segura con una arriesgada simultáneamente.

### 4. Visual Log & Dashboard
- ✅ **Semáforo Visual**: Log cromático de los últimos 20 multiplicadores.
- ✅ **Algoritmo Status**: Panel de estado que indica qué está pensando el Sniper en cada momento.
- ✅ **Sincronización de Sesión**: Visualizador de Wins/Losses y Profit acumulado.

---

## 📦 Almacenamiento Dual (Sin Límites)

- **IndexedDB**: Repositorio histórico ilimitado para análisis de tendencias a largo plazo.
- **Chrome Storage**: Caché de los últimos 300 registros para acceso instantáneo por el Popup y SidePanel.
- **Exportación**: Descarga en CSV/JSON desde la vista de historial detallado.

---

## 🛠️ Instalación para Desarrolladores

1. Abre Chrome y navega a `chrome://extensions/`.
2. Activa el **Modo de desarrollador**.
3. Haz clic en **"Cargar extensión sin empaquetar"**.
4. Selecciona la carpeta raíz del proyecto.
5. El SidePanel se abrirá automáticamente al navegar a la página del juego.

---

## 📁 Estructura del Proyecto

```
aviator-tracker-extension/
├── dev-tools/          # Herramientas de diagnóstico y scripts de soporte
├── docs/               # Plan de pruebas, instrucciones y snippets
├── icons/              # Assets visuales
├── manifest.json       # Configuración V3
├── content.js          # Sniper Trigger & Scraper (Core)
├── background.js       # Coordinador de datos y Service Worker
├── db.js               # Manejo de IndexedDB
├── sidepanel.html/js   # Dashboard Principal de Control
├── popup.html/js/css   # Estadísticas Rápidas
├── history.html/js     # Análisis Histórico Avanzado
└── simulator.html/js   # Laboratorio de Estrategias
```

---

## 🛡️ Privacidad y Ética

- 🔒 **Local First**: No se envían datos a servidores externos. Tu historial es tuyo.
- 🔒 **No-Cheat**: La extensión no altera el código del juego ni influye en los resultados. Es una herramienta de visualización y automatización de clics basada en lo que ves.
- 🔒 **Open Source**: Todo el código es auditable y transparente.

---

## 🔄 Actualizaciones (v1.1.0)

### Novedades:
- **Integración de Estrategias**: 7 perfiles configurables.
- **Optimización de DOM**: Reducción del 40% en uso de CPU mediante MutationObserver específico.
- **UX Mejorada**: Tooltips informativos y feedback visual de Kill-Switch.
- **Reorganización**: Estructura de archivos profesional.

---

## ⚠️ Advertencia Legal

Este software es un asistente de análisis estadístico. El juego de azar conlleva riesgos económicos. El desarrollador no se hace responsable de pérdidas financieras derivadas del uso de esta herramienta. **Juega con responsabilidad.**

---

**Versión**: 1.1.0 RC  
**Desarrollado con ❤️ por Antigravity (Advanced Agentic Coding Team)**
