/**
 * ============================================================================
 * OmniLearn Turbo Speed & Visibility Engine
 * Developed by: Divyanshu Rai (@harmless-bot)
 * GitHub: https://github.com/harmless-bot
 * 
 * Supports: Coursera & LinkedIn Learning
 * Features:
 * - Native prototype descriptor capture at document_start
 * - Dynamic playbackRate getter spoofing (reports 2.0x to satisfy platform limiters)
 * - Capture-phase ratechange event shield to prevent platform playback rate resets
 * - Background play shield (visibilityState & hidden overrides)
 * - Anti-stall and pitch-preserving turbo speed up to 16x
 * ============================================================================
 */

(function() {
    'use strict';

    if (window.__harmless_speed_engine_installed__) return;
    window.__harmless_speed_engine_installed__ = true;

    let harmlessForcedSpeed = 2.0;
    let harmlessSpeedEnabled = true;

    // 1. Capture pristine native media descriptors directly from HTMLMediaElement prototype
    const harmlessNativeDescriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'playbackRate');
    if (!harmlessNativeDescriptor || !harmlessNativeDescriptor.get || !harmlessNativeDescriptor.set) {
        console.error('[HarmlessBot Speed Engine] Unable to capture native playbackRate descriptor.');
        return;
    }

    // 2. Event Shield: suppress ratechange in capture phase when forced speed > 2.0x
    // Prevents Coursera / LinkedIn Video.js player code from intercepting and resetting custom speeds
    const shieldRateChange = (evt) => {
        if (harmlessSpeedEnabled && harmlessForcedSpeed > 2.0) {
            evt.stopImmediatePropagation();
        }
    };
    ['ratechange'].forEach(evtName => {
        window.addEventListener(evtName, shieldRateChange, true);
        document.addEventListener(evtName, shieldRateChange, true);
    });

    // 3. Override playbackRate on HTMLMediaElement prototype
    Object.defineProperty(HTMLMediaElement.prototype, 'playbackRate', {
        get: function() {
            // When forced speed is above platform native cap (2.0x), spoof 2.0x to platform scripts
            if (harmlessSpeedEnabled && harmlessForcedSpeed > 2.0) {
                return 2.0;
            }
            return harmlessNativeDescriptor.get.call(this);
        },
        set: function(targetVal) {
            if (harmlessSpeedEnabled && harmlessForcedSpeed > 1.0) {
                harmlessNativeDescriptor.set.call(this, harmlessForcedSpeed);
            } else {
                harmlessNativeDescriptor.set.call(this, targetVal);
            }
        },
        configurable: true,
        enumerable: true
    });

    // 4. Hook each media element instance
    function harmlessHookMedia(media) {
        if (!media || media.__harmless_media_hooked__) return;
        media.__harmless_media_hooked__ = true;

        media.addEventListener('ratechange', shieldRateChange, true);

        // Instance error handler: recovers gracefully to safe 2.0x rate on network/buffer blips
        media.addEventListener('error', () => {
            console.warn('[HarmlessBot Speed Engine] Media error encountered. Reverting to safe 2.0x rate.', media.error);
            if (harmlessForcedSpeed > 2.0) {
                harmlessForcedSpeed = 2.0;
                try { harmlessNativeDescriptor.set.call(media, 2.0); } catch(err) {}
            }
            try { media.play().catch(() => {}); } catch(err) {}
        }, true);

        // Ensure instance doesn't shadow prototype
        try {
            Object.defineProperty(media, 'playbackRate', {
                configurable: true,
                enumerable: true,
                get: function() {
                    if (harmlessSpeedEnabled && harmlessForcedSpeed > 2.0) return 2.0;
                    return harmlessNativeDescriptor.get.call(this);
                },
                set: function(targetVal) {
                    if (harmlessSpeedEnabled && harmlessForcedSpeed > 1.0) {
                        harmlessNativeDescriptor.set.call(this, harmlessForcedSpeed);
                    } else {
                        harmlessNativeDescriptor.set.call(this, targetVal);
                    }
                }
            });
        } catch(err) {}

        harmlessApplySpeed(media);
    }

    // 5. Apply speed with pitch preservation
    function harmlessApplySpeed(media) {
        if (!media) return;
        try {
            const target = (harmlessSpeedEnabled && harmlessForcedSpeed > 0) ? harmlessForcedSpeed : 1.0;
            if (media.readyState >= 1) {
                harmlessNativeDescriptor.set.call(media, target);
                if ('preservesPitch' in media) {
                    media.preservesPitch = true;
                }
            }
        } catch (e) {}
    }

    function harmlessApplySpeedToAll() {
        document.querySelectorAll('video, audio').forEach(media => {
            harmlessHookMedia(media);
            harmlessApplySpeed(media);
        });
    }

    // 6. Periodic enforcement loop (every 500ms)
    setInterval(() => {
        if (harmlessSpeedEnabled && harmlessForcedSpeed > 1.0) {
            document.querySelectorAll('video, audio').forEach(media => {
                harmlessHookMedia(media);
                if (media.readyState >= 1 && !media.seeking && !media.paused) {
                    const actual = harmlessNativeDescriptor.get.call(media);
                    if (Math.abs(actual - harmlessForcedSpeed) > 0.05) {
                        harmlessNativeDescriptor.set.call(media, harmlessForcedSpeed);
                    }
                }
            });
        }
    }, 500);

    // 7. Hook play/playing events
    ['play', 'playing'].forEach(evt => {
        document.addEventListener(evt, (e) => {
            if (e.target && (e.target.tagName === 'VIDEO' || e.target.tagName === 'AUDIO')) {
                harmlessHookMedia(e.target);
                harmlessApplySpeed(e.target);
            }
        }, true);
    });

    // 8. PostMessage communication with content script
    window.addEventListener('message', (event) => {
        if (!event.data) return;
        if (event.data.type === 'HARMLESS_SET_SPEED' || event.data.type === 'LINKEDIN_FORCE_SPEED' || event.data.type === 'COURSERA_FORCE_SPEED') {
            const speed = parseFloat(event.data.speed);
            const enabled = event.data.enabled !== undefined ? !!event.data.enabled : true;
            harmlessSpeedEnabled = enabled;

            if (!enabled || isNaN(speed) || speed <= 1.0) {
                harmlessForcedSpeed = 1.0;
            } else {
                harmlessForcedSpeed = Math.min(16.0, Math.max(0.25, speed));
            }
            harmlessApplySpeedToAll();
        } else if (event.data.type === 'HARMLESS_BYPASS_END') {
            document.querySelectorAll('video').forEach(v => {
                if (v && !isNaN(v.duration) && v.duration > 1) {
                    v.currentTime = Math.max(0, v.duration - 1.2);
                    v.play().catch(() => {});
                }
            });
        }
    });

    // 9. True Background Play: Visibility State Overrides
    try {
        Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true });
        Object.defineProperty(document, 'hidden', { get: () => false, configurable: true });
    } catch (e) {}

    ['visibilitychange', 'webkitvisibilitychange'].forEach(evt => {
        window.addEventListener(evt, (e) => e.stopImmediatePropagation(), true);
        document.addEventListener(evt, (e) => e.stopImmediatePropagation(), true);
    });
    window.addEventListener('blur', (e) => e.stopImmediatePropagation(), true);

    // 10. Auto-Dismiss Inactivity Modals ("Are you still watching?", Coursera skip speed notices)
    setInterval(() => {
        if (!harmlessSpeedEnabled) return;
        
        document.querySelectorAll('button, [role="button"], a').forEach(btn => {
            const text = (btn.innerText || btn.textContent || '').trim().toLowerCase();
            const parentText = (btn.parentElement ? btn.parentElement.innerText || '' : '').toLowerCase();
            if (
                parentText.includes('still watching') ||
                parentText.includes('continue watching') ||
                parentText.includes('skipping forward is only available') ||
                text === 'continue watching' ||
                text === 'keep watching' ||
                text === 'yes, keep watching' ||
                text === 'resume' ||
                text === 'dismiss'
            ) {
                try {
                    btn.click();
                    console.log('[HarmlessBot AutoPilot] Auto-dismissed idle/inactivity prompt.');
                } catch(e) {}
            }
        });
    }, 1200);

    // Initial pass
    harmlessApplySpeedToAll();

    // 11. Expose controller interface on window
    window.harmlessPlaybackController = {
        set(speed, enabled = true) {
            harmlessSpeedEnabled = enabled;
            if (!enabled || speed <= 1.0) {
                harmlessForcedSpeed = 1.0;
            } else {
                harmlessForcedSpeed = Math.min(16.0, Math.max(0.25, parseFloat(speed) || 1.0));
            }
            harmlessApplySpeedToAll();
        },
        get() { return harmlessForcedSpeed; },
        isEnabled() { return harmlessSpeedEnabled; },
        isSpoofing() { return harmlessSpeedEnabled && harmlessForcedSpeed > 2.0; },
        getNativeRate() {
            const v = document.querySelector('video');
            return v ? harmlessNativeDescriptor.get.call(v) : null;
        },
        author: 'Divyanshu Rai (@harmless-bot)'
    };

    console.log(`[HarmlessBot Speed Engine] Active. Target: ${harmlessForcedSpeed}x (Author: Divyanshu Rai @harmless-bot)`);
})();
