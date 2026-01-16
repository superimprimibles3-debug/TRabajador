# 🎯 Plan: Sistema de Máscaras Python (Sin uso del DOM)

Este plan detalla cómo migrar el sistema de calibración y máscaras de la extensión de navegador hacia un sistema basado en **Python**, eliminando por completo la dependencia del DOM de la página web para la captura de coordenadas, pero manteniendo la interfaz de la extensión intacta.

---

## 🏗️ Nueva Arquitectura (Python-Native Masks)

En lugar de inyectar elementos HTML en la página del juego, la extensión se comunicará con el backend de Python para solicitar una "Capa de Calibración" nativa del sistema operativo.

1.  **Extensión (Sidepanel):** El usuario pulsa "Calibrar". La extensión no envía un mensaje al `content.js`, sino que hace una petición `fetch` al servidor Python local.
2.  **Backend (Python):** Al recibir la petición, Python abre una ventana transparente a pantalla completa (`PyQt5`) que detecta los clics del ratón.
3.  **Calibración:** El usuario hace clic en el botón del juego. Python captura la coordenada global de la pantalla.
4.  **Retorno:** Una vez finalizada la calibración (presionando ENTER), Python devuelve las coordenadas a la extensión vía JSON.
5.  **Ejecución:** Para realizar apuestas, la extensión solicita al backend que ejecute el clic en las coordenadas guardadas usando `PyAutoGUI`.

---

## 🛠️ Cambios en el Proyecto

### 1. Backend Python (`/backend`)
*   **`overlay_manager.py`**: Gestionará las ventanas transparentes de PyQt5 para la calibración de botones y de la zona OCR.
*   **`calibration_service.py`**: Nuevos endpoints en Flask:
    *   `/calibrate/button/<id>`: Activa el overlay de Python.
    *   `/click/button/<id>`: Ejecuta el clic aleatorio con jitter.
*   **`app.py`**: Integración de los nuevos servicios.

### 2. Extensión de Navegador (`/aviator-tracker-extension`)
*   **`sidepanel.js`**: Se modifican las funciones de calibración para que invoquen al API de Python en lugar de enviar mensajes al script de contenido.
*   **`content.js`**: Ya no será necesario para crear máscaras visuales (se puede mantener solo para lectura de datos si es necesario, o eliminar la lógica de máscaras).

---

## ✅ Ventajas del Enfoque
*   **Indetectable por el Juego:** Al no haber elementos extra en el DOM de la página, el sistema es totalmente invisible para cualquier script de detección de trampas del sitio web.
*   **Inmune a Cambios Visuales:** Si el casino cambia el diseño de la web, las coordenadas de pantalla siguen siendo las mismas mientras la ventana no se mueva.
*   **Precisión Superior:** El uso de `PyAutoGUI` permite simular movimientos humanos reales y clics a nivel de sistema operativo.
*   **Estética Intacta:** El panel de control de la extensión sigue siendo azul, profesional y con la misma distribución que el usuario ya conoce.

---

## 🚀 Próximos Pasos Proponidos
1.  Migrar la lógica de `CalibrationOverlay` de la app de escritorio al backend actual.
2.  Actualizar `requirements.txt` del backend para incluir `PyQt5` y `pyautogui`.
3.  Modificar `sidepanel.js` para conectar con el nuevo flujo de trabajo.
