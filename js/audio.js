export class Audio {
    constructor() {
        this.ctx = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.initialized = false;
        this.musicTimer = null;
        this.musicPlaying = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = 0.15;
            this.musicGain.connect(this.ctx.destination);
            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = 0.4;
            this.sfxGain.connect(this.ctx.destination);
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio not available');
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    _playTone(freq, duration, type = 'square', dest = null, startTime = 0, vol = 0.3) {
        if (!this.initialized) return;
        const t = this.ctx.currentTime + startTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
        osc.connect(gain);
        gain.connect(dest || this.sfxGain);
        osc.start(t);
        osc.stop(t + duration);
    }

    _playNoise(duration, dest = null, startTime = 0, vol = 0.2) {
        if (!this.initialized) return;
        const t = this.ctx.currentTime + startTime;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 800;
        filter.Q.value = 2;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(dest || this.sfxGain);
        source.start(t);
        source.stop(t + duration);
    }

    playHit() {
        this.init();
        this.resume();
        this._playNoise(0.08, null, 0, 0.3);
        this._playTone(300, 0.08, 'square', null, 0, 0.2);
        this._playTone(200, 0.06, 'square', null, 0.02, 0.15);
    }

    playPurify() {
        this.init();
        this.resume();
        const notes = [523, 659, 784, 1047, 1319];
        notes.forEach((freq, i) => {
            this._playTone(freq, 0.25, 'square', null, i * 0.08, 0.25);
            this._playTone(freq * 2, 0.15, 'sine', null, i * 0.08, 0.1);
        });
    }

    playDamage() {
        this.init();
        this.resume();
        this._playTone(150, 0.15, 'sawtooth', null, 0, 0.3);
        this._playTone(100, 0.2, 'sawtooth', null, 0.05, 0.2);
    }

    playPickup() {
        this.init();
        this.resume();
        this._playTone(784, 0.1, 'square', null, 0, 0.3);
        this._playTone(1047, 0.15, 'square', null, 0.08, 0.3);
        this._playTone(1319, 0.2, 'sine', null, 0.15, 0.2);
    }

    playPowerupCollect() {
        this.init();
        this.resume();
        const notes = [523, 659, 784, 880, 1047];
        notes.forEach((freq, i) => {
            this._playTone(freq, 0.15, 'square', null, i * 0.06, 0.3);
            this._playTone(freq * 1.5, 0.1, 'sine', null, i * 0.06, 0.15);
        });
    }

    playLuckyCharm() {
        this.init();
        this.resume();
        // Big magical ascending blast
        for (let i = 0; i < 8; i++) {
            this._playTone(440 + i * 100, 0.3, 'square', null, i * 0.03, 0.25);
            this._playTone(440 + i * 150, 0.2, 'sine', null, i * 0.03, 0.15);
        }
        this._playNoise(0.15, null, 0, 0.2);
        // Say "Lucky Charm!" via speech synthesis
        this._speak('Lucky Charm!');
    }

    playCataclysm() {
        this.init();
        this.resume();
        // Dark destructive blast
        this._playTone(220, 0.4, 'sawtooth', null, 0, 0.3);
        this._playTone(110, 0.5, 'sawtooth', null, 0.05, 0.25);
        this._playNoise(0.3, null, 0, 0.3);
        for (let i = 0; i < 5; i++) {
            this._playTone(150 + i * 50, 0.2, 'square', null, i * 0.05, 0.2);
        }
        // Say "Cataclysm!"
        this._speak('Cataclysm!');
    }

    _speak(text) {
        try {
            if ('speechSynthesis' in window) {
                const utter = new SpeechSynthesisUtterance(text);
                utter.rate = 1.1;
                utter.pitch = 1.2;
                utter.volume = 0.8;
                window.speechSynthesis.speak(utter);
            }
        } catch (e) {
            // Speech not available, that's ok
        }
    }

    playLevelComplete() {
        this.init();
        this.resume();
        const fanfare = [
            [523, 0.2], [523, 0.2], [523, 0.2], [659, 0.3],
            [587, 0.2], [659, 0.2], [784, 0.5]
        ];
        let t = 0;
        fanfare.forEach(([freq, dur]) => {
            this._playTone(freq, dur + 0.1, 'square', null, t, 0.3);
            this._playTone(freq / 2, dur + 0.1, 'square', null, t, 0.1);
            t += dur;
        });
    }

    playGameOver() {
        this.init();
        this.resume();
        const notes = [392, 349, 330, 262];
        notes.forEach((freq, i) => {
            this._playTone(freq, 0.4, 'square', null, i * 0.3, 0.25);
        });
    }

    playVictory() {
        this.init();
        this.resume();
        const melody = [
            [523, 0.15], [587, 0.15], [659, 0.15], [784, 0.3],
            [659, 0.15], [784, 0.15], [1047, 0.5],
            [784, 0.15], [1047, 0.15], [1319, 0.6]
        ];
        let t = 0;
        melody.forEach(([freq, dur]) => {
            this._playTone(freq, dur + 0.1, 'square', null, t, 0.25);
            this._playTone(freq * 0.5, dur + 0.1, 'triangle', null, t, 0.15);
            t += dur;
        });
        // Cheering crowd effect after fanfare
        setTimeout(() => this.playCheer(), (t + 0.3) * 1000);
    }

    playCheer() {
        this.init();
        this.resume();
        // Simulate crowd cheering with layered noise bursts and rising tones
        for (let i = 0; i < 6; i++) {
            this._playNoise(0.4, null, i * 0.15, 0.15);
            this._playTone(400 + Math.random() * 600, 0.3, 'sine', null, i * 0.12, 0.08);
        }
        // Rising excitement
        for (let i = 0; i < 8; i++) {
            this._playTone(300 + i * 80, 0.2, 'sine', null, 1 + i * 0.1, 0.1);
            this._playNoise(0.3, null, 1 + i * 0.12, 0.1);
        }
        // Final burst
        this._playNoise(0.6, null, 2, 0.2);
        this._playTone(1047, 0.4, 'square', null, 2, 0.15);
        this._playTone(1319, 0.5, 'square', null, 2.1, 0.15);
    }

    startMusic(levelIndex) {
        this.init();
        this.resume();
        this.stopMusic();
        this.musicPlaying = true;

        const isBoss = levelIndex === 3 || levelIndex === 6;
        const bpm = isBoss ? 160 : 130;
        const beatLen = 60 / bpm;

        // Original upbeat pop-rock 8-bit melodies inspired by the heroic energy of Miraculous
        const melodies = [
            // Level 1 - Catchy upbeat intro, driving pop energy
            [
                [659, 0.5], [659, 0.5], [784, 0.5], [659, 0.5], [587, 1], [523, 0.5], [587, 0.5],
                [659, 1], [784, 1], [880, 1], [784, 0.5], [659, 0.5],
                [587, 0.5], [587, 0.5], [659, 0.5], [587, 0.5], [523, 1], [440, 0.5], [523, 0.5],
                [587, 1], [659, 1], [523, 2],
            ],
            // Level 2 - Higher energy, syncopated pop-rock
            [
                [784, 0.5], [659, 0.5], [784, 1], [880, 0.5], [784, 0.5], [659, 1],
                [587, 0.5], [659, 0.5], [784, 1], [880, 1],
                [1047, 0.5], [880, 0.5], [784, 1], [659, 0.5], [587, 0.5], [659, 1],
                [784, 0.5], [659, 0.5], [587, 1], [523, 2],
            ],
            // Level 3 - Building intensity, heroic
            [
                [523, 0.5], [587, 0.5], [659, 1], [784, 0.5], [880, 0.5], [784, 1],
                [659, 0.5], [587, 0.5], [523, 1], [587, 1],
                [659, 0.5], [784, 0.5], [880, 1], [1047, 0.5], [880, 0.5], [784, 1],
                [659, 1], [587, 0.5], [523, 0.5], [587, 2],
            ],
            // Boss - Dark driving minor key, intense
            [
                [330, 0.5], [330, 0.5], [392, 0.5], [440, 0.5], [392, 1], [330, 0.5], [294, 0.5],
                [330, 0.5], [392, 0.5], [440, 1], [523, 0.5], [440, 0.5], [392, 1],
                [349, 0.5], [349, 0.5], [440, 0.5], [523, 0.5], [440, 1], [349, 0.5], [330, 0.5],
                [294, 0.5], [330, 0.5], [392, 1], [330, 2],
            ],
            // Level 5 - Triumphant anthemic feel
            [
                [880, 0.5], [880, 0.5], [1047, 0.5], [880, 0.5], [784, 1], [659, 0.5], [784, 0.5],
                [880, 1], [1047, 1], [880, 1],
                [784, 0.5], [784, 0.5], [880, 0.5], [784, 0.5], [659, 1], [587, 0.5], [659, 0.5],
                [784, 1], [880, 1], [659, 2],
            ],
            // Level 6 - Grand finale, full power
            [
                [880, 0.5], [1047, 0.5], [880, 1], [784, 0.5], [659, 0.5], [784, 1],
                [880, 0.5], [1047, 0.5], [1175, 1], [1047, 1],
                [880, 0.5], [784, 0.5], [659, 1], [784, 0.5], [880, 0.5], [1047, 1],
                [1175, 0.5], [1047, 0.5], [880, 1], [784, 2],
            ],
        ];

        // Driving pop-rock bass lines with 8th note energy
        const bassLines = [
            [[220, 1], [220, 1], [196, 1], [196, 1], [175, 1], [175, 1], [196, 1], [220, 1]],
            [[330, 1], [330, 1], [262, 1], [262, 1], [294, 1], [294, 1], [262, 1], [262, 1]],
            [[262, 1], [262, 1], [294, 1], [294, 1], [330, 1], [330, 1], [294, 1], [262, 1]],
            [[165, 0.5], [165, 0.5], [165, 0.5], [165, 0.5], [175, 0.5], [175, 0.5], [175, 0.5], [175, 0.5],
             [147, 0.5], [147, 0.5], [147, 0.5], [147, 0.5], [165, 0.5], [165, 0.5], [165, 0.5], [165, 0.5]],
            [[330, 1], [330, 1], [262, 1], [262, 1], [294, 1], [294, 1], [330, 1], [330, 1]],
            [[330, 1], [349, 1], [330, 1], [262, 1], [294, 1], [330, 1], [349, 1], [330, 1]],
        ];

        const melody = melodies[Math.min(levelIndex, melodies.length - 1)];
        const bass = bassLines[Math.min(levelIndex, bassLines.length - 1)];

        let melodyIdx = 0;
        let bassIdx = 0;
        let melodyWait = 0;
        let bassWait = 0;

        const scheduleAhead = 0.1;
        let nextNoteTime = this.ctx.currentTime + 0.05;

        const tick = () => {
            if (!this.musicPlaying) return;

            while (nextNoteTime < this.ctx.currentTime + scheduleAhead) {
                // Melody
                if (melodyWait <= 0) {
                    const [freq, beats] = melody[melodyIdx % melody.length];
                    const dur = beats * beatLen;
                    this._playTone(freq, dur * 0.9, 'square', this.musicGain, nextNoteTime - this.ctx.currentTime, 0.2);
                    if (isBoss) {
                        this._playTone(freq * 1.005, dur * 0.9, 'sawtooth', this.musicGain, nextNoteTime - this.ctx.currentTime, 0.08);
                    }
                    melodyWait = beats;
                    melodyIdx++;
                }

                // Bass
                if (bassWait <= 0) {
                    const [freq, beats] = bass[bassIdx % bass.length];
                    const dur = beats * beatLen;
                    this._playTone(freq, dur * 0.8, 'triangle', this.musicGain, nextNoteTime - this.ctx.currentTime, 0.25);
                    bassWait = beats;
                    bassIdx++;
                }

                const step = 0.5;
                melodyWait -= step;
                bassWait -= step;
                nextNoteTime += step * beatLen;
            }

            this.musicTimer = requestAnimationFrame(tick);
        };

        tick();
    }

    stopMusic() {
        this.musicPlaying = false;
        if (this.musicTimer) {
            cancelAnimationFrame(this.musicTimer);
            this.musicTimer = null;
        }
    }
}
