# ⚡ OmniLearn AutoPilot (v2.0)

<p align="center">
  <img src="icons/icon128.png" alt="OmniLearn AutoPilot Logo" width="100" height="100" style="border-radius: 22px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);">
</p>

<p align="center">
  <b>Enterprise-grade autonomous learning accelerator and workflow automation engine for Coursera and LinkedIn Learning.</b><br>
  Engineered with precision by <b>Divyanshu Rai</b> (<a href="https://github.com/harmless-bot">@harmless-bot</a>)
</p>

<p align="center">
  <a href="https://github.com/harmless-bot/harmless-course-completer/releases"><img src="https://img.shields.io/badge/version-2.0.0-blue.svg?style=flat-square" alt="Version"></a>
  <a href="https://developer.chrome.com/docs/extensions/mv3/"><img src="https://img.shields.io/badge/manifest-v3-green.svg?style=flat-square" alt="Manifest V3"></a>
  <a href="#supported-platforms"><img src="https://img.shields.io/badge/platforms-Coursera%20%7C%20LinkedIn%20Learning-orange.svg?style=flat-square" alt="Supported Platforms"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-purple.svg?style=flat-square" alt="License"></a>
</p>

---

## 📋 Overview

**OmniLearn AutoPilot** is a browser extension developed by **Divyanshu Rai** designed to streamline and accelerate digital course workflows on major enterprise learning platforms including **Coursera** and **LinkedIn Learning**. 

By combining low-level media element manipulation, main-world prototype spoofing, intelligent DOM mutation monitoring, and client-side multi-provider AI heuristics, OmniLearn AutoPilot delivers autonomous lecture progression and intelligent practice assessment assistance.

---

## 🚀 Key Features

### ⚡ Super Bypass Video Mode
* Initialises video playback for 1.2 seconds to satisfy platform-side heartbeat ping cycles and session engagement monitors.
* Programmatically seeks to the final second of the stream, ensuring video completion events fire naturally and register verified course checkmarks before auto-advancing to subsequent modules.

### ⏩ Turbo Playback & Spoofing Engine (Up to 16x)
* Intercepts and overrides `HTMLMediaElement.prototype.playbackRate` directly within the webpage's main execution context (`MAIN` world).
* Speeds exceeding the platform's native cap (e.g., 4x, 8x, 16x) run at genuine high-throughput hardware rates while spoofing a standard `2.0x` metric to platform telemetry and analytics tracking scripts.

### 🛡️ RateChange Shield & Background Processing
* Intercepts and suppresses restrictive `ratechange` events during the capture phase, preventing third-party media players from resetting user speed preferences.
* Spoofs browser document visibility state (`Page Visibility API`) to prevent learning platforms from auto-pausing media when tabs are unfocused or minimized.

### 🧠 Multi-Provider AI Practice Assessment Solver
* Real-time DOM parsing of multiple-choice and single-choice quiz questions.
* Native integration with major LLM inference providers via custom client-side API connectors:
  * **Google Gemini** (`gemini-2.5-flash` / `gemini-1.5-pro`)
  * **Groq Cloud** (`llama-3.3-70b-versatile`)
  * **OpenRouter** (Multi-model routing)
  * **NVIDIA NIM** (`meta/llama-3.1-70b-instruct`)
* Built-in heuristic fallback engine ensuring high accuracy without external server dependencies.

### 🎯 Configurable Focus Filtering
* **Complete All Items:** Sequential progress across all videos, readings, and quizzes.
* **Incomplete Only:** Dynamically skips previously completed and verified modules.
* **Videos Only:** Accelerates lecture content while bypassing assessments.
* **Quizzes Only:** Focuses exclusively on practice assessments and review checkpoints.

### 🎮 Draggable On-Screen HUD
* Floating on-player controller docked onto active video players.
* Real-time speed presets, quick 1-click Super Bypass toggling, fast-forwarding, and next-lesson controls.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| `[` or `{` | **Decrease Speed** | Decreases playback speed by 0.5x |
| `]` or `}` | **Increase Speed** | Increases playback speed by 0.5x |
| `\` or `\|` | **Toggle Super Bypass** | Instantly toggles Super Bypass Mode ON/OFF |

---

## 🏗️ Architecture

```
harmless-course-completer/
├── manifest.json         # Manifest V3 configuration & permission boundaries
├── background.js         # Service worker handling LLM requests & badge states
├── content.js            # Content script managing DOM observer & draggable HUD
├── main_world.js         # Script injected into main world context for API spoofing
├── popup.html            # Extension popup user interface
├── popup.js              # State synchronisation and user preference controller
├── icons/                # Extension branding assets (16x16 to 128x128)
└── assets/               # Visual UI assets
```

---

## 🛠️ Installation Guide

### Method 1: Load Unpacked in Developer Mode (Recommended)

1. **Clone or Download the Repository:**
   ```bash
   git clone https://github.com/harmless-bot/harmless-course-completer.git
   ```

2. **Open the Extensions Management Page:**
   * **Google Chrome / Brave:** Navigate to `chrome://extensions/`
   * **Microsoft Edge:** Navigate to `edge://extensions/`
   * **Arc Browser:** Open Settings → Extensions

3. **Enable Developer Mode:**
   * Toggle the **Developer mode** switch located in the upper right corner.

4. **Load the Extension:**
   * Click the **Load unpacked** button in the top left corner.
   * Select the root directory of this repository:
     ```bash
     /Users/divyanshurai/projects/harmless-course-completer
     ```

5. **Pin to Toolbar:**
   * Click the extension puzzle icon in your browser toolbar and pin **OmniLearn AutoPilot**.

---

## 🔒 Security & Privacy

* **Zero External Telemetry:** OmniLearn AutoPilot does not collect, log, or transmit personal data or browsing history to any third-party servers.
* **Local Storage:** All user configuration options and API credentials are stored exclusively on your device using `chrome.storage.local`.
* **Direct Inference:** AI API requests communicate directly between your client browser and the designated API endpoint (Google, Groq, OpenRouter, NVIDIA).

---

## 👤 Author & Maintainer

* **Developer:** Divyanshu Rai
* **GitHub:** [@harmless-bot](https://github.com/harmless-bot)
* **Website:** [https://github.com/harmless-bot](https://github.com/harmless-bot)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
