import '@logseq/libs';
import { Buffer } from "buffer";
import settings from './settings';
declare const logseq: any;

const PLUGIN_ID = 'logseq-transcriber';
let apiKeyAlertShown = false;
let observer: MutationObserver;

console.log(`[${PLUGIN_ID}] Script loaded`);

if (typeof window !== 'undefined' && typeof window.Buffer === 'undefined') {
  window.Buffer = Buffer;
  console.log(`[${PLUGIN_ID}] Buffer polyfilled.`);
}

interface PluginSettings {
  apiKey: string | null;
  model: string;
  language: string | undefined;
}

function getSettings(): PluginSettings {
  console.log(`[${PLUGIN_ID}] getSettings called.`);
  const lsSettings = (logseq.settings as any) || {};
  const apiKey = lsSettings.apiKey as string;
  const model = (lsSettings.model as string) || "nova-3";
  const languageSetting = (lsSettings.language as string) || "auto-detect";

  if (!apiKey || apiKey.trim() === '') {
    console.warn(`[${PLUGIN_ID}] API Key is not set or empty.`);
    if (!apiKeyAlertShown) {
      (logseq.App as any).showMsg('Deepgram API Key not set. Please configure it in plugin settings.', 'error');
      (logseq.App as any).openSettingItem(PLUGIN_ID, 'apiKey');
      apiKeyAlertShown = true;
      if (observer) {
        observer.disconnect();
        console.log(`[${PLUGIN_ID}] MutationObserver disconnected due to missing API key.`);
      }
    }
    return { apiKey: null, model, language: undefined };
  }
  console.log(`[${PLUGIN_ID}] API Key found. Model: ${model}, Language Setting: ${languageSetting}`);
  return {
    apiKey,
    model,
    language: languageSetting === "auto-detect" ? undefined : languageSetting.trim(),
  };
}

async function transcribeAudioSource(
  source: { buffer: Buffer, name: string, type?: string },
  apiKey: string,
  model: string,
  language?: string,
  button?: HTMLButtonElement
): Promise<string | null> {
  console.log(`[${PLUGIN_ID}] transcribeAudioSource called for: ${source.name}, Model: ${model}, Lang: ${language || 'auto-detect'}`);
  if (button) button.textContent = '🎙️...';

  try {
    // build query params
    const params = new URLSearchParams({
      model,
      punctuate: 'true',
      smart_format: 'true',
      ...(language ? { language } : { detect_language: 'true' })
    });
    const url = `https://api.deepgram.com/v1/listen?${params}`;

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': source.type || 'application/octet-stream'
      },
      body: source.buffer
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error(`[${PLUGIN_ID}] Deepgram API error:`, resp.status, resp.statusText, errText);
      throw new Error(`Deepgram API ${resp.status}: ${resp.statusText}`);
    }

    const dg = await resp.json() as any;
    console.log(`[${PLUGIN_ID}] Deepgram API result:`, dg);

    const transcript = dg.results?.channels?.[0]?.alternatives?.[0]?.transcript;
    if (!transcript) {
      console.warn(`[${PLUGIN_ID}] No transcript in response.`);
      throw new Error('No transcription result');
    }

    (logseq.App as any).showMsg(`Transcription for "${source.name}" successful!`, 'success');
    return transcript;

  } catch (err: any) {
    console.error(`[${PLUGIN_ID}] transcribeAudioSource failed for ${source.name}:`, err);
    (logseq.App as any).showMsg(`Transcription failed for "${source.name}": ${err.message}`, 'error');
    return null;

  } finally {
    if (button) button.textContent = '🎙️ Transcribe';
  }
}

function addTranscribeButtonToAudioElement(audioElement: HTMLAudioElement, blockUUID: string) {
  console.log(`[${PLUGIN_ID}] addTranscribeButtonToAudioElement called for audio src: ${audioElement.src}, block: ${blockUUID}`);
  if (audioElement.dataset.transcriberButtonAdded === 'true') {
    console.log(`[${PLUGIN_ID}] Button already added for ${audioElement.src}. Skipping.`);
    return; 
  }

  const settings = getSettings();
  if (!settings.apiKey) {
    console.warn(`[${PLUGIN_ID}] No API key, cannot add transcribe button for ${audioElement.src}.`);
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
    console.log(`[${PLUGIN_ID}] Transcribe button clicked for ${audioElement.src}`);

    const currentSettings = getSettings(); 
    if (!currentSettings.apiKey) {
        console.warn(`[${PLUGIN_ID}] API Key missing at time of click.`);
        return;
    }

    isTranscribing = true;
    button.disabled = true;

    const audioSrc = audioElement.src;
    const audioName = audioElement.title || audioSrc.substring(audioSrc.lastIndexOf('/') + 1) || 'audio_file';
    
    try {
      (logseq.App as any).showMsg(`Fetching audio "${audioName}" for transcription...`, 'info');
      console.log(`[${PLUGIN_ID}] Fetching audio from: ${audioSrc}`);
      const response = await fetch(audioSrc);
      if (!response.ok) {
        console.error(`[${PLUGIN_ID}] Failed to fetch audio: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const audioType = response.headers.get('content-type') || undefined;
      console.log(`[${PLUGIN_ID}] Audio fetched. Size: ${buffer.length} bytes. Type: ${audioType}`);

      const transcription = await transcribeAudioSource(
        { buffer, name: audioName, type: audioType },
        currentSettings.apiKey,
        currentSettings.model,
        currentSettings.language,
        button
      );

      if (transcription) {
        console.log(`[${PLUGIN_ID}] Inserting transcription for ${blockUUID}: "${transcription.substring(0, 50)}..."`);
        await logseq.Editor.insertBlock(blockUUID, transcription, { sibling: true, focus: true });
      } else {
        console.warn(`[${PLUGIN_ID}] Transcription returned null for ${audioName}.`);
      }
    } catch (err: any) {
        console.error(`[${PLUGIN_ID}] Error in button click handler for ${audioName}:`, err);
        (logseq.App as any).showMsg(`Error transcribing ${audioName}: ${err.message || 'Unknown error'}`, 'error');
        button.textContent = '🎙️ Transcribe'; 
    } finally {
      isTranscribing = false;
      button.disabled = false;
      console.log(`[${PLUGIN_ID}] Transcription process finished for ${audioName}.`);
    }
  });

  const playerContainer = audioElement.closest('.audio-player-wrapper, .asset-audio, .asset-container, .block-content-inner');
  if (playerContainer && playerContainer.parentNode) {
    // Attempt to place it more consistently relative to the player controls if possible
    const controls = playerContainer.querySelector('audio'); // The audio element itself
    if (controls && controls.parentNode) {
        controls.parentNode.insertBefore(button, controls.nextSibling);
    } else {
        playerContainer.parentNode.insertBefore(button, playerContainer.nextSibling);
    }
    console.log(`[${PLUGIN_ID}] Transcribe button added for ${audioElement.src}.`);
  } else if (audioElement.parentNode) {
    audioElement.parentNode.insertBefore(button, audioElement.nextSibling);
    console.log(`[${PLUGIN_ID}] Transcribe button added (fallback placement) for ${audioElement.src}.`);
  } else {
    console.warn(`[${PLUGIN_ID}] Could not find suitable parent to insert transcribe button for:`, audioElement);
  }
  audioElement.dataset.transcriberButtonAdded = 'true';
}

function scanAndAddButtons() {
  console.log(`[${PLUGIN_ID}] scanAndAddButtons called.`);
  // Query within the main Logseq document context
  const audioElements = parent.document.querySelectorAll('div[blockid].ls-block audio:not([data-transcriber-button-added="true"])');
  console.log(`[${PLUGIN_ID}] Found ${audioElements.length} audio elements to process.`);
  
  audioElements.forEach((audioElNode) => {
    const audioEl = audioElNode as HTMLAudioElement;
    const blockElement = audioEl.closest('div.ls-block[blockid]'); // Ensure we get the blockid from the correct parent
    
    if (blockElement) {
        const blockUUID = blockElement.getAttribute('blockid');
        if (blockUUID) {
            console.log(`[${PLUGIN_ID}] Processing audio in block: ${blockUUID}`);
            addTranscribeButtonToAudioElement(audioEl, blockUUID);
        } else {
            console.warn(`[${PLUGIN_ID}] Found audio element within .ls-block, but no blockid attribute.`, audioEl);
        }
    } else {
      console.warn(`[${PLUGIN_ID}] Could not find parent .ls-block[blockid] for audio element:`, audioEl);
    }
  });
}

async function main() {
  console.log(`[${PLUGIN_ID}] Plugin main function starting.`);
  (logseq.App as any).showMsg('🎙️ Logseq Transcriber Plugin Loaded');

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
      margin-left: 5px; /* Ensure some space */
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

  observer = new MutationObserver((mutationsList) => {
    // Debounce or throttle scanAndAddButtons if it becomes too frequent
    console.log(`[${PLUGIN_ID}] MutationObserver triggered. Mutations:`, mutationsList.length);
    scanAndAddButtons();
  });
  
  const setupObserver = () => {
    console.log(`[${PLUGIN_ID}] setupObserver called.`);
    const appContainer = parent.document.getElementById('app-container');
    if (appContainer) {
      observer.disconnect();
      observer.observe(appContainer, { childList: true, subtree: true });
      console.log(`[${PLUGIN_ID}] MutationObserver observing #app-container.`);
      scanAndAddButtons(); 
    } else {
      console.error(`[${PLUGIN_ID}] #app-container not found for MutationObserver.`);
    }
  };
  
  // Initial setup and re-setup on route changes
  logseq.App.onRouteChanged(setupObserver);
  
  // Attempt initial setup after a short delay in case Logseq UI isn't fully ready
  setTimeout(setupObserver, 1000);

  // Also listen to sidebar changes as content might appear there
  logseq.App.onSidebarVisibleChanged( ({ visible }) => {
    if (visible) {
        console.log(`[${PLUGIN_ID}] Sidebar became visible, scanning for audio.`);
        setTimeout(scanAndAddButtons, 500); // Delay for sidebar content to render
    }
  });

  // Watch for API key setting changes and re-initialize or disconnect the observer accordingly
  (logseq.App as any).onSettingsChanged(({ key, newValue }) => {
    if (key === 'apiKey') {
      const newKey = (newValue as string)?.trim();
      if (newKey) {
        apiKeyAlertShown = false;
        console.log(`[${PLUGIN_ID}] API key set, re-initializing observer.`);
        setupObserver();
      } else {
        console.log(`[${PLUGIN_ID}] API key removed, disconnecting observer.`);
        observer.disconnect();
      }
    }
  });
  
  console.log(`[${PLUGIN_ID}] Plugin main function finished setup.`);
}

logseq.useSettingsSchema(settings).ready(main).catch(err => {
  console.error(`[${PLUGIN_ID}] Error in logseq.ready:`, err);
});