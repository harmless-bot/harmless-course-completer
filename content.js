/**
 * ============================================================================
 * OmniLearn AutoPilot - Content Automation Engine
 * Developed by: Divyanshu Rai (@harmless-bot)
 * GitHub: https://github.com/harmless-bot
 * 
 * Supports: Coursera & LinkedIn Learning
 * Features:
 * - Adaptive multi-platform video controller with Super Bypass & 16x Turbo fallback
 * - Bulletproof Green-Tick sidebar confirmation before advancing
 * - Auto-advances across lectures, readings, quizzes, and modules
 * - AI Chapter Quiz & Practice Test Auto-Solver (Gemini, Groq, OpenRouter, NVIDIA)
 * - Single-Question (LinkedIn) & Multi-Question (Coursera) quiz engines
 * - Obsidian & Electric Purple Cybernetic Floating HUD
 * ============================================================================
 */

(function() {
    'use strict';

    if (window.__dr_autopilot_content_loaded__) return;
    window.__dr_autopilot_content_loaded__ = true;

    // Platform detection
    const isCoursera = window.location.hostname.includes('coursera.org');
    const isLinkedIn = window.location.hostname.includes('linkedin.com');
    const platformLabel = isCoursera ? 'Coursera' : isLinkedIn ? 'LinkedIn' : 'Learning';

    // Configuration state
    const drConfig = {
        harmlessEnabled: true,
        harmlessSpeed: 2.0,
        harmlessSpeedInjection: true,
        harmlessSuperBypass: false,
        harmlessIsPaused: false,
        harmlessAutoNavigate: true,
        harmlessAutoSolveQuizzes: true,
        harmlessFocusMode: 'all', // 'all', 'incomplete_only', 'videos_only', 'quizzes_only'
        harmlessAiProvider: 'gemini',
        geminiApiKey: '',
        groqApiKey: '',
        openRouterApiKey: '',
        nvidiaApiKey: ''
    };

    let drFloatingBar = null;
    let drActiveMediaIdentifier = '';
    let drLastNavTimestamp = 0;

    // Video Engine State Machine
    let drBypassAttempted = false;
    let drBypassStartTime = 0;
    let drFallbackTo16xEngaged = false;
    let drVideoStartTime = 0;
    let drVideoEndedFirstSeen = 0;
    let drHasNavigatedForCurrentVideo = false;
    let drItemReattemptMap = {};

    // Quiz Automation State
    let drQuizProcessing = false;
    let drLastProcessedQuestion = '';
    let drLastQuizActionTime = 0;

    // Load initial settings
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(null, (stored) => {
            if (stored) {
                Object.assign(drConfig, stored);
                drSyncSpeedToMainWorld();
                drUpdateFloatingHUD();
            }
        });

        chrome.storage.onChanged.addListener((changes, area) => {
            if (area === 'local') {
                for (const [key, change] of Object.entries(changes)) {
                    drConfig[key] = change.newValue;
                }
                drSyncSpeedToMainWorld();
                drUpdateFloatingHUD();
            }
        });
    }

    function drSyncSpeedToMainWorld() {
        try {
            window.postMessage({
                type: 'HARMLESS_SET_SPEED',
                speed: drConfig.harmlessSpeed,
                enabled: drConfig.harmlessEnabled && drConfig.harmlessSpeedInjection && !drConfig.harmlessIsPaused
            }, '*');
        } catch (e) {}
    }

    // ------------------------------------------------------------------------
    // SYNTHETIC EVENT TRIGGER (POINTER + MOUSE + NATIVE CLICK)
    // ------------------------------------------------------------------------
    function triggerClick(el) {
        if (!el) return;
        try { el.focus(); } catch (e) {}
        try { el.scrollIntoView({ behavior: 'instant', block: 'center' }); } catch (e) {}

        try {
            const pOpts = { bubbles: true, cancelable: true, view: window, composed: true, pointerId: 1, pointerType: 'mouse', isPrimary: true };
            const mOpts = { bubbles: true, cancelable: true, view: window, composed: true, buttons: 1 };
            el.dispatchEvent(new PointerEvent('pointerdown', pOpts));
            el.dispatchEvent(new MouseEvent('mousedown', mOpts));
            el.dispatchEvent(new PointerEvent('pointerup', pOpts));
            el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window, composed: true }));
        } catch (e) {}

        try { el.click(); } catch (e) {}
    }

    // ------------------------------------------------------------------------
    // FLOATING ON-PLAYER CONTROLLER HUD (CYBERNETIC OBSIDIAN THEME)
    // ------------------------------------------------------------------------
    function drCreateFloatingHUD() {
        if (!document.body || !document.head) return;
        if (drFloatingBar && document.contains(drFloatingBar)) return;

        let toiletImgUrl = '';
        try {
            toiletImgUrl = chrome.runtime.getURL('icons/icon48.png');
        } catch (e) {}

        drFloatingBar = document.createElement('div');
        drFloatingBar.id = 'harmless-autopilot-widget';
        drFloatingBar.innerHTML = `
            <div id="dr-hud-header" title="🚽 Skibidi AutoPilot 3000 by Divyanshu Rai (@harmless-bot)">
                <div style="display:flex; align-items:center; gap:6px;">
                    ${toiletImgUrl ? `<img src="${toiletImgUrl}" class="dr-toilet-icon" alt="🚽">` : `<span style="font-size:16px;">🚽</span>`}
                    <span id="dr-hud-brand">Skibidi Mogger • ${platformLabel}</span>
                </div>
                <span id="dr-hud-speed-pill">2.0x 🗿</span>
            </div>
            <div id="dr-hud-status-line">
                <span id="dr-hud-status">🟢 Rizzing in Ohio</span>
            </div>
            <div id="dr-hud-controls">
                <button id="dr-btn-minus" title="Mew / Decrease Speed (HotKey: [)">- Mew</button>
                <button class="dr-btn-speed" data-speed="2.0">2x 🗿</button>
                <button class="dr-btn-speed" data-speed="4.0">4x 🍷</button>
                <button class="dr-btn-speed" data-speed="8.0">8x 👑</button>
                <button class="dr-btn-speed" data-speed="16.0">16x 🚽</button>
                <button id="dr-btn-plus" title="Mog / Increase Speed (HotKey: ])">+ Mog</button>
                <button id="dr-btn-bypass" title="Super Skibidi Bypass Mode (HotKey: \\)">🚽 Flush</button>
                <button id="dr-btn-end" title="Fast-forward End Yap">⏩ End</button>
                <button id="dr-btn-next" title="Fanum Tax Next Item">⏭️ Next</button>
                <button id="dr-btn-pause" title="Touch Grass / Pause">⏸️ Pause</button>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes drRainbowGlow {
                0% { border-color: #ec4899; box-shadow: 0 0 15px rgba(236, 72, 153, 0.4), 0 10px 30px rgba(0,0,0,0.8); }
                33% { border-color: #a855f7; box-shadow: 0 0 15px rgba(168, 85, 247, 0.4), 0 10px 30px rgba(0,0,0,0.8); }
                66% { border-color: #22c55e; box-shadow: 0 0 15px rgba(34, 197, 94, 0.4), 0 10px 30px rgba(0,0,0,0.8); }
                100% { border-color: #ec4899; box-shadow: 0 0 15px rgba(236, 72, 153, 0.4), 0 10px 30px rgba(0,0,0,0.8); }
            }
            @keyframes drToiletWobble {
                0%, 100% { transform: rotate(0deg) scale(1); }
                25% { transform: rotate(-8deg) scale(1.1); }
                75% { transform: rotate(8deg) scale(1.1); }
            }
            #harmless-autopilot-widget {
                position: fixed;
                bottom: 24px;
                right: 24px;
                z-index: 9999999;
                background: rgba(14, 8, 26, 0.96);
                backdrop-filter: blur(14px);
                -webkit-backdrop-filter: blur(14px);
                border: 2px solid #ec4899;
                border-radius: 14px;
                padding: 10px 14px;
                color: #f8fafc;
                font-family: 'Comic Sans MS', 'Chalkboard SE', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, cursive, sans-serif;
                font-size: 12px;
                user-select: none;
                transition: transform 0.2s ease, opacity 0.2s ease;
                display: flex;
                flex-direction: column;
                gap: 6px;
                animation: drRainbowGlow 5s linear infinite;
            }
            .dr-toilet-icon {
                width: 22px;
                height: 22px;
                border-radius: 6px;
                animation: drToiletWobble 2.5s infinite ease-in-out;
                vertical-align: middle;
            }
            #dr-hud-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                font-weight: 800;
                gap: 12px;
                cursor: grab;
            }
            #dr-hud-brand {
                color: #fde047;
                font-size: 11.5px;
                letter-spacing: 0.3px;
                text-shadow: 0 0 8px rgba(250, 204, 21, 0.4);
            }
            #dr-hud-speed-pill {
                background: linear-gradient(135deg, #ec4899, #8b5cf6);
                color: #ffffff;
                padding: 2px 8px;
                border-radius: 8px;
                font-size: 11px;
                font-weight: 800;
                box-shadow: 0 0 8px rgba(236, 72, 153, 0.5);
            }
            #dr-hud-status-line {
                font-size: 10.5px;
                color: #f43f5e;
                font-weight: 700;
            }
            #dr-hud-controls {
                display: flex;
                align-items: center;
                gap: 4px;
                flex-wrap: wrap;
            }
            #dr-hud-controls button {
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.15);
                color: #f1f5f9;
                border-radius: 6px;
                padding: 4px 7px;
                font-size: 11px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.15s ease;
                font-family: inherit;
            }
            #dr-hud-controls button:hover {
                background: rgba(236, 72, 153, 0.3);
                border-color: #ec4899;
                transform: scale(1.05);
            }
            #dr-btn-bypass {
                background: rgba(245, 158, 11, 0.2) !important;
                border: 1px solid #f59e0b !important;
                color: #fbbf24 !important;
            }
            #dr-btn-bypass.active {
                background: linear-gradient(135deg, #f59e0b, #ef4444) !important;
                color: #ffffff !important;
                font-weight: 800 !important;
                box-shadow: 0 0 12px rgba(245, 158, 11, 0.7);
            }
            #dr-btn-end {
                background: rgba(16, 185, 129, 0.2) !important;
                border: 1px solid #10b981 !important;
                color: #34d399 !important;
            }
            #dr-btn-next {
                background: rgba(14, 165, 233, 0.2) !important;
                border: 1px solid #0ea5e9 !important;
                color: #38bdf8 !important;
            }
            #dr-btn-pause {
                background: rgba(239, 68, 68, 0.2) !important;
                border: 1px solid #ef4444 !important;
                color: #f87171 !important;
            }
            #dr-btn-pause.active {
                background: #ef4444 !important;
                color: #ffffff !important;
                font-weight: 800 !important;
                box-shadow: 0 0 10px rgba(239, 68, 68, 0.6);
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(drFloatingBar);

        // Bind events
        drFloatingBar.querySelector('#dr-btn-minus').addEventListener('click', () => {
            drSetSpeed(Math.max(0.5, +(drConfig.harmlessSpeed - 0.5).toFixed(1)));
        });

        drFloatingBar.querySelector('#dr-btn-plus').addEventListener('click', () => {
            drSetSpeed(Math.min(16.0, +(drConfig.harmlessSpeed + 0.5).toFixed(1)));
        });

        drFloatingBar.querySelectorAll('.dr-btn-speed').forEach(btn => {
            btn.addEventListener('click', () => {
                const s = parseFloat(btn.getAttribute('data-speed'));
                if (s) drSetSpeed(s);
            });
        });

        const bypassBtn = drFloatingBar.querySelector('#dr-btn-bypass');
        bypassBtn.addEventListener('click', () => {
            drConfig.harmlessSuperBypass = !drConfig.harmlessSuperBypass;
            if (chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({ harmlessSuperBypass: drConfig.harmlessSuperBypass });
            }
            drUpdateFloatingHUD();
            drShowToast(`⚡ Super Bypass: ${drConfig.harmlessSuperBypass ? 'ON' : 'OFF'}`);
        });

        drFloatingBar.querySelector('#dr-btn-end').addEventListener('click', () => {
            drFastForwardToEnd();
        });

        drFloatingBar.querySelector('#dr-btn-next').addEventListener('click', () => {
            drAdvanceToNextItem(true);
        });

        drFloatingBar.querySelector('#dr-btn-pause').addEventListener('click', () => {
            drConfig.harmlessIsPaused = !drConfig.harmlessIsPaused;
            if (chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({ harmlessIsPaused: drConfig.harmlessIsPaused });
            }
            drSyncSpeedToMainWorld();
            drUpdateFloatingHUD();
            drShowToast(`AutoPilot ${drConfig.harmlessIsPaused ? 'Paused' : 'Resumed'}`);
            
            const video = document.querySelector('video');
            if (video) {
                if (drConfig.harmlessIsPaused) {
                    try { video.pause(); } catch(e) {}
                } else {
                    try { video.play().catch(()=>{}); } catch(e) {}
                }
            }
        });

        drMakeDraggable(drFloatingBar);
        drUpdateFloatingHUD();
    }

    function drSetSpeed(targetSpeed) {
        drConfig.harmlessSpeed = targetSpeed;
        if (chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ harmlessSpeed: targetSpeed });
        }
        drSyncSpeedToMainWorld();
        drUpdateFloatingHUD();
        drShowToast(`Playback speed set to ${targetSpeed}x ${targetSpeed >= 16 ? '(SKIBIDI GOD)' : '(MOGGING)'}`);
    }

    function drUpdateFloatingHUD() {
        if (!drFloatingBar) return;
        const speedPill = drFloatingBar.querySelector('#dr-hud-speed-pill');
        if (speedPill) speedPill.textContent = `${drConfig.harmlessSpeed}x 🗿`;

        const bypassBtn = drFloatingBar.querySelector('#dr-btn-bypass');
        if (bypassBtn) {
            if (drConfig.harmlessSuperBypass) {
                bypassBtn.classList.add('active');
                bypassBtn.textContent = '🚽 Flush: ON';
            } else {
                bypassBtn.classList.remove('active');
                bypassBtn.textContent = '🚽 Flush: OFF';
            }
        }

        const pauseBtn = drFloatingBar.querySelector('#dr-btn-pause');
        if (pauseBtn) {
            if (drConfig.harmlessIsPaused) {
                pauseBtn.classList.add('active');
                pauseBtn.textContent = '▶️ Lock In';
            } else {
                pauseBtn.classList.remove('active');
                pauseBtn.textContent = '⏸️ Touch Grass';
            }
        }

        const statusEl = drFloatingBar.querySelector('#dr-hud-status');
        if (statusEl) {
            if (!drConfig.harmlessEnabled) {
                statusEl.textContent = '⏹️ Disabled (Beta In Ohio)';
                statusEl.style.color = '#94a3b8';
            } else if (drConfig.harmlessIsPaused) {
                statusEl.textContent = '⏸️ Touching Grass (Paused)';
                statusEl.style.color = '#f87171';
            } else if (drConfig.harmlessSuperBypass) {
                statusEl.textContent = '🚽 Super Skibidi Bypass Active';
                statusEl.style.color = '#fbbf24';
            } else {
                statusEl.textContent = `🟢 Mogging In Ohio (${drConfig.harmlessSpeed}x) 🗿`;
                statusEl.style.color = '#10b981';
            }
        }
    }

    function drMakeDraggable(widgetEl) {
        let isDragging = false;
        let startX, startY, origX, origY;
        const header = widgetEl.querySelector('#dr-hud-header');

        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            header.style.cursor = 'grabbing';
            startX = e.clientX;
            startY = e.clientY;
            const r = widgetEl.getBoundingClientRect();
            origX = r.left;
            origY = r.top;
            e.preventDefault();
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            widgetEl.style.left = `${origX + (e.clientX - startX)}px`;
            widgetEl.style.top = `${origY + (e.clientY - startY)}px`;
            widgetEl.style.right = 'auto';
            widgetEl.style.bottom = 'auto';
        });

        window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                header.style.cursor = 'grab';
            }
        });
    }

    function drShowToast(text) {
        if (!document.body) return;
        let toast = document.getElementById('dr-hud-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'dr-hud-toast';
            toast.style.cssText = `
                position: fixed;
                top: 24px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(14, 8, 26, 0.96);
                border: 2px solid #ec4899;
                color: #fde047;
                padding: 9px 20px;
                border-radius: 20px;
                font-size: 13px;
                font-weight: 800;
                font-family: 'Comic Sans MS', 'Chalkboard SE', cursive, sans-serif;
                box-shadow: 0 4px 25px rgba(236, 72, 153, 0.5);
                z-index: 10000000;
                transition: opacity 0.3s ease;
                pointer-events: none;
                text-shadow: 0 0 8px rgba(0,0,0,0.8);
            `;
            document.body.appendChild(toast);
        }
        toast.textContent = `🚽 ${text} 🔥`;
        toast.style.opacity = '1';
        clearTimeout(toast.__timer);
        toast.__timer = setTimeout(() => {
            toast.style.opacity = '0';
        }, 2500);
    }

    function drUpdateHudStatus(text) {
        if (!drFloatingBar) return;
        const statusEl = drFloatingBar.querySelector('#dr-hud-status');
        if (statusEl) {
            statusEl.textContent = text;
            statusEl.style.color = '#a855f7';
        }
    }

    // ------------------------------------------------------------------------
    // SIDEBAR & GREEN-TICK COMPLETION DETECTOR
    // ------------------------------------------------------------------------

    function drIsGreenColor(str) {
        if (!str) return false;
        const match = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
            const r = parseInt(match[1]), g = parseInt(match[2]), b = parseInt(match[3]);
            return g > 70 && g > r * 1.15 && g > b * 1.15;
        }
        if (str.startsWith('#')) {
            const hex = str.replace('#', '');
            if (hex.length === 6) {
                const r = parseInt(hex.substring(0, 2), 16);
                const g = parseInt(hex.substring(2, 4), 16);
                const b = parseInt(hex.substring(4, 6), 16);
                return g > 70 && g > r * 1.15 && g > b * 1.15;
            }
        }
        return false;
    }

    function drGetCourseLinks() {
        const parts = location.pathname.split('/').filter(Boolean);
        if (parts.length < 2 || parts[0] !== 'learning') return [];
        const prefix = `/learning/${parts[1]}/`;
        const anchors = Array.from(document.querySelectorAll('a[href]'));
        const result = [];
        const seen = new Set();
        for (const a of anchors) {
            try {
                const url = new URL(a.href, location.href);
                if (url.origin === location.origin && url.pathname.startsWith(prefix) && url.pathname !== prefix) {
                    const normPath = url.pathname.replace(/\/+$/, '');
                    if (!seen.has(normPath)) {
                        seen.add(normPath);
                        result.push({
                            element: a,
                            path: normPath,
                            url: url.href,
                            text: (a.innerText || a.getAttribute('aria-label') || '').trim()
                        });
                    }
                }
            } catch(e) {}
        }
        return result;
    }

    function drGetCurrentSidebarItem() {
        // 1. By URL slug matching (deterministic and resilient)
        const currentPath = window.location.pathname.replace(/\/+$/, '');
        const segments = currentPath.split('/').filter(Boolean);
        const slug = segments[segments.length - 1] || '';

        if (slug) {
            const anchors = document.querySelectorAll(`
                .classroom-toc a[href*="${slug}"],
                .classroom-toc-item a[href*="${slug}"],
                nav a[href*="${slug}"],
                a[href*="${slug}"]
            `);
            for (const a of anchors) {
                const item = a.closest('li, .classroom-toc-item, .rc-WeekItemName, [data-control-name="course_item"]');
                if (item) return item;
                if (a) return a;
            }
        }

        // 2. Active / selected selectors
        const activeSelectors = [
            '.classroom-toc-item--selected',
            '.classroom-toc-item--active',
            'li.classroom-toc-item[aria-selected="true"]',
            'li.classroom-toc-item[aria-current="true"]',
            '.classroom-toc-item.active',
            '.rc-WeekItemName--selected',
            'li[class*="ItemName"][class*="selected"]',
            'li[aria-current="true"]',
            'li[aria-selected="true"]',
            'a[aria-current="page"]',
            '.cds-NavigationItem.active',
            '[data-control-name="course_item"].active'
        ];
        for (const sel of activeSelectors) {
            const el = document.querySelector(sel);
            if (el) return el.closest('li') || el;
        }

        return null;
    }

    function drIsItemCompleted(itemEl) {
        if (!itemEl) return false;

        // A. Aria-label inspection across item and children
        const labels = [
            itemEl.getAttribute('aria-label') || '',
            ...Array.from(itemEl.querySelectorAll('[aria-label]')).map(el => el.getAttribute('aria-label') || '')
        ].join(' ');
        if (/\b(completed|complete|viewed|passed)\b/i.test(labels)) return true;

        // B. Class check
        if (itemEl.classList.contains('classroom-toc-item--completed') ||
            itemEl.classList.contains('completed') ||
            itemEl.classList.contains('viewed') ||
            itemEl.querySelector('.classroom-toc-item--completed, .completed, .is-completed, [class*="--completed"]')) {
            return true;
        }

        // C. Specific check icon elements
        const checkEl = itemEl.querySelector(`
            svg[data-test-icon*="check"],
            svg[data-testid*="check"],
            .classroom-toc-item__check-icon,
            .cds-icon-check,
            li-icon[type*="check"],
            [data-test-icon*="check"],
            use[href*="check"],
            use[*|href*="check"]
        `);
        if (checkEl) return true;

        // D. Inspect SVGs for checkmark paths or green color
        const svgs = itemEl.querySelectorAll('svg, li-icon');
        for (const svg of svgs) {
            const useEl = svg.querySelector('use');
            if (useEl) {
                const href = useEl.getAttribute('href') || useEl.getAttribute('xlink:href') || '';
                if (/check|complete|done|tick/i.test(href)) return true;
            }

            const paths = svg.querySelectorAll('path');
            for (const p of paths) {
                const d = p.getAttribute('d') || '';
                if (d.includes('M9 16.2') || d.includes('M9 16.17') || d.includes('9.86 18') || d.includes('M10 15.172') || d.includes('M12 2C6.48')) {
                    return true;
                }
            }

            try {
                const cs = window.getComputedStyle(svg);
                if (drIsGreenColor(cs.color) || drIsGreenColor(cs.fill) || drIsGreenColor(cs.stroke)) {
                    return true;
                }
            } catch(e) {}
        }

        // E. Sibling check (if itemEl is inside li)
        const li = itemEl.closest('li');
        if (li && li !== itemEl) {
            return drIsItemCompleted(li);
        }

        return false;
    }

    function drIsCurrentItemCompletedInSidebar() {
        const current = drGetCurrentSidebarItem();
        if (!current) return null;
        return drIsItemCompleted(current);
    }

    // ------------------------------------------------------------------------
    // POPUP & INTERRUPTION CLEARANCE
    // ------------------------------------------------------------------------
    function drClearInterruptions() {
        const interruptBtns = Array.from(document.querySelectorAll("button, [role='button'], a, span")).filter(btn => {
            if (btn.closest('#harmless-autopilot-widget')) return false;
            const text = (btn.innerText || btn.textContent || '').toLowerCase().trim();
            if (text.includes('skip to main') || text.includes('skip to content')) return false;

            return text === 'continue' ||
                   text === 'skip' ||
                   text === 'skip survey' ||
                   text === 'skip quiz' ||
                   text === 'skip question' ||
                   text === 'resume video' ||
                   text === 'continue to video' ||
                   text === 'play now' ||
                   text === 'keep watching' ||
                   text === 'yes, keep watching' ||
                   text === 'continue watching' ||
                   text === 'dismiss';
        });

        for (const btn of interruptBtns) {
            try {
                triggerClick(btn);
                console.log('[HarmlessBot] Cleared prompt/modal:', btn.textContent.trim());
            } catch(e) {}
        }
    }

    // ------------------------------------------------------------------------
    // VIDEO ENGINE & SUPER BYPASS (WITH 16X GUARANTEED TURBO FALLBACK)
    // ------------------------------------------------------------------------
    function drFastForwardToEnd() {
        const video = document.querySelector('video');
        if (video && !isNaN(video.duration) && video.duration > 1) {
            video.currentTime = Math.max(0, video.duration - 1.5);
            video.play().catch(() => {});
            try {
                video.dispatchEvent(new Event('timeupdate', { bubbles: true }));
            } catch(e) {}
            drShowToast('⏩ Jumped to end');
        }
    }

    function drHandleVideoPlayback() {
        const video = document.querySelector('video');
        if (!video) return;

        // Detect new video / lesson change
        const currentSrc = video.currentSrc || video.src || window.location.href;
        if (currentSrc && currentSrc !== drActiveMediaIdentifier) {
            drActiveMediaIdentifier = currentSrc;
            drBypassAttempted = false;
            drBypassStartTime = 0;
            drFallbackTo16xEngaged = false;
            drVideoStartTime = 0;
            drVideoEndedFirstSeen = 0;
            drHasNavigatedForCurrentVideo = false;
            console.log('[HarmlessBot] New video detected:', currentSrc.substring(0, 80));
        }

        // Reset if video was restarted from beginning
        if (video.currentTime < 0.5 && drBypassAttempted && !drFallbackTo16xEngaged) {
            drBypassAttempted = false;
            drBypassStartTime = 0;
            drVideoStartTime = 0;
            drVideoEndedFirstSeen = 0;
            drHasNavigatedForCurrentVideo = false;
        }

        if (drHasNavigatedForCurrentVideo) return;

        // Auto-mute so browser autoplay policy never pauses/stalls video
        if (!video.muted) {
            video.muted = true;
        }

        // Apply speed
        if (drConfig.harmlessSpeedInjection && drConfig.harmlessSpeed > 0) {
            if (video.playbackRate !== drConfig.harmlessSpeed) {
                try { video.playbackRate = drConfig.harmlessSpeed; } catch(e) {}
            }
        }

        // 1. Auto-Play if paused
        if (video.paused && !video.ended) {
            video.play().catch(() => {
                const playBtn = document.querySelector(
                    'button.vjs-play-control, button[data-control-name="play"], ' +
                    'button[data-testid="play-button"], button[aria-label*="Play" i]'
                );
                if (playBtn) triggerClick(playBtn);
            });
        }

        // 2. Early Green Tick Check (if video is already complete or completes mid-playback)
        const isAlreadyComplete = drIsCurrentItemCompletedInSidebar();
        if (isAlreadyComplete === true) {
            // If already complete and played at least 2s or video ended, advance!
            if (video.currentTime >= 2 || video.ended || drBypassAttempted) {
                console.log('[HarmlessBot] ✅ Green tick confirmed by platform. Advancing immediately!');
                drShowToast('✅ Green tick verified! Advancing...');
                drHasNavigatedForCurrentVideo = true;
                if (drConfig.harmlessAutoNavigate) {
                    drAdvanceToNextItem();
                }
                return;
            }
        }

        // 3. Super Bypass Mode: Attempt seek-to-end first
        if (drConfig.harmlessSuperBypass && !drBypassAttempted && !video.ended && video.duration > 2) {
            if (!video.paused && !video.seeking) {
                if (!drVideoStartTime) {
                    drVideoStartTime = Date.now();
                }
                const elapsedMs = Date.now() - drVideoStartTime;
                // Wait ~1.2s of playback so initial session beacon registers
                if (elapsedMs >= 1200 || video.currentTime >= 1.2) {
                    drBypassAttempted = true;
                    drBypassStartTime = Date.now();
                    drShowToast('⚡ Super Bypass: Jumped to end. Awaiting platform verification...');
                    video.currentTime = Math.max(0, video.duration - 1.8);
                    try {
                        video.dispatchEvent(new Event('timeupdate', { bubbles: true }));
                    } catch(e) {}
                    video.play().catch(() => {});
                }
            }
        }

        // 4. Super Bypass Verification & 16x Turbo Fallback
        // If bypass was attempted, check if platform accepted it
        if (drBypassAttempted && !drHasNavigatedForCurrentVideo) {
            const timeSinceBypass = Date.now() - drBypassStartTime;

            // Did the green tick appear?
            if (isAlreadyComplete === true) {
                console.log('[HarmlessBot] ✅ Super Bypass accepted by platform!');
                drShowToast('✅ Super Bypass complete! Moving to next...');
                drHasNavigatedForCurrentVideo = true;
                if (drConfig.harmlessAutoNavigate) {
                    drAdvanceToNextItem();
                }
                return;
            }

            // If 3.8s passed after seek and still NO green tick:
            // Platform rejected the seek jump! Fallback to 16x Turbo Play to GUARANTEE credit!
            if (timeSinceBypass > 3800 && !drFallbackTo16xEngaged) {
                drFallbackTo16xEngaged = true;
                console.warn('[HarmlessBot] Seek bypass not credited by platform. Engaging 16x Turbo Play to guarantee green tick.');
                drShowToast('⚡ Seek bypass not credited. Engaging 16x Turbo to guarantee tick...');
                video.currentTime = 0;
                drSetSpeed(16.0);
                video.play().catch(() => {});
                return;
            }
        }

        // 5. Video End Detection & Confirmation Wait
        const isNearEnd = video.duration > 0 && (video.currentTime >= video.duration - 0.5 || video.ended);

        if (isNearEnd) {
            if (!drVideoEndedFirstSeen) {
                drVideoEndedFirstSeen = Date.now();
                try {
                    video.dispatchEvent(new Event('timeupdate', { bubbles: true }));
                    video.dispatchEvent(new Event('ended', { bubbles: true }));
                } catch(e) {}
                console.log('[HarmlessBot] Video reached end. Verifying platform green tick...');
            }

            const waitElapsed = Date.now() - drVideoEndedFirstSeen;
            const isConfirmed = drIsCurrentItemCompletedInSidebar();

            if (isConfirmed === true) {
                console.log('[HarmlessBot] ✅ Green tick confirmed by platform. Advancing!');
                drShowToast('✅ Lesson complete! Moving to next...');
                drHasNavigatedForCurrentVideo = true;
                if (drConfig.harmlessAutoNavigate) {
                    drAdvanceToNextItem();
                }
                return;
            }

            // Green tick not yet confirmed. Wait up to 5 seconds for background sync.
            if (waitElapsed < 5000) {
                const remaining = Math.ceil((5000 - waitElapsed) / 1000);
                drUpdateHudStatus(`⏳ Video done. Verifying green tick (${remaining}s)...`);
                return;
            }

            // 5s elapsed without green tick. Apply smart reattempt.
            const curPath = window.location.pathname.toLowerCase();
            const reattemptCount = drItemReattemptMap[curPath] || 0;

            if (reattemptCount === 0) {
                drItemReattemptMap[curPath] = 1;
                drVideoEndedFirstSeen = 0;
                drVideoStartTime = 0;
                drBypassAttempted = true; // Don't re-seek, play continuously at 16x
                drFallbackTo16xEngaged = true;
                video.currentTime = 0;
                drSetSpeed(16.0);
                video.play().catch(() => {});
                drShowToast('⚠️ Green tick delayed. Replaying at 16x to secure credit...');
                console.log('[HarmlessBot] No green tick after 5s. Replaying at 16x to secure credit.');
                return;
            } else {
                console.log('[HarmlessBot] Replay completed. Proceeding ahead to avoid loop.');
                drShowToast('Moving to next item...');
                drHasNavigatedForCurrentVideo = true;
                if (drConfig.harmlessAutoNavigate) {
                    drAdvanceToNextItem();
                }
                return;
            }
        }
    }

    // ------------------------------------------------------------------------
    // READING / NON-VIDEO PAGE AUTO-ADVANCE
    // ------------------------------------------------------------------------
    function drHandleReadingPage() {
        if (document.querySelector('video')) return;

        const url = window.location.href.toLowerCase();
        const isReading = url.includes('/supplement/') || url.includes('/reading/') ||
                          url.includes('/item/') || url.includes('/ungradedWidget/');

        if (!isReading && isCoursera) return;

        const isComplete = drIsCurrentItemCompletedInSidebar();
        if (isComplete === true && drConfig.harmlessAutoNavigate) {
            if (Date.now() - drLastNavTimestamp > 4000) {
                drShowToast('📖 Reading marked complete. Advancing...');
                drAdvanceToNextItem();
            }
        }
    }

    // ------------------------------------------------------------------------
    // PLATFORM-ADAPTIVE NAVIGATION (COURSERA & LINKEDIN LEARNING)
    // ------------------------------------------------------------------------
    function drFindSyllabusItems() {
        return Array.from(document.querySelectorAll(`
            .classroom-toc-item,
            li[data-control-name="course_item"],
            .classroom-toc-section li,
            .cds-NavigationItem,
            nav[aria-label="Course"] li,
            li[data-testid*="item"],
            .rc-WeekItemName
        `));
    }

    function drIsItemActive(itemEl) {
        if (!itemEl) return false;
        return itemEl.classList.contains('classroom-toc-item--selected') ||
               itemEl.classList.contains('classroom-toc-item--active') ||
               itemEl.classList.contains('active') ||
               itemEl.getAttribute('aria-current') === 'true' ||
               itemEl.getAttribute('aria-selected') === 'true' ||
               !!itemEl.querySelector('[aria-current="true"]');
    }

    function drGetItemClickable(itemEl) {
        if (!itemEl) return null;
        return itemEl.querySelector('a, button') || itemEl;
    }

    function drAdvanceToNextItem(force = false) {
        const now = Date.now();
        if (!force && (now - drLastNavTimestamp < 2500)) return;
        drLastNavTimestamp = now;

        console.log('[HarmlessBot] Advancing to next item. Focus Mode:', drConfig.harmlessFocusMode);

        // 1. Up Next Countdown Overlay (LinkedIn & Coursera)
        const upNextBtn = document.querySelector(`
            .classroom-up-next__play-button,
            button[data-control-name="up_next_play"],
            .classroom-up-next button,
            button[aria-label*="Up next" i],
            .rc-PostVideoCountdown button,
            [data-testid="post-video-countdown"] button
        `);
        if (upNextBtn && !upNextBtn.disabled) {
            drShowToast('Advancing to next video...');
            triggerClick(upNextBtn);
            return;
        }

        // 2. Primary Next Item Button
        const nextButton = document.querySelector(`
            [data-control-name="next_item"],
            [data-control-name="next_video"],
            button.vjs-next-button,
            .classroom-nav__next-button,
            a.classroom-nav__next-button,
            .rc-NextItemButton,
            button[data-testid="next-item"],
            a[data-testid="next-item"],
            [data-test-nav-next],
            a[aria-label="Go to next item"],
            button[aria-label*="Next item" i],
            button[aria-label*="Next video" i]
        `);
        if (nextButton && !nextButton.disabled && nextButton.getAttribute('aria-disabled') !== 'true') {
            drShowToast('Moving to next course item...');
            triggerClick(nextButton);
            return;
        }

        // 3. For LinkedIn: Contextual course links navigation
        if (isLinkedIn) {
            const courseLinks = drGetCourseLinks();
            const currentNorm = location.pathname.replace(/\/+$/, '');
            const curIdx = courseLinks.findIndex(l => l.path === currentNorm);
            if (curIdx !== -1 && curIdx + 1 < courseLinks.length) {
                const nextItem = courseLinks[curIdx + 1];
                drShowToast(`Moving to next: ${nextItem.text || 'Next Lesson'}`);
                if (nextItem.element) {
                    triggerClick(nextItem.element);
                } else {
                    location.assign(nextItem.url);
                }
                return;
            }
        }

        // 4. Coursera / General syllabus navigation
        const allItems = drFindSyllabusItems();
        const currentIdx = allItems.findIndex(drIsItemActive);
        if (currentIdx !== -1 && currentIdx + 1 < allItems.length) {
            const nextItem = allItems[currentIdx + 1];
            const btn = drGetItemClickable(nextItem);
            if (btn) {
                drShowToast('Moving to next syllabus item...');
                triggerClick(btn);
                return;
            }
        }

        // 5. Broad text search for "next" buttons
        const allBtns = Array.from(document.querySelectorAll('button, a'));
        const textBtn = allBtns.find(el => {
            if (el.disabled || el.getAttribute('aria-disabled') === 'true') return false;
            if (el.closest('#harmless-autopilot-widget')) return false;
            const t = (el.innerText || el.textContent || '').trim().toLowerCase();
            return t === 'next' || t === 'next item' || t === 'up next' || t === 'continue to next';
        });
        if (textBtn) {
            drShowToast('Advancing to next item...');
            triggerClick(textBtn);
            return;
        }

        drShowToast('⚠️ Course appears complete or no next item found.');
    }

    // ------------------------------------------------------------------------
    // QUIZ AUTO-SOLVER ENGINE (COURSERA & LINKEDIN LEARNING)
    // Supports single-question and multi-question chapter quizzes
    // ------------------------------------------------------------------------

    function drGetQuizInputs() {
        const inputs = Array.from(document.querySelectorAll(`
            input[type="radio"]:not(:disabled),
            input[type="checkbox"]:not(:disabled),
            textarea:not(:disabled),
            input[type="text"]:not(:disabled):not([type="search"]):not([aria-label*="search" i])
        `));

        return inputs.filter(el => {
            if (el.closest('#harmless-autopilot-widget, header, nav, aside, footer, [role="navigation"], [role="search"]')) {
                return false;
            }
            return true;
        });
    }

    function drFindQuestionContainer(inputEl) {
        return inputEl.closest(
            '.rc-FormPartsQuestion, [data-testid*="question"], .quiz-question, ' +
            '.cds-FormGroup, [role="radiogroup"], [role="group"], ' +
            'fieldset, .quiz-view__question, .classroom-quiz, form'
        ) || inputEl.parentElement;
    }

    function drExtractQuestionText(container) {
        if (container) {
            const candidates = container.querySelectorAll(
                'h1, h2, h3, h4, legend, .quiz-question__title, .quiz-question-title, ' +
                '[data-testid="question-title"], .question-stem, [class*="question-title"], ' +
                '[class*="question-prompt"], .classroom-quiz__question, [data-test-question-title], ' +
                '.rc-CML p, .css-1tqx16q, label[class*="prompt"]'
            );
            for (const el of candidates) {
                const text = (el.innerText || el.textContent || '').trim();
                if (text.length > 5) return text;
            }
        }

        // Global headings on page (for single-question LinkedIn quizzes)
        const headings = document.querySelectorAll(
            'main h1, main h2, main h3, .classroom-layout h1, .classroom-layout h2, .classroom-quiz h1, .classroom-quiz h2, [role="main"] h1, [role="main"] h2'
        );
        for (const h of headings) {
            const text = (h.innerText || h.textContent || '').trim();
            if (text.length > 8 && !/chapter quiz|quiz|assessment/i.test(text)) {
                return text;
            }
        }

        if (container) {
            const lines = (container.innerText || '').split('\n').map(l => l.trim()).filter(l => l.length > 5);
            if (lines.length > 0) return lines[0].substring(0, 500);
        }
        return 'Quiz Question';
    }

    function drGetOptionLabel(inputEl) {
        const label = inputEl.closest('label');
        if (label) {
            return (label.innerText || label.textContent || '').trim();
        }
        if (inputEl.id) {
            const labelEl = document.querySelector(`label[for="${inputEl.id}"]`);
            if (labelEl) return (labelEl.innerText || labelEl.textContent || '').trim();
        }
        const nextSibling = inputEl.nextElementSibling;
        if (nextSibling) {
            const t = (nextSibling.innerText || nextSibling.textContent || '').trim();
            if (t.length > 0) return t;
        }
        const parent = inputEl.parentElement;
        if (parent) {
            return (parent.innerText || parent.textContent || '').replace(/^\s*[A-Z0-9][\.\)]\s*/, '').trim();
        }
        return '';
    }

    function drSelectQuizOption(inputEl) {
        if (!inputEl) return;
        const label = inputEl.closest('label');
        if (label) {
            triggerClick(label);
        }
        triggerClick(inputEl);
        if (!inputEl.checked) {
            inputEl.checked = true;
            inputEl.dispatchEvent(new Event('change', { bubbles: true }));
            inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    async function drHandleQuizAutomation() {
        if (!drConfig.harmlessAutoSolveQuizzes || drQuizProcessing) return;

        // Check if we are on a quiz results or start page first
        drHandleQuizResultsPage();
        drHandleStartQuizButton();

        const quizInputs = drGetQuizInputs();
        if (quizInputs.length === 0) return;

        // Group inputs by question
        const questions = [];
        quizInputs.forEach(input => {
            const isText = input.tagName === 'TEXTAREA' || (input.tagName === 'INPUT' && input.type !== 'radio' && input.type !== 'checkbox');
            const groupEl = input.closest('[role="radiogroup"], [role="group"]');
            const groupKey = (input.name && input.name.trim())
                ? `name:${input.name.trim()}`
                : (groupEl ? groupEl : drFindQuestionContainer(input));

            let q = questions.find(item => item.groupKey === groupKey);
            if (!q) {
                const container = drFindQuestionContainer(input);
                q = {
                    type: isText ? 'text' : input.type,
                    isText: isText,
                    groupKey,
                    container,
                    questionText: drExtractQuestionText(container),
                    inputs: [],
                    options: []
                };
                questions.push(q);
            }
            q.inputs.push(input);
        });

        // Build options
        questions.forEach(q => {
            if (q.isText) {
                q.options = [{ input: q.inputs[0], text: 'Free-text answer input field', index: 0 }];
            } else {
                q.options = q.inputs.map((inp, idx) => ({
                    input: inp,
                    text: drGetOptionLabel(inp) || `Option ${idx + 1}`,
                    index: idx
                }));
            }
        });

        if (questions.length === 0) return;

        // Signature check: don't loop on the same question
        const pageSignature = questions.map(q => q.questionText.substring(0, 50)).join('|');
        if (pageSignature === drLastProcessedQuestion && Date.now() - drLastQuizActionTime < 10000) return;

        drQuizProcessing = true;
        drLastProcessedQuestion = pageSignature;
        drLastQuizActionTime = Date.now();
        drShowToast(`🧠 Analyzing ${questions.length} quiz question(s) with AI...`);

        // Build AI Prompt
        let prompt = `You are a distinguished university professor and academic quiz solver with 100% precision.\n`;
        prompt += `Solve the following quiz question(s) with absolute accuracy.\n\n`;

        questions.forEach((q, idx) => {
            prompt += `=== QUESTION ${idx} ===\n`;
            if (q.isText) {
                prompt += `Type: text_input (type the exact word or short phrase required)\n`;
                prompt += `Prompt: ${q.questionText}\n`;
            } else if (q.type === 'checkbox') {
                prompt += `Type: multiple_choice (select all that apply)\n`;
                prompt += `Prompt: ${q.questionText}\n`;
                prompt += `Options:\n`;
                q.options.forEach((opt, oIdx) => {
                    prompt += `[Index ${oIdx}]: ${opt.text}\n`;
                });
            } else {
                prompt += `Type: single_choice (select exactly one)\n`;
                prompt += `Prompt: ${q.questionText}\n`;
                prompt += `Options:\n`;
                q.options.forEach((opt, oIdx) => {
                    prompt += `[Index ${oIdx}]: ${opt.text}\n`;
                });
            }
            prompt += `\n`;
        });

        prompt += `CRITICAL INSTRUCTIONS:
1. Provide the 0-based index of the correct option(s) in 'answerIndices'.
2. For multiple_choice: select all correct options.
3. For single_choice: select exactly one option.
4. Output ONLY a valid JSON object with an "answers" array without Markdown formatting:
{
  "answers": [
    {
      "id": 0,
      "rationale": "reasoning",
      "answerIndices": [0],
      "answerTexts": ["exact text"]
    }
  ]
}`;

        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({
                type: 'HARMLESS_SOLVE_QUIZ_BATCH',
                prompt: prompt,
                questionCount: questions.length,
                question: questions[0]?.questionText || '',
                options: questions[0]?.options?.map(o => o.text) || []
            }, (response) => {
                try {
                    let answered = false;
                    if (response && response.success && response.text) {
                        let text = response.text.replace(/```json/gi, '').replace(/```/g, '').trim();
                        let parsed;
                        try {
                            parsed = JSON.parse(text);
                        } catch(e) {
                            const matchObj = text.match(/\{[\s\S]*?\}/);
                            const matchArr = text.match(/\[[\s\S]*?\]/);
                            if (matchObj) {
                                try { parsed = JSON.parse(matchObj[0]); } catch(err) {}
                            }
                            if (!parsed && matchArr) {
                                try { parsed = JSON.parse(matchArr[0]); } catch(err) {}
                            }
                        }

                        if (parsed && Array.isArray(parsed.answers)) {
                            drApplyBatchAnswers(questions, parsed.answers, response.provider || 'AI');
                            answered = true;
                        } else if (Array.isArray(parsed)) {
                            drApplyBatchAnswers(questions, parsed, response.provider || 'AI');
                            answered = true;
                        } else if (parsed && typeof parsed === 'object') {
                            drApplyBatchAnswers(questions, [parsed], response.provider || 'AI');
                            answered = true;
                        }
                    }

                    if (!answered) {
                        drApplyHeuristicAnswers(questions);
                    }

                    // Auto-submit after selection
                    setTimeout(() => {
                        drSubmitQuizAnswers();
                        setTimeout(() => {
                            drQuizProcessing = false;
                        }, 2000);
                    }, 1200);

                } catch (e) {
                    console.error('[HarmlessBot] Quiz error:', e);
                    drQuizProcessing = false;
                }
            });
        } else {
            drQuizProcessing = false;
        }
    }

    function drApplyBatchAnswers(questions, answers, provider) {
        answers.forEach(ans => {
            const qIdx = ans.id !== undefined ? ans.id : 0;
            const q = questions[qIdx];
            if (!q) return;

            if (q.isText && ans.answerTexts && ans.answerTexts.length > 0) {
                const input = q.inputs[0];
                const nativeSet = Object.getOwnPropertyDescriptor(window.HTMLInputElement?.prototype || HTMLElement.prototype, 'value')?.set ||
                                  Object.getOwnPropertyDescriptor(HTMLTextAreaElement?.prototype || HTMLElement.prototype, 'value')?.set;
                if (nativeSet) {
                    nativeSet.call(input, ans.answerTexts[0]);
                } else {
                    input.value = ans.answerTexts[0];
                }
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                drShowToast(`Q${qIdx + 1}: Typed "${ans.answerTexts[0]}" (${provider})`);
            } else if (ans.answerIndices && Array.isArray(ans.answerIndices)) {
                ans.answerIndices.forEach(idx => {
                    if (q.options[idx]) {
                        drSelectQuizOption(q.options[idx].input);
                    }
                });
                drShowToast(`Q${qIdx + 1}: Selected option ${ans.answerIndices.map(i => i+1).join(',')} (${provider})`);
            }
        });
    }

    function drApplyHeuristicAnswers(questions) {
        drShowToast('⚠️ AI unavailable. Using heuristic selection...');
        questions.forEach(q => {
            if (q.isText) return;
            let bestIdx = 0;
            let maxLen = 0;
            q.options.forEach((opt, idx) => {
                const text = opt.text.toLowerCase();
                if (text.includes('all of the above') || text.includes('all of these') || text.includes('both a and b')) {
                    bestIdx = idx;
                    maxLen = Infinity;
                } else if (opt.text.length > maxLen && maxLen < Infinity) {
                    maxLen = opt.text.length;
                    bestIdx = idx;
                }
            });
            if (q.options[bestIdx]) {
                drSelectQuizOption(q.options[bestIdx].input);
            }
        });
    }

    function drSubmitQuizAnswers() {
        const allBtns = Array.from(document.querySelectorAll('button, [role="button"], input[type="submit"]'));
        const submitBtn = allBtns.find(btn => {
            if (btn.disabled || btn.getAttribute('aria-disabled') === 'true') return false;
            if (btn.closest('#harmless-autopilot-widget')) return false;
            const text = (btn.innerText || btn.textContent || btn.value || btn.getAttribute('aria-label') || '').trim().toLowerCase();
            return text === 'submit' || text === 'submit answer' || text === 'check answer' ||
                   text === 'check' || text.includes('submit quiz') || text === 'done';
        }) || document.querySelector(`
            button[data-control-name="quiz_submit"],
            button.quiz-view__submit-button,
            button[data-testid="submit-button"],
            button.cds-button[type="submit"],
            button[type="submit"],
            .rc-QuizSubmitButton button,
            button[data-test="submit-quiz"]
        `);

        if (submitBtn && !submitBtn.disabled) {
            triggerClick(submitBtn);
            drShowToast('📝 Submitted answer!');
            console.log('[HarmlessBot] Clicked quiz submit button.');

            // After submit, advance to next question or continue
            setTimeout(drAdvanceQuizStep, 1500);
        }
    }

    function drAdvanceQuizStep() {
        const allBtns = Array.from(document.querySelectorAll('button, a, [role="button"]'));

        // 1. Next question / Next button
        const nextBtn = allBtns.find(btn => {
            if (btn.disabled || btn.getAttribute('aria-disabled') === 'true') return false;
            if (btn.closest('#harmless-autopilot-widget')) return false;
            const text = (btn.innerText || btn.textContent || btn.getAttribute('aria-label') || '').trim().toLowerCase();
            return text === 'next question' || text === 'next' || text === 'continue' ||
                   text.includes('next question');
        }) || document.querySelector(`
            button[data-control-name="quiz_next"],
            button.quiz-view__next-button,
            button[data-control-name="continue"],
            .rc-QuizNextButton button
        `);

        if (nextBtn) {
            triggerClick(nextBtn);
            drShowToast('Advancing to next question...');
            drLastProcessedQuestion = '';
            return;
        }

        // 2. End of quiz / Continue watching / Back to course / Next video
        const finishBtn = allBtns.find(btn => {
            if (btn.disabled || btn.getAttribute('aria-disabled') === 'true') return false;
            if (btn.closest('#harmless-autopilot-widget')) return false;
            const text = (btn.innerText || btn.textContent || btn.getAttribute('aria-label') || '').trim().toLowerCase();
            return text === 'continue watching' || text === 'next video' ||
                   text === 'back to course' || text === 'view certificate' ||
                   text === 'see results' || text === 'finish quiz';
        }) || document.querySelector(`
            [data-control-name="continue_watching"],
            [data-control-name="next_video"]
        `);

        if (finishBtn) {
            triggerClick(finishBtn);
            drShowToast('Quiz completed! Returning to course...');
            drLastProcessedQuestion = '';
            return;
        }

        // 3. Retake or Try again
        const retakeBtn = allBtns.find(btn => {
            if (btn.disabled) return false;
            if (btn.closest('#harmless-autopilot-widget')) return false;
            const text = (btn.innerText || btn.textContent || '').trim().toLowerCase();
            return text === 'retake quiz' || text === 'try again' || text === 'take again';
        });
        if (retakeBtn) {
            triggerClick(retakeBtn);
            drShowToast('Retaking quiz...');
            drLastProcessedQuestion = '';
        }
    }

    function drHandleQuizResultsPage() {
        const gradeEl = document.querySelector(
            '[data-testid*="grade"], .rc-QuizGrade, .quiz-result, ' +
            '[class*="grade"], [class*="score"], .quiz-view__result'
        );
        const gradeText = document.body ? document.body.innerText || '' : '';
        const hasGrade = gradeEl || /your grade|your score|you scored|quiz result|passed|failed/i.test(gradeText.substring(0, 2000));

        if (hasGrade && drConfig.harmlessAutoNavigate) {
            const nextBtn = document.querySelector(`
                .rc-NextItemButton, button[data-testid="next-item"], a[data-testid="next-item"],
                button[aria-label*="Next" i], a[aria-label="Go to next item"],
                button[data-control-name="continue"], button[data-control-name="next_video"],
                [data-control-name="continue_watching"]
            `);
            if (nextBtn && !nextBtn.disabled && nextBtn.getAttribute('aria-disabled') !== 'true') {
                if (Date.now() - drLastNavTimestamp > 3500) {
                    drShowToast('Quiz complete! Advancing...');
                    drLastNavTimestamp = Date.now();
                    triggerClick(nextBtn);
                }
            }
        }
    }

    function drHandleStartQuizButton() {
        if (!drConfig.harmlessAutoSolveQuizzes) return;

        const startBtn = Array.from(document.querySelectorAll('button, a')).find(btn => {
            if (btn.disabled) return false;
            if (btn.closest('#harmless-autopilot-widget')) return false;
            const t = (btn.innerText || btn.textContent || '').trim().toLowerCase();
            return t === 'start assignment' || t === 'resume assignment' ||
                   t === 'start quiz' || t === 'resume quiz' ||
                   t === 'start exam' || t === 'resume exam' ||
                   t === 'start' || t === 'resume';
        });

        if (startBtn) {
            if (Date.now() - drLastNavTimestamp > 5000) {
                triggerClick(startBtn);
                drLastNavTimestamp = Date.now();
                drShowToast('📝 Starting quiz...');
                setTimeout(() => {
                    const honorBtn = Array.from(document.querySelectorAll('button, input[type="checkbox"]')).find(el => {
                        const text = (el.innerText || el.textContent || el.getAttribute('aria-label') || '').toLowerCase();
                        return text.includes('honor') || text.includes('agree') || text.includes('i understand');
                    });
                    if (honorBtn) {
                        triggerClick(honorBtn);
                    }
                }, 1000);
            }
        }
    }

    // ------------------------------------------------------------------------
    // KEYBOARD HOTKEYS
    // ------------------------------------------------------------------------
    window.addEventListener('keydown', (e) => {
        if (!e.key) return;
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) return;

        if (e.key === '[' || e.key === '{') {
            e.preventDefault();
            drSetSpeed(Math.max(0.5, +(drConfig.harmlessSpeed - 0.5).toFixed(1)));
        } else if (e.key === ']' || e.key === '}') {
            e.preventDefault();
            drSetSpeed(Math.min(16.0, +(drConfig.harmlessSpeed + 0.5).toFixed(1)));
        } else if (e.key === '\\' || e.key === '|') {
            e.preventDefault();
            drConfig.harmlessSuperBypass = !drConfig.harmlessSuperBypass;
            if (chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({ harmlessSuperBypass: drConfig.harmlessSuperBypass });
            }
            drUpdateFloatingHUD();
            drShowToast(`⚡ Super Bypass: ${drConfig.harmlessSuperBypass ? 'ON' : 'OFF'}`);
        }
    });

    // ------------------------------------------------------------------------
    // MAIN EXECUTION CYCLE
    // ------------------------------------------------------------------------
    function drRunAutoPilotCycle() {
        if (!drConfig.harmlessEnabled) return;
        if (!document.body || !document.head) return;

        try { drCreateFloatingHUD(); } catch(e) { console.error('[HarmlessBot] HUD error:', e); }
        
        if (drConfig.harmlessIsPaused) return;

        try { drClearInterruptions(); } catch(e) {}
        try { drHandleVideoPlayback(); } catch(e) { console.error('[HarmlessBot] Video error:', e); }
        try { drHandleReadingPage(); } catch(e) { console.error('[HarmlessBot] Reading error:', e); }
        try { drHandleQuizAutomation(); } catch(e) { console.error('[HarmlessBot] Quiz error:', e); }
    }

    setInterval(drRunAutoPilotCycle, 600);
    setTimeout(() => {
        drCreateFloatingHUD();
        drSyncSpeedToMainWorld();
    }, 500);

    console.log(`[OmniLearn AutoPilot v2.2] Engine loaded for ${platformLabel}. Author: Divyanshu Rai (@harmless-bot)`);
})();
