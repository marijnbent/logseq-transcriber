# Logseq Transcriber Plugin

  Quickly transcribe audio files embedded in your Logseq notes using the Deepgram API. This plugin adds a “Transcribe” button next to audio players, allowing you to get a text version of your audio content inserted directly as a new block. If you like it, please [give it a star on Github ![GitHub Repo stars](https://img.shields.io/github/stars/marijnbent/logseq-transcriber?style=social)](https://github.com/marijnbent/logseq-transcriber)!

  If you really like it, you can [☕ buy me a coffee](https://buymeacoffe.com/marijnbent) ❤️.

## Features

- **Inline Transcription**: Adds a “🎙️ Transcribe” button next to audio players in your Logseq blocks.
- **Configurable**: Set your Deepgram API key, preferred transcription model, and audio language via plugin settings.
- **Automatic Language Detection**: If no language is specified, the plugin will ask Deepgram to auto-detect the language.
- **Simple Workflow**: Click, transcribe, and get the text as a new block below the audio.

## Setup & Configuration

Download the latest release from the plugin marketplace.

### Configure Settings

Before using, you'll need to configure the plugin settings.

- Go to the plugin settings:
  - **API Key**: Your Deepgram API Key (from the [Deepgram Console](https://console.deepgram.com/project/_/api-keys))
  - **Transcription Model**: e.g. `nova-3`, `whisper-large` (defaults to `nova-3`)
  - **Audio Language**: Choose a language or “Auto-detect” (see [Deepgram Languages](https://developers.deepgram.com/docs/models-languages-overview))

## Usage

1. Embed an audio file in a Logseq block
2. A “🎙️ Transcribe” button appears next to the audio player
3. Click it—the text changes to “🎙️…” while processing
4. The transcription is inserted as a new block beneath the audio

## Notes

- Requires an internet connection and a valid Deepgram key with credits
- Accuracy depends on audio quality and chosen model
- Audio is fetched from Logseq’s local asset URL (`http://localhost:…/assets/…`)

## License

MIT