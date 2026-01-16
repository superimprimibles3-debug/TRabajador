/**
 * SidePanel UI Controller - Cleaned & Consolidated Version
 */

class SidePanelController {
    constructor() {
        this.history = [];
        this.stats = {
            wins: 0,
            losses: 0,
            totalProfit: 0,
            systemBets: 0,
            systemWins: 0,
            systemLosses: 0,
            sessionReloads: 0,
            partida: 1
        };
        this.pythonServer = "http://localhost:5000";
        this.bypassStats = { count: 0, lastTime: null };
        this.calibrationData = null;
        this.sniperActive = false;
        this.currentPhase = 'unknown';
        this.pendingSystemBet = false;
        this.activeBetRound = false;
        this.lastAnalysis = null;
        this.lastAutobet = null; // Cooldown para auto-bet
        this.soundEnabled = false;
        this.exponentialConfig = {
            active: false,
            sound: false,
            multiplierEnabled: false,
            multiplierValue: 1.2,
            sys1: { active: false, points: [] },
            sys2: { active: false, points: [] }
        };
        this.clickMode = 'both';
        this.presenceActive = false;
        this.audioCtx = null;
        this.partidaNumber = 1;
        this.bypassSoundEnabled = true;
        this.healthStatus = {
            domAt: Date.now(),
            iframeAt: Date.now(),
            serverAt: Date.now()
        };
        this.lastOCRValue = null;
        this.previewActive = false;
        this.lastPreviewTime = 0;

        // OPTIMIZACIÓN 2: Caché de configuración en memoria
        this.configCache = null;
        this.tooltipsInitialized = false;

        this.init();
    }

    init() {
        try {
            // init() carga datos al abrir el panel.
            // Para "Nueva Partida al abrir", pasamos true.
            this.loadData(true);
            this.setupEventListeners();
            this.setupMessageListener();
            // OPTIMIZACIÓN 3: Lazy loading - tooltips solo cuando se necesiten
            // this.setupTooltips(); // Movido a initTooltipsLazy()
            this.startSessionTimer(); // Start session timer
            setInterval(() => this.updateDashboard(), 2000); // Poll dashboard every 2s
            setInterval(() => this.pollOCRStatus(), 500); // Optimizado: 200ms -> 500ms
            setInterval(() => this.updateOCRConsole(), 2000); // Optimizado: 1s -> 2s
            setInterval(() => this.checkServerConnectivity(), 2000);
            setInterval(() => this.checkHealth(), 5000);

            // Conectar port para que background detecte apertura/cierre (para la máscara OCR)
            this.port = chrome.runtime.connect({ name: 'sidepanel' });

            // Verificación post-init (lazy)
            setTimeout(() => {
                this.checkCriticalElements();
                this.initTooltipsLazy(); // Inicializar tooltips después
            }, 1000);
        } catch (e) {
            logError('Error en init()', e);
        }
    }

    checkCriticalElements() {
        const criticalIds = ['history-container', 'toggle-ocr'];
        const missing = criticalIds.filter(id => !document.getElementById(id));
        if (missing.length > 0) {
            logError(`⚠️ Faltan elementos críticos en el DOM: ${missing.join(', ')}`);
        } else {
            console.log('✅ Verificación de integridad UI completada');
        }
    }

    loadData(incrementSession = false) {
        chrome.storage.local.get([
            'gameHistory', 'stats', 'dbRecords', 'bypassStats', 'buttonCalibration',
            'sniperActive', 'presenceActive', 'soundEnabled', 'clickMode',
            'totalSessionReloads', 'partidaNumber', 'currentRound',
            'ocrMaskConfig',
            'exponentialConfig'
        ], (result) => {
            if (result.gameHistory) this.history = result.gameHistory;
            if (result.stats) this.stats = result.stats;
            // DB Records default
            if (result.dbRecords) this.dbRecords = result.dbRecords;

            // Session Stats
            if (result.bypassStats) this.bypassStats = result.bypassStats;

            // Reloads
            if (result.totalSessionReloads) {
                const reloadEl = document.getElementById('bypass-reloads');
                if (reloadEl) reloadEl.textContent = result.totalSessionReloads;
            }

            // Partida Number
            this.partidaNumber = result.partidaNumber || 1;
            this.currentRound = result.currentRound || 0; // Round within session

            if (incrementSession) {
                this.handleNewGame();
            }

            const pEl = document.getElementById('partida-number');
            if (pEl) pEl.textContent = this.partidaNumber;

            if (result.gameHistory) this.history = result.gameHistory.filter(h => h.partida === this.partidaNumber);
            if (result.buttonCalibration) this.calibrationData = result.buttonCalibration;
            if (result.multiplierElement) this.multiplierElement = result.multiplierElement;
            if (result.balanceElement) this.balanceElement = result.balanceElement;
            if (result.sniperActive !== undefined) this.sniperActive = result.sniperActive;
            if (result.bypassStats) this.bypassStats = result.bypassStats;
            if (result.presenceActive !== undefined) this.presenceActive = result.presenceActive;

            if (result.soundEnabled !== undefined) {
                this.soundEnabled = result.soundEnabled;
                const ch = document.getElementById('sniper-sound-toggle');
                if (ch) ch.checked = this.soundEnabled;
            }

            if (result.bypassSoundEnabled !== undefined) {
                this.bypassSoundEnabled = result.bypassSoundEnabled;
                const ch = document.getElementById('bypass-sound-toggle');
                if (ch) ch.checked = this.bypassSoundEnabled;
            }

            if (result.clickMode) {
                this.clickMode = result.clickMode;
                // select-click-mode reference removed as it's not in HTML
            }

            if (result.totalSessionReloads !== undefined) {
                this.stats.sessionReloads = result.totalSessionReloads;
            }

            if (result.exponentialConfig) {
                this.exponentialConfig = result.exponentialConfig;
            }

            // Sync Partida Number with History if exists
            if (this.history.length > 0) {
                const last = this.history[0];
                if (last.partida > this.partidaNumber) {
                    console.warn(`⚠️ Syncing partidaNumber from ${this.partidaNumber} to ${last.partida}`);
                    this.partidaNumber = last.partida;
                    const pEl = document.getElementById('partida-number');
                    if (pEl) pEl.textContent = this.partidaNumber;
                }
            }

            // Fallback: If filtered history is empty but we have data, show all or last session
            const currentSessionHistory = this.history.filter(h => h.partida === this.partidaNumber);

            // If current session empty but global history has data, try finding the last valid session
            if (currentSessionHistory.length === 0 && this.history.length > 0) {
                // Relaxed filter for debugging: Show up to 20 recent items regardless of session if current session is empty
                console.log("⚠️ Session history empty, showing recent global history");
            } else {
                // Strict filter
                this.history = currentSessionHistory;
            }

            this.render();
            // Retrasar tooltips para asegurar que el DOM esté listo
            setTimeout(() => this.setupTooltips(), 100);

            // SYNC WITH PYTHON DB (Source of Truth)
            // If DB has records, we start a NEW Partida (Session)
            // Fix: Definir maxPartida para evitar ReferenceError
            const maxPartida = this.partidaNumber;

            // Logic: Opening SidePanel = New Session
            if (maxPartida >= this.partidaNumber) {
                this.partidaNumber = maxPartida + 1;
                console.log(`🆕 Starting New Partida from DB: #${this.partidaNumber}`);

                // Update UI
                const pEl = document.getElementById('partida-number');
                if (pEl) pEl.textContent = this.partidaNumber;

                // Reset Session Round Counter
                this.currentRound = 0;
                this.updateRoundCounter(0);

                // Persist new Partida Number locally
                chrome.storage.local.set({
                    partidaNumber: this.partidaNumber,
                    currentRound: 0
                });
            }

            // 2. Map DB records to internal format
            // 2. Map DB records to internal format (Fixed: Handle null/undefined history)
            const rawHistory = result.history || [];
            this.history = rawHistory.map(item => ({
                multiplier: parseFloat(item.multiplier || item.m),
                timestamp: item.timestamp || item.t,
                partida: parseInt(item.partida || 0),
                isSystemBet: item.bet === 'win' || item.bet === 'loss'
            })).reverse();

            this.history.sort((a, b) => b.timestamp - a.timestamp);

            // 3. Filter History for UI
            // Show ONLY current session (which is 0 initially) OR show last session if desired?
            // User Request "Cuenta rondas por partidas". 
            // Since it's a NEW partida, history for THIS partida is empty.
            // But we want to show global history below? 
            // Usually users want to see previous rounds. 
            // So we populate 'history' with ALL DB data, but filter 'stats' for current session.

            const sessionHistory = this.history.filter(h => h.partida === this.partidaNumber);
            this.stats.rounds = sessionHistory.length;

            this.render();
            this.showNotification(`📥 Sincronizado: Partida #${this.partidaNumber}`, 'success');
        });
    }

    saveStats() { chrome.storage.local.set({ stats: this.stats }); }

    // ==========================================
    // DASHBOARD UPDATE (8 CONTADORES)
    // ==========================================
    async updateDashboard() {
        try {
            const res = await fetch('http://localhost:5000/api/dashboard');
            if (!res.ok) {
                // Fallback: Calcular contadores desde datos locales
                this.updateCountersFromLocalData();
                return;
            }

            const data = await res.json();

            // Actualizar los 8 contadores desde backend
            const counters = data.counters || {};
            this.updateCounterElement('stat-total-rounds', counters.total_rounds || 0);
            this.updateCounterElement('stat-rounds-no-bet', counters.rounds_no_bet || 0);
            this.updateCounterElement('stat-wins', counters.wins || 0);
            this.updateCounterElement('stat-losses', counters.losses || 0);
            this.updateCounterElement('stat-click-apostar', counters.click_apostar || 0);
            this.updateCounterElement('stat-click-falso', counters.click_falso || 0);
            this.updateCounterElement('stat-click-exp', counters.click_exp || 0);

            // Calcular efectividad
            const total_bets = counters.wins + counters.losses;
            const efficiency = total_bets > 0 ? Math.round((counters.wins / total_bets) * 100) : 0;
            this.updateCounterElement('stat-eff', efficiency + '%');

            // Actualizar session ID
            const sessionEl = document.getElementById('display-session-id');
            if (sessionEl) sessionEl.textContent = data.session_id || 1;

            // Actualizar estado del filtro
            if (data.filter) {
                this.updateFilterStatus(data.filter.ok, data.filter.msg);
            }

            // CRITICAL FIX: Actualizar Historial y Tabla DB
            if (data.history && Array.isArray(data.history)) {
                this.history = data.history;
                // Actualizar estado interno de partida si viene del servidor
                if (data.session_id) this.partidaNumber = data.session_id;

                this.renderHistory();
                this.updateDatabaseTable(this.history);
            }

        } catch (e) {
            // Fallback: Usar datos locales cuando el servidor no responde
            this.updateCountersFromLocalData();
        }
    }

    // Método auxiliar para calcular contadores desde datos locales
    updateCountersFromLocalData() {
        if (!this.history || this.history.length === 0) return;

        const target = parseFloat(document.getElementById('input-target')?.value) || 2.0;
        const wins = this.history.filter(h => h.multiplier >= target).length;
        const losses = this.history.filter(h => h.multiplier < target && h.isSystemBet).length;

        this.updateCounterElement('stat-total-rounds', this.history.length);
        this.updateCounterElement('stat-wins', wins);
        this.updateCounterElement('stat-losses', losses);
    }

    updateCounterElement(id, value) {
        const el = document.getElementById(id);
        if (el && el.textContent !== String(value)) {
            el.textContent = value;
            // Micro-animación de actualización
            el.style.transform = 'scale(1.1)';
            setTimeout(() => el.style.transform = 'scale(1)', 200);
        }
    }

    updateFilterStatus(ok, msg) {
        const statusEl = document.getElementById('filter-status-text');
        const indicatorEl = document.getElementById('filter-status-indicator');

        if (statusEl) statusEl.textContent = msg || 'Analizando...';
        if (indicatorEl) {
            indicatorEl.className = ok ? 'status-light green pulse' : 'status-light';
        }
    }


    setupEventListeners() {
        // --- CALIBRATION ---
        document.getElementById('btn-cal-1')?.addEventListener('click', () => this.startIndependentCalibration(1));
        document.getElementById('btn-reset-cal-1')?.addEventListener('click', () => this.resetIndependentCalibration(1));
        document.getElementById('btn-cal-2')?.addEventListener('click', () => this.startIndependentCalibration(2));
        document.getElementById('btn-reset-cal-2')?.addEventListener('click', () => this.resetIndependentCalibration(2));

        // Calibración Independiente (Apuesta)
        document.getElementById('btn-cal-1')?.addEventListener('click', () => this.startIndependentCalibration(1));
        document.getElementById('btn-reset-cal-1')?.addEventListener('click', () => this.resetIndependentCalibration(1));
        document.getElementById('btn-cal-2')?.addEventListener('click', () => this.startIndependentCalibration(2));
        document.getElementById('btn-reset-cal-2')?.addEventListener('click', () => this.resetIndependentCalibration(2));

        // --- SNIPER ---
        document.getElementById('toggle-sniper')?.addEventListener('change', (e) => {
            this.sniperActive = e.target.checked;
            chrome.storage.local.set({ sniperActive: this.sniperActive });
            this.showNotification(
                this.sniperActive ? '🎯 Sniper ACTIVADO' : '⚪ Sniper Desactivado',
                this.sniperActive ? 'success' : 'secondary'
            );
        });
        document.getElementById('toggle-sound')?.addEventListener('change', (e) => {
            this.soundEnabled = e.target.checked;
            chrome.storage.local.set({ soundEnabled: this.soundEnabled });
        });

        // FASE 3: Toggle Anti-AFK
        document.getElementById('toggle-anti-afk')?.addEventListener('change', async (e) => {
            this.antiAFKEnabled = e.target.checked;
            chrome.storage.local.set({ antiAFKEnabled: this.antiAFKEnabled });

            // Enviar al backend
            try {
                await fetch(`${this.pythonServer}/toggle_anti_afk`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ enabled: this.antiAFKEnabled })
                });
                this.showNotification(
                    this.antiAFKEnabled ? '✅ Anti-AFK Activado' : '⚪ Anti-AFK Desactivado',
                    this.antiAFKEnabled ? 'success' : 'secondary'
                );
            } catch (e) {
                console.warn('Error al enviar toggle Anti-AFK:', e);
            }
        });

        // --- OCR ---
        document.getElementById('toggle-ocr')?.addEventListener('change', (e) => this.toggleOCR(e.target.checked));
        document.getElementById('btn-calibrate-ocr')?.addEventListener('click', () => this.startOCRSelection());
        document.getElementById('btn-reset-ocr')?.addEventListener('click', () => this.resetOCRData());

        // --- DATABASE ---
        document.getElementById('btn-open-db')?.addEventListener('click', () => this.toggleDatabaseView()); // Toggle handling needed
        document.getElementById('btn-export-db')?.addEventListener('click', () => this.exportDatabase()); // Fixed ID
        document.getElementById('btn-clear-db')?.addEventListener('click', () => this.clearDatabase());
        document.getElementById('btn-new-game')?.addEventListener('click', () => this.resetAll()); // Reusing resetAll for New Game

        // --- TARGET SYNC ---
        document.getElementById('input-target')?.addEventListener('change', (e) => {
            const val = parseFloat(e.target.value);
            if (val && !isNaN(val)) {
                fetch(`${this.pythonServer}/api/config`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ target: val })
                }).catch(err => console.error('Error syncing target:', err));
            }
        });

        // --- EXPONENTIAL / POST-WIN ---
        document.getElementById('toggle-exp-trigger')?.addEventListener('change', (e) => {
            this.exponentialConfig.postWinActive = e.target.checked;
            this.saveExponentialConfig();
            this.showNotification(e.target.checked ? '🔫 Trigger Post-Win ACTIVADO' : '⚪ Trigger Post-Win Desactivado');
        });

        // Exponential Betting Calibration Buttons
        // Exponential Betting Calibration Buttons (FIXED IDs)
        document.getElementById('btn-calibrate-2')?.addEventListener('click', () => this.startExponentialCalibration(2));
        document.getElementById('btn-calibrate-reload')?.addEventListener('click', () => this.startExponentialCalibration('reload'));

        // --- DIAGNOSTICS & TESTS ---
        document.getElementById('btn-test-apostar')?.addEventListener('click', () => this.testApostar());
        document.getElementById('btn-test-falso')?.addEventListener('click', () => this.testFalso());
        document.getElementById('btn-test-exp')?.addEventListener('click', () => this.testExponentialBet());
        document.getElementById('btn-test-reload')?.addEventListener('click', () => this.testReload());
        document.getElementById('btn-test-sound')?.addEventListener('click', () => this.playAlert('test', true));

        document.getElementById('toggle-auto-reload')?.addEventListener('change', (e) => {
            chrome.storage.local.set({ autoReloadEnabled: e.target.checked });
            console.log(`Auto-Reload: ${e.target.checked}`);
        });

        // --- HISTORIAL ---
        document.getElementById('btn-clear-history')?.addEventListener('click', () => this.clearHistory());
        // Existing clearDatabase clears "gameHistory". So I use that.
        // Wait, clearDatabase method calls confirm.
        // I will use clearDatabase.

        // --- GENERIC SECTION TOGGLE (Replaces inline onclick) ---
        // --- GENERIC SECTION TOGGLE (Replaces inline onclick) ---
        document.querySelectorAll('.section-header').forEach(header => {
            header.addEventListener('click', () => {
                header.parentElement.classList.toggle('collapsed');
                // Optional: Save state if needed
            });
        });

        // Initialize Drag & Drop
        this.setupDragAndDrop();

        // Event Listener for New Game - REMOVED DUPLICATE (already exists on line 357)
        document.getElementById('btn-refresh-data')?.addEventListener('click', () => this.updateDashboard());

        // --- EXTRA / LEGACY ---
        // Listeners for elements that might not exist in simplified HTML but useful to keep if I re-add them
    }

    // ===========================================
    // NUEVA PARTIDA / RESET (UNIFIED)
    // ===========================================
    async resetAll() {
        if (!confirm('¿Iniciar nueva partida? Se guardará el historial actual.')) return;

        // ASEGURAR NUMERO ENTERO
        let currentPartida = parseInt(this.partidaNumber) || 0;
        let newPartidaNumber = currentPartida + 1;

        console.log(`[Reset] Partida actual: ${currentPartida}, Nueva: ${newPartidaNumber}`);

        try {
            // 1. Intentar crear nueva sesión en el backend
            const res = await fetch(`${this.pythonServer}/api/new_session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ partida: newPartidaNumber })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    newPartidaNumber = data.session_id || newPartidaNumber;
                    console.log(`✅ Backend confirmó nueva partida: #${newPartidaNumber}`);
                }
            } else {
                console.warn('⚠️ Backend no respondió, usando modo local');
            }
        } catch (e) {
            console.warn('⚠️ Error de conexión con backend, usando modo local:', e);
        }

        // 2. Actualizar número de partida
        this.partidaNumber = newPartidaNumber;

        // 3. Resetear estado local
        this.currentRound = 0;
        this.history = [];
        this.stats = {
            wins: 0,
            losses: 0,
            totalProfit: 0,
            systemBets: 0,
            systemWins: 0,
            systemLosses: 0,
            sessionReloads: 0,
            rounds: 0,
            partida: this.partidaNumber
        };
        this.bypassStats = { count: 0, lastTime: null };

        // 4. Guardar en storage
        chrome.storage.local.set({
            partidaNumber: this.partidaNumber,
            currentRound: 0,
            gameHistory: [],
            stats: this.stats,
            bypassStats: this.bypassStats,
            totalSessionReloads: 0
        });

        // 5. Actualizar UI inmediatamente
        const pEl = document.getElementById('partida-number');
        if (pEl) pEl.textContent = `#${this.partidaNumber}`;

        // Resetear TODOS los contadores visualmente
        this.updateCounterElement('stat-total-rounds', 0);
        this.updateCounterElement('stat-wins', 0);
        this.updateCounterElement('stat-losses', 0);
        this.updateCounterElement('stat-rounds-no-bet', 0);
        this.updateCounterElement('stat-click-apostar', 0);
        this.updateCounterElement('stat-click-falso', 0);
        this.updateCounterElement('stat-click-exp', 0);

        // 6. Limpiar historial y tabla
        this.renderHistory();
        this.updateDatabaseTable([]);
        this.render();

        // 7. Mostrar notificación
        this.showNotification(`✨ Nueva Partida #${this.partidaNumber} iniciada`, 'success');

        // 8. Forzar actualización desde backend después de un delay
        setTimeout(() => this.updateDashboard(), 1000);
    }

    // DATABASE METHODS
    toggleDatabaseView(show) {
        const view = document.getElementById('db-view-container');
        if (!view) return;

        const isHidden = view.style.display === 'none';
        const shouldShow = show !== undefined ? show : isHidden;

        view.style.display = shouldShow ? 'block' : 'none';

        if (shouldShow) {
            this.updateDatabaseTable();
            view.scrollIntoView({ behavior: 'smooth' });
            document.getElementById('btn-open-db').textContent = '📊 Ocultar Datos';
        } else {
            document.getElementById('btn-open-db').textContent = '📊 Ver Datos';
        }
    }

    // updateDatabaseTable() moved to line 917 (unified version)



    clearDatabase() {
        if (!confirm('⚠️ ¿Estás seguro de que quieres BORRAR TODO el historial?\n\nEsta acción eliminará todos los registros de la Base de Datos Real (Python) y del navegador. No se puede deshacer.')) return;

        // 1. Borrar en Backend (Python)
        fetch(`${this.pythonServer}/api/clear_db`, { method: 'POST' })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    this.showNotification('✅ Base de Datos Real eliminada', 'success');
                } else {
                    this.showNotification('❌ Error borrando DB Python: ' + data.error, 'error');
                }
            })
            .catch(e => this.showNotification('❌ Error de conexión al borrar DB', 'error'));

        // 2. Borrar Local (Frontend)
        this.dbRecords = [];
        this.history = [];
        this.stats = { wins: 0, losses: 0, rounds: 0, partida: 1 };
        chrome.storage.local.set({ dbRecords: [], gameHistory: [], stats: this.stats });

        // Reset Counters
        this.updateDatabaseTable([]);
        this.render();
        this.showNotification('🗑️ Datos locales eliminados', 'success');
    }

    async startOCRSelection() {
        this.logToBypassConsole(`🔍 Iniciando calibración OCR vía Python...`);
        try {
            const res = await fetch(`${this.pythonServer}/calibrate/ocr`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                this.showNotification('✅ Región OCR calibrada en Python', 'success');
                chrome.storage.local.set({ ocrMaskConfig: data.region });
            }
        } catch (e) {
            this.showNotification('❌ Error: Inicia el servicio Python', 'error');
        }
    }

    calibrateOCR() {
        // Legacy method removed. Now using startOCRSelection.
    }

    toggleOCR(shouldStart) {
        // Fix: Use the boolean argument from the checkbox
        const action = shouldStart ? 'start' : 'stop';

        fetch('http://localhost:5000/ocr/control', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action })
        }).then(r => r.json()).then(status => {
            this.updateOCRUI(status);
        }).catch(e => {
            console.error('❌ Error en toggleOCR:', e);
            this.showNotification('❌ Error al controlar OCR', 'error');
            this.showNotification('❌ Error comunicando con Servidor Python', 'error');
        });
    }

    pollOCRStatus() {
        fetch('http://localhost:5000/ocr/status')
            .then(r => r.json())
            .then(status => {
                this.updateOCRUI(status);
                // Si el status trae balance, actualizarlo
                if (status.balance) { // Asumimos que el backend enviará balance si lo detecta
                    // this.updateBalanceUI(status.balance, 0); // TODO: Implementar lógica de cambio
                }
            })
            .catch((error) => {
                // Silenciar errores de conexión cuando el servidor está apagado
                // Solo mostrar si OCR está activo y esperamos respuesta
                if (this.ocrActive) {
                    console.warn('⚠️ Error de conexión con servidor OCR:', error.message);
                }
            });
    }

    updateOCRUI(status) {
        const valueEl = document.getElementById('ocr-value-display'); // Correccion ID
        const dot = document.getElementById('python-status-indicator'); // Correccion ID
        const text = null; // No text element in new UI
        const btn = document.getElementById('toggle-ocr');

        if (status.running) {
            if (dot) dot.className = 'dot green';
            if (text) text.textContent = 'Activo';
            if (btn && btn.type === 'checkbox') btn.checked = true;
        } else {
            if (dot) dot.className = 'dot';
            if (text) text.textContent = 'Inactivo';
            if (btn && btn.type === 'checkbox') btn.checked = false;
        }

        if (valueEl && status.value) {
            const val = parseFloat(status.value);
            if (!isNaN(val)) {
                valueEl.textContent = val.toFixed(2) + 'x';
                this.processOCRValue(val);
            } else {
                valueEl.textContent = status.value;
            }
        }

        const previewCont = document.getElementById('ocr-preview-container');
        if (previewCont) {
            if (status.running) previewCont.classList.remove('hidden');
            else previewCont.classList.add('hidden');
        }
    }

    async updateOCRConsole() {
        const consoleEl = document.getElementById('ocr-log-console');
        const ocrContent = document.getElementById('tracking-section');
        if (!consoleEl || !ocrContent || ocrContent.classList.contains('hidden')) return;

        // 1. POLL ANALYSIS (Visualizer)
        try {
            const res = await fetch(`${this.pythonServer}/api/analysis/latest`);
            const analysis = await res.json();
            if (analysis && analysis.stage) {
                this.renderFilterSteps(analysis);
            }
        } catch (e) {
            // Ignore analysis errors
        }

        try {
            const start = Date.now();
            const res = await fetch('http://localhost:5000/ocr/logs');
            const data = await res.json();

            // Fix: Server returns a direct list, not {logs: []}
            const logs = Array.isArray(data) ? data : (data.logs || []);

            if (logs.length > 0) {
                // Solo actualizar si hay nuevos logs para evitar parpadeo
                const newContent = logs.map(log => {
                    let color = '#22c55e'; // Info
                    if (log.includes('[ERROR]')) color = '#ef4444';
                    if (log.includes('[WARN]')) color = '#facc15';
                    if (log.includes('[DEBUG]')) color = '#94a3b8';
                    if (log.includes('✅')) color = '#4ade80';
                    return `<div style="color: ${color}; margin-bottom: 2px;">> ${log}</div>`;
                }).join('');

                if (consoleEl.innerHTML !== newContent) {
                    consoleEl.innerHTML = newContent;
                    consoleEl.scrollTop = consoleEl.scrollHeight;
                }

                const duration = Date.now() - start;
                const fpsEl = document.getElementById('preview-fps');
                if (fpsEl) fpsEl.textContent = `${Math.round(1000 / (Math.max(duration, 100) || 1))} ms`;
            }
        } catch (e) {
            if (consoleEl.innerHTML.indexOf('⚠️ ERROR: Servidor Python desconectado') === -1) {
                consoleEl.innerHTML = `<div style="color: #ef4444; font-weight: bold;">⚠️ ERROR: Servidor Python desconectado</div>
                                       <div style="color: #94a3b8; font-size: 9px; margin-top: 4px;">Verifica que server.py esté corriendo en localhost:5000</div>`;
            }
        }
    }

    processOCRValue(val) {
        if (val === this.lastOCRValue) return;
        this.lastOCRValue = val;

        // Filtro de Estabilidad para Historial y Sniper
        if (this.ocrStabilityTimer) clearTimeout(this.ocrStabilityTimer);

        this.ocrStabilityTimer = setTimeout(() => {
            console.log('🎯 OCR VALOR FINAL:', val);

            // ACTUALIZACIÓN OPTIMISTA (Solicitado por Usuario)
            // Agregar directamente al historial local para feedback inmediato
            const tempResult = {
                multiplier: val,
                timestamp: Date.now(),
                isSystemBet: false,
                partida: this.partidaNumber
            };
            this.history.unshift(tempResult);

            // OPTIMIZACIÓN 2: Limitar historial a 50 rondas
            if (this.history.length > 50) {
                this.history = this.history.slice(0, 50);
            }

            // Increment optimistic rounds
            this.stats.rounds = (this.stats.rounds || 0) + 1;

            this.render(); // Renderizar inmediatamente

            chrome.runtime.sendMessage({
                type: 'newMultiplier',
                data: { multiplier: val, timestamp: Date.now(), isOCR: true }
            }).catch(() => { });

            this.sendCommand('NEW_OCR_RESULT', { value: val });
        }, 1000);
    }

    // performReload removed/cleaned if not used or kept minimal
    performReload() {
        // Keep existing logic if F5 button exists (removed from UI, but maybe kept in code)
        // Button removed from UI: btn-test-f5
        // So this method is dead code unless called programmatically.
    }

    setupTooltips() {
        const tooltips = [
            { icon: 'pattern-info', tip: 'pattern-tooltip' },
            { icon: 'filters-info', tip: 'filters-tooltip' },
            { icon: 'history-legend-icon', tip: 'history-legend-tooltip' },
            { icon: 'stats-info', tip: 'stats-tooltip' },
            { icon: 'btns-info', tip: 'btns-tooltip' },
            { icon: 'tracking-info', tip: 'tracking-tooltip' },
            { icon: 'sniper-info-header', tip: 'sniper-tooltip' },
            { icon: 'exp-info-header', tip: 'exp-tooltip' },
            { icon: 'clicks-info', tip: 'clicks-tooltip' },
            { icon: 'bypass-info', tip: 'bypass-tooltip' }
        ];

        tooltips.forEach(t => {
            const icon = document.getElementById(t.icon);
            const tip = document.getElementById(t.tip);
            if (icon && tip) {
                // Eliminar listeners previos para evitar duplicados
                const newIcon = icon.cloneNode(true);
                icon.parentNode.replaceChild(newIcon, icon);

                newIcon.addEventListener('mouseenter', () => tip.classList.add('show'));
                newIcon.addEventListener('mouseleave', () => tip.classList.remove('show'));
                newIcon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    document.querySelectorAll('.tooltip').forEach(ot => { if (ot !== tip) ot.classList.remove('show'); });
                    tip.classList.toggle('show');
                });
            }
        });

        // Hide tooltips when clicking outside
        document.addEventListener('click', () => {
            document.querySelectorAll('.tooltip').forEach(tip => tip.classList.remove('show'));
        });
    }

    // OPTIMIZACIÓN 3: Lazy loading de tooltips
    initTooltipsLazy() {
        if (this.tooltipsInitialized) return;
        this.tooltipsInitialized = true;
        this.setupTooltips();
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message) => {
            switch (message.type) {
                case 'UPDATE_HISTORY':
                    console.log('📨 SidePanel received UPDATE_HISTORY:', message.history?.length);

                    // MERGE LOGIC: Prevent overwriting optimistic latest result
                    const incomingHistory = message.history.filter(h => h.partida === this.partidaNumber);

                    // If we have local history and incoming is different/stale...
                    if (this.history.length > 0 && incomingHistory.length > 0) {
                        const localTop = this.history[0];
                        const incomingTop = incomingHistory[0];

                        // If local top is newer/different than incoming (e.g. optimistic), keep local!
                        // We check timestamp or value.
                        if (localTop.timestamp > incomingTop.timestamp) {
                            console.log("🛡️ Preserving Optimistic Result against Stale Update");
                            // Keep local top, append incoming rest
                            this.history = [localTop, ...incomingHistory];
                        } else {
                            this.history = incomingHistory;
                        }
                    } else if (this.history.length > 0 && incomingHistory.length === 0) {
                        // Background sent empty but we have optimistic? Keep optimistic.
                        console.log("🛡️ Preserving Optimistic Result against Empty Update");
                    } else {
                        this.history = incomingHistory;
                    }

                    // Preserve rounds count since background doesn't track it
                    const currentRounds = this.stats.rounds;
                    this.stats = message.stats;
                    // Restoration
                    if (currentRounds > (this.stats.rounds || 0)) {
                        this.stats.rounds = currentRounds;
                    }
                    this.stats.rounds = this.history.length;
                    if (this.stats.counters && this.stats.counters.session_reloads !== undefined) {
                        this.stats.sessionReloads = this.stats.counters.session_reloads;
                    }

                    this.render(); // Render calls renderStats which uses this.stats.rounds

                    if (message.lastResult) this.saveToDatabase(message.lastResult);
                    break;
                case 'PHASE_UPDATE': this.currentPhase = message.phase; this.updatePhaseUI(); break;
                case 'CALIBRATION_UPDATE': this.calibrationData = message.data; this.updateCalibrationStatus(); break;
                case 'TRIGGER_EXECUTED': this.showNotification('✅ Trigger ejecutado', 'success'); this.recordSystemBet(); break;
                case 'MULTIPLIER_ELEMENT_LOADED':
                    this.multiplierElement = true;
                    this.updateCalibrationStatus();
                    break;
                case 'BALANCE_UPDATE':
                    // El balance ya no se muestra en el panel principal por solicitud del usuario
                    // pero mantenemos el log interno si fuera necesario debuggear
                    break;
                case 'WEBSOCKET_DATA': if (message.data.roundNumber) this.updateRoundCounter(message.data.roundNumber); break;
                case 'DIALOG_CLOSED':
                    this.bypassStats.count++;
                    this.bypassStats.lastTime = message.timestamp;
                    chrome.storage.local.set({ bypassStats: this.bypassStats });
                    this.renderBypassStats();
                    break;
                case 'CLICK_REVERTED': this.updateClickStats(); this.showNotification('🔴 Click revertido detectado', 'error'); break;
                case 'DOM_PULSE': this.updateDOMStatusLight('dom', true); break;
                case 'IFRAME_PULSE': this.updateDOMStatusLight('iframe', true); break;
                case 'SNIPER_ANALYSIS':
                    this.lastAnalysis = message.analysis;
                    this.renderFilterSteps(message.analysis);
                    if (this.soundEnabled && message.analysis.decision) this.playAlert('sniper');
                    break;
                case 'PLAY_ALERT':
                    this.playAlert(message.soundType);
                    break;
                case 'PRESENCE_UPDATE': this.updatePresenceUI(message); break;
                case 'SELECTION_COMPLETED':
                    this.handleOCRSelection(message.data);
                    break;
                case 'EXPONENTIAL_CALIBRATION_COMPLETE':
                    this.exponentialConfig = message.config;
                    this.renderExponentialUI();
                    this.showNotification(`✅ Sistema ${message.sysId} calibrado: ${message.count} puntos`, 'success');
                    break;
            }
        });
    }

    render() {
        this.renderStats();
        this.renderHistory();
        this.updateCalibrationStatus();
        this.updateSniperButton();
        this.renderBypassStats();
        this.updatePhaseUI();
        this.renderExponentialUI();
    }

    renderStats() {
        const ids = {
            'round-number': this.stats.rounds,
            'stat-bets': this.stats.systemBets,
            'stat-system-wins': this.stats.systemWins,
            'stat-system-losses': this.stats.systemLosses
        };
        Object.entries(ids).forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val !== undefined ? val : 0;
        });

        const reloadEl = document.getElementById('session-reload-count');
        if (reloadEl) reloadEl.textContent = this.stats.sessionReloads || 0;

        // Actualizar último resultado desde el historial si existe
        if (this.history && this.history.length > 0) {
            const last = this.history[0];
            const lastEl = document.getElementById('last-result');
            if (lastEl) {
                lastEl.textContent = parseFloat(last.multiplier).toFixed(2) + 'x';
                lastEl.style.color = this.getResultColor(last.multiplier);
            }
        }
    }

    updateDatabaseTable(records) {
        const tbody = document.getElementById('db-table-body');
        const countEl = document.getElementById('db-total-count');

        if (!tbody) return;

        // Usar historial local si no se pasan records
        const data = records || this.history || [];

        if (countEl) countEl.textContent = `Registros: ${data.length}`;

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#666;">Sin datos</td></tr>';
            return;
        }

        // Generar número de ronda automáticamente si no existe
        tbody.innerHTML = data.slice(0, 50).map((r, index) => {
            const partida = r.partida || r.p || this.partidaNumber;
            const ronda = r.ronda || r.r || (data.length - index);
            const multiplier = parseFloat(r.multiplier || r.m || 0);
            const timestamp = r.timestamp || r.t || Date.now();
            const timeStr = new Date(timestamp).toLocaleTimeString();

            return `
            <tr>
                <td>${partida}</td>
                <td>${ronda}</td>
                <td style="font-weight: bold; color: ${multiplier >= 2.0 ? '#10b981' : '#ef4444'};">${multiplier.toFixed(2)}x</td>
                <td>${timeStr}</td>
            </tr>
        `;
        }).join('');
    }

    renderHistory() {
        const container = document.getElementById('history-container');
        if (!container) return;

        if (!this.history || this.history.length === 0) {
            container.innerHTML = '<div class="history-empty">Esperando...</div>';
            return;
        }

        // FIXED: Mostrar últimos 20 valores independientemente de la partida
        const visibleHistory = this.history.slice(0, 20);

        container.innerHTML = visibleHistory.map(r => {
            const val = parseFloat(r.multiplier || r.m || 0);

            // IMPORTANTE: Solo verificar isSystemBet, NO el campo bet
            // Esto asegura que solo las apuestas reales tengan color
            const isSystemBet = r.isSystemBet === true;

            // NUEVA LÓGICA DE COLORES:
            // - Neutral (gris) si NO se apostó (isSystemBet === false o undefined)
            // - Verde si se apostó Y se ganó
            // - Rojo si se apostó Y se perdió
            let colorClass = 'neutral';
            if (isSystemBet) {
                const target = parseFloat(document.getElementById('input-target')?.value) || 2.0;
                colorClass = val >= target ? 'win' : 'loss';
            }

            return `<span class="history-item ${colorClass}${isSystemBet ? ' system' : ''}">${val.toFixed(2)}x</span>`;
        }).join('');
    }

    updatePhaseUI() {
        const phaseText = document.getElementById('phase-text');
        const statusDot = document.querySelector('.status-dot');
        const map = { 'betting': { t: 'Apuestas', c: 'green' }, 'flying': { t: 'Volando', c: 'yellow' }, 'crashed': { t: 'Crashed', c: 'red' }, 'waiting': { t: 'Esperando', c: 'yellow' } };
        const p = map[this.currentPhase] || { t: 'Desconocida', c: '' };
        if (phaseText) phaseText.textContent = p.t;
        if (statusDot) statusDot.className = `status-dot ${p.c}`;
    }

    updateCalibrationStatus() {
        const updateStatus = (id, isCalibrated) => {
            const el = document.getElementById(id);
            if (el) {
                if (isCalibrated) {
                    el.style.background = 'rgba(16, 185, 129, 0.2)';
                    el.style.color = '#10b981';
                    el.textContent = 'Calibrado';
                } else {
                    el.style.background = 'rgba(239, 68, 68, 0.2)';
                    el.style.color = '#ef4444';
                    el.textContent = 'No calib.';
                }
            }
        };

        if (this.calibrationData) {
            // Check keys: 1, 2, reload (or synonyms)
            // Python Backend returns: btn1, btn2, exp1, exp2, ocr, reload...
            // Local storage often maps them.
            // Let's check loosen properties to be safe
            const c = this.calibrationData;
            const has1 = c[1] || c.btn1 || c.button1;
            const has2 = c[2] || c.btn2 || c.button2;
            const hasReload = c.reload || c.f5;

            updateStatus('status-cal-1', has1);
            updateStatus('status-cal-2', has2);
            updateStatus('status-cal-reload', hasReload);
        }
    }

    renderBypassStats() {
        const t = document.getElementById('bypass-count');
        if (t) t.textContent = this.bypassStats.count || 0;

        const r = document.getElementById('bypass-reloads');
        if (r) r.textContent = this.stats.sessionReloads || 0;

        const lt = document.getElementById('bypass-last-time');
        if (lt && this.bypassStats.lastTime) lt.textContent = new Date(this.bypassStats.lastTime).toLocaleTimeString();
    }

    renderFilterSteps(analysis) {
        const container = document.getElementById('filters-status-container');
        if (!container) return;

        container.innerHTML = '';
        const names = ["Canal", "Continuidad", "Densidad", "Anti-Rosa"];

        names.forEach((name, i) => {
            const step = i + 1;
            const pass = analysis.decision || step < analysis.failedFilter;
            const fail = !analysis.decision && step === analysis.failedFilter;

            // Create status element
            const statusDiv = document.createElement('div');
            statusDiv.className = 'status-box';
            statusDiv.style.marginTop = '0';
            statusDiv.style.padding = '4px 6px';
            statusDiv.style.display = 'flex';
            statusDiv.style.justifyContent = 'space-between';
            statusDiv.style.alignItems = 'center';
            statusDiv.style.borderLeft = pass ? '3px solid var(--success)' : (fail ? '3px solid var(--danger)' : '3px solid #334155');
            statusDiv.style.background = pass ? 'rgba(34, 197, 94, 0.05)' : (fail ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255,255,255,0.02)');

            const icon = pass ? '✅' : (fail ? '❌' : '⬜');
            statusDiv.innerHTML = `
                <span style="font-size: 10px; color: ${pass ? '#22c55e' : (fail ? '#ef4444' : '#94a3b8')}">${step}. ${name}</span>
                <span style="font-size: 10px;">${icon}</span>
            `;
            container.appendChild(statusDiv);
        });

        // Add final decision summary at the bottom if complete
        if (analysis.decision !== undefined) {
            const summaryDiv = document.createElement('div');
            summaryDiv.style.gridColumn = '1 / -1';
            summaryDiv.style.textAlign = 'center';
            summaryDiv.style.marginTop = '5px';
            summaryDiv.style.fontWeight = 'bold';
            summaryDiv.style.fontSize = '12px';
            summaryDiv.style.color = analysis.decision ? '#22c55e' : '#ef4444';
            summaryDiv.innerHTML = analysis.decision ? '✅ ENTRADA CONFIRMADA' : `❌ RECHAZADO: ${analysis.stage || 'Filtros'}`;
            container.appendChild(summaryDiv);
        }
    }

    // OCR METHODS
    startDrawingSelection() {
        this.sendCommand('START_SELECTION', {}, (res) => {
            if (res && res.success) {
                this.showNotification('🖌️ Dibuja un recuadro verde sobre el multiplicador', 'success');
            } else {
                this.showNotification('❌ Error: Recarga la página', 'error');
            }
        });
    }

    handleOCRSelection(data) {
        console.log("📍 Selección recibida:", data);
        try {
            // Enviamos la configuración al servidor Python
            // 'data' contiene {x, y, width, height, type? }
            this.updateOCRUI({ running: true, value: 0 }); // Update UI immediately
        } catch (e) {
            console.error(e);
        }
    }

    resetOCRData() {
        if (confirm('¿Resetear toda la configuración OCR?')) {
            this.sendCommand('RESET_OCR_SELECTION');
            this.updateOCRUI({ running: false, value: '--' });
            this.showNotification('🗑️ OCR Reseteado', 'success');
        }
    }

    clearOCRMask() {
        this.sendCommand('CLEAR_OCR_MASK');
    }

    async testSingleClick() {
        // FIX: Validar calibración antes de probar
        try {
            const res = await fetch(`${this.pythonServer}/get_calibration/button/1`);
            const data = await res.json();

            if (!data.calibrated || !data.points || data.points.length === 0) {
                this.showNotification('⚠️ Calibra el Botón 1 primero', 'warning');
                return;
            }
        } catch (e) {
            this.showNotification('❌ Error: Inicia el servicio Python', 'error');
            return;
        }

        // Ejecutar test
        this.showNotification('🧪 Probando click vía Python...', 'info');
        try {
            const res = await fetch(`${this.pythonServer}/click/button/1`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                this.showNotification('✅ Click exitoso', 'success');
            } else {
                this.showNotification('❌ Error en click', 'error');
            }
        } catch (e) {
            this.showNotification('❌ Error: Inicia el servicio Python', 'error');
        }
    }

    // Duplicate processOCRValue removed to favor the comprehensive version above.


    // Legacy method maintained just in case, but untethered from UI
    async startOCRCalibration() {
        const btn = document.getElementById('btn-calibrate-ocr');
        const originalText = btn.textContent;
        const info = document.getElementById('ocr-value'); // Usamos este espacio para feedback

        try {
            // Paso 1: Esquina Superior Izquierda
            await this.runCountDown(btn, info, "PONE MOUSE ARRIBA-IZQ", 3);
            const p1 = await this.fetchMousePosition();
            this.showNotification('✅ Punto 1 Capturado', 'success');

            // Paso 2: Esquina Inferior Derecha
            await this.runCountDown(btn, info, "AHORA ABAJO-DER", 3);
            const p2 = await this.fetchMousePosition();
            this.showNotification('✅ Punto 2 Capturado', 'success');

            // Calcular Región
            const width = Math.abs(p2.x - p1.x);
            const height = Math.abs(p2.y - p1.y);
            const centerX = Math.min(p1.x, p2.x) + width / 2;
            const centerY = Math.min(p1.y, p2.y) + height / 2;

            // Enviar Config Teniendo en cuenta que el server espera centro y dimensiones
            const resp = await fetch('http://localhost:5000/ocr/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ x: centerX, y: centerY, width: width, height: height })
            }).then(r => r.json());

            if (resp.success) {
                this.showNotification('✅ Zona OCR Guardada y Activada', 'success');
                this.updateOCRUI({ running: true, value: 0 }); // Forzar estado UI
            } else {
                throw new Error(resp.error || 'Error config server');
            }

        } catch (e) {
            console.error(e);
            this.showNotification('❌ Cancelado o Error', 'error');
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
            info.textContent = "--";
        }
    }

    toggleOCR(enabled) {
        const action = enabled ? 'start' : 'stop';

        // 1. Channel: Content Script (Visual Feedback)
        this.sendCommand('TOGGLE_ALL_MASKS', { visible: enabled });

        // 2. Channel: Python Backend
        fetch('http://localhost:5000/ocr/control', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action })
        })
            .then(r => r.json())
            .then(status => this.updateOCRUI(status))
            .catch(e => {
                this.showNotification('❌ Error Conexión', 'error');
                // Revert checkbox if failed
                const chk = document.getElementById('toggle-ocr');
                if (chk) chk.checked = !enabled;
            });
    }

    runCountDown(btnElement, displayElement, msg, seconds) {
        return new Promise((resolve) => {
            btnElement.disabled = true;
            let counter = seconds;

            const interval = setInterval(() => {
                btnElement.textContent = `${msg} (${counter})`;
                if (displayElement) displayElement.textContent = `⏳ ${counter}s`;

                if (counter <= 0) {
                    clearInterval(interval);
                    resolve();
                }
                counter--;
            }, 1000);

            // UI inmediata start
            btnElement.textContent = `${msg} (${counter})`;
        });
    }

    async fetchMousePosition() {
        return fetch('http://localhost:5000/calibrate', { method: 'POST' }).then(r => r.json());
    }

    // ACTIONS
    // ACTIONS
    startCalibration(type) {
        if (!type) return;

        console.log(`📡 Solicitando calibración: ${type}`);

        // Verificación de servidor Python (Local Connection)
        if (this.clickMode === 'external' || this.clickMode === 'both') {
            fetch('http://localhost:5000/status')
                .then(r => {
                    if (!r.ok) throw new Error('Server error');
                    this._proceedCalibration(type);
                })
                .catch(() => {
                    this.showNotification('❌ Error Conexión Local: Python OFF', 'error');
                    console.error('Python Server Unreachable');
                    // Block calib only if purely external
                    if (this.clickMode === 'external') return;
                    this._proceedCalibration(type);
                });
        } else {
            this._proceedCalibration(type);
        }
    }

    _proceedCalibration(type) {
        // Logica original de F5
        if (type === 'reload' && this.clickMode === 'external') {
            this.showNotification('✅ Recarga F5 activada (Python)', 'success');
            if (!this.calibrationData) this.calibrationData = { multiPoint: true };
            this.calibrationData.reload = { method: 'f5' };
            chrome.storage.local.set({ buttonCalibration: this.calibrationData });
            this.updateCalibrationStatus();
            return;
        }

        this.sendCommand('start_calibration', { type }, (res) => {
            if (res && res.success) {
                console.log('✅ Calibración iniciada correctamente en content script');
            } else {
                console.warn('⚠️ Fallo silencioso al iniciar calibración (Modo Permisivo)');
                // Ya no mostramos alerta invasiva
            }
        });
    }
    selectMultiplierElement() { this.sendCommand('select_multiplier_element', {}, (res) => { if (!res) this.showError(); }); }
    resetMultiplierElement() { if (confirm('¿Resetear Multiplicador?')) { this.sendCommand('reset_multiplier_element'); this.multiplierElement = null; this.updateCalibrationStatus(); } }
    resetCalibration() { if (confirm('¿Resetear Botones?')) { this.sendCommand('reset_calibration'); this.calibrationData = null; this.updateCalibrationStatus(); } }
    toggleSniper(enabled) { this.sniperActive = enabled !== undefined ? enabled : !this.sniperActive; this.sendCommand('toggle_sniper', { enabled: this.sniperActive }); chrome.storage.local.set({ sniperActive: this.sniperActive }); this.updateSniperButton(); }
    togglePresence() { this.presenceActive = !this.presenceActive; this.sendCommand('toggle_presence', { enabled: this.presenceActive }); }

    clearClickHistory() {
        if (confirm('¿Borrar historial de clicks y estadísticas?')) {
            this.sendCommand('clear_click_history', {}, (res) => {
                if (res && res.success) {
                    this.showNotification('✅ Historial de clicks borrado', 'success');
                    this.updateClickStats(); // Refrescar UI
                } else {
                    this.showNotification('❌ Error al borrar historial', 'error');
                }
            });
        }
    }

    async findGameFrameId(tabId) {
        // Enfoque Frame 0: No buscamos iframes. Asumimos Frame 0.
        return 0;
    }

    sendCommand(action, data = {}, callback = null) {
        // Enfoque Frame 0 Strict con Debugging
        console.log(`[SidePanel] Intentando enviar comando: ${action} a Frame 0`);

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]) {
                console.warn('[SidePanel] No se encontró pestaña activa.');
                this.showNotification('⚠️ No hay pestaña activa', 'warning');
                if (callback) callback(false);
                return;
            }

            const tabId = tabs[0].id;
            console.log(`[SidePanel] Tab ID: ${tabId}, enviando msg...`);

            // Enviar a la pestaña
            chrome.tabs.sendMessage(tabId, { action, ...data }, (res) => {
                if (chrome.runtime.lastError) {
                    // Comandos críticos que requieren notificación visual
                    const criticalCommands = ['start_calibration', 'toggle_sniper', 'execute_exponential', 'start_exponential_calibration'];

                    if (criticalCommands.includes(action)) {
                        console.warn(`[SidePanel] ⚠️ Error enviando ${action}:`, chrome.runtime.lastError.message);
                        this.showNotification(`⚠️ ${action} falló: Abre la página del juego primero`, 'warning');
                    } else {
                        console.log(`[SidePanel] ℹ️ ${action}: Content script no disponible (esto es normal si no estás en la página del juego)`);
                    }
                    if (callback) callback(false);
                } else {
                    console.log(`[SidePanel] ✅ Respuesta recibida para ${action}:`, res);
                    if (callback) callback(res || true);
                }
            });
        });
    }

    showNotification(m, t) {
        const n = document.createElement('div'); n.className = `notification ${t}`;
        n.style.cssText = `position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: ${t === 'success' ? '#10b981' : '#ef4444'}; color: white; padding: 12px 20px; border-radius: 8px; z-index: 10000;`;
        n.textContent = m; document.body.appendChild(n); setTimeout(() => n.remove(), 3000);
    }

    showError() {
        // Verificación suprimida por solicitud del usuario
        console.log('Verificación de conexión omitida (showError called)');
    }

    getResultColor(m) { return m < 2 ? '#3b82f6' : (m < 3 ? '#a855f7' : (m < 10 ? '#f59e0b' : '#ef4444')); }

    updateSniperButton() {
        const b = document.getElementById('toggle-sniper');
        // Update checkbox state
        if (b && b.type === 'checkbox') {
            b.checked = this.sniperActive;
        }
    }

    updatePresenceUI(d) {
        const b = document.getElementById('btn-toggle-presence');
        const s = document.getElementById('presence-status-text');
        const g = document.getElementById('presence-remaining');
        if (b) { b.textContent = d.isActive ? '🔴 Desactivar Anti-Ausencia' : '🟢 Activar Anti-Ausencia'; b.className = d.isActive ? 'active' : ''; }
        if (s) { s.textContent = d.isActive ? '🟢 Activo' : 'Inactivo'; s.style.color = d.isActive ? '#10b981' : '#ef4444'; }
        if (g) { g.textContent = d.isActive ? `En ${d.roundsToWait - d.roundCounter} rondas` : 'Inactivo'; }
    }

    updateBalanceUI(balance, change) {
        const balanceEl = document.getElementById('current-balance');
        if (balanceEl) {
            balanceEl.textContent = `$${parseFloat(balance).toFixed(2)}`;

            // Colorear según el cambio
            if (change > 0) {
                balanceEl.style.color = '#10b981'; // Verde para ganancia
                setTimeout(() => balanceEl.style.color = '', 2000);
            } else if (change < 0) {
                balanceEl.style.color = '#ef4444'; // Rojo para pérdida
                setTimeout(() => balanceEl.style.color = '', 2000);
            }
        }
    }

    updateRoundCounter(r) { const e = document.getElementById('round-number'); if (e) e.textContent = r; }

    updateClickStats() {
        this.sendCommand('get_click_report', {}, (res) => {
            if (res?.report) {
                const r = res.report;
                const totalEl = document.getElementById('click-total');
                const revertedEl = document.getElementById('click-reverted');
                const rateEl = document.getElementById('click-success-rate');

                if (totalEl) totalEl.textContent = r.summary.totalClicks;

                // Actualizar tabla detallada si existe
                const body = document.getElementById('click-stats-body');
                if (body && r.detailed) {
                    // Aquí podrías actualizar las celdas específicas si fuera necesario
                }
            }
        });
    }

    recordSystemBet() { this.pendingSystemBet = true; this.activeBetRound = true; }

    saveToDatabase(r) {
        // Increment Round Counter for the new result
        this.currentRound++;
        this.updateRoundCounter(this.currentRound); // Update UI
        chrome.storage.local.set({ currentRound: this.currentRound });

        // Determinar si fue una apuesta del sistema
        const wasSystemBet = this.activeBetRound === true;
        const betResult = wasSystemBet ? (parseFloat(r.multiplier) >= 1.11 ? 'win' : 'loss') : null;

        const record = {
            multiplier: parseFloat(r.multiplier),
            timestamp: r.timestamp || Date.now(),
            bet: betResult,
            isSystemBet: wasSystemBet,  // ← IMPORTANTE: Solo true si realmente se apostó
            partida: this.partidaNumber,
            ronda: this.currentRound,
            raw_multiplier: r.multiplier
        };

        // 1. Save to Local Storage (Chrome)
        chrome.storage.local.get(['dbRecords'], (res) => {
            let db = res.dbRecords || [];
            db.push({
                m: record.multiplier,
                t: record.timestamp,
                bet: record.bet,
                isSystemBet: record.isSystemBet,  // ← Agregar al storage
                p: record.partida,
                r: record.ronda
            });

            // Keep last 2000
            const newDb = db.slice(-2000);
            chrome.storage.local.set({ dbRecords: newDb });
            this.dbRecords = newDb;
            this.activeBetRound = false;  // Reset después de guardar
            this.updateDatabaseTable();  // Actualizar tabla de base de datos
        });

        // 2. Sync to Python Backend (Database)
        console.log('💾 Syncing to Python DB:', record);
        fetch('http://localhost:5000/ocr/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record)
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) console.log('✅ Saved to Python DB');
                else console.warn('⚠️ Python DB Save Failed:', data.error);
            })
            .catch(err => console.error('❌ DB Connection Error:', err));
    }

    // ===========================================
    // LOGICA "TRIGGER POST-WIN" (NUEVO)
    // ===========================================

    handleNewGame() {
        console.log("🎮 New Game Handled in SidePanel");
        // Reset local round counter for UI
        this.currentRound = 0;
        this.updateRoundCounter(0);
        // Maybe visual flare?
        const pEl = document.getElementById('partida-number');
        if (pEl) {
            pEl.style.color = '#22c55e';
            setTimeout(() => pEl.style.color = '', 1000);
        }
    }

    setupListeners() {
        // ... (Existing)

        // Post-Win Trigger Toggle
        document.getElementById('toggle-exp-trigger')?.addEventListener('change', (e) => {
            this.exponentialConfig.postWinActive = e.target.checked;
            this.saveExponentialConfig();
            this.showNotification(e.target.checked ? '🔫 Trigger Post-Win ACTIVADO (4s)' : '⚪ Trigger Post-Win Desactivado');
        });

        // Toggle OCR (Also toggles Global Masks now)
        document.getElementById('toggle-ocr')?.addEventListener('change', (e) => {
            const active = e.target.checked;
            if (active) {
                this.startTracking('ocr');
                // Send to Python
                this.sendCommand('TOGGLE_ALL_MASKS', { visible: true });
                // Send to Content Script (Visual Dots)
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { type: 'TOGGLE_ALL_MASKS', visible: true });
                });
            } else {
                this.stopTracking('ocr');
                // Send to Python
                this.sendCommand('TOGGLE_ALL_MASKS', { visible: false });
                // Send to Content Script (Visual Dots)
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { type: 'TOGGLE_ALL_MASKS', visible: false });
                });
            }
        });

        // ...
    }

    checkPostWinTrigger(resultMultiplier, targetMultiplier) {
        if (!this.exponentialConfig.postWinActive) return;

        const multiplier = parseFloat(resultMultiplier);
        const target = parseFloat(targetMultiplier || 2.0); // Default 2.0x target/objective?
        // Actually, if "Win" means "OCR > 1.00" (Round valid) -> No, Win means "Green" usually.
        // Or simply "After a win in the betting history."
        // Since we track wins in DB (`it.bet === 'win'`), we can check the LAST entry.

        // Wait a bit after round end to ensure DB is updated
        setTimeout(() => {
            const lastRec = this.dbRecords[this.dbRecords.length - 1];
            // TRIGGER ON LOSS (Martingale / Recuperación)
            if (lastRec && lastRec.bet === 'loss') {
                console.log('🔫 Trigger Exponencial (Post-Loss): DERROTA detectada. Ejecutando sistema de recuperación...');
                this.showNotification('🔫 Trigger Post-Loss: Ejecutando Sistema...', 'warning');
                // Execute configured click sequence (e.g. System 1) Directly via Python
                fetch(`${this.pythonServer}/click/exponential/1`, { method: 'POST' })
                    .then(r => r.json())
                    .then(d => {
                        if (d.success) this.showNotification('✅ Sistema Exponencial Ejecutado', 'success');
                        else this.showNotification('❌ Error ejecución exponencial', 'error');
                    });
            }
        }, 1000);
    }

    // Updated Export
    exportDatabase() {
        chrome.storage.local.get(['dbRecords'], (res) => {
            const db = res.dbRecords || [];
            if (db.length === 0) return this.showNotification('⚠️ Vacía', 'error');

            let txt = "AVIATOR TRACKER DB\n";
            txt += "Partida | Ronda | Multiplicador | Resultado | Hora\n";
            txt += "--------------------------------------------------------\n";

            db.forEach((it) => {
                const p = it.partida || '-';
                const r = it.ronda || '-';
                const m = parseFloat(it.multiplier).toFixed(2) + 'x';
                const res = it.bet ? (it.bet === 'win' ? 'WIN' : 'LOSS') : '-';
                const t = it.time || '';
                txt += `${p} | ${r} | ${m} | ${res} | ${t}\n`;
            });

            const blob = new Blob([txt], { type: 'text/plain' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `AviatorBD_${new Date().toISOString().slice(0, 10)}.txt`;
            a.click();
        });
    }

    // DRAG AND DROP & UI HELPERS
    setupDragAndDrop() {
        const draggables = document.querySelectorAll('.panel-section[draggable="true"]');
        let draggedItem = null;

        draggables.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                draggedItem = item;
                e.dataTransfer.effectAllowed = 'move';
                setTimeout(() => item.classList.add('hidden'), 0);
            });

            item.addEventListener('dragend', () => {
                draggedItem.classList.remove('hidden');
                draggedItem = null;
                this.saveSectionOrder(); // Persist order
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });

            item.addEventListener('drop', function () {
                if (this !== draggedItem) {
                    let allItems = Array.from(document.querySelectorAll('.panel-section[draggable="true"]'));
                    let draggedIndex = allItems.indexOf(draggedItem);
                    let droppedIndex = allItems.indexOf(this);

                    if (draggedIndex < droppedIndex) {
                        this.parentNode.insertBefore(draggedItem, this.nextSibling);
                    } else {
                        this.parentNode.insertBefore(draggedItem, this);
                    }
                }
            });
        });

        this.loadSectionOrder();
    }

    saveSectionOrder() {
        const order = Array.from(document.querySelectorAll('.panel-section[draggable="true"]')).map(el => el.id);
        chrome.storage.local.set({ sectionOrder: order });
    }

    loadSectionOrder() {
        chrome.storage.local.get(['sectionOrder'], (res) => {
            if (res.sectionOrder && Array.isArray(res.sectionOrder)) {
                const container = document.body; // Assuming direct body children or specific wrapper if changed
                // Actually sections are likely inside body or a main wrapper. Need to check parent.
                // Assuming they are siblings, we can reorder them.
                const sections = {};
                document.querySelectorAll('.panel-section[draggable="true"]').forEach(el => sections[el.id] = el);

                // Find reference node (the one after the dashboard/header, before the first section)
                // We'll just append them in order to the container of the first found section.
                const firstSection = document.querySelector('.panel-section');
                if (!firstSection) return;
                const parent = firstSection.parentNode;

                res.sectionOrder.forEach(id => {
                    if (sections[id]) {
                        parent.appendChild(sections[id]);
                    }
                });
            }
        });
    }

    toggleSection(id) {
        // Since we removed explicit IDs like 'content-calibration' in some versions or 
        // to match the new dynamic structure, we traverse DOM
        // Wait, did we remove them? In HTML scan, they seemed to use class 'section-content'
        // Let's use traversal from the header's click event usually, but here 'id' implies we know which one.
        // Let's assume standard ID pattern 'section-[name]' -> trigger button inside it

        // Simpler approach: If 'toggleSection' is called with a name, find the section.
        // BUT the HTML has 'section-content' as ids like 'calibration-section'.
        // Let's map strict IDs based on known section names if needed, OR fix the usage.

        let contentId;
        if (id === 'calibration') contentId = 'calibration-section';
        else if (id === 'history') contentId = 'history-section';
        else if (id === 'sniper') contentId = 'sniper-section';
        else if (id === 'exponential') contentId = 'exponential-section';
        else if (id === 'diagnostic') contentId = 'diagnostic-section';
        else if (id === 'bypass') contentId = 'bypass-section';
        else if (id === 'db') contentId = 'db-section';
        else if (id === 'ocr') contentId = 'tracking-section'; // wait, OCR uses 'tracking-section' in HTML
        else if (id === 'analysis') contentId = 'analysis-section';
        else contentId = id + '-section'; // Fallback

        const c = document.getElementById(contentId);
        // Find chevron inside the section header relative to content
        // The structure is: strict .panel-section > .section-header > .toggle-icon
        //                                         > .section-content (c)
        if (c) {
            c.classList.toggle('hidden');
            const section = c.closest('.panel-section');
            const chevron = section?.querySelector('.toggle-icon');
            if (chevron) {
                chevron.style.transform = c.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
                chevron.textContent = c.classList.contains('hidden') ? '▼' : '▲';
            }
        }
    }

    // FIX: Mejorado para manejar AudioContext suspendido
    async playAlert() {
        try {
            if (!this.audioCtx) {
                this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }

            // Manejar estado suspendido de forma asíncrona
            if (this.audioCtx.state === 'suspended') {
                await this.audioCtx.resume();
            }

            // Crear y reproducir tono
            const o = this.audioCtx.createOscillator();
            const g = this.audioCtx.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(880, this.audioCtx.currentTime);
            g.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.5);
            o.connect(g);
            g.connect(this.audioCtx.destination);
            o.start();
            o.stop(this.audioCtx.currentTime + 0.5);
        } catch (e) {
            console.warn('No se pudo reproducir sonido:', e);
        }
    }

    // EXPONENTIAL METHODS
    toggleExponential() {
        this.exponentialConfig.active = !this.exponentialConfig.active;
        this.saveExponentialConfig();
        this.renderExponentialUI();
        this.showNotification(this.exponentialConfig.active ? '🚀 Apuesta Exponencial ACTIVADA' : '⚪ Apuesta Exponencial DESACTIVADA', this.exponentialConfig.active ? 'success' : 'secondary');
    }

    saveExponentialConfig() {
        chrome.storage.local.set({ exponentialConfig: this.exponentialConfig });
        this.sendCommand('update_exponential_config', { config: this.exponentialConfig });
    }

    renderExponentialUI() {
        const btn = document.getElementById('btn-toggle-exponential');
        if (btn) {
            btn.textContent = this.exponentialConfig.active ? '🔴 Desactivar Sistema' : '🟢 Activar Sistema';
            btn.className = this.exponentialConfig.active ? 'btn btn-danger' : 'btn btn-secondary';
        }

        const sound = document.getElementById('exp-sound-toggle');
        if (sound) sound.checked = this.exponentialConfig.sound;

        const mEnable = document.getElementById('exp-multiplier-enable');
        if (mEnable) mEnable.checked = this.exponentialConfig.multiplierEnabled;

        const mValue = document.getElementById('exp-multiplier-value');
        if (mValue) mValue.value = this.exponentialConfig.multiplierValue || 1.2;

        const s1 = document.getElementById('exp-sys1-toggle');
        if (s1) s1.checked = this.exponentialConfig.sys1.active;

        const s2 = document.getElementById('exp-sys2-toggle');
        if (s2) s2.checked = this.exponentialConfig.sys2.active;

        const st1 = document.getElementById('exp1-status');
        if (st1) st1.textContent = `${this.exponentialConfig.sys1.points.length} pts`;

        const st2 = document.getElementById('exp2-status');
        if (st2) st2.textContent = `${this.exponentialConfig.sys2.points.length} pts`;
    }

    async startExponentialCalibration(sysId) {
        this.logToBypassConsole(`🎯 Iniciando calibración exponencial nativa Sistema ${sysId}`);
        try {
            const res = await fetch(`${this.pythonServer}/calibrate/exponential/${sysId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target_points: 3 })
            });
            const data = await res.json();
            if (data.success) {
                this.showNotification(`✅ Sistema ${sysId} calibrado (${data.count} puntos)`, 'success');
                // Sincronizar localmente si es necesario
                this.exponentialConfig[`sys${sysId}`].points = data.points;
                chrome.storage.local.set({ exponentialConfig: this.exponentialConfig });
                this.renderExponentialUI();
            }
        } catch (e) {
            this.showNotification('❌ Error comunicando con Python', 'error');
        }
    }

    checkServerConnectivity() {
        fetch('http://localhost:5000/status')
            .then(r => {
                const dot = document.getElementById('server-status-light');
                if (dot) {
                    dot.style.background = r.ok ? '#10b981' : '#ef4444';
                    dot.style.boxShadow = r.ok ? '0 0 5px #10b981' : '0 0 5px #ef4444';
                }
            })
            .catch(() => {
                const dot = document.getElementById('server-status-light');
                if (dot) {
                    dot.style.background = '#ef4444';
                    dot.style.boxShadow = '0 0 5px #ef4444';
                }
            });
    }

    updateDOMStatusLight(type, active) {
        const id = type === 'dom' ? 'dom-status-light' : 'iframe-status-light';
        const el = document.getElementById(id);
        if (!el) return;

        el.style.background = active ? '#10b981' : '#ef4444';
        el.style.boxShadow = active ? '0 0 4px #10b981' : 'none';

        // Timer para "apagar" si no llega pulso
        if (active) {
            if (this[`${type}Timer`]) clearTimeout(this[`${type}Timer`]);
            this[`${type}Timer`] = setTimeout(() => {
                this.updateDOMStatusLight(type, false);
            }, 3000); // 3 segundos sin pulso = desconectado
        }
    }

    toggleMaskVision(e) {
        const btn = e.currentTarget;
        const statusText = document.getElementById('mask-status-text');
        const isCurrentlyVisible = btn.textContent.includes('👁️') || btn.textContent === '👁️';
        const nextVisible = !isCurrentlyVisible;

        if (statusText) {
            statusText.textContent = nextVisible ? '👁️ Máscara' : '🙈 Máscara';
        } else {
            btn.textContent = nextVisible ? '👁️' : '🙈';
        }

        btn.style.opacity = nextVisible ? '1' : '0.5';

        this.sendCommand(nextVisible ? 'SHOW_OCR_MASK' : 'HIDE_OCR_MASK');
        this.showNotification(nextVisible ? '👁️ Máscara visible' : '🙈 Máscara oculta', 'success');
    }

    switchTrackingTab(tab) {
        document.getElementById('tab-dom')?.classList.toggle('active', tab === 'dom');
        document.getElementById('tab-ocr')?.classList.toggle('active', tab === 'ocr');
        document.getElementById('tracking-dom-content')?.classList.toggle('hidden', tab !== 'dom');
        document.getElementById('tracking-ocr-content')?.classList.toggle('hidden', tab !== 'ocr');
    }

    testExponential(sysId) {
        this.showNotification(`🖱️ Probando secuencia Sistema ${sysId}...`, 'success');
        this.sendCommand('execute_exponential', { sysId });
    }

    testSound(section) {
        this.logToBypassConsole(`🔊 Probando sonido: ${section.toUpperCase()}`);
        this.playAlert(section, true);
    }

    playAlert(type, force = false) {
        const soundEnabled = force ||
            (type === 'sniper' && document.getElementById('sniper-sound-toggle')?.checked) ||
            (type === 'exponential' && document.getElementById('exp-sound-toggle')?.checked) ||
            (type === 'bypass' && document.getElementById('bypass-sound-toggle')?.checked) ||
            (type === 'test');

        if (soundEnabled) {
            // Cada sección tiene una frecuencia única para el sintetizador
            const frequencies = {
                'sniper': 880,      // A5 (Brillante)
                'exponential': 440, // A4 (Medio)
                'bypass': 220,      // A3 (Grave/Aviso)
                'test': 660         // E5 (Neutral)
            };

            const freq = frequencies[type] || 880;

            const audio = new Audio(chrome.runtime.getURL('assets/alert.mp3'));
            audio.play().catch(e => {
                console.warn(`Audio ${type} failed, using synthesized tone (${freq}Hz)`);
                this.playSynthesizedTone(freq);
            });
        }
    }

    playSynthesizedTone(freq) {
        try {
            if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

            // Resume if suspended (user interaction requirement)
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }

            const o = this.audioCtx.createOscillator();
            const g = this.audioCtx.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
            g.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.5);
            o.connect(g);
            g.connect(this.audioCtx.destination);
            o.start();
            o.stop(this.audioCtx.currentTime + 0.5);
        } catch (e) {
            console.error("Synthesized tone failed:", e);
        }
    }

    playSynthesizedTone(freq) {
        try {
            if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

            // Resume if suspended (user interaction requirement)
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }

            const o = this.audioCtx.createOscillator();
            const g = this.audioCtx.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
            g.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.5);
            o.connect(g);
            g.connect(this.audioCtx.destination);
            o.start();
            o.stop(this.audioCtx.currentTime + 0.5);
        } catch (e) {
            console.error("Synthesized tone failed:", e);
        }
    }

    playSynthesizedTone(frequency = 880) {
        try {
            if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);

            gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.5);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.5);
        } catch (e) {
            console.error('Oscillator failed:', e);
        }
    }

    logToBypassConsole(msg, type = 'info') {
        const consoleEl = document.getElementById('bypass-error-console');
        if (!consoleEl) return;

        const date = new Date().toLocaleTimeString('es-ES', { hour12: false });
        const div = document.createElement('div');
        div.className = type;
        div.textContent = `> [${date}] ${msg}`;

        consoleEl.prepend(div);
        if (consoleEl.children.length > 50) consoleEl.lastChild.remove();
    }

    async startIndependentCalibration(btnId) { // btnId: 1, 2, or 'reload'
        console.log(`Iniciando calibración independiente para botón: ${btnId}`);
        const hint = document.getElementById('calibration-overlay-hint');
        if (hint) {
            hint.style.display = 'flex';
            hint.querySelector('p').textContent = btnId === 'reload'
                ? 'Haz click en el botón de RECARGAR de la página...'
                : `Haz click en el BOTÓN ${btnId} de apuesta...`;
        }

        // Usar fetch directo a Python (Backend Visual)
        // ID 1 -> button1, ID 2 -> button2, ID 'reload' -> buttonReload (map to 3 or specific)

        let pyId = btnId;
        if (btnId === 'reload') pyId = 3; // Asumimos ID 3 para recarga, o manejar string en server

        fetch(`${this.pythonServer}/calibrate/button/${pyId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target_points: 1 }) // Botones simples = 1 click de centro
        })
            .then(r => r.json())
            .then(res => {
                if (res.success) {
                    this.showNotification(`✅ Calibración Botón ${btnId} COMPLETADA`, 'success');
                    if (hint) hint.style.display = 'none';

                    // Update Local State
                    if (!this.calibrationData) this.calibrationData = {};
                    if (btnId === 1 || btnId === '1') this.calibrationData.button1 = true;
                    if (btnId === 2 || btnId === '2') this.calibrationData.button2 = true;
                    if (btnId === 'reload') this.calibrationData.buttonReload = true;

                    this.updateCalibrationStatus();

                    // Save to storage
                    chrome.storage.local.set({ buttonCalibration: this.calibrationData });
                } else {
                    this.showNotification('❌ Error iniciando calibración: ' + (res.message || 'Error'), 'error');
                    if (hint) hint.style.display = 'none';
                }
            })
            .catch(e => {
                console.error(e);
                this.showNotification('❌ Error conexión Python', 'error');
                if (hint) hint.style.display = 'none';
            });
    }

    async resetIndependentCalibration(btnId) {
        if (!confirm(`¿Seguro que deseas resetear la calibración del Botón ${btnId}?`)) return;
        try {
            const res = await fetch(`${this.pythonServer}/reset/button/${btnId}`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                this.showNotification(`🗑️ Calibración Botón ${btnId} reseteada`, 'success');
                this.updateCalibrationStatus();
            }
        } catch (e) {
            this.showNotification('❌ Error comunicando con Python', 'error');
        }
    }

    testSingleClick() {
        // Usar datos de calibración del Botón 1 si existen
        let clickData = {};
        if (this.calibrationData && this.calibrationData.button1Points && this.calibrationData.button1Points.length > 0) {
            // Si tenemos puntos, calculamos una "región" aproximada basada en ellos (bounding box)
            const points = this.calibrationData.button1Points;
            const xs = points.map(p => p.x);
            const ys = points.map(p => p.y);
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);

            // Centro y dimensiones
            const width = Math.max(maxX - minX, 20); // Mínimo 20px
            const height = Math.max(maxY - minY, 10);
            const x = minX + width / 2;
            const y = minY + height / 2;

            clickData = { x, y, width, height };
            this.showNotification('🖱️ Probando click en Botón 1 (Calibrado)...', 'success');
        } else {
            this.showNotification('🖱️ Probando click Genérico (Falta Calibrar)...', 'warning');
            // Si no hay calib, el server fallará o usará default si le mandamos fake
            // Mejor mandar solo check
            this.sendCommand('click_test_single');
            return;
        }

        // Llamada DIRECTA al servidor Python (Bypaseando content script para click físico real)
        fetch('http://localhost:5000/click', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clickData)
        })
            .then(r => r.json())
            .then(res => {
                if (res.success) this.showNotification('✅ Click Enviado (Python)', 'success');
                else this.showNotification('❌ Error Click Python', 'error');
            })
            .catch(e => this.showNotification('❌ Error Conexión Python', 'error'));
    }

    resetOCRData() {
        if (confirm('¿Seguro que deseas resetear la zona de captura OCR?')) {
            // Detener el OCR en el backend primero
            fetch('http://localhost:5000/ocr/control', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'stop' })
            }).catch(() => { });

            this.sendCommand('RESET_OCR_SELECTION', {}, (res) => {
                if (res?.success) {
                    this.showNotification('🗑️ Zona OCR eliminada', 'success');
                }
            });
        }
    }

    renderFilterSteps(analysis) {
        const list = document.getElementById('filters-status-container');
        if (!list) return;

        // Estado de calibración
        if (!analysis || analysis.stage === 'Calibración') {
            list.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: #94a3b8; font-size: 11px; padding: 10px;">
                📊 Calibrando historial (mín. 12 rondas)...
            </div>`;
            return;
        }

        const filters = analysis.filters || {};
        const filterNames = {
            canal: 'F1: Canal',
            continuidad: 'F2: Continuidad',
            densidad: 'F3: Densidad',
            antiRosa: 'F4: Anti-Rosa',
            soporte: 'F5: Soporte'
        };

        // Renderizar filtros con animación
        list.innerHTML = Object.entries(filterNames).map(([key, name]) => {
            const ok = filters[key];
            const color = ok === true ? '#10b981' : (ok === false ? '#ef4444' : '#64748b');
            const icon = ok === true ? '✅' : (ok === false ? '❌' : '⏳');
            const bgColor = ok === true ? 'rgba(16, 185, 129, 0.1)' : (ok === false ? 'rgba(239, 68, 68, 0.1)' : 'rgba(148, 163, 184, 0.05)');

            return `<div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; padding: 6px 8px; border-radius: 4px; background: ${bgColor}; border: 1px solid ${color}33; transition: all 0.3s ease;">
                <span style="color: #cbd5e1;">${name}</span>
                <span style="color: ${color}; font-size: 14px; font-weight: bold;">${icon}</span>
            </div>`;
        }).join('');

        // DECISIÓN FINAL Y AUTO-BET
        const allPassed = Object.values(filters).every(v => v === true);

        if (allPassed && analysis.decision) {
            // Mostrar indicador de "LISTO PARA APOSTAR"
            list.innerHTML += `<div style="grid-column: 1 / -1; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; font-weight: 800; padding: 10px; border-radius: 6px; margin-top: 8px; animation: pulse 1s infinite; box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);">
                🎯 CONDICIONES CUMPLIDAS - APOSTANDO...
            </div>`;

            // AUTO-BET: Ejecutar apuesta si Sniper está activo
            const sniperActive = document.getElementById('toggle-sniper')?.checked;
            if (sniperActive && !this.lastAutobet) {
                this.lastAutobet = Date.now();
                this.showNotification('🎯 SNIPER ACTIVADO - Ejecutando apuesta...', 'success');

                // Llamar al backend para ejecutar click
                fetch(`${this.pythonServer}/click/button/1`, { method: 'POST' })
                    .then(r => r.json())
                    .then(data => {
                        if (data.success) {
                            this.showNotification('✅ Apuesta ejecutada automáticamente', 'success');
                            // Registrar click
                            fetch(`${this.pythonServer}/api/report_click`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ type: 'apostar' })
                            });
                        }
                    })
                    .catch(e => console.error('Error auto-bet:', e));

                // Cooldown de 10s para evitar spam
                setTimeout(() => this.lastAutobet = null, 10000);
            }
        } else if (analysis.failedFilter) {
            // Mostrar razón del fallo
            list.innerHTML += `<div style="grid-column: 1 / -1; text-align: center; background: rgba(239, 68, 68, 0.1); color: #ef4444; font-size: 10px; padding: 8px; border-radius: 4px; margin-top: 8px; border: 1px solid #ef444433;">
                ${analysis.reason || '⚠️ Condiciones no cumplidas'}
            </div>`;
        }
    }

    setupTooltips() {
        const tooltips = [
            { icon: 'pattern-info', tip: 'pattern-tooltip' },
            { icon: 'filters-info', tip: 'filters-tooltip' },
            { icon: 'stats-info', tip: 'stats-tooltip' },
            { icon: 'history-legend-icon', tip: 'history-legend-tooltip' },
            { icon: 'btns-info', tip: 'btns-tooltip' },
            { icon: 'exp-info-header', tip: 'exp-tooltip' },
            { icon: 'sniper-info-header', tip: 'sniper-tooltip' },
            { icon: 'clicks-info', tip: 'clicks-tooltip' },
            { icon: 'bypass-info', tip: 'bypass-tooltip' }
        ];

        tooltips.forEach(({ icon, tip }) => {
            const iconEl = document.getElementById(icon);
            const tipEl = document.getElementById(tip);

            if (iconEl && tipEl) {
                iconEl.addEventListener('mouseenter', () => {
                    tipEl.classList.add('show');
                    // Posicionamiento dinámico relativo al icono
                    const rect = iconEl.getBoundingClientRect();
                    tipEl.style.top = (rect.top + window.scrollY - 10) + 'px';
                });

                iconEl.addEventListener('mouseleave', () => {
                    tipEl.classList.remove('show');
                });
            }
        });
    }

    checkHealth() {
        const now = Date.now();

        // Check DOM / Iframe (Pulsos desde content.js)
        if (now - this.healthStatus.domAt > 15000) {
            this.logToBypassConsole('⚠️ Alerta: Pérdida de conexión con DOM principal', 'err');
            this.playAlert('bypass');
            this.healthStatus.domAt = now; // Evitar spam
        }

        // El check de servidor ya se hace en checkServerConnectivity pero podemos integrarlo aquí
    }

    // ==========================================
    // TOP PANEL LOGIC
    // ==========================================
    updateRoundCounter(val) {
        const el = document.getElementById('ronda-number');
        if (el) el.textContent = val || 0;
    }

    startSessionTimer() {
        if (this.sessionTimerInterval) return; // Already running

        this.sessionStartTime = Date.now();
        this.sessionTimerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.sessionStartTime) / 1000);
            const hours = Math.floor(elapsed / 3600);
            const minutes = Math.floor((elapsed % 3600) / 60);
            const seconds = elapsed % 60;

            const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            const el = document.getElementById('session-time');
            if (el) el.textContent = timeStr;
        }, 1000);
    }

    // ==========================================
    // EXPONENTIAL BETTING METHODS
    // ==========================================
    // ==========================================
    // TEST METHODS FOR DIAGNOSTIC BUTTONS
    // ==========================================
    async testApostar() {
        this.showNotification('🧪 Probando clicks en Botón 1 y 2...', 'info');
        try {
            // Click en Botón 1
            const res1 = await fetch(`${this.pythonServer}/click/button/1`, { method: 'POST' });
            const data1 = await res1.json();

            if (!data1.success) {
                this.showNotification('❌ Error en Botón 1: ' + (data1.error || 'Click falló'), 'error');
                return;
            }

            // Esperar un momento entre clicks
            await new Promise(resolve => setTimeout(resolve, 200));

            // Click en Botón 2
            const res2 = await fetch(`${this.pythonServer}/click/button/2`, { method: 'POST' });
            const data2 = await res2.json();

            if (data2.success) {
                this.showNotification('✅ Clicks en Botón 1 y 2 exitosos', 'success');
            } else {
                this.showNotification('⚠️ Botón 1 OK, Botón 2 falló: ' + (data2.error || 'Error'), 'warning');
            }
        } catch (e) {
            this.showNotification('❌ Error: Inicia el servicio Python', 'error');
        }
    }

    async testFalso() {
        this.showNotification('🧪 Probando click falso (Apostar + Cancelar)...', 'info');
        try {
            const res = await fetch(`${this.pythonServer}/api/fake_bet`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                this.showNotification('✅ Click Falso exitoso', 'success');
            } else {
                this.showNotification('❌ Error: ' + (data.error || 'Click falló'), 'error');
            }
        } catch (e) {
            this.showNotification('❌ Error: Inicia el servicio Python', 'error');
        }
    }

    async testExponentialBet() {
        this.showNotification('🧪 Probando apuesta exponencial...', 'info');
        try {
            const res = await fetch(`${this.pythonServer}/click/exponential/1`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                this.showNotification('✅ Test Exponencial exitoso', 'success');
            } else {
                this.showNotification('❌ Error: ' + (data.error || 'Test falló'), 'error');
            }
        } catch (e) {
            this.showNotification('❌ Error: Inicia el servicio Python', 'error');
        }
    }

    async testReload() {
        this.showNotification('🔄 Probando Recarga...', 'info');

        // 1. Intentar por coordenadas (Python) si está calibrado
        if (this.calibrationData && this.calibrationData.buttonReload) {
            try {
                this.showNotification('🖱️ Ejecutando click de recarga (Coordenadas)...', 'info');
                await fetch(`${this.pythonServer}/api/reload_page`, { method: 'POST' });
                this.showNotification('✅ Click de recarga enviado', 'success');
                return;
            } catch (e) {
                console.warn('Fallo click python, usando fallback', e);
            }
        }

        // 2. Fallback: Recarga de pestaña (Nativo)
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.reload(tabs[0].id);
                this.showNotification('✅ Recarga nativa ejecutada', 'success');
            }
        });
    }

    clearHistory() {
        if (confirm('¿Limpiar el historial visual? (No afecta la base de datos)')) {
            this.history = [];
            this.renderHistory();
            this.showNotification('🗑️ Historial limpiado', 'success');
        }
    }

    // ==========================================
    // EXPONENTIAL BETTING CALIBRATION
    // ==========================================
    async startExponentialCalibration(sysId) {
        this.showNotification(`📏 Iniciando calibración Sistema ${sysId}...`, 'info');
        try {
            const res = await fetch(`${this.pythonServer}/calibrate/exponential/${sysId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target_points: 5 })
            });
            const data = await res.json();
            if (data.success) {
                this.showNotification(`✅ Sistema ${sysId} calibrado (${data.count} puntos)`, 'success');
            } else {
                this.showNotification('❌ Calibración cancelada', 'error');
            }
        } catch (e) {
            this.showNotification('❌ Error: Inicia el servicio Python', 'error');
        }
    }

    testExponential(sysId) {
        this.showNotification(`🧪 Probando Sistema ${sysId}...`, 'info');
        fetch(`${this.pythonServer}/click/exponential/${sysId}`, { method: 'POST' })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    this.showNotification(`✅ Test Sistema ${sysId} exitoso`, 'success');
                } else {
                    this.showNotification('❌ Error: ' + (data.error || 'Test falló'), 'error');
                }
            })
            .catch(e => this.showNotification('❌ Error: Inicia el servicio Python', 'error'));
    }

    // ==========================================
    // VISUAL CALIBRATION TEST
    // ==========================================
    async testVisualCalibration() {
        this.showNotification('👁️ Mostrando máscaras en Python...', 'info');
        try {
            // Nota: Podríamos implementar un modo de "preview" en Python que dibuje los rectángulos actuales
            await fetch(`${this.pythonServer}/preview/masks`, { method: 'POST' });
        } catch (e) {
            this.showNotification('❌ Servicio Python desconectado', 'error');
        }
    }
}

// Utility for safe error logging
function logError(msg, error = null) {
    console.error(msg, error);
    const debugConsole = document.getElementById('debug-console');
    if (debugConsole) {
        debugConsole.style.display = 'block';
        debugConsole.textContent += `[${new Date().toLocaleTimeString()}] ❌ ${msg}\n${error ? error.stack || error.message : ''}\n---\n`;
    }
}

// Global Error Handlers
window.onerror = function (msg, url, line, col, error) {
    logError(`Global Error: ${msg} (${line}:${col})`, error);
    return false;
};

window.addEventListener('unhandledrejection', function (event) {
    logError(`Unhandled Promise: ${event.reason}`, event.reason);
});

document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('🚀 Iniciando SidePanel...');
        window.sidePanelController = new SidePanelController();
        console.log('✅ SidePanel Consolidated V3.2 (Safe Mode)');
    } catch (e) {
        logError('FATAL: Falló la inicialización del controlador', e);
    }
});

