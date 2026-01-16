document.addEventListener('DOMContentLoaded', async () => {
    let realData = [];

    // Cargar datos reales desde el almacenamiento
    const result = await chrome.storage.local.get(['multipliers']);
    realData = result.multipliers || [];

    const simSourceSelect = document.getElementById('simSource');
    simSourceSelect.options[0].textContent = `Datos Reales (${realData.length})`;

    // Función para formatear números: muestra 2 decimales solo si es necesario
    const formatNumber = (num) => {
        return Number.isInteger(num) ? num.toString() : num.toFixed(2);
    };

    const runSim = () => {
        const source = document.getElementById('simSource').value;

        // Generar datos realistas si no hay datos reales
        const data = source === 'real' ? realData : Array.from({ length: 500 }, () => {
            const r = Math.random();
            let val = 1.0;

            // Distribución realista basada en probabilidades de Aviator
            if (r > 0.99) {
                // 1% - Valores muy altos (20x - 100x)
                val = 20 + Math.random() * 80;
            } else if (r > 0.95) {
                // 4% - Valores altos (10x - 20x)
                val = 10 + Math.random() * 10;
            } else if (r > 0.80) {
                // 15% - Valores medios-altos (3x - 10x)
                val = 3 + Math.random() * 7;
            } else if (r > 0.50) {
                // 30% - Valores medios (1.5x - 3x)
                val = 1.5 + Math.random() * 1.5;
            } else {
                // 50% - Valores bajos (1.0x - 1.5x)
                val = 1.0 + Math.random() * 0.5;
            }

            return { multiplier: parseFloat(val.toFixed(2)), timestamp: new Date().toISOString() };
        });

        // Obtener parámetros de configuración
        const b1 = parseFloat(document.getElementById('s1_bet').value) || 0;
        const t1 = parseFloat(document.getElementById('s1_target').value) || 0;
        const b2 = parseFloat(document.getElementById('s2_bet').value) || 0;
        const t2 = parseFloat(document.getElementById('s2_target').value) || 0;
        const minP = parseFloat(document.getElementById('s_prob').value) || 0;
        const skipVal = parseFloat(document.getElementById('s_skip').value) || 10;
        const takeProfit = parseFloat(document.getElementById('s_tp').value) || 1000;
        const maxRounds = parseInt(document.getElementById('s_maxR').value) || 50;

        let balance = 0;
        let wins = 0;
        let losses = 0;
        let totalBets = 0;
        let totalInvested = 0;
        let totalReturned = 0;
        let stopReason = '';
        let logHtml = '<table><thead><tr><th>Ronda</th><th>Multiplicador</th><th>Apuesta 1</th><th>Apuesta 2</th><th>Ganancia Neta</th><th>Balance</th></tr></thead><tbody>';

        // Necesitamos al menos 30 rondas de historial para calcular probabilidades
        if (data.length < 30) {
            document.getElementById('simLog').innerHTML = '<div style="padding:20px; text-align:center; color:#f87171;">❌ Se necesitan al menos 30 rondas de datos para ejecutar la simulación.</div>';
            return;
        }

        for (let i = 30; i < data.length; i++) {
            // Condiciones de parada
            if (balance >= takeProfit) {
                stopReason = '✅ Meta de Ganancia Alcanzada';
                break;
            }
            if (totalBets >= maxRounds) {
                stopReason = '⏱️ Límite de Rondas Alcanzado';
                break;
            }
            if (balance <= -takeProfit) {
                stopReason = '❌ Pérdida Máxima Alcanzada';
                break;
            }

            const currentMultiplier = data[i].multiplier;
            const history = data.slice(0, i);

            // Filtro de seguridad: Skip después de valores altos
            const prevVal = data[i - 1].multiplier;
            if (prevVal > skipVal) continue;

            // Calcular probabilidades basadas en historial
            const p1 = (history.filter(x => x.multiplier >= t1).length / history.length) * 100;
            const p2 = (history.filter(x => x.multiplier >= t2).length / history.length) * 100;
            const avgProb = (p1 + p2) / 2;

            // Solo apostar si la probabilidad promedio cumple el mínimo
            if (avgProb >= minP) {
                totalBets++;

                // Calcular resultados de cada apuesta
                let result1 = 0;
                let result2 = 0;

                if (b1 > 0 && t1 > 0) {
                    totalInvested += b1;
                    if (currentMultiplier >= t1) {
                        result1 = (b1 * t1) - b1; // Ganancia neta
                        totalReturned += (b1 * t1);
                    } else {
                        result1 = -b1; // Pérdida
                    }
                }

                if (b2 > 0 && t2 > 0) {
                    totalInvested += b2;
                    if (currentMultiplier >= t2) {
                        result2 = (b2 * t2) - b2; // Ganancia neta
                        totalReturned += (b2 * t2);
                    } else {
                        result2 = -b2; // Pérdida
                    }
                }

                const netProfit = result1 + result2;
                balance += netProfit;

                if (netProfit > 0) {
                    wins++;
                } else if (netProfit < 0) {
                    losses++;
                }

                // Agregar fila a la tabla
                const rowClass = netProfit > 0 ? 'win' : (netProfit < 0 ? 'loss' : '');
                logHtml += `<tr class="${rowClass}">
                    <td>#${totalBets}</td>
                    <td>${currentMultiplier.toFixed(2)}x</td>
                    <td class="${result1 > 0 ? 'win' : (result1 < 0 ? 'loss' : '')}">${result1 >= 0 ? '+' : ''}${formatNumber(result1)}</td>
                    <td class="${result2 > 0 ? 'win' : (result2 < 0 ? 'loss' : '')}">${result2 >= 0 ? '+' : ''}${formatNumber(result2)}</td>
                    <td style="font-weight:bold" class="${netProfit > 0 ? 'win' : (netProfit < 0 ? 'loss' : '')}">${netProfit >= 0 ? '+' : ''}${formatNumber(netProfit)}</td>
                    <td style="font-weight:bold; color: ${balance >= 0 ? '#4ade80' : '#f87171'}">${formatNumber(balance)}</td>
                </tr>`;
            }
        }

        logHtml += '</tbody></table>';

        // Agregar mensaje de finalización
        if (stopReason) {
            logHtml = `<div style="padding:10px; background:#4338ca; border-radius:4px; margin-bottom:10px; font-weight:bold;">${stopReason}</div>` + logHtml;
        }

        document.getElementById('simLog').innerHTML = logHtml;

        // Mostrar resumen
        const summaryEl = document.getElementById('summary');
        summaryEl.style.display = 'flex';

        const balanceEl = document.getElementById('sum_balance');
        const winRate = totalBets > 0 ? (wins / totalBets) * 100 : 0;
        const roi = totalInvested > 0 ? ((totalReturned - totalInvested) / totalInvested) * 100 : 0;

        balanceEl.innerHTML = `Balance: ARS ${formatNumber(balance)}`;
        balanceEl.style.color = balance >= 0 ? '#4ade80' : '#f87171';

        document.getElementById('sum_stats').innerHTML = `
            Victorias: ${wins} | Derrotas: ${losses} | Empates: ${totalBets - wins - losses}<br>
            Tasa de Éxito: ${winRate.toFixed(2)}% | ROI: ${roi >= 0 ? '+' : ''}${roi.toFixed(2)}%<br>
            Invertido: ${formatNumber(totalInvested)} | Retornado: ${formatNumber(totalReturned)}
        `;
    };

    document.getElementById('runSimBtn').addEventListener('click', runSim);
});
