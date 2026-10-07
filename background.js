/**
 * ============================================================================
 * OmniLearn AutoPilot - Background Service Worker
 * Developed by: Divyanshu Rai (@harmless-bot)
 * GitHub: https://github.com/harmless-bot
 * 
 * Manages:
 * - Multi-provider AI quiz answering engine (Gemini, Groq, OpenRouter, NVIDIA)
 * - Batch quiz solving (all questions in one API call)
 * - Intelligent heuristic fallback answer parser
 * - Statistics synchronization & extension badge management
 * ============================================================================
 */

const DEFAULT_HARMLESS_CONFIG = {
    harmlessEnabled: true,
    harmlessSpeed: 2.0,
    harmlessSpeedInjection: true,
    harmlessSuperBypass: false,
    harmlessAutoNavigate: true,
    harmlessAutoSolveQuizzes: true,
    harmlessFocusMode: 'all', // 'all', 'incomplete_only', 'videos_only', 'quizzes_only'
    harmlessAiProvider: 'gemini',
    geminiApiKey: '',
    groqApiKey: '',
    openRouterApiKey: '',
    nvidiaApiKey: '',
    statVideosFinished: 0,
    statQuizzesPassed: 0,
    statMinutesSaved: 0
};

// Initialize settings on install
chrome.runtime.onInstalled.addListener(async () => {
    const stored = await chrome.storage.local.get(null);
    const updates = {};
    for (const [key, val] of Object.entries(DEFAULT_HARMLESS_CONFIG)) {
        if (stored[key] === undefined) {
            updates[key] = val;
        }
    }
    if (Object.keys(updates).length > 0) {
        await chrome.storage.local.set(updates);
    }
    await harmlessUpdateBadge(stored.harmlessEnabled !== false);
    console.log('[🚽 Skibidi AutoPilot 3000] Initialized with maximum rizz by Divyanshu Rai (@harmless-bot) in Ohio.');
});

async function harmlessUpdateBadge(isActive, badgeText = null) {
    try {
        if (badgeText) {
            await chrome.action.setBadgeText({ text: badgeText });
            await chrome.action.setBadgeBackgroundColor({ color: '#ec4899' });
        } else if (isActive) {
            await chrome.action.setBadgeText({ text: 'MOG' });
            await chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
        } else {
            await chrome.action.setBadgeText({ text: 'ZZZ' });
            await chrome.action.setBadgeBackgroundColor({ color: '#64748b' });
        }
    } catch (e) {}
}

// ----------------------------------------------------------------------------
// AI QUIZ SOLVER INTEGRATIONS
// ----------------------------------------------------------------------------

async function harmlessQueryAI(prompt, config) {
    const provider = config.harmlessAiProvider || 'gemini';

    // Try the selected provider first, then fallback chain
    const providerChain = [provider, 'gemini', 'groq', 'openrouter'].filter((v, i, a) => a.indexOf(v) === i);

    let lastErr = null;
    for (const p of providerChain) {
        try {
            let result;
            if (p === 'gemini' && config.geminiApiKey) {
                result = await harmlessQueryGemini(prompt, config.geminiApiKey);
            } else if (p === 'groq' && config.groqApiKey) {
                result = await harmlessQueryGroq(prompt, config.groqApiKey);
            } else if (p === 'openrouter' && config.openRouterApiKey) {
                result = await harmlessQueryOpenRouter(prompt, config.openRouterApiKey);
            } else {
                continue; // No key for this provider
            }
            return { text: result, provider: p };
        } catch (err) {
            lastErr = err;
            console.warn(`[HarmlessBot] AI Provider (${p}) error:`, err.message);
        }
    }
    throw lastErr || new Error('No AI provider configured or all failed');
}

async function harmlessQueryGemini(prompt, apiKey) {
    const key = (apiKey || '').trim();
    if (!key) throw new Error('Gemini API key is required');

    const models = [
        'gemini-2.5-flash',
        'gemini-1.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-pro'
    ];

    let lastErr = null;
    for (const model of models) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.1 }
                }),
                signal: AbortSignal.timeout(15000)
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Gemini ${model} HTTP ${res.status}: ${errText}`);
            }

            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (text.length > 0) return text;
        } catch (err) {
            lastErr = err;
            console.warn(`[HarmlessBot] Gemini ${model} error:`, err.message);
        }
    }
    throw lastErr || new Error('All Gemini candidate models failed');
}

async function harmlessQueryGroq(prompt, apiKey) {
    const key = (apiKey || '').trim();
    if (!key) throw new Error('Groq API key is required');

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: 'You are an automated quiz solver. Always return strict JSON.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' }
        }),
        signal: AbortSignal.timeout(15000)
    });

    if (!res.ok) throw new Error(`Groq HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
}

async function harmlessQueryOpenRouter(prompt, apiKey) {
    const key = (apiKey || '').trim();
    if (!key) throw new Error('OpenRouter API key is required');

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'meta-llama/llama-3.3-70b-instruct:free',
            messages: [
                { role: 'system', content: 'You are an automated quiz solver. Always return strict JSON.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.1
        }),
        signal: AbortSignal.timeout(15000)
    });

    if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
}

// Smart Heuristic Fallback (for single-question backward compat)
function harmlessHeuristicSelect(question, options) {
    // 1. "All of the above" / "Both A and B"
    for (let i = 0; i < options.length; i++) {
        const text = options[i].toLowerCase();
        if (text.includes('all of the above') || text.includes('all of these') || text.includes('both a and b')) {
            return { selectedIndex: i, reason: 'Matched comprehensive option heuristic' };
        }
    }

    // 2. Statistically highest fidelity option length heuristic
    let bestIdx = 0;
    let maxLen = -1;
    options.forEach((opt, idx) => {
        if (opt.length > maxLen) {
            maxLen = opt.length;
            bestIdx = idx;
        }
    });

    return { selectedIndex: bestIdx, reason: 'Detailed response heuristic selection' };
}

// Message Listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    // *** NEW: Batch quiz solving (sends full prompt, returns raw AI text) ***
    if (message.type === 'HARMLESS_SOLVE_QUIZ_BATCH') {
        (async () => {
            const config = await chrome.storage.local.get(null);
            const prompt = message.prompt;

            try {
                const result = await harmlessQueryAI(prompt, config);
                const currentQuizzes = (config.statQuizzesPassed || 0) + (message.questionCount || 1);
                await chrome.storage.local.set({ statQuizzesPassed: currentQuizzes });

                sendResponse({
                    success: true,
                    text: result.text,
                    provider: result.provider
                });
            } catch (err) {
                console.warn('[HarmlessBot] Batch quiz solve error:', err.message);
                sendResponse({
                    success: false,
                    error: err.message
                });
            }
        })();
        return true;
    }

    // Legacy: Single-question quiz solving (backward compat)
    if (message.type === 'HARMLESS_SOLVE_QUIZ' || message.type === 'SOLVE_QUIZ_QUESTION') {
        (async () => {
            const { question, options } = message;
            const config = await chrome.storage.local.get(null);

            // Build a simple prompt for single question
            const prompt = `You are an automated exam solver.
Question: "${question}"
Options:
${options.map((opt, i) => `[${i}] ${opt}`).join('\n')}

Select the single best or correct answer. Output ONLY a valid JSON object in this exact format:
{"selectedIndex": <0-based integer>, "reason": "<brief justification>"}`;

            let result = null;
            let provider = config.harmlessAiProvider || 'gemini';

            try {
                const aiResult = await harmlessQueryAI(prompt, config);
                provider = aiResult.provider;
                const text = aiResult.text;
                const match = text.match(/\{[\s\S]*?\}/);
                if (match) {
                    const parsed = JSON.parse(match[0]);
                    if (typeof parsed.selectedIndex === 'number' && parsed.selectedIndex >= 0 && parsed.selectedIndex < options.length) {
                        result = parsed;
                    }
                }
            } catch (err) {
                console.warn(`[HarmlessBot] AI Solver error:`, err.message);
            }

            if (!result || typeof result.selectedIndex !== 'number') {
                result = harmlessHeuristicSelect(question, options);
                provider = 'heuristic-engine';
            }

            const currentQuizzes = (config.statQuizzesPassed || 0) + 1;
            await chrome.storage.local.set({ statQuizzesPassed: currentQuizzes });

            sendResponse({
                success: true,
                selectedIndex: result.selectedIndex,
                reason: result.reason || 'Optimal selection',
                provider: provider
            });
        })();
        return true;
    }

    // Also handle original Coursera-completer message type
    if (message.type === 'ASK_AI') {
        (async () => {
            const config = await chrome.storage.local.get(null);
            const prompt = message.prompt;

            try {
                const result = await harmlessQueryAI(prompt, config);
                sendResponse({
                    success: true,
                    text: result.text,
                    provider: result.provider
                });
            } catch (err) {
                console.warn('[HarmlessBot] ASK_AI error:', err.message);
                sendResponse({
                    success: false,
                    error: err.message
                });
            }
        })();
        return true;
    }

    if (message.type === 'RECORD_LESSON_COMPLETED' || message.type === 'RECORD_VIDEO_COMPLETED') {
        (async () => {
            const config = await chrome.storage.local.get(['statVideosFinished', 'statMinutesSaved', 'harmlessSpeed']);
            const count = (config.statVideosFinished || 0) + 1;
            const speed = config.harmlessSpeed || 2.0;
            const savedEstimate = Math.max(1, Math.round(4 * (1 - 1 / Math.max(1, speed))));
            const totalMins = (config.statMinutesSaved || 0) + savedEstimate;

            await chrome.storage.local.set({
                statVideosFinished: count,
                statMinutesSaved: totalMins
            });
            sendResponse({ success: true, videosCompleted: count });
        })();
        return true;
    }

    if (message.type === 'SET_BADGE') {
        harmlessUpdateBadge(message.enabled, message.text).then(() => {
            sendResponse({ success: true });
        });
        return true;
    }
});
