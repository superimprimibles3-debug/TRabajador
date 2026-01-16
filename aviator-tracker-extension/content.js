/**
 * Aviator Tracker v5.5 - PURE VISUAL MODE
 * Security Policy: STRICT (No DOM Access, No WebSocket Interception)
 * 
 * This script is intentionally stripped down to minimum connectivity heartbeats.
 * All logic runs in Python (OCR + Hardware Clicks).
 */

(function () {
    'use strict';

    if (window.AV_TRACKER_LOADED) return;
    window.AV_TRACKER_LOADED = true;

    console.log('%c🔒 ATR 5.5: Secure Visual Mode Active', 'background: #0f172a; color: #10b981; font-weight: bold; padding: 4px;');

    // ============================================
    // 1. HEALTH CHECK SYSTEM (DOM HEARTBEAT)
    // ============================================
    // Only used to tell the sidepanel "I am alive"
    const isInIframe = window.self !== window.top;

    // Send pulse every 1s
    setInterval(() => {
        if (!chrome.runtime?.id) return;
        try {
            chrome.runtime.sendMessage({
                type: isInIframe ? 'IFRAME_PULSE' : 'DOM_PULSE',
                timestamp: Date.now()
            }).catch(() => { });
        } catch (e) { }
    }, 1000);

    // ============================================
    // 2. MESSAGE RELAY
    // ============================================
    // Allows Python/Sidepanel to show visual diagnostics (red dots) without logic
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        if (msg.type === 'PING') {
            sendResponse({ status: 'alive' });
        }
        // Visual overlay logic for calibration dots could go here if needed, 
        // but now we use Python PyQt5 overlays, so even this might be redundant.
        return true;
    });

})();
