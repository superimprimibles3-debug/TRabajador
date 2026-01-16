/**
 * Simulator V2 - High Flyer Pro
 * Engine with Kernel V5.2 Logic
 */

class SimulatorEngine {
    constructor() {
        this.history = []; // Full multiplier history from file
        this.currentIndex = 0;
        this.balance = 7190.48;
        this.initialBalance = 7190.48;
        this.isRunning = false;
        this.speed = 1000;

        // Simulation Stats
        this.rounds = 0;
        this.totalBets = 0;
        this.wins = 0;
        this.losses = 0;

        // Kernel Config (V5.2)
        this.config = {
            minCanal: 1.65,
            maxCanal: 2.85,
            minContinuidad: 1.25,
            maxRosas: 40.0,
            targetMultiplier: 1.11 // Fixed target for presence/quick bets
        };

        this.currentHistory = []; // Historical data seen by the "bot" so far
        this.initEventListeners();
    }

    initEventListeners() {
        document.getElementById('toggle-panel').addEventListener('click', () => {
            document.getElementById('control-panel').classList.toggle('collapsed');
        });

        document.getElementById('db-upload').addEventListener('change', (e) => this.handleFileUpload(e));

        document.getElementById('start-sim').addEventListener('click', () => {
            if (this.isRunning) {
                this.stop();
            } else {
                this.start();
            }
        });

        document.getElementById('reset-sim').addEventListener('click', () => this.reset());
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            this.parseData(content);
        };
        reader.readAsText(file);
    }

    parseData(content) {
        // Simple parser for TXT/CSV
        // Expected: list of numbers or lines like "multiplier, timestamp"
        const lines = content.split(/\r?\n/);
        const data = [];

        lines.forEach(line => {
            const parts = line.split(/[,\s\t]+/);
            // Try to find the first number in the line
            for (let part of parts) {
                const val = parseFloat(part.replace('x', '').replace(',', '.'));
                if (!isNaN(val) && val > 0) {
                    data.push(val);
                    break;
                }
            }
        });

        if (data.length > 0) {
            this.history = data;
            alert(`Cargados ${data.length} registros exitosamente.`);
            console.log("Data loaded:", this.history.slice(0, 10));
        } else {
            alert("No se detectaron datos válidos en el archivo.");
        }
    }

    async start() {
        if (this.history.length === 0) {
            alert("Por favor, carga una base de datos primero.");
            return;
        }

        this.isRunning = true;
        document.getElementById('start-sim').textContent = "Detener Simulación";
        document.getElementById('start-sim').classList.replace('btn-primary', 'btn-secondary');

        // Initial 10 rounds as "context"
        this.currentIndex = Math.min(10, this.history.length);
        this.currentHistory = this.history.slice(0, this.currentIndex);
        this.renderHistory();

        this.runStep();
    }

    stop() {
        this.isRunning = false;
        document.getElementById('start-sim').textContent = "Iniciar Simulación";
        document.getElementById('start-sim').classList.replace('btn-secondary', 'btn-primary');
    }

    reset() {
        this.stop();
        this.currentIndex = 0;
        this.balance = parseFloat(document.getElementById('initial-balance').value) || 7190.48;
        this.initialBalance = this.balance;
        this.rounds = 0;
        this.totalBets = 0;
        this.wins = 0;
        this.losses = 0;
        this.updateUI();
        document.getElementById('history-list').innerHTML = '';
        document.getElementById('multiplier-text').textContent = "1.00x";
        document.getElementById('game-status').textContent = "ESPERE AL SIGUIENTE JUEGO";
    }

    addLog(message, type = 'info') {
        const container = document.getElementById('activity-logs');
        const div = document.createElement('div');
        div.className = `log-entry ${type}`;
        div.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        container.prepend(div);
        if (container.children.length > 20) container.lastChild.remove();
    }

    async runStep() {
        if (!this.isRunning || this.currentIndex >= this.history.length) {
            this.addLog("Fin de los datos históricos.", "info");
            this.stop();
            return;
        }

        const nextMultiplier = this.history[this.currentIndex];

        // 1. PHASE: Waiting / Analyze
        document.getElementById('game-status').textContent = "ESPERE AL SIGUIENTE JUEGO";
        document.getElementById('multiplier-text').style.color = "white";

        // Kernel V5.2 Analysis
        const analysis = this.analyzeSignal();
        this.updateExtensionMock(analysis);

        // Simulated Bet?
        let activeBet = false;
        const betAmount = 50.0;
        const targetOutput = 1.11;

        if (analysis.decision) {
            activeBet = true;
            this.balance -= betAmount * 2;
            this.totalBets++;
            this.updateUI();
            this.addLog(`Apuesta realizada: $${betAmount * 2} (x2)`, "bet");

            document.getElementById('btn-bet-1').textContent = "CANCELAR";
            document.getElementById('btn-bet-1').style.background = "#fd5f55";
            document.getElementById('btn-bet-2').textContent = "CANCELAR";
            document.getElementById('btn-bet-2').style.background = "#fd5f55";
        }

        const speed = parseInt(document.getElementById('sim-speed').value) || 1000;
        await this.sleep(speed * 0.4);

        // 2. PHASE: Flying
        document.getElementById('game-status').textContent = "VOLANDO...";
        await this.animateMultiplier(nextMultiplier);

        // 3. PHASE: Result
        document.getElementById('game-status').textContent = "FLEW AWAY!";
        document.getElementById('multiplier-text').style.color = "#ff4444";

        // Process Bet result
        if (activeBet) {
            if (nextMultiplier >= targetOutput) {
                const winAmount = (betAmount * targetOutput) * 2;
                this.balance += winAmount;
                this.wins++;
                this.addLog(`¡GANADO! +$${winAmount.toFixed(2)} (Target: ${targetOutput}x)`, "win");
            } else {
                this.losses++;
                this.addLog(`PERDIDO. -$${(betAmount * 2).toFixed(2)} (Crasheó en: ${nextMultiplier.toFixed(2)}x)`, "loss");
            }
            document.getElementById('btn-bet-1').innerHTML = `CONFIRMAR APUESTA <div class="amount">50,00 $</div>`;
            document.getElementById('btn-bet-1').style.background = "var(--accent-green)";
            document.getElementById('btn-bet-2').innerHTML = `CONFIRMAR APUESTA <div class="amount">50,00 $</div>`;
            document.getElementById('btn-bet-2').style.background = "var(--accent-green)";
        }

        // Add to persistent history
        this.currentHistory.unshift(nextMultiplier);
        if (this.currentHistory.length > 50) this.currentHistory.pop();
        this.addHistoryBubble(nextMultiplier);

        this.rounds++;
        this.currentIndex++;
        this.updateUI();

        // Check limits
        const targetProfit = parseFloat(document.getElementById('target-profit').value);
        const stopLoss = parseFloat(document.getElementById('stop-loss').value);

        if (this.balance >= (this.initialBalance + targetProfit)) {
            this.addLog("✅ META DE GANANCIA ALCANZADA", "win");
            this.stop();
            return;
        }
        if (this.balance <= (this.initialBalance - stopLoss)) {
            this.addLog("❌ STOP LOSS ALCANZADO", "loss");
            this.stop();
            return;
        }

        setTimeout(() => this.runStep(), speed * 0.2);
    }

    analyzeSignal() {
        const lastValue = this.currentHistory[0];
        const penultimo = this.currentHistory[1];

        const filters = {
            canal: lastValue >= this.config.minCanal && lastValue <= this.config.maxCanal,
            continuidad: penultimo > this.config.minContinuidad,
            densidad: this.currentHistory.slice(0, 5).filter(v => v < 1.30).length <= 1,
            antiRosa: !this.currentHistory.slice(0, 10).some(v => v > 40.0)
        };

        const decision = filters.canal && filters.continuidad && filters.densidad && filters.antiRosa;

        return { filters, decision };
    }

    updateExtensionMock(analysis) {
        const steps = document.querySelectorAll('.extension-mock .step');
        // Simple mapping for display
        if (analysis.filters.canal) {
            steps[0].className = "step success";
            steps[0].textContent = "Canal OK (1.65 - 2.85)";
        } else {
            steps[0].className = "step warning";
            steps[0].textContent = "Fuera de Canal";
        }

        if (analysis.decision) {
            steps[1].className = "step success";
            steps[1].textContent = "¡SEÑAL CONFIRMADA!";
        } else {
            steps[1].className = "step warning";
            steps[1].textContent = "Esperando Patrón...";
        }
    }

    async animateMultiplier(target) {
        const el = document.getElementById('multiplier-text');
        const duration = 1500; // Fixed duration for animation
        const start = Date.now();

        return new Promise(resolve => {
            const timer = setInterval(() => {
                const now = Date.now();
                const progress = Math.min(1, (now - start) / duration);

                // Real aviator multiplier grows exponentially but for sim we use linear/curved
                const current = 1 + (target - 1) * progress;
                el.textContent = current.toFixed(2) + "x";

                if (progress >= 1) {
                    clearInterval(timer);
                    el.textContent = target.toFixed(2) + "x";
                    resolve();
                }
            }, 50);
        });
    }

    updateUI() {
        document.getElementById('current-balance').textContent = this.balance.toFixed(2).replace('.', ',') + " $";
        document.getElementById('stat-rounds').textContent = this.rounds;

        const profit = this.balance - this.initialBalance;
        const profitEl = document.getElementById('stat-profit');
        profitEl.textContent = (profit >= 0 ? '+' : '') + profit.toFixed(2) + " $";
        profitEl.style.color = profit >= 0 ? "var(--accent-green)" : "#ff4444";

        const roi = (profit / this.initialBalance) * 100;
        document.getElementById('stat-roi').textContent = roi.toFixed(2) + "%";
    }

    renderHistory() {
        const container = document.getElementById('history-list');
        container.innerHTML = '';
        this.currentHistory.slice(0, 20).forEach(val => this.addHistoryBubble(val, false));
    }

    addHistoryBubble(val, prepend = true) {
        const container = document.getElementById('history-list');
        const span = document.createElement('span');
        let color = "blue";
        if (val > 2 && val < 10) color = "purple";
        if (val >= 10) color = "dark-pink";

        span.className = `bubble ${color}`;
        span.textContent = val.toFixed(2) + "x";

        if (prepend) {
            container.prepend(span);
            if (container.children.length > 20) container.lastChild.remove();
        } else {
            container.appendChild(span);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    setupExtensionListeners() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            console.log("Simulador recibió acción:", message.action);

            if (message.action === 'start_calibration') {
                alert("Simulador: Calibración iniciada. Haz clic en los botones de apuesta del simulador.");
                sendResponse({ success: true });
            }

            if (message.action === 'select_multiplier_element') {
                alert("Simulador: Selección de multiplicador activada. Haz clic en una burbuja del historial.");
                sendResponse({ success: true });
            }

            if (message.action === 'select_balance_element') {
                alert("Simulador: Selección de balance activada. Haz clic en el balance arriba a la derecha.");
                sendResponse({ success: true });
            }

            if (message.action === 'reset_round_counter') {
                this.rounds = 0;
                this.updateUI();
                sendResponse({ success: true });
            }

            if (message.action === 'reset_calibration') {
                this.addLog("Simulador: Calibración reseteada", "info");
                sendResponse({ success: true });
            }

            if (message.action === 'click_calibrated') {
                this.addLog("Simulador: Probando clics calibrados ✅", "win");
                sendResponse({ success: true });
            }

            if (message.action === 'toggle_presence') {
                this.isActive = message.enabled;
                this.addLog(`Anti-Ausencia ${this.isActive ? 'ACTIVADO' : 'DESACTIVADO'}`, this.isActive ? 'win' : 'info');
                sendResponse({ success: true });
            }

            if (message.action === 'reset_multiplier_element' || message.action === 'reset_balance_element') {
                sendResponse({ success: true });
            }

            if (message.action === 'show_click_report' || message.action === 'export_click_report') {
                sendResponse({ success: true });
            }

            if (message.action === 'get_click_report') {
                sendResponse({
                    success: true,
                    report: {
                        summary: {
                            totalClicks: 0,
                            revertedClicks: 0,
                            successRate: "100%",
                            presenceOk: 0,
                            presenceFail: 0
                        },
                        recentClicks: []
                    }
                });
            }
        });
    }
}

// Initialize
window.simulator = new SimulatorEngine();
window.simulator.setupExtensionListeners();
