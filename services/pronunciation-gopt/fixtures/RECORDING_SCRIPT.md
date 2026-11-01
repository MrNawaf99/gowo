# Recording script: Arabic-L1 calibration and sound-attribution fixtures

Two separate questions are measured, so every row states both:
- **Verdict**: should the word pass or fail?
- **Target sound**: which ONE sound was deliberately changed (blank for correct takes)?

## Setup

Record on a phone through GoWord's recorder, so files have exactly the
production format (16 kHz mono PCM16 WAV). Microphones need HTTPS:

```bash
npx next dev --experimental-https --port 3100
```

Open `https://<computer-ip>:3100/dev/recorder` on the phone. For each row:
type the reference word, **Record**, say it once, **Stop**, **Assess clip**.
Save the WAV as `<speaker>_<row>_<take>.wav` (e.g. `s1_05_a.wav`) and note the row.

- At least **2 speakers**, ideally 3, Arabic L1 (one teacher-level, one student-level).
- Quiet room, phone at normal speaking distance, unless the row says otherwise.
- Say each word naturally once per take. Do not exaggerate the mistake.

## A. Sound-attribution set (one deliberate mistake per word)

| # | reference | correct take | mistake take: say it as | target sound | position |
|---|---|---|---|---|---|
| 1 | three | three | **tree** | TH | start |
| 2 | think | think | **sink** | TH | start |
| 3 | this | this | **zis** | TH (voiced) | start |
| 4 | red | red | **wed** | R | start |
| 5 | very | very | **vely** (L for R) | R | middle |
| 6 | light | light | **right** | L | start |
| 7 | feel | feel | **feer** | L | end |
| 8 | van | van | **fan** | V | start |
| 9 | love | love | **luff** | V | end |
| 10 | wine | wine | **vine** | W | start |
| 11 | pen | pen | **ben** | P | start |
| 12 | happy | happy | **habby** | P | middle |
| 13 | big | big | **pig** | B | start |
| 14 | ship | ship | **sip** | SH | start |
| 15 | wash | wash | **wass** | SH | end |
| 16 | chair | chair | **share** | CH | start |
| 17 | watch | watch | **wash** | CH | end |
| 18 | jam | jam | **yam** | J | start |
| 19 | page | page | **pash** | J | end |

Record each row as: correct take **a**, correct take **b**, mistake take **c**, mistake take **d**.

## B. Verdict and threshold set

| # | reference | how to say it | expected verdict |
|---|---|---|---|
| 20 | comfortable | clearly | pass |
| 21 | environment | clearly | pass |
| 22 | communication | clearly | pass |
| 23 | rabbit | clearly, normal Arabic accent | pass |
| 24 | three | correct, spoken quietly from arm's length | pass or NO_SPEECH, never a false issue |
| 25 | three | correct, fast | pass |
| 26 | comfortable | mostly wrong ("com-for-TAY-bel") | fail |
| 27 | three | a different word entirely ("chair") | fail or NO_SPEECH |
| 28 | three | cough / silence only | NO_SPEECH (not an attempt) |

Repeat rows 1, 4, 11 and 20 three times each (take a/b/c) to measure score stability.
