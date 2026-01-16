document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inicializar DB e intentar cargar datos
    await aviatorDB.init();
    const allMultipliers = await aviatorDB.getAll();
    const result = await chrome.storage.local.get(['sessionStats']);

    const multipliers = allMultipliers || [];
    const session = result.sessionStats || { wins: 0, losses: 0, profit: 0 };

    // Mostrar los últimos 300 en la tabla para no saturar el DOM, 
    // pero usar TODOS para las estadísticas de frecuencia.
    const lastMultipliers = [...multipliers].slice(-300).reverse();

    // Análisis de Patrones Avanzado con Estadísticas
    const getAnalysisReport = () => {
        if (lastMultipliers.length < 30) {
            return {
                trend: 'Datos insuficientes',
                advice: 'Se requieren al menos 30 rondas para análisis confiable.',
                strat: 'N/A',
                confidence: 0,
                stats: { ma10: '-', ma30: '-', stdDev: '-', volatility: '-' }
            };
        }

        const recent10 = lastMultipliers.slice(0, 10).map(m => m.multiplier);
        const recent30 = lastMultipliers.slice(0, 30).map(m => m.multiplier);
        const recent100 = lastMultipliers.slice(0, Math.min(100, lastMultipliers.length)).map(m => m.multiplier);

        // Calcular medias móviles
        const ma10 = recent10.reduce((a, b) => a + b, 0) / recent10.length;
        const ma30 = recent30.reduce((a, b) => a + b, 0) / recent30.length;
        const ma100 = recent100.reduce((a, b) => a + b, 0) / recent100.length;

        // Calcular desviación estándar
        const variance30 = recent30.reduce((sum, val) => sum + Math.pow(val - ma30, 2), 0) / recent30.length;
        const stdDev = Math.sqrt(variance30);

        // Detectar tendencia
        let trend = 'Neutral';
        let advice = 'Mantener estrategia equilibrada.';
        let strat = 'Slot 2 (2.0x)';
        let confidence = 50;

        // Análisis de volatilidad
        const volatility = stdDev / ma30;

        if (volatility < 0.5) {
            trend = 'Baja Volatilidad (Estable)';
            advice = 'El juego muestra comportamiento predecible. Objetivos conservadores (1.50x - 2.00x) tienen alta probabilidad.';
            strat = 'Slot 1 (1.50x)';
            confidence = 70;
        } else if (volatility > 1.5) {
            trend = 'Alta Volatilidad (Errático)';
            advice = 'Varianza extrema detectada. Riesgo elevado. Considerar objetivos muy conservadores o pausar.';
            strat = 'PRECAUCIÓN (1.20x o menos)';
            confidence = 40;
        }

        // Detectar tendencia alcista/bajista
        if (ma10 > ma30 * 1.1) {
            trend += ' + Tendencia Alcista';
            advice = 'Las últimas 10 rondas muestran valores superiores al promedio. Posible oportunidad para objetivos medios (2.5x - 4.0x).';
            strat = 'Slot 3 (3.0x)';
            confidence = 65;
        } else if (ma10 < ma30 * 0.9) {
            trend += ' + Tendencia Bajista';
            advice = 'Las últimas 10 rondas muestran valores inferiores al promedio. Recomendación: objetivos muy conservadores.';
            strat = 'Slot 1 (1.50x)';
            confidence = 75;
        }

        // Detectar picos recientes
        const recentMax = Math.max(...recent10);
        if (recentMax > 15) {
            trend += ' + ALERTA DE PICO';
            advice = `¡ADVERTENCIA! Pico de ${recentMax.toFixed(2)}x detectado en últimas 10 rondas. Históricamente, tras valores >15x suele haber corrección. Recomendación: PAUSAR 3-5 rondas.`;
            strat = 'SEGURIDAD (STOP)';
            confidence = 85;
        }

        // Detectar rachas
        const lowStreak = recent10.filter(v => v < 1.50).length;
        const highStreak = recent10.filter(v => v >= 3.00).length;

        if (lowStreak >= 7) {
            trend = 'Racha Fría Extrema';
            advice = 'Frecuencia anormal de crashes. Posible fase de recuperación próxima. Objetivos ultra-conservadores (1.10x - 1.30x).';
            strat = 'MICRO-OBJETIVOS (1.20x)';
            confidence = 60;
        } else if (highStreak >= 6) {
            trend = 'Racha Caliente';
            advice = 'Frecuencia alta de multiplicadores elevados. Aprovechar mientras dure, pero preparar salida.';
            strat = 'Slot 4 (5.0x)';
            confidence = 55;
        }

        return {
            trend,
            advice,
            strat,
            confidence,
            stats: {
                ma10: ma10.toFixed(2),
                ma30: ma30.toFixed(2),
                stdDev: stdDev.toFixed(2),
                volatility: (volatility * 100).toFixed(1) + '%'
            }
        };
    };

    const analysis = getAnalysisReport();

    // Actualizar badges y análisis
    document.getElementById('trendBadge').textContent = analysis.trend;
    document.getElementById('adviceText').textContent = analysis.advice;
    document.getElementById('stratBadge').textContent = analysis.strat;

    // Actualizar métricas de sesión
    document.getElementById('sessionWins').textContent = session.wins;
    document.getElementById('sessionLosses').textContent = session.losses;
    const profitEl = document.getElementById('sessionProfit');
    profitEl.textContent = `ARS ${session.profit.toFixed(2)}`;
    profitEl.style.color = session.profit >= 0 ? '#4ade80' : '#f87171';

    // Poblar tabla
    const tableBody = document.getElementById('historyTableBody');
    tableBody.innerHTML = lastMultipliers.map((m, i, arr) => {
        const prev = arr[i + 1]?.multiplier || 0;
        const isHigh = m.multiplier >= 2;
        let gp = m.multiplier >= 2 ? "+100.00" : "-100.00";
        let gpColor = m.multiplier >= 2 ? "#4ade80" : "#f87171";

        let obs = '-';
        if (m.multiplier > 10) obs = 'Pico de varianza';
        if (m.multiplier < 1.1) obs = 'Crash inmediato';
        if (prev > 10) obs = 'Seguridad (Post-Alto)';

        return `<tr>
            <td>${new Date(m.timestamp).toLocaleTimeString()}</td>
            <td class="${isHigh ? 'success' : 'fail'}">${m.multiplier.toFixed(2)}x</td>
            <td>${isHigh ? 'WIN' : 'LOSS'}</td>
            <td style="color: ${gpColor}; font-weight: bold;">${gp}</td>
            <td class="obs">${obs}</td>
        </tr>`;
    }).join('');

    // Poblar frecuencia por tiempo - RANGOS ACTUALIZADOS
    const updateFrequencyTable = () => {
        const now = Date.now();
        const t15 = now - (15 * 60 * 1000);
        const t30 = now - (30 * 60 * 1000);
        const t60 = now - (60 * 60 * 1000);

        const ranges = [
            { label: '🔵 Crash Bajo (1.00x - 1.20x)', min: 1.00, max: 1.20 },
            { label: '🟢 Seguro (1.21x - 2.00x)', min: 1.21, max: 2.00 },
            { label: '🟡 Medios (2.01x - 10.00x)', min: 2.01, max: 10.00 },
            { label: '🟠 Altos (10.01x - 20.00x)', min: 10.01, max: 20.00 },
            { label: '🟣 Muy Altos (20.01x+)', min: 20.01, max: Infinity }
        ];

        const getCount = (range, sinceTime) => {
            return multipliers.filter(m => new Date(m.timestamp).getTime() >= sinceTime && m.multiplier >= range.min && m.multiplier <= range.max).length;
        };

        const freqTableBody = document.getElementById('freqTableBody');
        freqTableBody.innerHTML = ranges.map(r => `
            <tr>
                <td><strong>${r.label}</strong></td>
                <td>${getCount(r, t15)}</td>
                <td>${getCount(r, t30)}</td>
                <td>${getCount(r, t60)}</td>
                <td>${multipliers.filter(m => m.multiplier >= r.min && m.multiplier <= r.max).length}</td>
            </tr>
        `).join('');
    };

    updateFrequencyTable();

    // Manejar descarga CSV
    document.getElementById('downloadCsvBtn').addEventListener('click', () => {
        const csv = 'Timestamp,Multiplier,URL\n' +
            multipliers.map(m => `${m.timestamp},${m.multiplier},${m.url}`).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aviator_history_${new Date().getTime()}.csv`;
        a.click();
    });
});
