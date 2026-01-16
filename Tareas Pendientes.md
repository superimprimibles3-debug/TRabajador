# 📋 TAREAS PENDIENTES - AVIATOR TRACKER PRO

Este documento resume el plan de trabajo acordado para migrar el sistema a una arquitectura **100% Visual/Externa** y corregir funcionalidades críticas.

---

## 🟥 1. SEGURIDAD Y LIMPIEZA (PRIORIDAD ALTA)
*Objetivo: Eliminar cualquier rastro de inyección en el navegador para evitar detección.*

- [x] **Desactivar Detección DOM**: Eliminar `MultiplierDetector` de `content.js`. Solo usar OCR.
- [x] **Eliminar WebSockets**: Dejar de interceptar tráfico de red en `content.js`.
- [x] **Borrar Clicks Internos**: Eliminar clase `StealthClicker` (clicks JS) y dependencias.
- [x] **Limpieza de Archivos**:
    - Borrar `server_BACKUP.py` y similares.
    - Borrar `calibration-overlay.html/js/css` (versión antigua).
    - Actualizar `manifest.json` para no cargar scripts basura.

---

## 🟧 2. CORRECCIONES CRÍTICAS (BUGS)
*Objetivo: Que los botones y contadores hagan lo que dicen hacer.*

- [x] **Borrar Base de Datos Real**:
    - **Backend**: Crear endpoint `/api/clear_db` (DELETE + VACUUM).
    - **Frontend**: Conectar botón "Borrar DB" a este endpoint.
- [x] **Sincronización de TARGET**:
    - Asegurar que el input "Target" envíe su valor a Python (`/api/update_config`) para que el bot lo respete.
- [x] **Recargas por Sesión**:
    - Implementar lógica por tiempo: Si `OCR` no detecta nada en **> 60 segundos**, activar Recarga.
    - Incrementar contador + F5 real.
- [x] **Indicadores de Calibración**:
    - Los badges de "No calib." / "Calibrado" no se actualizan correctamente tras calibrar.
    - **Fix**: Revisar lógica en `sidepanel.js` que actualiza estos elementos.
- [x] **Botones Sección Exponencial Rotos**:
    - El usuario reporta que la sección no funciona.
    - **Causa**: Discrepancia de IDs entre HTML (`btn-calibrate-2`) y JS (`btn-cal-exp-1/2`).
    - **Fix**: Corregir IDs en `sidepanel.html` para que coincidan con `sidepanel.js` o viceversa.

---

## 🟨 3. MIGRACIÓN DE PRUEBAS
*Objetivo: Que la sección "Pruebas de Funcionamiento" use el motor Python.*

- [x] **Btn "Test Apostar"**: Redirigir a `POST /click/button/1`.
- [x] **Btn "Test Falso"**: Redirigir a secuencia manual o endpoint nuevo `fake_bet`.
- [x] **Btn "Test Recarga"**: Redirigir a `POST /reload_page` (Tecla F5).

---

## 🟦 4. EXPERIMENTAL: APUESTA EXPONENCIAL
*Objetivo: Activar la "carcasa vacía" que es actualmente esta función.*

- [x] **Backend**: Conectar `/execute_exponential` con `screen_clicker` usando coordenadas calibradas (`exp1`, `exp2`).
- [x] **Frontend**: Implementar el "Gatillo".
    - Lógica: `if (Resultado == Loss) -> Llamar a Python`.
- [x] **Coordenadas**: Asegurar que la calibración de Botón Exponencial se guarde y use correctamente.
- [x] **Animación de Análisis**:
    - Backend: Emitir evento `SNIPER_ANALYSIS` con detalle de filtros.
    - Frontend: Reemplazar "En Desarrollo" con visualizador de pasos (✅/❌ en cascada).

---

## 🟪 5. MEJORAS DE UI / UX
*Objetivo: Mejorar la usabilidad y estética del panel lateral.*

- [x] **Colapso de Secciones**:
    - Las secciones del panel lateral no se contraen actualmente.
    - **Fix**: Agregar reglas CSS para la clase `.collapsed` que oculten `.section-content` y roten el icono.
- [x] **Reordenar Secciones**:
    - La sección "Historial" debe aparecer ENCIMA de la sección "Rastreo".
    - **Fix**: Mover el bloque HTML `#section-history` antes de `#section-ocr`.

---

## 🟩 6. OPTIMIZACIÓN DE RENDIMIENTO
*Objetivo: Mejorar la velocidad de respuesta del sistema.*

- [x] **Acelerar Sistema de Clicks**:
    - El usuario reporta que los clicks tardan mucho en ejecutarse.
    - **Fix**: Revisar y reducir delays en `python_backend/screen_clicker.py`.
