# Listening and text-to-speech

The first A1 listening exercise uses a closed, reviewed clip catalog. API callers
select a clip identifier rather than submitting arbitrary text. This keeps the TTS
endpoint aligned with lesson content and prevents it from becoming a public speech
generation proxy.

## Provider order

1. If `PIPER_EXECUTABLE` and `PIPER_MODEL_PATH` are configured, the server invokes
   the local Piper CLI with an argument array, returns WAV audio, and caches it.
2. If server TTS is not configured or fails, the lesson uses the browser Speech
   Synthesis API and requires an installed Spanish voice. Browser speech is not
   represented as cached or reproducible audio.

The UI reports which path played the clip. It does not label browser speech as
Piper output or claim a cache hit when no server audio was generated.

## Server cache

The cache key includes the provider, cache format version, voice identifier, locale,
rate, and text. WAV files and JSON metadata are written under `TTS_CACHE_DIR`
(`.data/tts-cache` by default), which is excluded from Git. A provider or cache
format change invalidates old entries without deleting them.

## Optional Piper setup

Piper and its model are deliberately not bundled. Configure these values in
`.env.local`:

```dotenv
PIPER_EXECUTABLE=C:\path\to\piper.exe
PIPER_MODEL_PATH=C:\path\to\es_ES-davefx-medium.onnx
PIPER_MODEL_CONFIG_PATH=C:\path\to\es_ES-davefx-medium.onnx.json
PIPER_VOICE_ID=es_ES-davefx-medium
TTS_CACHE_DIR=.data/tts-cache
```

The current Piper implementation is GPL-3.0. The suggested `es_ES-davefx-medium`
model card labels the model MIT and its dataset CC0. Verify the executable and model
artifacts again before distribution, record their exact versions and hashes, and
keep their license notices with any shipped sidecar or model package.

The application-authored listening sentence is recorded in the catalog with
`Project-authored` provenance. Future imported or recorded clips must have equally
explicit source, license, and attribution metadata.
