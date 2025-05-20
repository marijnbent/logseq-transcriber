import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin';

const settings: SettingSchemaDesc[] = [
  {
    key: 'apiKey',
    type: 'string',
    title: 'API Key',
    description: 'Your API Key from Deepgram. Get one at https://console.deepgram.com/project/_/api-keys',
    default: '',
  },
  {
    key: 'model',
    type: 'string',
    title: 'Transcription Model',
    description: 'Model to use (e.g., nova-3, whisper-large). See https://developers.deepgram.com/docs/model for options.',
    default: 'nova-3',
  },
  {
    key: 'language',
    type: 'enum',
    title: 'Audio Language',
    description: "Select the primary language of the audio or choose 'auto-detect'. See https://developers.deepgram.com/docs/models-languages-overview.",
    default: 'auto-detect',
    enumPicker: 'select',
    enumChoices: [
      'auto-detect',
      'en',
      'es',
      'fr',
      'de',
      'it',
      'pt',
      'nl',
      'hi',
      'ja',
      'zh',
      'ko',
      'ru',
      'uk',
      'sv',
      'tr',
      'id'
    ],
  },
  {
    key: 'useCallout',
    type: 'boolean',
    title: 'Prefix transcription as callout',
    description: 'When enabled, transcription will be formatted as a callout block with > prefixes',
    default: true,
  }
];

export default settings;
