/*Markdown*/
# VoiceScribe Accessibility - Speech-to-Text Tool

A free, privacy-first, AI-powered Speech-to-Text tool designed with accessibility at its core. All processing happens in your browser — no audio data ever leaves your device.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Accessibility](https://img.shields.io/badge/WCAG-2.1%20AA-green.svg)
![Privacy](https://img.shields.io/badge/Privacy-100%25%20Client--side-success)

## Features

- **Real-time Transcription** — Instant speech-to-text using the Web Speech API
- **Multi-language Support** — 13+ languages including English, Spanish, French, German, Chinese, Japanese, Arabic, Hindi, and more
- **AI-Assisted Punctuation** — Auto-detects questions and adds periods automatically
- **Live Confidence Meter** — Visual feedback on transcription accuracy
- **Audio Visualizer** — Real-time waveform visualization (or CSS fallback)
- **Continuous Mode** — Keeps listening until you stop it
- **Live Preview** — See words appear as you speak
- **Export Options** — Plain text (.txt), Subtitles (.srt), WebVTT (.vtt), JSON data
- **Text-to-Speech** — Read back your transcript aloud
- **Accessibility Modes** — High contrast & large text toggles
- **Keyboard Shortcuts** — Full keyboard control (Ctrl+Space to record, etc.)
- **Persistent Storage** — Auto-saves transcripts and settings locally
- **Privacy First** — 100% client-side. No server, no API keys, no data collection

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full |
| Edge | ✅ Full |
| Safari | ✅ Full |
| Firefox | ❌ No (Web Speech API not supported) |
| Opera | ✅ Full |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl` + `Space` | Start/Stop Recording |
| `Ctrl` + `.` | Pause/Resume |
| `Ctrl` + `C` | Copy Transcript |
| `Ctrl` + `S` | Save as TXT |
| `Ctrl` + `L` | Clear Transcript |
| `Esc` | Stop Recording |

## Deploy Your Own (Free)

### Option 1: GitHub Pages
1. Fork or create a new repository
2. Upload these files to the root
3. Go to **Settings → Pages**
4. Select **Deploy from a branch** → `main` → `/ (root)`
5. Your site will be live at `https://yourusername.github.io/voicescribe-accessibility`

### Option 2: Vercel (Recommended)
1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repo
3. Framework preset: **Other** (static site)
4. Deploy instantly with auto-updates on every push

### Option 3: Netlify
1. Drag and drop the project folder to [netlify.com](https://netlify.com)
2. Instant deployment with HTTPS

## File Structure

/*plain*/

## How It Works

This tool uses the **Web Speech API** (specifically `SpeechRecognition`) which is built into modern browsers. The API processes audio locally on your device using the browser's speech engine — no cloud service required.

### For Developers

The app is built with vanilla JavaScript (no frameworks) for maximum performance and minimal bundle size. Key architectural decisions:

- **No build step** — Just HTML, CSS, JS. Deploy anywhere.
- **No dependencies** — Zero npm packages to maintain.
- **Progressive enhancement** — Works without the visualizer, works without continuous mode.
- **ARIA labels** — Full screen reader support.

## Accessibility Features

- WCAG 2.1 Level AA compliant color contrast
- Keyboard-navigable interface
- Screen reader compatible with live regions
- High contrast mode for low vision users
- Large text mode for readability
- Focus indicators on all interactive elements

## License

MIT — Free for personal and commercial use.

---

**Note:** Microphone permission is required. The app will prompt you on first use. All audio processing is done locally by your browser.