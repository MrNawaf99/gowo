# Teaching inventory decision — Study Mode Pronunciation

> **STATUS — the decisions below are now IMPLEMENTED in the data model**
> (implementation-preparation phase). What is done and what is still pending is
> listed in §12. Still true of this phase: **no external asset was downloaded —
> no image, no audio** — and no scoring threshold, pass/fail rule or GOPT model
> code was touched.

Decision and verification phase. **No asset was downloaded, no scoring
threshold or engine code was touched.** This document
settles the four open phonetic questions left by
[`SOUND_INVENTORY_RESEARCH.md`](./SOUND_INVENTORY_RESEARCH.md) §8 and fixes the
*student* teaching inventory, which is deliberately **not** the same thing as
the engine's *technical* phone inventory.

Everything below was verified against code and data in this repository or in
the model/dataset files already downloaded for QA
(`.claude/worktrees/goword-full-qa-audit-33f1a0/.qa-tmp/`, read only). No
claim here rests on a web search result.

---

## 1. Technical phone inventory (39)

Source of truth: [`services/pronunciation-gopt/app/phone_ids.json`](../../services/pronunciation-gopt/app/phone_ids.json),
enforced at load time — `GoptModel.__init__` refuses any table that is not
exactly 39 phones mapped to ids 0‥38
([`gopt_model.py:44`](../../services/pronunciation-gopt/app/gopt_model.py#L44)).

```
24 consonants   B CH D DH F G HH JH K L M N NG P R S SH T TH V W Y Z ZH
10 monophthongs AA AE AH AO EH ER IH IY UH UW
 5 diphthongs   AW AY EY OW OY
--------------- 39 total
```

These are **pure** ARPAbet symbols: no stress digit, no Kaldi position suffix.
This inventory is fixed by the model and cannot be extended without retraining.
It is a machine vocabulary, not a syllabus.

**FINAL TECHNICAL PHONE COUNT: 39 (unchanged).**

## 2. Teaching targets before this work (15)

The state this decision started from, for comparison with §7:

`TH_VOICELESS TH_VOICED R L V W P B SH CH J VOWEL_SHORT_I VOWEL_LONG_E
VOWEL_A_CAT VOWEL_U_CUT`

It is now the 18 of §7 in
[`src/lib/pronunciation/phoneSounds.ts`](../../src/lib/pronunciation/phoneSounds.ts)
→ `SOUND_KEYS`, with catalogue entries in
[`src/lib/pronunciation/sounds.ts`](../../src/lib/pronunciation/sounds.ts).

Every one has `imageAsset.status: "MISSING"`, so `isUsableAsset()` rejects all
of them and every failure currently teaches at word level. Sound feedback is
additionally gated off entirely by
[`config.ts`](../../src/lib/pronunciation/config.ts) → `soundFeedbackEnabled: false`.

---

## 3. AH — schwa vs STRUT

### 3.1 Where the distinction is actually lost

Traced end to end. The research note blamed `purePhone()`; that is **not** the
real loss point, and fixing only `purePhone()` would change nothing.

| Step | File | Stress present? |
|---|---|---|
| CMUdict / LibriSpeech lexicon file | `librispeech-lexicon.txt` (`CUT K AH1 T`, `THE DH AH0`) | ✅ yes |
| `Lexicon.pronounce()` → `WordPron.phones` | [`lexicon.py:26`](../../services/pronunciation-gopt/app/lexicon.py#L26) | ✅ yes (`("K","AH1","T")`) |
| g2p-en fallback for out-of-lexicon words | [`lexicon.py`](../../services/pronunciation-gopt/app/lexicon.py) `_ARPABET = ^[A-Z]{1,2}[0-2]?$` | ✅ yes |
| Kaldi alignment input | `WordPron.kaldi_phones()` → `AH1_I` (position-**and**-stress dependent) | ✅ yes |
| Kaldi GOP features | `compute-gop` collapses to `phones-pure.txt` ([`kaldi.py:60`](../../services/pronunciation-gopt/app/kaldi.py#L60)) | ❌ **dropped** |
| GOPT model input | `WordPron.pure_phones` → 39-id embedding ([`assessor.py`](../../services/pronunciation-gopt/app/assessor.py), `gopt_model.py`) | ❌ dropped (by design) |
| **HTTP v1 response `words[].phones[].phone`** | [`assessor.py`](../../services/pronunciation-gopt/app/assessor.py) — emits `pure[span]`, not `part.phones` | ❌ **dropped here — this is the real loss point** |
| `goptServiceProvider` → `ProviderPhone.phone` | [`goptServiceProvider.ts:132`](../../src/lib/pronunciation/provider/goptServiceProvider.ts#L132) | ❌ already gone |
| `purePhone()` / `soundKeyForPhone()` | [`phoneSounds.ts:50`](../../src/lib/pronunciation/phoneSounds.ts#L50) | ❌ already gone — the strip is a **no-op in production** |

So stress **is** available on the server, all the way to the point where the
response is assembled, and is thrown away one line before it would have been
serialised. `purePhone()` only still matters for defence in depth and for the
mock provider.

### 3.2 What the stress digit means (corrected)

`SOUND_INVENTORY_RESEARCH.md` §8.1 states `AH0/AH2 → /ə/`. **That is wrong for
AH2.** Verified directly in the LibriSpeech lexicon:

```
CUT        K AH1 T          /ʌ/   stressed STRUT
ADJUNCT    AE1 JH AH2 NG K T /ʌ/  secondary-stressed STRUT
ANYONE     EH1 N IY0 W AH2 N /ʌ/  ("-one")
AGRICULTURE AE1 G R IH0 K AH2 L CH ER0 /ʌ/
THE        DH AH0           /ə/   schwa
ABOUT      AH0 B AW1 T      /ə/
BANANA     B AH0 N AE1 N AH0 /ə/
```

The rule is **AH1, AH2 → STRUT /ʌ/; AH0 → schwa /ə/** — i.e. *stressed or
secondary-stressed = STRUT, unstressed = schwa*. This matches the user's
statement, and §8.1 of the research document is corrected by this decision.

### 3.3 Why it matters

Occurrence counts over the 206,508-entry LibriSpeech lexicon actually in use:

| Symbol | Occurrences | Share of all `AH` |
|---|---:|---:|
| `AH0` (schwa) | 104,039 | **88.9 %** |
| `AH1` (STRUT) | 11,291 | 9.6 % |
| `AH2` (STRUT) | 1,676 | 1.4 % |

Today **89 % of `AH` failures tell the student to practise "the U sound as in
*cut*"** and would show a /ʌ/ mouth position for what is really a reduced
schwa. The teaching advice is also inverted: STRUT wants a clear, full vowel;
schwa wants the opposite — shorten and relax it. This is the single worst
defect in the mapping and it must be fixed before any vowel image is chosen.

### 3.4 What GOPT can and cannot do here

GOPT scores a phone **token whose identity we already know** from the
dictionary — it answers *"how well was this canonical phone produced?"*, not
*"which phone was that?"*. Its embedding has one `AH` id (16) and no stress
dimension, and the speechocean762 GOP pipeline it was trained on collapses
stress the same way. Therefore:

- GOPT **cannot** acoustically tell /ʌ/ from /ə/, and never will without
  retraining. Splitting the id table is out of the question.
- GOPT **does not need to**. The canonical label comes from the lexicon, which
  *does* know. The split is a *labelling* fix, not a modelling change: identical
  features, identical score, correct lesson.

### 3.5 Recommended fix — smallest architecture-compatible change ✅ IMPLEMENTED

Carry the stress digit that already exists, as a **separate optional field**;
do not change the meaning of `phone`.

1. **Service** — [`assessor.py`](../../services/pronunciation-gopt/app/assessor.py):
   alongside `"phone": <pure>`, emit `"stress": 0 | 1 | 2 | null`, read from
   `part.phones` (parse the trailing digit; `null` for consonants and for any
   phone that carries none). Model input, scores, thresholds and the `phone`
   field are untouched, so this is additive and backward compatible.
2. **Contract** — `ServiceAssessmentSchema` in
   [`goptServiceProvider.ts`](../../src/lib/pronunciation/provider/goptServiceProvider.ts):
   add `stress: z.number().int().min(0).max(2).nullish()`; pass it through to
   a new optional `ProviderPhone.stress` in
   [`provider/types.ts`](../../src/lib/pronunciation/provider/types.ts).
3. **Mapping** — [`phoneSounds.ts`](../../src/lib/pronunciation/phoneSounds.ts):
   `soundKeyForPhone(phone, stress?)`. Keep `PHONE_TO_SOUND` for the
   stress-independent majority and add one small table for stress-sensitive
   phones: `AH` + stress 1 or 2 → `VOWEL_STRUT`; `AH` + stress 0 → `VOWEL_SCHWA`.
   **`AH` with stress `undefined` returns `null`** (word-level lesson) rather
   than guessing — an unknown-quality vowel must never pick a mouth diagram.
   `purePhone()` keeps stripping, unchanged, and still accepts `"AH1"` if a
   provider ever sends a stressed symbol in `phone`.
4. **Catalogue** — [`sounds.ts`](../../src/lib/pronunciation/sounds.ts): replace
   `VOWEL_U_CUT` with `VOWEL_STRUT` (*cut*) and `VOWEL_SCHWA` (*about*).
5. **Persistence** — `soundKey` is `z.string()` in
   [`schemas/pronunciation.ts`](../../src/lib/schemas/pronunciation.ts), and
   `soundFor()` already degrades an unknown key to the word-level lesson, so
   old attempts naming `VOWEL_U_CUT` keep working. No migration, no schema
   change.

Rejected alternatives, for the record: putting `"AH1"` in the `phone` field
(breaks every consumer and the `phone` contract); a second GOPT phone id
(requires retraining); inferring quality from the score (the client must never
infer a sound).

**Result: `VOWEL_STRUT` and `VOWEL_SCHWA` are distinguishable exactly when the
dictionary supports it, and stress variants are still not counted as separate
phonemes — `AH` remains one technical phone, id 16.**

---

## 4. ER

**What the pipeline actually represents.** `ER` is one technical phone (id 33),
one lexicon symbol, one GOPT embedding row. The stress digit distinguishes
`ER1/ER2` (stressed /ɝ/, *hurt*, *bird*, *first*) from `ER0` (unstressed /ɚ/,
*letter*, *butter*, *teacher*) — 7,253 + 731 vs **32,663** occurrences, so ~81 %
of `ER` tokens are unstressed. Both are r-coloured central vowels; General
American analyses routinely treat them as one phoneme differing only in stress,
and GA is fully rhotic, so no centring-diphthong alternative exists.

**Decision: A — one teaching target, `VOWEL_ER`, label "ER sound", example
*bird*.** Reasons, in the order the brief asks for them:

| Criterion | Finding |
|---|---|
| Current en-US target | None exists; `R` is taught but the r-coloured vowel is not. |
| CMUdict representation | One symbol `ER`; stress digit only marks prominence, not a different quality. |
| Actual GOPT output | One id, one score head. Identical features for both. |
| Student teaching value | The instruction is the same for both: curl/bunch the tongue and colour the whole vowel. Splitting would produce two lessons with the same corrective action. |
| Would the image differ? | **No.** The articulation is the same posture; /ɚ/ is shorter and less prominent. Two identical diagrams would be misleading. |

Unlike `AH`, where the two qualities need **different** mouth positions and
**opposite** advice, `ER` fails every test for splitting. The stress difference
is worth one sentence inside the tip ("in an unstressed syllable keep it short,
but keep the r-colour"), not a second target.

Data note for later QA: the lexicon's *first* entry for `FROM` is `F ER0 M`,
and `Lexicon.load` keeps the first pronunciation, so the word *from* will be
scored with an `ER`. That is a dictionary artefact, not a bug in this decision.

---

## 5. F

- **In the GOPT phone set?** Yes — `"F": 13` in `phone_ids.json`, and it is a
  first-class LibriSpeech lexicon symbol (20,998 occurrences, vs 17,532 for the
  already-taught `V`).
- **Can the current SoundKey architecture support it?** Yes, with no structural
  change: add `"F"` to `SOUND_KEYS`, one line `F: "F"` in `PHONE_TO_SOUND`, and
  one catalogue entry. `Record<SoundKey, PronunciationSound>` makes a missing
  catalogue entry a compile error, and `sounds.test.ts` covers the round trip.
  (`F` existed in the pre-fix catalogue but no phone mapped to it, so it was
  unreachable — this closes that loop properly.)
- **Teaching case:** /f/–/v/ is a minimal pair and a standard Arabic-L1
  confusion (*many varieties lack /v/ and substitute /f/*). Teaching only the
  voiced half is exactly backwards: the student's *error* is usually the `F`
  articulation appearing where `V` belongs, and the contrast is what fixes it.

**Documented as a candidate teaching target and included in the final inventory
(§7). It is not enabled by this commit — no code was changed.**

---

## 6. TH labels

Current state: `TH_VOICELESS` and `TH_VOICED` both render `displayLabel: "TH
sound"`; only the example word in parentheses differs, so the student sees
"TH sound (think)" vs "TH sound (this)". That is a real ambiguity — the two
entries look like the same lesson shown twice.

Constraints that cannot be traded away: the label is **always English in both
locales** (rendered `dir="ltr" lang="en"` in
[`PronunciationStudyActivity.tsx`](../../src/components/quiz/PronunciationStudyActivity.tsx)),
it must never be written with Arabic letters (ث / ذ), it must never show IPA,
and `sounds.test.ts` enforces `/^[A-Za-z ]+ sound$/`.

**Recommended labels:**

| Key | English label (unchanged locale rule) | Example |
|---|---|---|
| `TH_VOICELESS` | **Voiceless TH sound** | think |
| `TH_VOICED` | **Voiced TH sound** | this |

Both pass the existing label regex unchanged. "Voiceless/Voiced" is the only
wording that is accurate, stays English, works for an English-UI user, and does
not smuggle in phonetic notation. Alternatives considered and rejected:
"Soft/Hard TH" (not a real distinction, and "hard" misleads towards force),
"Quiet/Loud TH" (wrong — voicing is not volume), keeping the example word as
the only difference (the present, ambiguous state).

**The Arabic user must not be left to parse the English word "Voiceless".** The
label stays English; the *explanation* next to it is Arabic, which is exactly
the locale/content boundary this project already follows. Recommended addition
to the catalogue: an optional localized `labelNote: { en, ar }` rendered under
the label.

| Key | `labelNote.en` | `labelNote.ar` |
|---|---|---|
| `TH_VOICELESS` | TH without your voice — only air | صوت TH بدون اهتزاز الحنجرة — هواء فقط (كما في كلمة think) |
| `TH_VOICED` | TH with your voice on — your throat buzzes | صوت TH مع اهتزاز الحنجرة (كما في كلمة this) |

The letters **TH** stay in Latin script inside the Arabic sentence, and the
sound is never explained by comparing it to an Arabic letter. The existing
`tips.ar` already say "لا تُشغّل صوتك" / "شغّل صوتك", so the Arabic UI is
consistent end to end.

---

## 7. Final proposed student teaching inventory (18)

Not 39. The technical inventory is a machine vocabulary; this is a curriculum
for Arabic-L1 learners of General American English. Every row is a phone GOPT
can score and the application can already attribute.

> The **Now?** and **Code?** columns record the state *before* this work, so the
> proposal can be read against what existed. All of it is now implemented —
> §12 has the current state.

Legend: **GOPT?** = the engine can produce a score for this phone ·
**App?** = the app can identify this target from the response *after* the §3.5
change · **Image?** = needs an articulation illustration ·
**Now?** = implemented today · **Code?** = needs a code change.

### A. Consonant teaching targets (12)

| SoundKey | Phone | English label | Arabic explanation (`tips.ar` / `labelNote.ar`) | Example | GOPT? | App? | Image? | Now? | Code? |
|---|---|---|---|---|---|---|---|---|---|
| `TH_VOICELESS` | TH | Voiceless TH sound | صوت TH بدون اهتزاز الحنجرة — هواء فقط | think | ✅ | ✅ | ✅ | ✅ | label + note |
| `TH_VOICED` | DH | Voiced TH sound | صوت TH مع اهتزاز الحنجرة | this | ✅ | ✅ | ✅ | ✅ | label + note |
| `R` | R | R sound | صوت R: اسحب اللسان للخلف والأعلى دون أن يلمس سقف الفم | red | ✅ | ✅ | ✅ | ✅ | — |
| `L` | L | L sound | صوت L: طرف اللسان خلف الأسنان العليا والصوت يخرج من الجانبين | light | ✅ | ✅ | ✅ | ✅ | — |
| `F` | F | F sound | صوت F: الأسنان العليا على الشفة السفلى بدون تشغيل الصوت | fish | ✅ | ✅ | ✅ | ❌ | **new target** |
| `V` | V | V sound | صوت V: الأسنان العليا على الشفة السفلى مع تشغيل الصوت | very | ✅ | ✅ | ✅ | ✅ | — |
| `W` | W | W sound | صوت W: تقريب الشفتين على شكل دائرة، ولا تلمس الأسنان الشفة | water | ✅ | ✅ | ✅ | ✅ | — |
| `P` | P | P sound | صوت P: إطباق الشفتين ثم دفعة هواء قوية بدون صوت | pen | ✅ | ✅ | ✅ | ✅ | — |
| `B` | B | B sound | صوت B: مثل P لكن مع تشغيل الصوت وبدون دفعة هواء | book | ✅ | ✅ | ✅ | ✅ | — |
| `SH` | SH | SH sound | صوت SH: رفع وسط اللسان ودفع الشفتين للأمام مع هواء مستمر | she | ✅ | ✅ | ✅ | ✅ | — |
| `CH` | CH | CH sound | صوت CH: حبس الهواء ثم إطلاقه إلى صوت SH بدون تشغيل الصوت | chair | ✅ | ✅ | ✅ | ✅ | — |
| `J` | JH | J sound | صوت J: نفس حركة CH مع تشغيل الصوت من البداية | jump | ✅ | ✅ | ✅ | ✅ | — |

### B. Vowel teaching targets (6)

| SoundKey | Phone | English label | Arabic explanation | Example | GOPT? | App? | Image? | Now? | Code? |
|---|---|---|---|---|---|---|---|---|---|
| `VOWEL_SHORT_I` | IH | Short I sound | حركة قصيرة ومسترخية، لا تمدّها | ship | ✅ | ✅ | ✅ | ✅ | — |
| `VOWEL_LONG_E` | IY | Long E sound | افرد الشفتين كالابتسامة وأطل الصوت قليلًا | sheep | ✅ | ✅ | ✅ | ✅ | — |
| `VOWEL_A_CAT` | AE | A sound | افتح الفم على اتساعه واللسان منخفض إلى الأمام | cat | ✅ | ✅ | ✅ | ✅ | — |
| `VOWEL_STRUT` | AH (stress 1/2) | Short U sound | حركة واضحة قصيرة والفم نصف مفتوح بلا تقريب للشفتين | cut | ✅ | ⚠️ needs §3.5 | ✅ | ⚠️ as `VOWEL_U_CUT` | **rename + stress** |
| `VOWEL_SCHWA` | AH (stress 0) | Relaxed U sound | حركة مختصرة جدًا وسريعة في المقطع غير المشدّد — لا تنطقها بوضوح | about | ✅ | ⚠️ needs §3.5 | ✅ (shared) | ❌ | **new target** |
| `VOWEL_ER` | ER | ER sound | حركة ملوّنة بصوت R: اسحب اللسان للخلف طوال الحركة | bird | ✅ | ✅ | ✅ | ❌ | **new target** |

`VOWEL_STRUT`'s English label is "Short U sound" rather than the bare "U sound"
it has today, so that it contrasts audibly with `VOWEL_SCHWA` ("Relaxed U
sound") without either label carrying phonetic notation. Both remain English in
both locales.

### C. Diphthong teaching targets (0 enabled, 2 documented)

**No diphthong is a teaching target in this phase.** `AW AY OY` map onto
sequences Arabic already has (/aw/, /aj/), so they are not a priority. `EY` and
`OW` *are* a genuine Arabic-L1 difficulty (produced as flat [eː] [oː] instead of
gliding) and are recorded as **tier-2 candidates**, not enabled:

| SoundKey (proposed) | Phone | English label | Example | GOPT? | Image? | Status |
|---|---|---|---|---|---|---|
| `DIPHTHONG_LONG_A` | EY | Long A sound | day | ✅ | 2 panels | tier 2, not enabled |
| `DIPHTHONG_LONG_O` | OW | Long O sound | go | ✅ | 2 panels | tier 2, not enabled |

### D. Deliberately excluded (21 technical phones)

`AA AO EH UH UW` (vowels), `AW AY EY OW OY` (diphthongs), `D G HH K M N NG S T
Y Z ZH` (consonants). Reachable by the engine, scored normally, but they get the
word-level lesson. They are excluded because they are not systematic Arabic-L1
difficulties, and each one costs a licence-verified image and a maintained
lesson. This is a recorded decision, not an omission — and any of them can be
promoted later with a one-line mapping plus an asset.

**FINAL STUDENT TEACHING TARGET COUNT: 18** (12 consonants + 6 vowels + 0
diphthongs), of which 15 exist today, 3 are new (`F`, `VOWEL_SCHWA`,
`VOWEL_ER`), and 1 is a rename with a behaviour change (`VOWEL_U_CUT` →
`VOWEL_STRUT`).

---

## 8. Articulation images required

**17 distinct images for the 18 targets.**

- 16 targets need one image each.
- `VOWEL_STRUT` and `VOWEL_SCHWA` **share one mid-central, unrounded,
  half-open mouth diagram**. In General American their articulation is the same
  posture; what separates them is duration and prominence, which a static
  sagittal section cannot show and must not pretend to. They keep **separate
  lessons and separate Arabic tips** (produce clearly vs reduce and shorten),
  but pointing at two subtly different drawings would teach a distinction that
  does not exist in the mouth. One file, referenced twice.

**FINAL IMAGE COUNT: 17** (not 39 — and not 18).

If the tier-2 diphthongs are ever enabled, add **4 more panels** (start + end
for each of `EY`, `OW`), taking the total to 21.

## 9. Diphthong visualisation strategy

A single static mid-sagittal section is **not** sufficient for a diphthong: the
sound *is* the movement between two tongue positions, and one frozen frame
teaches the wrong target — usually the flat monophthong the Arabic-L1 student
already produces by mistake.

Required treatment, should tier 2 be enabled:

1. **Two panels side by side**, labelled *start* → *end*, with an arrow between
   them (the arrow is GoWord's own overlay, not part of the licensed asset).
2. Each panel reuses the corresponding **monophthong** diagram from the same
   visual style set (`EY` = /e/→/ɪ/, `OW` = /o/→/ʊ/), so no new artwork style
   is introduced and licence coverage is inherited from one source set.
3. Naming: `diphthong-long-a-start.svg`, `diphthong-long-a-end.svg`, etc.
4. This needs a `SoundAsset` shape that can hold two images. The current
   `imageAsset: SoundAsset` is single-valued, so enabling diphthongs is a
   **structural** change to `sounds.ts` — a further reason to leave them out of
   this phase rather than half-build them.

An animation or video is out of scope: it would multiply the licence surface and
the payload for two targets.

## 10. Code changes required before asset collection ✅ DONE

All seven are implemented, in the order below. Still untouched, as required:
scoring thresholds (`config.ts`), the GOPT model, `phone_ids.json`, alignment,
and `soundFeedbackEnabled` (still `false`).

| # | Change | Files | Blocking assets? |
|---|---|---|---|
| 1 | Emit `stress` per phone in the v1 response (additive) | `services/pronunciation-gopt/app/assessor.py` (+ service tests) | **Yes** — decides how many vowel images |
| 2 | Accept optional `stress` in the contract and provider type | `provider/goptServiceProvider.ts`, `provider/types.ts`, `provider/mockProvider.ts` | Yes |
| 3 | `soundKeyForPhone(phone, stress?)`; `AH`+1/2 → `VOWEL_STRUT`, `AH`+0 → `VOWEL_SCHWA`, unknown stress → `null` | `phoneSounds.ts`, `assessment.ts` | Yes |
| 4 | Catalogue: `VOWEL_U_CUT` → `VOWEL_STRUT`; add `VOWEL_SCHWA`, `VOWEL_ER`, `F` | `sounds.ts`, `phoneSounds.ts` | Yes — these are 3 of the 17 image slots |
| 5 | TH labels → "Voiceless TH sound" / "Voiced TH sound"; `VOWEL_STRUT` → "Short U sound" | `sounds.ts` | No |
| 6 | Optional localized `labelNote: {en, ar}` + render it under the label | `sounds.ts`, `PronunciationStudyActivity.tsx` | No |
| 7 | Tests: stress→key mapping, unknown stress → no lesson, catalogue/keys still congruent, labels still English and IPA-free | `sounds.test.ts`, `assessment.test.ts`, service tests | No |

Explicitly **not** changed by any of the above: scoring thresholds
(`config.ts`), the GOPT model, `phone_ids.json`, alignment, or
`soundFeedbackEnabled` (which stays `false` until Arabic-L1 attribution is
validated — see `services/pronunciation-gopt/LIMITATIONS.md`).

Persistence impact: none. `soundKey` is an unconstrained string and `soundFor()`
already degrades an unknown key to the word-level lesson, so attempts stored
with `VOWEL_U_CUT` stay readable.

## 11. Exact next step for asset research

1. **Land changes 1–4 above** (behaviour-affecting) with tests, so the image
   list is frozen at exactly the 17 slots in §8. Sourcing before this risks
   commissioning a /ʌ/ diagram for what is mostly schwa.
2. **Then, and only then**, resume asset research with a fixed shopping list:
   12 consonant diagrams (TH, DH, R, L, F, V, W, P, B, SH, CH, JH), 4 vowel
   diagrams (IH, IY, AE, ER), 1 shared mid-central vowel diagram (AH).
3. The blocker is unchanged and is environmental, not phonetic: this session's
   egress proxy blocks Wikimedia, `github.com` HTML and every university/OER
   host (`SOUND_INVENTORY_RESEARCH.md` §0). Nothing may be classified
   `SAFE_TO_USE` until a licence is read at its source.
4. First target when unblocked: locate the Wright & McCloy sagittal-section
   repository, read its `LICENSE`, and confirm the CC0 tag on two or three
   Commons file pages. One consistent style covering all 17 slots is the best
   outcome; `raw.githubusercontent.com` is reachable once exact paths are known.
5. Record every asset through `isUsableAsset()` with full provenance and mirror
   it into `soundAssets.manifest.json`. A file on disk alone still shows nothing.

---

## 12. Implemented state — DONE vs PENDING

### DONE (this phase, data model only)

| Item | Where | Evidence |
|---|---|---|
| `stress` emitted per phone in the v1 response | `services/pronunciation-gopt/app/assessor.py`, `lexicon.py` (`phone_stress`, `WordPron.stresses`) | service tests in `tests/test_service.py`; the model is still called with pure phones only |
| `stress` carried through the contract | `provider/goptServiceProvider.ts` (Zod, `.catch(null)` for out-of-range), `provider/types.ts` (`ProviderPhone.stress?`) | provider tests: present, absent and malformed |
| AH routing | `phoneSounds.ts` → `soundKeyForPhone(phone, stress?)`, `normaliseStress`, `stressOfPhone`; threaded in `assessment.ts` (`AssessedPhone.stress`) | `AH0`→schwa, `AH1`/`AH2`→STRUT, unknown/invalid→`null` |
| `VOWEL_STRUT` (replaces `VOWEL_U_CUT`) | `phoneSounds.ts`, `sounds.ts` | catalogue entry, example *cut* |
| `VOWEL_SCHWA` (new) | `phoneSounds.ts`, `sounds.ts` | catalogue entry, example *about*, shares the `vowel-mid-central.svg` slot |
| `VOWEL_ER` (new, one target) | `phoneSounds.ts`, `sounds.ts` | same key at every stress |
| `F` (new) | `phoneSounds.ts`, `sounds.ts` | example *fish*, completing the F/V pair |
| TH labels | `sounds.ts` | "Voiceless TH sound" / "Voiced TH sound" |
| Localized `labelNote` + rendering | `sounds.ts`, `PronunciationStudyActivity.tsx` | English label, Arabic explanation, `dir`/`lang` set per locale |
| Manifest split: technical phones vs teaching targets | `soundAssets.manifest.json` | generated from the catalogue; a unit test fails if they drift |

Unchanged on purpose: `phone_ids.json` (still 39), the GOPT model and
alignment, every scoring threshold in `config.ts`, and `soundFeedbackEnabled`
(still `false`).

### PENDING

| Item | Blocker |
|---|---|
| External articulation images (17 slots) | Not started. Network egress policy prevents verifying any licence at its source. |
| Licence verification and provenance | Same. Every `source`/`license` field is `null`; `isUsableAsset()` rejects every slot, so students still get the word-level lesson. |
| External isolated-phoneme audio (18 clips) | Not started. GoWord TTS must not be used — it would read the words "TH sound", not produce /θ/. |
| Turning sound teaching on | `soundFeedbackEnabled` is `false` pending Arabic-L1 attribution validation (`services/pronunciation-gopt/LIMITATIONS.md` §2). Independent of assets. |
| Tier-2 diphthongs (`EY`, `OW`) | Deliberately not enabled; needs a two-image `SoundAsset` shape first. |

---

## 15. Inventory expansion to 24 (2026-09-17)

The product owner supplied two master infographic sheets (English, Arabic),
24 sound cards each, as the final approved Study Mode teaching artwork —
covering all 18 targets above **plus six more**: `T`, `D`, `K`, `G`, `S`, `Z`.

**These six are added as full teaching targets.** They are not a special
case architecturally: all six are ordinary phones already in the 39-phone
technical inventory (`phone_ids.json`), each maps to its own `SoundKey` with
a one-line `PHONE_TO_SOUND` entry (`T: "T"`, `D: "D"`, …), and GOPT already
scores them — nothing about the engine, alignment or scoring changed.

**This does not retract §7's reasoning for the original 18.** That section
picked a *difficulty-based* curriculum: the 12 consonants and 6 vowels judged
to be systematic Arabic-L1 confusions. `T/D/K/G/S/Z` were not added because
new evidence overturned that judgement — Arabic natively has close
counterparts to all six, so they remain a lower-priority difficulty set than
the original 18. They are added because **asset availability is an
independent, sufficient reason to teach a sound**: high-quality bilingual
art now exists for them, and shipping a correct, well-illustrated lesson for
a sound that is merely a *lower* priority is better than shipping none. A
future difficulty-only curriculum and an asset-driven one are not in
conflict; this document simply stops being the sole gate on what gets taught.

New teaching-target rows, following the same table shape as §7:

| SoundKey | Phone | English label | Example | GOPT? | App? | Card? | Now? |
|---|---|---|---|---|---|---|---|
| `T` | T | T sound | tea | ✅ | ✅ | ✅ | ✅ |
| `D` | D | D sound | day | ✅ | ✅ | ✅ | ✅ |
| `K` | K | K sound | key | ✅ | ✅ | ✅ | ✅ |
| `G` | G | G sound | go | ✅ | ✅ | ✅ | ✅ |
| `S` | S | S sound | sun | ✅ | ✅ | ✅ | ✅ |
| `Z` | Z | Z sound | zoo | ✅ | ✅ | ✅ | ✅ |

**Diphthongs and the excluded 15 phones are unaffected** — `AA AO EH UH UW
AW AY EY OW OY D→(now taught) G→(now taught) HH M N NG Y ZH` shrinks by the
six now taught; the remaining phones (`AA AO EH UH UW HH M N NG Y ZH` plus
`AW AY EY OW OY`) stay excluded for the same reason as before: no art, no
priority difficulty, or (diphthongs) an unbuilt two-panel data model.

See `docs/pronunciation/SOUND_ASSET_RESEARCH.md` §Cards for the artwork
extraction, licensing and IPA-masking record, and §12 of
`LOCAL_ASSET_VERIFICATION_RESULTS.md`-adjacent
`LOCAL_ASSET_EXECUTION_PLAN.md` history for how the legacy per-sound diagram
system (§10–12 above) now sits underneath the cards as a fallback, unchanged.

---

## Summary

| Question | Answer |
|---|---|
| FINAL TECHNICAL PHONE COUNT | **39** (unchanged, fixed by the model) |
| FINAL STUDENT TEACHING TARGET COUNT | **24** (18 consonants, 6 vowels, 0 diphthongs) — grew from 18 on 2026-09-17 when supplied artwork covered 6 more; see §15 |
| FINAL IMAGE COUNT | **Primary: 48** (24 sounds × 2 locales, the supplied teaching cards, all `AVAILABLE`). **Legacy fallback: 23** distinct per-sound diagram paths (`VOWEL_STRUT`/`VOWEL_SCHWA` share one, `R`/`VOWEL_ER` share one), 16 of 23 `AVAILABLE`, used only if a locale's card is ever unusable. |
| SOUNDS THAT NEEDED CODE CHANGES | Original 18: `VOWEL_STRUT` (rename + stress routing), `VOWEL_SCHWA` (new), `VOWEL_ER` (new), `F` (new), `TH_VOICELESS`/`TH_VOICED` (labels only) — all implemented, §12. Plus `T`, `D`, `K`, `G`, `S`, `Z` (new, §15) and a new `card` field + `usableCard()` gate + card-priority rendering, all implemented. |
| CAN ASSET COLLECTION START? | Images: **done** — every one of the 24 targets has a licence-clear, `AVAILABLE` card in both locales. Audio: still blocked, and not by network access — genuine isolated-phoneme verification requires listening to a candidate at its source, which no phase of this work could do with confidence. |
