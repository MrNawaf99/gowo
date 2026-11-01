# GoWord GOPT pronunciation service

Internal service that scores how a student pronounced ONE target word or short
phrase. GoWord's Next.js server is its only client.

```
browser recorder (16 kHz mono PCM16 WAV)
  -> GoWord  POST /api/study/pronunciation/assess   (reads the target word from Firestore)
  -> this service  POST /v1/assess                  (internal network + bearer token)
       Kaldi LibriSpeech chain model: MFCC -> i-vectors -> forced alignment -> GOP features
       GOPT transformer (resident in memory): phone / word / utterance scores
  -> GoWord deterministic logic (pass/fail, issues)  -> browser
```

Recordings are never stored: they live in memory and a per-request temp
directory (tmpfs in Docker) that is deleted before the response is sent.
Audio and reference text are never logged.

## Components and licences

| Component | Source | Licence |
|---|---|---|
| GOPT model code (`app/gopt.py`, vendored unchanged) and "GOPT (Librispeech)" weights | [YuanGongND/gopt](https://github.com/YuanGongND/gopt) @ `bed909daf8eca035095871e51642525acc5b9b55` | BSD-3-Clause (`third_party/gopt/LICENSE`) |
| GOPT training data (determines the weights) | speechocean762, [OpenSLR 101](https://www.openslr.org/101/) | CC BY 4.0 — attribution required |
| Kaldi toolkit (Docker base image) | `kaldiasr/kaldi:cpu-debian12-openblas-2025-07-28` | Apache-2.0 |
| LibriSpeech chain acoustic model + i-vector extractor | [kaldi-asr.org/models/m13](https://kaldi-asr.org/models/m13) | **No licence stated on the model page** (trained on LibriSpeech, CC BY 4.0). Confirm with the Kaldi maintainers before commercial release. |
| LibriSpeech lexicon | [OpenSLR 11](https://www.openslr.org/11/) | Public domain |
| g2p-en (out-of-dictionary words) | [Kyubyong/g2p](https://github.com/Kyubyong/g2p) | Apache-2.0 |
| Test fixtures (`fixtures/speechocean762`) | speechocean762 | CC BY 4.0 |

## API (v1)

`GET /health` — liveness (process up).
`GET /ready` — 200 only after the model, lexicon and Kaldi assets loaded **and**
a real self-test assessment of a bundled recording succeeded; otherwise 503.

`POST /v1/assess` — `multipart/form-data`, header `Authorization: Bearer $SERVICE_TOKEN`

| field | |
|---|---|
| `audio` | WAV, 16 kHz, mono, 16-bit PCM, 0.3–10.5 s, ≤ 1 MB. No conversion is performed. |
| `reference_text` | exact target word/phrase (≤ 12 words) |

200 response:

```json
{
  "reference_text": "three",
  "words": [
    { "text": "three", "accuracy": 96.3, "pronunciation_source": "lexicon",
      "phones": [ { "phone": "TH", "stress": null, "accuracy": 90.3 },
                  { "phone": "R", "stress": null, "accuracy": 96.9 },
                  { "phone": "IY", "stress": 1, "accuracy": 95.5 } ] }
  ],
  "utterance": { "accuracy": 84.8 },
  "duration_ms": 2240,
  "processing_ms": 910,
  "engine": { "name": "gopt-librispeech", "version": "gopt-bed909d+kaldi-m13" }
}
```

Scores are GOPT outputs rescaled from speechocean762's 0–2 scale to 0–100.

`phone` is the pure ARPAbet symbol the model scores. `stress` is the lexical
stress the dictionary gives that phone (`0`, `1`, `2`, or `null` for a
consonant); it is reported because the pure phone cannot express it — on `AH`
the digit selects the vowel quality (`AH1`/`AH2` = /ʌ/ *cut*, `AH0` = /ə/
*about*) — and it never takes part in scoring or alignment.
Phones are the target's canonical dictionary pronunciation, in order.

Errors: `{ "error": { "code", "message" } }`

| code | HTTP | meaning |
|---|---|---|
| `INVALID_AUDIO` | 400/413/415 | not 16 kHz mono PCM16 WAV, too long or too big |
| `NO_SPEECH` | 422 | too short, silent, or speech could not be aligned to the reference |
| `UNSUPPORTED_TEXT` | 422 | empty/over-long text or a word with no derivable pronunciation |
| `UNAUTHORIZED` | 401 | wrong or missing token |
| `BUSY` | 429 | all workers busy for `QUEUE_TIMEOUT_S` |
| `NOT_READY` | 503 | model not loaded yet or startup failed (see `/ready`) |
| `INTERNAL` | 500 | unexpected failure (details only in service logs) |

GoWord never counts any of these as a pronunciation attempt.

## Configuration

| env | default | |
|---|---|---|
| `SERVICE_TOKEN` | — | bearer token GoWord must send (required in compose) |
| `MAX_CONCURRENT` | `2` | simultaneous assessments (each Kaldi run is single-threaded) |
| `QUEUE_TIMEOUT_S` | `10` | wait for a free slot before answering `BUSY` |
| `TORCH_THREADS` | `1` | GOPT forward threads |
| `ENABLE_G2P` | `1` | derive pronunciations for words missing from the lexicon |

GoWord (Next.js server) needs:

```
PRONUNCIATION_SERVICE_URL=http://127.0.0.1:8200        # or http://gopt-pronunciation:8000 on the compose network
PRONUNCIATION_SERVICE_TOKEN=<same value as SERVICE_TOKEN>
PRONUNCIATION_SERVICE_TIMEOUT_MS=20000
```

## Deploy on a clean Linux server

Requirements: Docker Engine with Compose v2, x86-64, 2 vCPU / 4 GB RAM minimum,
~6 GB disk for the image. No GPU.

```bash
git clone <goword repo> && cd <repo>/services/pronunciation-gopt
printf 'PRONUNCIATION_SERVICE_TOKEN=%s\n' "$(openssl rand -hex 32)" > .env
docker compose build            # downloads Kaldi base, models (SHA-256 verified), builds lang
docker compose up -d
until curl -fsS http://127.0.0.1:8200/ready; do sleep 5; done
```

The port is published on `127.0.0.1` only. If GoWord runs on another host, put
the service behind a private network / VPN or a TLS reverse proxy restricted to
GoWord's address — do not expose port 8000 publicly. If GoWord is hosted on a
serverless platform (e.g. Vercel), it cannot reach a private address; in that
case expose the service only through HTTPS with the bearer token and an IP/allow
list at the proxy.

## Development without Kaldi

```bash
pip install torch==2.4.1 --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt pytest httpx
pytest tests                                          # service unit tests
python tools/calibrate_speechocean762.py --seq-data ... --weights ...   # accuracy + thresholds
python tools/serve_with_precomputed_features.py ...    # real HTTP + real GOPT, Kaldi stage replaced by published features
```

See `CALIBRATION.md` for the measured accuracy and the chosen thresholds.
