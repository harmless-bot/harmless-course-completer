/**
 * ============================================================================
 * 🚽 Skibidi AutoPilot 3000 - Brainrot Edition Popup Controller
 * Engineered by GigaChad: Divyanshu Rai (@harmless-bot)
 * GitHub: https://github.com/harmless-bot
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', async () => {
    // ------------------------------------------------------------------------
    // WEB AUDIO BRAINROT SOUND SYNTHESIZER (Pure JS, No external files needed)
    // ------------------------------------------------------------------------
    let audioCtx = null;
    function getAudioContext() {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) audioCtx = new AudioContextClass();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    function playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.15) {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(gainVal, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) {}
    }

    function playToiletFlushSound() {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;
            const bufferSize = ctx.sampleRate * 1.5;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, ctx.currentTime);
            filter.frequency.linearRampToValueAtTime(120, ctx.currentTime + 1.5);

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            noise.start();
        } catch (e) {}
    }

    function playSkibidiAnthem() {
        // "Brrr Skibidi Dop Dop Dop Yes Yes" Melody Notes
        const notes = [
            { f: 220, d: 0.08, t: 'sawtooth' }, // Brr
            { f: 246, d: 0.08, t: 'sawtooth' },
            { f: 293, d: 0.12, t: 'square' },   // Ski-
            { f: 261, d: 0.12, t: 'square' },   // bi-
            { f: 220, d: 0.16, t: 'triangle' }, // di
            { f: 330, d: 0.10, t: 'square' },   // Dop
            { f: 330, d: 0.10, t: 'square' },   // Dop
            { f: 330, d: 0.14, t: 'square' },   // Dop
            { f: 440, d: 0.18, t: 'sawtooth' }, // Yes
            { f: 392, d: 0.22, t: 'sawtooth' }  // Yes
        ];
        let delay = 0;
        notes.forEach(n => {
            setTimeout(() => {
                playTone(n.f, n.t, n.d, 0.22);
            }, delay);
            delay += (n.d * 1000) + 40;
        });
    }

    function playSigmaSound() {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.6);
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.6);
        } catch (e) {}
    }

    function playFanumTaxSound() {
        // Deep 808 Boom
        try {
            const ctx = getAudioContext();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(130, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.5);
            gain.gain.setValueAtTime(0.4, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        } catch (e) {}
    }

    function playGyattSound() {
        const arpeggio = [261.63, 329.63, 392.00, 523.25, 659.25];
        arpeggio.forEach((freq, idx) => {
            setTimeout(() => {
                playTone(freq, 'square', 0.12, 0.18);
            }, idx * 70);
        });
    }

    function playMewingSound() {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(900, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.4);
        } catch (e) {}
    }

    // ------------------------------------------------------------------------
    // STORAGE ADAPTER
    // ------------------------------------------------------------------------
    const storage = {
        async get() {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                return await chrome.storage.local.get(null);
            }
            try {
                const raw = localStorage.getItem('harmless_autopilot_settings');
                return raw ? JSON.parse(raw) : {};
            } catch (e) {
                return {};
            }
        },
        async set(items) {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                return await chrome.storage.local.set(items);
            }
            try {
                const current = await this.get();
                Object.assign(current, items);
                localStorage.setItem('harmless_autopilot_settings', JSON.stringify(current));
            } catch (e) {}
        }
    };

    function safeSendMessage(msg) {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            try {
                chrome.runtime.sendMessage(msg, () => {});
            } catch (e) {}
        }
    }

    // ------------------------------------------------------------------------
    // TABS CONTROLLER
    // ------------------------------------------------------------------------
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            playTone(480, 'sine', 0.08, 0.1);
            const target = btn.getAttribute('data-tab');
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const pane = document.getElementById(`tab-${target}`);
            if (pane) pane.classList.add('active');
        });
    });

    // ------------------------------------------------------------------------
    // SOUNDBOARD CONTROLS
    // ------------------------------------------------------------------------
    const sndAnthem = document.getElementById('snd-anthem');
    if (sndAnthem) sndAnthem.addEventListener('click', playSkibidiAnthem);

    const sndSigma = document.getElementById('snd-sigma');
    if (sndSigma) sndSigma.addEventListener('click', playSigmaSound);

    const sndFlush = document.getElementById('snd-flush');
    if (sndFlush) sndFlush.addEventListener('click', playToiletFlushSound);

    const sndFanum = document.getElementById('snd-fanum');
    if (sndFanum) sndFanum.addEventListener('click', playFanumTaxSound);

    const sndGyatt = document.getElementById('snd-gyatt');
    if (sndGyatt) sndGyatt.addEventListener('click', playGyattSound);

    const sndMewing = document.getElementById('snd-mewing');
    if (sndMewing) sndMewing.addEventListener('click', playMewingSound);

    // ------------------------------------------------------------------------
    // CONTROL ELEMENTS
    // ------------------------------------------------------------------------
    const masterToggle = document.getElementById('master-toggle');
    const bypassToggle = document.getElementById('bypass-toggle');
    const navigateToggle = document.getElementById('navigate-toggle');
    const quizToggle = document.getElementById('quiz-toggle');
    const focusSelect = document.getElementById('focus-mode-select');
    const providerSelect = document.getElementById('ai-provider-select');

    const speedSlider = document.getElementById('speed-slider');
    const speedLabel = document.getElementById('speed-label');
    const speedPresets = document.querySelectorAll('.speed-btn');

    const keyGemini = document.getElementById('key-gemini');
    const keyGroq = document.getElementById('key-groq');
    const keyOpenRouter = document.getElementById('key-openrouter');
    const keyNvidia = document.getElementById('key-nvidia');

    const statVideos = document.getElementById('stat-videos');
    const statQuizzes = document.getElementById('stat-quizzes');
    const statTime = document.getElementById('stat-time');

    const logList = document.getElementById('log-list');
    const btnClearLog = document.getElementById('btn-clear-log');

    // Load initial settings
    const config = await storage.get();

    if (config.harmlessEnabled !== undefined) masterToggle.checked = config.harmlessEnabled;
    if (config.harmlessSuperBypass !== undefined) bypassToggle.checked = config.harmlessSuperBypass;
    if (config.harmlessAutoNavigate !== undefined) navigateToggle.checked = config.harmlessAutoNavigate;
    if (config.harmlessAutoSolveQuizzes !== undefined) quizToggle.checked = config.harmlessAutoSolveQuizzes;
    if (config.harmlessFocusMode) focusSelect.value = config.harmlessFocusMode;
    if (config.harmlessAiProvider) providerSelect.value = config.harmlessAiProvider;

    const currentSpeed = config.harmlessSpeed || 2.0;
    speedSlider.value = currentSpeed;
    speedLabel.textContent = `${currentSpeed}x`;
    updatePresetHighlight(currentSpeed);

    if (config.geminiApiKey) keyGemini.value = config.geminiApiKey;
    if (config.groqApiKey) keyGroq.value = config.groqApiKey;
    if (config.openRouterApiKey) keyOpenRouter.value = config.openRouterApiKey;
    if (config.nvidiaApiKey) keyNvidia.value = config.nvidiaApiKey;

    updateProviderGroup(config.harmlessAiProvider || 'gemini');

    // Stats
    statVideos.textContent = config.statVideosFinished || 0;
    statQuizzes.textContent = config.statQuizzesPassed || 0;
    const mins = config.statMinutesSaved || 0;
    statTime.textContent = mins >= 60 ? `${(mins / 60).toFixed(1)}h` : `${mins}m`;

    // Listeners
    masterToggle.addEventListener('change', async () => {
        playTone(masterToggle.checked ? 600 : 300, 'square', 0.1);
        await storage.set({ harmlessEnabled: masterToggle.checked });
        safeSendMessage({ type: 'SET_BADGE', enabled: masterToggle.checked });
        addFeedLog(`🚀 Skibidi AutoPilot is now ${masterToggle.checked ? 'MOGGING (ENABLED)' : 'TOUCHING GRASS (PAUSED)'}`);
    });

    bypassToggle.addEventListener('change', async () => {
        if (bypassToggle.checked) {
            playToiletFlushSound();
        } else {
            playTone(350, 'triangle', 0.1);
        }
        await storage.set({ harmlessSuperBypass: bypassToggle.checked });
        addFeedLog(`🚽 Super Skibidi Bypass: ${bypassToggle.checked ? 'ON 🔥 (Flushing courses into Ohio!)' : 'OFF'}`);
    });

    navigateToggle.addEventListener('change', async () => {
        playTone(520, 'sine', 0.08);
        await storage.set({ harmlessAutoNavigate: navigateToggle.checked });
        addFeedLog(`⏭️ Fanum Tax Auto-Advance: ${navigateToggle.checked ? 'ENABLED' : 'DISABLED'}`);
    });

    quizToggle.addEventListener('change', async () => {
        playTone(quizToggle.checked ? 580 : 320, 'square', 0.08);
        await storage.set({ harmlessAutoSolveQuizzes: quizToggle.checked });
        addFeedLog(`🧠 AI Quiz Auto-Cooker: ${quizToggle.checked ? 'ACTIVE (999+ Aura)' : 'DISABLED'}`);
    });

    focusSelect.addEventListener('change', async () => {
        playTone(440, 'triangle', 0.08);
        await storage.set({ harmlessFocusMode: focusSelect.value });
        addFeedLog(`🎯 Focus Grindset: ${focusSelect.options[focusSelect.selectedIndex].text}`);
    });

    providerSelect.addEventListener('change', async () => {
        const val = providerSelect.value;
        playTone(500, 'sine', 0.08);
        await storage.set({ harmlessAiProvider: val });
        updateProviderGroup(val);
        addFeedLog(`🤖 AI Rizz Provider set to: ${val.toUpperCase()}`);
    });

    function updateProviderGroup(provider) {
        document.getElementById('group-gemini').style.display = provider === 'gemini' ? 'block' : 'none';
        document.getElementById('group-groq').style.display = provider === 'groq' ? 'block' : 'none';
        document.getElementById('group-openrouter').style.display = provider === 'openrouter' ? 'block' : 'none';
        document.getElementById('group-nvidia').style.display = provider === 'nvidia' ? 'block' : 'none';
    }

    // Speed Slider
    speedSlider.addEventListener('input', () => {
        const val = parseFloat(speedSlider.value);
        speedLabel.textContent = `${val}x`;
        updatePresetHighlight(val);
    });

    speedSlider.addEventListener('change', async () => {
        const val = parseFloat(speedSlider.value);
        playTone(200 + (val * 40), 'sawtooth', 0.12, 0.15);
        await storage.set({ harmlessSpeed: val });
        addFeedLog(`⚡ Speed Mogger set to ${val}x ${val >= 16 ? '(MAX SKIBIDI GOD)' : ''}`);
    });

    // Speed Presets
    speedPresets.forEach(btn => {
        btn.addEventListener('click', async () => {
            const s = parseFloat(btn.getAttribute('data-speed'));
            speedSlider.value = s;
            speedLabel.textContent = `${s}x`;
            updatePresetHighlight(s);
            playTone(250 + (s * 35), 'sawtooth', 0.12, 0.15);
            await storage.set({ harmlessSpeed: s });
            addFeedLog(`🔥 Speed preset locked: ${s}x`);
        });
    });

    function updatePresetHighlight(val) {
        speedPresets.forEach(b => {
            const btnSpeed = parseFloat(b.getAttribute('data-speed'));
            if (btnSpeed === val) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });
    }

    // API Key inputs
    const keyInputs = [
        { el: keyGemini, key: 'geminiApiKey' },
        { el: keyGroq, key: 'groqApiKey' },
        { el: keyOpenRouter, key: 'openRouterApiKey' },
        { el: keyNvidia, key: 'nvidiaApiKey' }
    ];

    keyInputs.forEach(({ el, key }) => {
        el.addEventListener('input', async () => {
            const obj = {};
            obj[key] = el.value.trim();
            await storage.set(obj);
        });
    });

    // Toggle Eye Buttons
    document.querySelectorAll('.toggle-visibility').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (input) {
                input.type = input.type === 'password' ? 'text' : 'password';
            }
        });
    });

    if (btnClearLog) {
        btnClearLog.addEventListener('click', () => {
            playToiletFlushSound();
            logList.innerHTML = '<div class="log-entry"><span class="log-time">[Flushed]</span> Feed flushed down the toilet! 🚽 Clean slate fr fr.</div>';
        });
    }

    function addFeedLog(msg) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `<span class="log-time">[${time}]</span> ${msg}`;
        logList.insertBefore(entry, logList.firstChild);
    }
});
