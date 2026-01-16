print("🔧 Insertando métodos de estrategias...")

# Leer archivo línea por línea
with open(r'd:\Trabajador\aviator-tracker-extension\sidepanel.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Código a insertar después de la línea 158 (cierre de setupEventListeners)
methods = '''
    setupStrategyListeners() {
        document.getElementById('strategiesToggle')?.addEventListener('click', () => {
            const content = document.getElementById('strategiesContent');
            const arrow = document.getElementById('strategiesArrow');
            if (content && arrow) {
                if (content.style.display === 'none') {
                    content.style.display = 'block';
                    arrow.textContent = '▼';
                } else {
                    content.style.display = 'none';
                    arrow.textContent = '▶';
                }
            }
        });
        document.getElementById('strategySelector')?.addEventListener('change', (e) => {
            this.showStrategyConfig(e.target.value);
        });
        document.getElementById('activateStrategyBtn')?.addEventListener('click', () => {
            this.activateStrategy();
        });
    }

    showStrategyConfig(strategy) {
        document.querySelectorAll('.strategy-config').forEach(el => el.style.display = 'none');
        if (strategy !== 'none') {
            const configEl = document.getElementById(`strategy_${strategy}`);
            if (configEl) configEl.style.display = 'block';
        }
    }

    activateStrategy() {
        const selected = document.getElementById('strategySelector').value;
        if (selected === 'none') {
            this.activeStrategy = 'none';
            document.getElementById('strategyStatus').textContent = 'Estrategia desactivada';
            return;
        }
        this.loadStrategyConfig(selected);
        this.activeStrategy = selected;
        const stratName = document.getElementById('strategySelector').selectedOptions[0].text;
        document.getElementById('strategyStatus').textContent = `✅ ${stratName} activada`;
        document.getElementById('strategyStatus').style.color = '#4ade80';
    }

    loadStrategyConfig(strategy) {
        switch(strategy) {
            case 'martingale':
                this.strategies.martingale.baseBet = parseFloat(document.getElementById('mg_base').value);
                this.strategies.martingale.target = parseFloat(document.getElementById('mg_target').value);
                this.strategies.martingale.maxDoubles = parseInt(document.getElementById('mg_maxDoubles').value);
                this.strategies.martingale.currentBet = this.strategies.martingale.baseBet;
                this.strategies.martingale.lossStreak = 0;
                break;
            case 'anti_martingale':
                this.strategies.anti_martingale.baseBet = parseFloat(document.getElementById('am_base').value);
                this.strategies.anti_martingale.target = parseFloat(document.getElementById('am_target').value);
                this.strategies.anti_martingale.maxWins = parseInt(document.getElementById('am_maxWins').value);
                this.strategies.anti_martingale.currentBet = this.strategies.anti_martingale.baseBet;
                this.strategies.anti_martingale.winStreak = 0;
                break;
            case 'fibonacci':
                this.strategies.fibonacci.baseBet = parseFloat(document.getElementById('fib_base').value);
                this.strategies.fibonacci.target = parseFloat(document.getElementById('fib_target').value);
                this.strategies.fibonacci.maxPosition = parseInt(document.getElementById('fib_maxPos').value);
                this.strategies.fibonacci.currentPosition = 0;
                break;
            case 'dalembert':
                this.strategies.dalembert.baseBet = parseFloat(document.getElementById('da_base').value);
                this.strategies.dalembert.increment = parseFloat(document.getElementById('da_increment').value);
                this.strategies.dalembert.target = parseFloat(document.getElementById('da_target').value);
                this.strategies.dalembert.minBet = parseFloat(document.getElementById('da_min').value);
                this.strategies.dalembert.currentBet = this.strategies.dalembert.baseBet;
                break;
            case 'conservative':
                this.strategies.conservative.bet = parseFloat(document.getElementById('cons_bet').value);
                this.strategies.conservative.target1 = parseFloat(document.getElementById('cons_target1').value);
                this.strategies.conservative.target2 = parseFloat(document.getElementById('cons_target2').value);
                this.strategies.conservative.alternate = document.getElementById('cons_alternate').checked;
                this.strategies.conservative.useTarget1 = true;
                break;
            case 'high_risk':
                this.strategies.high_risk.bankroll = parseFloat(document.getElementById('hr_bankroll').value);
                this.strategies.high_risk.percent = parseFloat(document.getElementById('hr_percent').value);
                this.strategies.high_risk.target = parseFloat(document.getElementById('hr_target').value);
                this.strategies.high_risk.stopLoss = parseFloat(document.getElementById('hr_stopLoss').value);
                this.strategies.high_risk.initialBankroll = this.strategies.high_risk.bankroll;
                break;
            case 'dual':
                this.strategies.dual.bet1 = parseFloat(document.getElementById('dual_bet1').value);
                this.strategies.dual.target1 = parseFloat(document.getElementById('dual_target1').value);
                this.strategies.dual.bet2 = parseFloat(document.getElementById('dual_bet2').value);
                this.strategies.dual.target2 = parseFloat(document.getElementById('dual_target2').value);
                break;
        }
    }

    calculateStrategyBet(lastResult) {
        if (this.activeStrategy === 'none') return null;
        switch(this.activeStrategy) {
            case 'martingale': return this.calculateMartingale(lastResult);
            case 'anti_martingale': return this.calculateAntiMartingale(lastResult);
            case 'fibonacci': return this.calculateFibonacci(lastResult);
            case 'dalembert': return this.calculateDAlembert(lastResult);
            case 'conservative': return this.calculateConservative();
            case 'high_risk': return this.calculateHighRisk();
            case 'dual': return this.calculateDual();
            default: return null;
        }
    }

    calculateMartingale(lastResult) {
        const config = this.strategies.martingale;
        if (lastResult === 'loss') {
            config.lossStreak++;
            if (config.lossStreak <= config.maxDoubles) config.currentBet *= 2;
        } else if (lastResult === 'win') {
            config.lossStreak = 0;
            config.currentBet = config.baseBet;
        }
        return { amount: config.currentBet, target: config.target };
    }

    calculateAntiMartingale(lastResult) {
        const config = this.strategies.anti_martingale;
        if (lastResult === 'win') {
            config.winStreak++;
            if (config.winStreak < config.maxWins) {
                config.currentBet *= 2;
            } else {
                config.winStreak = 0;
                config.currentBet = config.baseBet;
            }
        } else if (lastResult === 'loss') {
            config.winStreak = 0;
            config.currentBet = config.baseBet;
        }
        return { amount: config.currentBet, target: config.target };
    }

    calculateFibonacci(lastResult) {
        const config = this.strategies.fibonacci;
        if (lastResult === 'loss') {
            config.currentPosition = Math.min(config.currentPosition + 1, config.maxPosition);
        } else if (lastResult === 'win') {
            config.currentPosition = Math.max(0, config.currentPosition - 2);
        }
        const multiplier = config.sequence[config.currentPosition];
        return { amount: config.baseBet * multiplier, target: config.target };
    }

    calculateDAlembert(lastResult) {
        const config = this.strategies.dalembert;
        if (lastResult === 'loss') {
            config.currentBet += config.increment;
        } else if (lastResult === 'win') {
            config.currentBet = Math.max(config.minBet, config.currentBet - config.increment);
        }
        return { amount: config.currentBet, target: config.target };
    }

    calculateConservative() {
        const config = this.strategies.conservative;
        let target = config.target1;
        if (config.alternate) {
            target = config.useTarget1 ? config.target1 : config.target2;
            config.useTarget1 = !config.useTarget1;
        }
        return { amount: config.bet, target: target };
    }

    calculateHighRisk() {
        const config = this.strategies.high_risk;
        const lossPercent = ((config.initialBankroll - config.bankroll) / config.initialBankroll) * 100;
        if (lossPercent >= config.stopLoss) {
            this.activeStrategy = 'none';
            document.getElementById('strategyStatus').textContent = '🛑 Límite de pérdidas alcanzado';
            document.getElementById('strategyStatus').style.color = '#f87171';
            return null;
        }
        const betAmount = (config.bankroll * config.percent) / 100;
        return { amount: betAmount, target: config.target };
    }

    calculateDual() {
        const config = this.strategies.dual;
        return {
            dual: true,
            bet1: { amount: config.bet1, target: config.target1 },
            bet2: { amount: config.bet2, target: config.target2 }
        };
    }

'''

# Insertar después de la línea 158 (índice 157)
lines.insert(158, methods)

# Guardar
with open(r'd:\Trabajador\aviator-tracker-extension\sidepanel.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("✅ Métodos insertados correctamente")
