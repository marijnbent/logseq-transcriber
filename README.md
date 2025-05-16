# Logseq Transcriber Plugin

Quickly transcribe audio files embedded in your Logseq notes using the Deepgram API. This plugin adds a “Transcribe” button next to audio players, allowing you to get a text version of your audio content inserted directly as a new block.

## Features

- **Inline Transcription**: Adds a “🎙️ Transcribe” button next to audio players in your Logseq blocks.
- **Configurable**: Set your Deepgram API key, preferred transcription model, and audio language via plugin settings.
- **Automatic Language Detection**: If no language is specified, the plugin will ask Deepgram to auto-detect the language.
- **Simple Workflow**: Click, transcribe, and get the text as a new block below the audio.

## Setup & Configuration

### 1. Install the Plugin

- Download the latest release from the plugin marketplace (once available) or load it as an unpacked plugin.
- To load unpacked:
  1. Build the plugin: `npm install && npm run build`
  2. In Logseq, go to the three-dots menu (…) → **Plugins**
  3. Click **Load unpacked plugin** and select the plugin’s root directory

### 2. Configure Settings

- Go to Logseq Settings (three-dots menu (…) → **Settings** or press `t s`)
- Navigate to **Plugin Settings**
- Find **Logseq Transcriber** and configure:
  - **API Key**: Your Deepgram API Key (from the [Deepgram Console](https://console.deepgram.com/project/_/api-keys))
  - **Transcription Model**: e.g. `nova-3`, `whisper-large` (defaults to `nova-3`)
  - **Audio Language**: Choose your audio’s BCP-47 code or “Auto-detect” (see [Deepgram Languages](https://developers.deepgram.com/docs/models-languages-overview))

## Usage

1. Embed an audio file in a Logseq block (drag-and-drop or `/Upload asset`)
2. A “🎙️ Transcribe” button appears next to the audio player
3. Click it—the text changes to “🎙️…” while processing
4. When done, the transcription is inserted as a new block beneath the audio
5. You’ll get a success or failure notification

## Notes

- Requires an internet connection and a valid Deepgram key with credits
- Accuracy depends on audio quality and chosen model
- Audio is fetched from Logseq’s local asset URL (`http://localhost:…/assets/…`)

## License

MIT