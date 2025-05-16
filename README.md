# Logseq Transcriber Plugin

Quickly transcribe audio files embedded in your Logseq notes using the Deepgram API. This plugin adds a "Transcribe" button next to audio players, allowing you to get a text version of your audio content inserted directly as a new block.

## Features

*   **Inline Transcription**: Adds a "🎙️ Transcribe" button next to audio players in your Logseq blocks.
*   **Configurable**: Set your Deepgram API key, preferred transcription model, and audio language via plugin settings.
*   **Automatic Language Detection**: If no language is specified, the plugin will ask Deepgram to auto-detect the language.
*   **Simple Workflow**: Click, transcribe, and get the text as a new block below the audio.

## Setup & Configuration

1.  **Install the Plugin**:
    *   Download the latest release from the plugin marketplace (once available) or load it as an unpacked plugin.
    *   To load unpacked:
        *   Build the plugin: `npm install && npm run build`
        *   In Logseq, go to `...` (three dots menu) > `Plugins`.
        *   Click `Load unpacked plugin` and select the plugin's root directory.

2.  **Configure Settings**:
    *   Go to Logseq Settings (`...` > `Settings` or `t` `s`).
    *   Navigate to `Plugin Settings`.
    *   Find "Logseq Transcriber" and configure the following:
        *   **API Key**: Your Deepgram API Key. You can get one from the [Deepgram Console](https://console.deepgram.com/project/_/api-keys). This is required.
        *   **Transcription Model**: The Deepgram model to use (e.g., `nova-3`, `whisper-large`). Defaults to `nova-3`. See [Deepgram Models documentation](https://developers.deepgram.com/docs/model) for available options and their capabilities.
        *   **Audio Language**: Select the primary language of your audio files from the dropdown, or choose "Auto-detect". For a list of supported BCP-47 language codes, see [Deepgram Languages Overview](https://developers.deepgram.com/docs/models-languages-overview).

## Usage

1.  Embed an audio file in a Logseq block (e.g., by dragging and dropping it or using `/Upload asset`).
2.  A "🎙️ Transcribe" button will appear next to the audio player.
3.  Click the button. The button text will change to "🎙️..." while processing.
4.  Once transcription is complete, the text will be inserted as a new block directly below the block containing the audio player.
5.  You'll receive a notification for success or failure.

## Notes

*   This plugin relies on the Deepgram API, so an active internet connection and a valid API key with credits are required.
*   Transcription accuracy depends on the audio quality and the chosen Deepgram model.
*   The plugin fetches audio from the `http://localhost:.../assets/...` URL that Logseq serves for local assets.

## License

MIT