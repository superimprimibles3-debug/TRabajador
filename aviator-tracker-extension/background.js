/**
 * Background Service Worker - Data Processing
 */

let gameHistory = [];
let isPendingBet = false;
let stats = {
    wins: 0,
    losses: 0,
    totalProfit: 0,
    totalBets: 0,
    systemBets: 0,
    systemWins: 0,
    systemLosses: 0,
    sessionReloads: 0,
    partida: 0
};

// ============================================
// WEBSOCKET DATA PROCESSING
// ============================================

let isSidePanelOpen = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    // Procesar datos del WebSocket
    if (message.type === 'WEBSOCKET_DATA') {
        console.log('📨 Background received WEBSOCKET_DATA:', message.data);
        processWebSocketData(message.data, message.timestamp);
    }

    // Calibración completada
    if (message.type === 'CALIBRATION_COMPLETE') {
        console.log('✅ Calibración guardada en background');
        broadcastToSidePanel({ type: 'CALIBRATION_UPDATE', data: message.data });
    }

    // Trigger ejecutado
    if (message.type === 'TRIGGER_EXECUTED') {
        stats.totalBets++;
        stats.systemBets = (stats.systemBets || 0) + 1;
        isPendingBet = true;
        saveStats();
        broadcastToSidePanel({ type: 'TRIGGER_EXECUTED', timestamp: message.timestamp });
    }

    // Nuevo multiplicador detectado
    if (message.type === 'newMultiplier') {
        handleNewMultiplier(message.data);
    }

    // Análisis del Sniper (Visualización de filtros)
    if (message.type === 'SNIPER_ANALYSIS') {
        broadcastToSidePanel({
            type: 'SNIPER_ANALYSIS',
            analysis: message.analysis,
            timestamp: Date.now()
        });
    }

    if (message.action === 'IS_SIDEPANEL_OPEN') {
        sendResponse({ open: isSidePanelOpen });
    }

    if (message.type === 'DIALOG_CLOSED' || message.type === 'SESSION_EXPIRED') {
        chrome.storage.local.get(['totalSessionReloads'], (res) => {
            stats.sessionReloads = res.totalSessionReloads || 0;
            saveStats();
            broadcastToSidePanel({
                type: 'UPDATE_HISTORY',
                history: gameHistory.slice(0, 20),
                stats
            });
        });
    }

    if (message.type === 'PROXY_TO_PYTHON') {
        fetch(`http://localhost:5000${message.endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message.data)
        })
            .then(r => r.json())
            .then(data => sendResponse({ success: true, data }))
            .catch(error => {
                console.error('Proxy Error:', error);
                sendResponse({ success: false, error: error.toString() });
            });
        return true; // Keep channel open for async response
    }
});

function processWebSocketData(data, timestamp) {
    // Detectar multiplicador/resultado
    const multiplier = extractMultiplier(data);

    if (multiplier) {
        handleNewMultiplier({
            multiplier,
            timestamp,
            rawData: data
        });
    }

    // Detectar fase del juego
    const phase = extractPhase(data);
    if (phase) {
        broadcastToSidePanel({
            type: 'PHASE_UPDATE',
            phase
        });
    }

    // Detectar apuestas del jugador
    if (data.playerBets || data.bets) {
        processPlayerBets(data);
    }
}

function extractMultiplier(data) {
    // Intentar múltiples formatos
    return data.multiplier ||
        data.result ||
        data.crash ||
        data.value ||
        data.coefficient ||
        null;
}

function extractPhase(data) {
    return data.phase ||
        data.state ||
        data.status ||
        data.gameState ||
        null;
}

function handleNewMultiplier(data) {
    console.log('⚙️ Processing Multiplier:', data.multiplier);
    chrome.storage.local.get(['partidaNumber'], (res) => {
        const currentPartida = res.partidaNumber || 1;

        // If partida changed, we might want to reset the background stats object
        if (stats.partida !== currentPartida) {
            stats = {
                wins: 0,
                losses: 0,
                totalProfit: 0,
                totalBets: 0,
                systemBets: 0,
                systemWins: 0,
                systemLosses: 0,
                sessionReloads: 0,
                partida: currentPartida
            };
            // Limit history to current session in memory if needed
        }

        const result = {
            multiplier: data.multiplier,
            timestamp: data.timestamp,
            filters: checkFilters(data.multiplier),
            isSystemBet: isPendingBet,
            partida: currentPartida
        };

        if (isPendingBet) {
            console.log(`🎯 Ronda de apuesta detectada (${data.multiplier}x)`);
            if (data.multiplier >= 1.11) {
                stats.systemWins = (stats.systemWins || 0) + 1;
            } else {
                stats.systemLosses = (stats.systemLosses || 0) + 1;
            }
            isPendingBet = false;
            saveStats();
        }

        // Agregar al historial
        gameHistory.unshift(result);

        // Mantener solo últimos 100
        if (gameHistory.length > 200) { // Increased slightly to keep some history across sessions if needed
            gameHistory.pop();
        }

        // Guardar en storage
        chrome.storage.local.set({
            gameHistory,
            lastResult: result
        });

        // Enviar al content script para triggers
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    type: 'NEW_RESULT',
                    multiplier: data.multiplier
                }).catch(() => { });
            });
        });

        // Actualizar SidePanel (Filtrado por partida)
        broadcastToSidePanel({
            type: 'UPDATE_HISTORY',
            history: gameHistory.filter(h => h.partida === currentPartida).slice(0, 20),
            lastResult: result,
            stats
        });
    });
}

function checkFilters(multiplier) {
    return {
        isLow: multiplier < 1.12,
        isConfirmation: multiplier > 1.25,
        isHigh: multiplier > 3.00,
        isTarget: multiplier >= 1.25 && multiplier <= 2.50
    };
}

function processPlayerBets(data) {
    const bets = data.playerBets || data.bets || [];

    bets.forEach(bet => {
        if (bet.won !== undefined) {
            if (bet.won) {
                stats.wins++;
                stats.totalProfit += (bet.profit || 0);
            } else {
                stats.losses++;
                stats.totalProfit -= (bet.amount || 0);
            }
        }
    });

    saveStats();
}

function saveStats() {
    chrome.storage.local.set({ stats });
}

function broadcastToSidePanel(message) {
    chrome.runtime.sendMessage(message).catch(() => {
        // SidePanel no está abierto
    });
}

// ============================================
// INITIALIZATION
// ============================================

// Cargar datos al iniciar
chrome.storage.local.get(['gameHistory', 'stats'], (result) => {
    if (result.gameHistory) {
        gameHistory = result.gameHistory;
    }
    if (result.stats) {
        stats = result.stats;
    }
    console.log('✅ Background initialized');
});

// Listener para cuando se abre el SidePanel (SidePanel abre un port por defecto)
chrome.runtime.onConnect.addListener((port) => {
    console.log('🔌 SidePanel connected');
    isSidePanelOpen = true;

    // Al abrir el panel, mostramos la máscara en las pestañas activas
    broadcastToTabs({ action: 'SHOW_OCR_MASK' });

    // Cuando se cierra el panel (port se desconecta)
    port.onDisconnect.addListener(() => {
        console.log('🔌 SidePanel disconnected');
        isSidePanelOpen = false;
        broadcastToTabs({ action: 'HIDE_OCR_MASK' });
    });

    // Enviar datos iniciales
    try {
        port.postMessage({
            type: 'INITIAL_DATA',
            history: gameHistory.slice(0, 20),
            stats
        });
    } catch (e) { }
});

function broadcastToTabs(message) {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, message).catch(() => { });
        });
    });
}
