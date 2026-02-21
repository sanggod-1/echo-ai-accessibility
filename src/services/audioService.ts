export class AudioService {
    private audioCtx: AudioContext | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    private equalizer: BiquadFilterNode | null = null;
    private lowCut: BiquadFilterNode | null = null;
    private compressor: DynamicsCompressorNode | null = null;
    private gainNode: GainNode | null = null;
    private analyser: AnalyserNode | null = null;

    async init(deviceId?: string) {
        if (this.audioCtx) this.stop();

        try {
            const constraints: MediaStreamConstraints = {
                audio: deviceId ? { deviceId: { exact: deviceId } } : {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: false
                }
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.source = this.audioCtx.createMediaStreamSource(stream);

            // 1. Low-cut filter (High-pass) to remove "mumbling" frequencies (bass)
            this.lowCut = this.audioCtx.createBiquadFilter();
            this.lowCut.type = 'highpass';
            this.lowCut.frequency.setValueAtTime(450, this.audioCtx.currentTime); // Neutralize mumble

            // 2. High-shelf filter to boost "Clarity" (consonants ㅅ, ㅎ, ㅋ)
            this.equalizer = this.audioCtx.createBiquadFilter();
            this.equalizer.type = 'highshelf';
            this.equalizer.frequency.setValueAtTime(2500, this.audioCtx.currentTime);
            this.equalizer.gain.setValueAtTime(15, this.audioCtx.currentTime);

            // 3. Dynamics Compressor to normalize volume
            this.compressor = this.audioCtx.createDynamicsCompressor();
            this.compressor.threshold.setValueAtTime(-20, this.audioCtx.currentTime);
            this.compressor.knee.setValueAtTime(30, this.audioCtx.currentTime);
            this.compressor.ratio.setValueAtTime(12, this.audioCtx.currentTime);

            // 4. Final Gain Stage
            this.gainNode = this.audioCtx.createGain();
            this.gainNode.gain.setValueAtTime(1.2, this.audioCtx.currentTime);

            this.analyser = this.audioCtx.createAnalyser();
            this.analyser.fftSize = 256;

            // Connect nodes: Source -> LowCut -> HighBoost -> Compressor -> Gain -> Dist/Analyser
            this.source.connect(this.lowCut);
            this.lowCut.connect(this.equalizer);
            this.equalizer.connect(this.compressor);
            this.compressor.connect(this.gainNode);
            this.gainNode.connect(this.audioCtx.destination);
            this.gainNode.connect(this.analyser);

            console.log(`Audio Engine Running on device: ${deviceId || 'Default'}`);
        } catch (err) {
            console.error("Failed to initialize Audio Service", err);
        }
    }

    async getDevices() {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter(device => device.kind === 'audioinput');
    }

    // Adjust "Mumbling" reduction level (Low frequency cut intensity)
    setMumbleReduction(value: number) { // 0 to 100
        if (this.lowCut && this.audioCtx) {
            // Adjust cut frequency from 200Hz to 1200Hz
            const freq = 200 + (value * 10);
            this.lowCut.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
        }
    }

    // Adjust "Clarity" boost level (High frequency boost intensity)
    setClarity(value: number) { // 0 to 100
        if (this.equalizer && this.audioCtx) {
            // Adjust gain from 0dB to 25dB
            const gain = (value / 4);
            this.equalizer.gain.setValueAtTime(gain, this.audioCtx.currentTime);
        }
    }

    // predefined situation modes
    setSituationMode(mode: 'quiet' | 'normal' | 'noisy') {
        if (!this.audioCtx) return;

        switch (mode) {
            case 'quiet':
                this.setMumbleReduction(10);
                this.setClarity(30);
                if (this.compressor) {
                    this.compressor.threshold.setValueAtTime(-10, this.audioCtx.currentTime);
                }
                break;
            case 'normal':
                this.setMumbleReduction(40);
                this.setClarity(60);
                if (this.compressor) {
                    this.compressor.threshold.setValueAtTime(-20, this.audioCtx.currentTime);
                }
                break;
            case 'noisy':
                this.setMumbleReduction(80);
                this.setClarity(90);
                if (this.compressor) {
                    this.compressor.threshold.setValueAtTime(-35, this.audioCtx.currentTime);
                }
                break;
        }
    }

    stop() {
        if (this.audioCtx) {
            this.audioCtx.close();
            this.audioCtx = null;
        }
    }

    getAnalyser() {
        return this.analyser;
    }
}

export const audioService = new AudioService();
