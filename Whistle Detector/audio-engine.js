export class AudioEngine {
    constructor() {
        this.ctx = null;
        this.analyser = null;
        this.source = null;
        this.stream = null;
        this.isListening = false;
        this.animationId = null;

        this.micSource = null;
        this.dataArray = null;

        this.onWhistle = null; // Callback
        this.onError = null;
        this.onVisualizerFrame = null; // New Callback

        // Detection Config
        this.config = {
            fftSize: 2048,
            minFreq: 2000,
            maxFreq: 5000,
            threshold: 180, // Dynamic
            whistleMinDuration: 300,
            whistleMaxDuration: 4000,
            cooldown: 4000
        };

        this.state = {
            whistleStartTime: 0,
            lastWhistleTime: 0,
            isWhistling: false
        };
    }

    async start() {
        if (this.isListening) return;

        try {
            // 1. Create Context if missing
            if (!this.ctx) {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
                this.analyser = this.ctx.createAnalyser();
                this.analyser.fftSize = this.config.fftSize;
            }

            // 2. Resume Context if suspended (browser requirements)
            if (this.ctx.state === 'suspended') {
                await this.ctx.resume();
            }

            // 3. Get Mic Stream
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.micSource = this.ctx.createMediaStreamSource(this.stream);
            this.micSource.connect(this.analyser);

            this.isListening = true;
            this.detectLoop();
        } catch (err) {
            console.error("Mic Error:", err);
            if (this.onError) this.onError(err);
            throw err;
        }
    }

    setThreshold(val) {
        this.config.threshold = parseInt(val);
    }

    stop() {
        if (!this.isListening) return;

        this.isListening = false;
        cancelAnimationFrame(this.animationId);

        if (this.stream) {
            this.stream.getTracks().forEach(t => t.stop());
            this.stream = null;
        }

        if (this.micSource) {
            this.micSource.disconnect();
            this.micSource = null;
        }

        // Suspend context to save CPU
        if (this.ctx && this.ctx.state !== 'closed') {
            this.ctx.suspend();
        }
    }

    detectLoop() {
        if (!this.isListening) return;

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);

        // Visualizer Callback
        if (this.onVisualizerFrame) {
            this.onVisualizerFrame(dataArray);
        }

        // Logic
        const sampleRate = this.ctx.sampleRate;
        const binSize = sampleRate / this.config.fftSize;
        const startBin = Math.floor(this.config.minFreq / binSize);
        const endBin = Math.floor(this.config.maxFreq / binSize);

        let maxAmp = 0;
        for (let i = startBin; i <= endBin; i++) {
            if (dataArray[i] > maxAmp) maxAmp = dataArray[i];
        }

        this.processSignal(maxAmp);

        this.animationId = requestAnimationFrame(() => this.detectLoop());
    }

    processSignal(maxAmp) {
        const now = Date.now();

        // Cooldown
        if (now - this.state.lastWhistleTime < this.config.cooldown) {
            return;
        }

        const isSignalStrong = maxAmp > this.config.threshold;

        if (isSignalStrong) {
            if (!this.state.isWhistling) {
                this.state.isWhistling = true;
                this.state.whistleStartTime = now;
            }
        } else {
            if (this.state.isWhistling) {
                const duration = now - this.state.whistleStartTime;
                this.state.isWhistling = false;

                if (duration >= this.config.whistleMinDuration && duration <= this.config.whistleMaxDuration) {
                    this.triggerWhistle(now);
                }
            }
        }
    }

    triggerWhistle(time) {
        this.state.lastWhistleTime = time;
        if (this.onWhistle) this.onWhistle();
    }

    async playAlarm() {
        if (!this.ctx) return;
        this.stopAlarm(); // Ensure no duplicates

        // Ensure context is running
        if (this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }

        // Create a repeating "Alarm Clock" burst (Beep-Beep-Beep)
        const beep = () => {
            if (!this.ctx) return;
            // Use slightly future time to avoid start-in-past errors
            const t = this.ctx.currentTime + 0.05;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(2040, t); // Classic digital alarm freq

            // Pulse pattern: Beep-Beep-Beep
            gain.gain.setValueAtTime(0, t);

            // Beep 1
            gain.gain.linearRampToValueAtTime(0.5, t + 0.05);
            gain.gain.setValueAtTime(0, t + 0.1);

            // Beep 2
            gain.gain.setValueAtTime(0.5, t + 0.2);
            gain.gain.setValueAtTime(0, t + 0.3);

            // Beep 3
            gain.gain.setValueAtTime(0.5, t + 0.4);
            gain.gain.setValueAtTime(0, t + 0.5);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.6);
        };

        beep(); // Instant
        this.alarmInterval = setInterval(beep, 1000); // Loop
    }

    stopAlarm() {
        if (this.alarmInterval) {
            clearInterval(this.alarmInterval);
            this.alarmInterval = null;
        }
    }
}
