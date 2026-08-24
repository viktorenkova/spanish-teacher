# Speaking and speech-to-text

The first speaking task asks the learner to give a short introduction with
`Me llamo…` and `Soy de…`. It separates three concepts:

- the browser transcript is evidence of what the recognizer heard;
- deterministic task assessment checks whether both communicative signals exist;
- pronunciation remains unassessed because a transcript has no phoneme-level evidence.

## Provider boundary

`SpeechToTextProvider` defines support detection, transcription, stop, and abort
operations. The first implementation wraps the browser `SpeechRecognition` or
`webkitSpeechRecognition` API and requests `es-ES`. It captures one utterance for
at most 15 seconds and returns one transcript with optional provider confidence.

The Web Speech recognition API has limited browser availability. Some browsers
use a server-based recognition engine and send microphone audio to their speech
service. The UI explains this before recording and reports permission, microphone,
no-speech, and network failures. See the current
[SpeechRecognition documentation](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition).

## Data retention

Spanish Coach does not receive or store raw audio in this implementation. After
the learner reviews the displayed transcript, the server stores:

- transcript text;
- STT provider identifier;
- optional provider confidence;
- deterministic assessment version and task result;
- FSRS review evidence and due date.

The server limits transcript input to 500 characters and does not trust a
client-provided pass/fail value. `introduction-task-v1` checks for a supported
name construction (`Me llamo…` or `Mi nombre es…`) and origin construction
(`Soy de…` or `Vengo de…`). This is deliberately task completion, not general
grammar correction or pronunciation scoring.

## Next provider step

A future server STT implementation can use the same port, but choosing a cloud
provider changes privacy, retention, cost, credentials, and deployment. That
decision remains outside this slice and should be made explicitly before raw
audio upload is added.
