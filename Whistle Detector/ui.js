export class UI {
    constructor() {
        this.dom = {
            countDisplay: document.getElementById('whistle-count'),
            statusIndicator: document.getElementById('status-indicator'),
            btnToggle: document.getElementById('btn-toggle'),
            btnReset: document.getElementById('btn-reset'),
            btnDec: document.getElementById('btn-decrement'),
            btnInc: document.getElementById('btn-increment'),
            targetInput: document.getElementById('target-input'),
            countCircle: document.querySelector('.count-circle'),
            alertModal: document.getElementById('alert-modal'),
            modalCount: document.getElementById('modal-count'),
            btnDismiss: document.getElementById('btn-dismiss'),
            btnStopRecord: document.getElementById('btn-stop-record'),
            historyList: document.getElementById('history-list'),
            btnClearHistory: document.getElementById('btn-clear-history'),
            btnHistory: document.getElementById('btn-history'),
            historyModal: document.getElementById('history-modal'),
            btnCloseHistory: document.getElementById('btn-close-history'),
            // New Elements
            canvas: document.getElementById('visualizer'),
            sensitivitySlider: document.getElementById('sensitivity-slider'),
            presetButtons: document.querySelectorAll('.preset-btn')
        };

        this.canvasCtx = this.dom.canvas.getContext('2d');
        this.onTargetChange = null;
        this.onSensitivityChange = null;

        this.setupListeners();
    }

    setupListeners() {
        // Local logic for +/- buttons - REMOVED (App.js handles this)

        // Allow manual input
        this.dom.targetInput.addEventListener('change', () => {
            let val = parseInt(this.dom.targetInput.value);
            // Clamp and ensure Integer
            if (isNaN(val) || val < 1) val = 1;
            if (val > 99) val = 99;
            this.dom.targetInput.value = val;

            if (this.onTargetChange) this.onTargetChange(val);
        });
    }

    updateTarget(change) {
        let val = parseInt(this.dom.targetInput.value) + change;
        if (val < 1) val = 1;
        if (val > 99) val = 99;

        this.dom.targetInput.value = val;

        if (this.onTargetChange) this.onTargetChange(val);
    }

    drawVisualizer(dataArray) {
        if (!this.dom.canvas) return;

        const width = this.dom.canvas.width;
        const height = this.dom.canvas.height;
        const ctx = this.canvasCtx;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffea00'; // Neon Yellow
        ctx.beginPath();

        const sliceWidth = width * 1.0 / dataArray.length;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
            const v = dataArray[i] / 128.0; // 0..2
            const y = height - (v * height / 2); // Flip/Scale

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();
    }

    renderHistory(items) {
        this.dom.historyList.innerHTML = '';
        if (items.length === 0) {
            this.dom.historyList.innerHTML = '<li class="empty-state">No history yet</li>';
            return;
        }

        items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'history-item';

            const dateStr = new Date(item.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            const statusClass = item.successful ? 'success' : '';
            const statusText = item.successful ? 'Target Reached' : 'Manual Reset';

            li.innerHTML = `
                <div class="history-info">
                    <span class="h-date">${dateStr}</span>
                    <span class="h-status ${statusClass}">${statusText}</span>
                </div>
                <div class="h-count">${item.count}/${item.target}</div>
            `;
            this.dom.historyList.appendChild(li);
        });
    }



    setListeningState(isListening) {
        if (isListening) {
            this.dom.statusIndicator.textContent = "Listening...";
            this.dom.statusIndicator.classList.add('listening');
            this.dom.statusIndicator.classList.remove('error');
            this.dom.btnToggle.textContent = "Stop Listening";
            this.dom.btnToggle.classList.add('stop');
            this.dom.btnToggle.innerHTML = '<i class="fas fa-stop"></i> Stop Listening';
        } else {
            this.dom.statusIndicator.textContent = "Ready";
            this.dom.statusIndicator.classList.remove('listening');
            this.dom.statusIndicator.classList.remove('error');
            this.dom.btnToggle.textContent = "Start Listening";
            this.dom.btnToggle.classList.remove('stop');
            this.dom.btnToggle.innerHTML = '<i class="fas fa-microphone"></i> Start Listening';
        }
    }

    setError(msg) {
        this.dom.statusIndicator.textContent = msg;
        this.dom.statusIndicator.classList.remove('listening');
        this.dom.statusIndicator.classList.add('error');
    }

    updateCount(count) {
        this.dom.countDisplay.textContent = count;
        // Animation
        this.dom.countCircle.classList.remove('bump');
        void this.dom.countCircle.offsetWidth; // trigger reflow
        this.dom.countCircle.classList.add('bump');
    }

    getTarget() {
        return parseInt(this.dom.targetInput.value, 10) || 1;
    }

    setTarget(val) {
        this.dom.targetInput.value = val;
    }

    showAlert(count) {
        this.dom.modalCount.textContent = count;
        this.dom.alertModal.classList.remove('hidden');
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }
    }

    hideAlert() {
        this.dom.alertModal.classList.add('hidden');
    }

    showHistory() {
        this.dom.historyModal.classList.remove('hidden');
    }

    hideHistory() {
        this.dom.historyModal.classList.add('hidden');
    }
}
