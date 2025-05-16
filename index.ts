import '@logseq/libs';
import { createClient, DeepgramClient, PrerecordedTranscriptionResponse, PrerecordedTranscriptionOptions } from "@deepgram/sdk";
import { Buffer } from "buffer";

if (typeof window !== 'undefined' && typeof window.Buffer === 'undefined') {
  window.Buffer = Buffer;
}

interface PluginSettings {
  apiKey: string | null;
  model: string;
  language: string | undefined;
}

function getSettings(): PluginSettings {
  const apiKey = logseq.settings?.apiKey;
  const model = logseq.settings?.model || "nova-3"; // Default to nova-3
  let languageSetting = logseq.settings?.language || "auto-detect";
  
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    logseq.App.showMsg('Transcription API Key not set. Please configure it in plugin settings.', 'error');
    logseq.App.openSettingItem('logseq-transcriber', 'apiKey');
    return { apiKey: null, model, language: undefined };
  }
  return { 
    apiKey, 
    model, 
    language: languageSetting === "auto-detect" || languageSetting.trim() === "" ? undefined : languageSetting.trim() 
  };
}

async function transcribeAudioSource(
    source: { buffer: Buffer, name: string, type?: string },
    apiKey: string,
    model: string,
    language?: string,
    button?: HTMLButtonElement
): Promise<string | null> {
  if (button) button.textContent = '🎙️...';

  try {
    const deepgram: DeepgramClient = createClient(apiKey);
    
    const options: PrerecordedTranscriptionOptions = {
      model: model,
      smart_format: true,
      punctuate: true,
    };

    if (language) {
      options.language = language;
    } else {
      options.detect_language = true; // Enable language detection if no language is specified
    }

    const { result, error }: PrerecordedTranscriptionResponse = await deepgram.listen.prerecorded.transcribeFile(
      source.buffer,
      options
    );

    if (error) {
      throw error;
    }

    const transcription = result?.results?.channels[0]?.alternatives[0]?.transcript;
    if (transcription) {
      logseq.App.showMsg(`Transcription for "${source.name}" successful!`, 'success');
      return transcription;
    } else {
      throw new Error('No transcription result found.');
    }
  } catch (err: any) {
    console.error(`Transcription Error for ${source.name}:`, err);
    logseq.App.showMsg(`Transcription failed for "${source.name}": ${err.message || err}`, 'error');
    return null;
  } finally {
    if (button) button.textContent = '🎙️ Transcribe';
  }
}

function addTranscribeButtonToAudioElement(audioElement: HTMLAudioElement, blockUUID: string) {
  if (audioElement.dataset.transcriberButtonAdded === 'true') {
    return; 
  }

  const settings = getSettings();
  if (!settings.apiKey) {
    return;
  }

  const button = document.createElement('button');
  button.textContent = '🎙️ Transcribe';
  button.className = 'button logseq-transcriber-audio-btn';
  button.style.marginLeft = '8px';
  button.style.padding = '2px 6px';
  button.style.fontSize = '0.8em';
  button.title = `Transcribe with ${settings.model}${settings.language ? ` (${settings.language})` : ' (auto-detect language)'}`;

  let isTranscribing = false;

  button.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (isTranscribing) return;

    const currentSettings = getSettings();
    if (!currentSettings.apiKey) return;

    isTranscribing = true;
    button.disabled = true;

    const audioSrc = audioElement.src;
    const audioName = audioElement.title || audioSrc.substring(audioSrc.lastIndexOf('/') + 1) || 'audio_file';
    
    try {
      logseq.App.showMsg(`Fetching audio "${audioName}" for transcription...`, 'info');
      const response = await fetch(audioSrc);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const audioType = response.headers.get('content-type') || undefined;

      const transcription = await transcribeAudioSource(
        { buffer, name: audioName, type: audioType },
        currentSettings.apiKey,
        currentSettings.model,
        currentSettings.language,
        button
      );

      if (transcription) {
        await logseq.Editor.insertBlock(blockUUID, transcription, { sibling: true, focus: true });
      }
    } catch (err: any) {
        console.error(`Error in button click for ${audioName}:`, err);
        logseq.App.showMsg(`Error transcribing ${audioName}: ${err.message || err}`, 'error');
        button.textContent = '🎙️ Transcribe';
    } finally {
      isTranscribing = false;
      button.disabled = false;
    }
  });

  const playerContainer = audioElement.closest('.audio-player-wrapper, .asset-audio, .asset-container');
  if (playerContainer && playerContainer.parentNode) {
    playerContainer.parentNode.insertBefore(button, playerContainer.nextSibling);
  } else if (audioElement.parentNode) {
    audioElement.parentNode.insertBefore(button, audioElement.nextSibling);
  } else {
    console.warn("Logseq Transcriber: Could not find suitable parent to insert transcribe button for:", audioElement);
  }
  audioElement.dataset.transcriberButtonAdded = 'true';
}

function scanAndAddButtons() {
  const audioElements = parent.document.querySelectorAll('div.ls-block audio:not([data-transcriber-button-added="true"])');
  
  audioElements.forEach((audioElNode) => {
    const audioEl = audioElNode as HTMLAudioElement;
    let currentElement: HTMLElement | null = audioEl;
    let blockUUID: string | undefined = undefined;
    let attempts = 0;

    while (currentElement && attempts < 10) { 
        if (currentElement.classList.contains('ls-block') && currentElement.getAttribute('blockid')) {
            blockUUID = currentElement.getAttribute('blockid') || undefined;
            break;
        }
        currentElement = currentElement.parentElement;
        attempts++;
    }
    
    if (blockUUID) {
      addTranscribeButtonToAudioElement(audioEl, blockUUID);
    }
  });
}

async function main() {
  logseq.App.showMsg('🎙️ Logseq Transcriber Plugin Loaded');

  logseq.provideStyle(`
    .logseq-transcriber-audio-btn {
      background-color: var(--ls-secondary-background-color);
      color: var(--ls-primary-text-color);
      border: 1px solid var(--ls-border-color);
      border-radius: var(--ls-border-radius-medium);
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.2s ease-in-out, background-color 0.2s ease-in-out;
      font-size: 0.75rem;
      padding: 1px 5px;
      margin-top: 2px;
      vertical-align: middle;
    }
    .logseq-transcriber-audio-btn:hover {
      opacity: 1;
      background-color: var(--ls-tertiary-background-color);
    }
    .logseq-transcriber-audio-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  `);

  const observer = new MutationObserver(() => {
    scanAndAddButtons();
  });
  
  const setupObserver = () => {
    const appContainer = parent.document.getElementById('app-container');
    if (appContainer) {
      observer.disconnect();
      observer.observe(appContainer, { childList: true, subtree: true });
      scanAndAddButtons(); 
    } else {
      console.error("Logseq Transcriber: #app-container not found for MutationObserver.");
    }
  };
  
  logseq.App.onRouteChanged(setupObserver);
  setupObserver();

  console.log('Logseq Transcriber plugin main function finished.');
}

logseq.ready(main).catch(console.error);