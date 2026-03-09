import { AudioEngine } from './audio-engine.js';
import { UI } from './ui.js';
import { HistoryManager } from './history-manager.js';

class App {
    constructor() {
        this.audio = new AudioEngine();
        this.ui = new UI();
        this.history = new HistoryManager();
        this.whistleCount = 0;
        this.targetCount = 3;

        this.initEventListeners();
        this.updateTarget();
        this.ui.renderHistory(this.history.getHistory());
    }

    initEventListeners() {
        // Toggle Listen
        this.ui.dom.btnToggle.addEventListener('click', () => {
            if (this.audio.isListening) {
                this.stop();
            } else {
                this.start();
            }
        });

        // Reset
        this.ui.dom.btnReset.addEventListener('click', () => {
            if (this.whistleCount > 0) {
                this.history.addEntry(this.whistleCount, this.targetCount, false);
                this.ui.renderHistory(this.history.getHistory());
            }
            this.audio.stopAlarm();
            this.whistleCount = 0;
            this.ui.updateCount(0);
        });

        // Target Controls
        this.ui.dom.btnDec.addEventListener('click', () => {
            let val = this.ui.getTarget();
            if (val > 1) {
                this.ui.setTarget(val - 1);
                this.updateTarget();
            }
        });

        this.ui.dom.btnInc.addEventListener('click', () => {
            let val = this.ui.getTarget();
            if (val < 99) {
                this.ui.setTarget(val + 1);
                this.updateTarget();
            }
        });

        this.ui.dom.targetInput.addEventListener('change', () => this.updateTarget());
        this.currentCount = 0;
        this.sessionDate = new Date();
        this.wakeLock = null; // Wake Lock Sentinel

        this.init();
    }

    init() {
        // UI Callbacks
        this.ui.onTargetChange = (val) => {
            this.targetCount = parseInt(val);
        };

        this.ui.onSensitivityChange = (val) => {
            this.audio.setThreshold(val);
        };

        // Button Events
        this.ui.dom.btnToggle.addEventListener('click', () => this.toggleListening());
        this.ui.dom.btnReset.addEventListener('click', () => this.resetSession());
        this.ui.dom.btnDismiss.addEventListener('click', () => {
            this.audio.stopAlarm();
            this.ui.hideAlert();
            // Just Continue: User can stop manually or wait for more whistles
        });

        this.ui.dom.btnStopRecord.addEventListener('click', () => {
            this.audio.stopAlarm();
            this.ui.hideAlert();
            this.history.addEntry(this.currentCount, this.targetCount, true);
            this.ui.renderHistory(this.history.getHistory());

            // Stop Recording
            this.toggleListening(); // This handles stop logic

            this.currentCount = 0;
            this.ui.updateCount(0);
        });

        this.ui.dom.btnClearHistory.addEventListener('click', () => {
            if (confirm('Clear all history?')) {
                this.history.clear();
                this.ui.renderHistory(this.history.getHistory());
            }
        });

        // History Toggle
        this.ui.dom.btnHistory.addEventListener('click', () => this.ui.showHistory());
        this.ui.dom.btnCloseHistory.addEventListener('click', () => this.ui.hideHistory());

        // Audio Engine Callbacks
        this.audio.onWhistle = () => this.handleWhistle();
        this.audio.onError = (e) => this.handleError(e);
        this.audio.onVisualizerFrame = (data) => this.ui.drawVisualizer(data); // Draw

        // Load History
        this.ui.renderHistory(this.history.getHistory());

        // Handle visibility for Wake Lock
        document.addEventListener('visibilitychange', async () => {
            if (this.audio.isListening && document.visibilityState === 'visible') {
                await this.requestWakeLock();
            }
        });
    }

    async toggleListening() {
        if (!this.audio.isListening) {
            try {
                // Start
                await this.audio.start();
                this.ui.setListeningState(true);
                await this.requestWakeLock();
            } catch (e) {
                // Error handled by callback usually, but ensuring UI doesn't hang
                this.ui.setListeningState(false);
            }
        } else {
            // Stop
            this.audio.stop();
            this.ui.setListeningState(false);
            this.releaseWakeLock();
        }
    }

    resetSession() {
        if (this.currentCount > 0) {
            this.history.addEntry(this.currentCount, this.targetCount, false);
            this.ui.renderHistory(this.history.getHistory());
        }
        this.audio.stopAlarm();
        this.currentCount = 0;
        this.ui.updateCount(0);
    }

    async requestWakeLock() {
        try {
            if ('wakeLock' in navigator) {
                this.wakeLock = await navigator.wakeLock.request('screen');
                console.log('Wake Lock active');
            }
        } catch (err) {
            console.error(`${err.name}, ${err.message}`);
        }
    }

    releaseWakeLock() {
        if (this.wakeLock !== null) {
            this.wakeLock.release()
                .then(() => {
                    this.wakeLock = null;
                });
        }
    }

    updateTarget() {
        this.targetCount = this.ui.getTarget();
    }

    handleWhistle() {
        this.currentCount++;
        console.log(`Whistle: ${this.currentCount} / ${this.targetCount}`);
        this.ui.updateCount(this.currentCount);

        // Check Target
        if (this.currentCount >= this.targetCount) {
            console.log("Target Reached! Triggering Alarm.");
            try {
                this.audio.playAlarm();
                this.ui.showAlert(this.currentCount);
            } catch (e) {
                console.error("Alert Error:", e);
            }
        }
    }

    handleError(error) {
        console.error(error);
        if (error.name === 'NotAllowedError') {
            this.ui.setError("Mic Permission Denied");
        } else {
            this.ui.setError("Audio Error");
        }
        this.ui.setListening(false);
    }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    new App();
});
