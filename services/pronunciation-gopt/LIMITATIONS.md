# Known limitations of the GOPT pronunciation engine

Status at the end of the Study Mode stabilisation pass. These are engine and
policy boundaries, not open application bugs — the application-side guarantees
are locked down by `src/lib/pronunciation/wrongWord.test.ts`.

## 1. A wrong word can be scored as correct (highest impact)

**Symptom.** A student says a different word from the target and the attempt is
sometimes accepted as PASS.

**Cause.** The pipeline is Goodness-of-Pronunciation scoring, which is
*conditioned on the assumption that the student attempted the target word*. In
`kaldi/assess_one.sh`:

- stage 8 builds the graph with `compile-train-graphs-without-lexicon` from the
  reference transcript alone — a linear FST of the reference phones;
- stage 9 runs `align-compiled-mapped`, **forced alignment**, not decoding.
  There is no phone loop, no lexicon-free alternative path and no language
  model, so the recording is always mapped onto the reference phones;
- stage 12 computes GOP against that forced path.

The system therefore answers "how well does this audio fit *these* phones",
and has no mechanism that could answer "is this that word". A different word
whose acoustics partly fit the reference phones can score above the pass mark.

**Confirmed not to be:** an application, state, cache or idempotency bug. The
target text is read from the server-side session snapshot, the client cannot
substitute it, an assessment for one reference text is refused for another, a
repeated `clientAttemptId` replays the stored result without re-assessing, and
the scripted mock provider cannot run in production. Each of those is a test.

**Related measurement.** `CALIBRATION.md` §3 shows the same weakness on real
speech at the current thresholds: 41% of words humans rated "poor" (≤ 5/10)
still pass, while 8% of correct words fail.

**Why thresholds were not changed.** Raising the pass mark trades one error for
the other — at W=90 poor words passing falls to 31% but correct words failing
rises to 13% — and it does not address wrong words at all, because a wrong word
that force-aligns well is not near the boundary. This needs a verification
stage, not a different number.

**Options for the next phase**, roughly by cost:

| Approach | What it adds | Cost |
|---|---|---|
| Free phone-loop decoding as a denominator | A second Kaldi pass that decodes without the reference; a large gap between forced and free likelihood means "not this word" | Moderate: one more decode per request, a threshold to calibrate |
| Keyword spotting / ASR confirmation on the target word | An independent check that the word was said, before GOP is trusted | Moderate–high: another model to host, or a paid ASR call |
| Whole-utterance ASR and text comparison | Transcribe, compare to the target | High latency; weak on heavily accented single words, which is exactly our population |

Whichever is chosen, it belongs *before* the pass decision and must keep the
current rule that a rejected attempt is reported without consuming one.

## 2. Phone attribution is weaker than the word verdict

A word can fail correctly while the phone reported as the problem is not the
one a human would name (`CALIBRATION.md` §4, `three_mispronounced`: humans say
TH is wrong; GOPT scores TH 83 and IY 34, so the issue is reported on IY).

This is why `PRONUNCIATION_SCORING_POLICY.soundFeedbackEnabled` is `false`:
issues are stored as codes but never taught. Turning it on requires validating
attribution on Arabic-L1 single-word recordings first
(`fixtures/RECORDING_SCRIPT.md`).

## 3. The calibration population does not match GoWord's students

speechocean762 is mostly Mandarin-L1 speakers reading full sentences. GoWord
students are Arabic-L1 saying isolated words. Thresholds are therefore marked
`status: "provisional"` and must be re-measured on Arabic-L1 recordings before
the policy can be called calibrated.

## 4. One canonical pronunciation per word

The lexicon holds a single dictionary pronunciation, so legitimate variants
(RABBIT with AH or IH, weak forms of TO and WAS, British vs American vowels)
score lower than they should. Teachers entering such words will see students
fail them for no real reason.

## 5. No dedicated handling of very short target words

Single-phoneme and very short words give GOP few frames to judge, making scores
noisier. Not measured yet; worth checking when the Arabic-L1 set is recorded.
