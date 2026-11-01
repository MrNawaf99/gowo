# English sound inventory research — Study Mode Pronunciation

Research phase only. **No assets were collected**; see §12 and §13 for why.

Machine-readable companion: [`soundAssets.manifest.json`](./soundAssets.manifest.json).

---

## 0. Research conditions (read this before trusting §9–§11)

This session runs behind a network egress proxy that permits only
`raw.githubusercontent.com`, package registries, and Anthropic-side web
**search**. Direct page fetches are refused:

| Host | Result |
|---|---|
| `en.wikipedia.org`, `commons.wikimedia.org`, `upload.wikimedia.org` | `EGRESS_BLOCKED` / no route |
| `github.com` (HTML), `codeload.github.com` | HTTP 403 |
| `alic.sites.unlv.edu`, `openstax.org`, `pressbooks.pub`, `seeingspeech.ac.uk`, `enunciate.arts.ubc.ca`, `internationalphoneticassociation.org`, `zenodo.org`, `figshare.com` | no route |
| `raw.githubusercontent.com` | **200** (works, but needs an exact owner/repo/path) |

Consequences, stated plainly:

- **§1–§8 are solid.** The inventory decision rests on evidence inside this
  repository, which is directly verifiable, cross-checked against web search
  results.
- **§9–§11 are leads, not verified sources.** Every licence claim there comes
  from a search-result summary. None was confirmed at its origin, because the
  origin could not be opened. Per the task's own rule — *"do not rely on
  search-result snippets"* — **nothing in §9 may be classified `SAFE_TO_USE`
  today.** All candidates are `NEEDS_LICENSE_REVIEW`.

---

## 1. Academic basis

The question "how many English phonemes are there?" has no single answer, and
sources genuinely disagree. The disagreement is real and is documented here
rather than resolved silently.

| Source | Type | Consonants | Vowels | Total | Variety |
|---|---|---|---|---|---|
| [ARPAbet / CMU Pronouncing Dictionary](http://www.speech.cs.cmu.edu/cgi-bin/cmudict) | Computational phonetic standard | 24 | 15 | **39** | General American |
| [ARPABET reference](https://en.wikipedia.org/wiki/ARPABET) | Encyclopaedic summary of the ARPA standard | 24 | 15 | 39 | General American |
| [UNLV, *Analyzing Language in Context*, ch. 11.4 / 11.5](https://alic.sites.unlv.edu/chapter-11-4-consonants/) | University OER | 24 | varies | — | General American |
| [Global Speech Therapy — GA consonants / vowels](https://globalspeechtherapy.com/consonants-of-general-american-english/) | Clinical teaching resource | 24 | 15–16 | — | General American |
| Common ELT/RP teaching charts | Teaching convention | 24 | 20 | **44** | Received Pronunciation |
| [*How Many Phonemes Does the English Language Have?*](https://www.researchgate.net/publication/321151067_How_Many_Phonemes_Does_the_English_Language_Have) | Journal article | 24 | 11 | 35 | argues the 44 figure misanalyses the vowel system |

**Where the disagreement comes from.** Consonants are stable at 24 across every
source consulted. Vowels are not, for four specific reasons:

1. **Cot–caught merger.** Many General American speakers merge /ɑ/ and /ɔ/.
   CMUdict keeps `AA` and `AO` distinct; merged-dialect descriptions do not.
2. **Schwa.** Whether /ə/ is a phoneme distinct from /ʌ/, or a reduced
   realisation of other vowels, changes the count by one.
3. **R-coloured vowels.** /ɝ/ (stressed, *hurt*) and /ɚ/ (unstressed, *letter*)
   may be one phoneme, two, or analysed as vowel + /ɹ/.
4. **Diphthongs.** /eɪ/ and /oʊ/ are counted as diphthongs by some analyses and
   as tense monophthongs by others; /aɪ aʊ ɔɪ/ are diphthongs in all of them.

The widely quoted **44** is a Received Pronunciation teaching figure, not a
General American one. It includes centring diphthongs (/ɪə eə ʊə/) that do not
exist in rhotic American English. **Mixing it into an en-US system would be an
error**, which is exactly why it is listed above but not selected.

### Phonemes vs allophones vs teaching targets

These three are not the same, and the task rightly asks that they not be
conflated:

- **Phoneme** — contrastive unit. `TH` (/θ/) and `DH` (/ð/) are two phonemes:
  *thigh* ≠ *thy*.
- **Allophone** — predictable variant of one phoneme. Aspirated [pʰ] in *pen*
  vs unaspirated [p] in *spen* is **one** phoneme /p/. GoWord must not count
  these separately, and does not.
- **Teaching target** — a curated subset chosen for a specific learner
  population. GoWord's 15 sound keys are teaching targets, not an inventory
  (§7).

---

## 2. Selected variety and inventory

**General American (en-US), ARPAbet / CMU Pronouncing Dictionary 39-phone set.**

This is not a preference; it is forced by the architecture, and that is the
strongest possible justification:

1. **It is the only inventory the engine can report.** The GOPT model's
   canonical-phone embedding is indexed by
   [`services/pronunciation-gopt/app/phone_ids.json`](../../services/pronunciation-gopt/app/phone_ids.json),
   which contains **exactly 39 pure ARPAbet phones**. A sound outside that table
   can never appear in an assessment result, so an asset for it could never be
   shown.
2. **It matches the configured locale.** `PRONUNCIATION_ASSESSMENT_LOCALES` is
   `["en-US"]`, and ARPAbet was designed for General American.
3. **It matches the lexicon.** Pronunciations come from the LibriSpeech
   dictionary (CMUdict-derived), so the target words teachers type are already
   transcribed in these symbols.
4. **It is academically defensible.** 24 consonants agrees with every source
   consulted; the 15-vowel analysis is a standard General American treatment.

Verified locally — the set partitions cleanly with nothing left over:

```
24 consonants   B CH D DH F G HH JH K L M N NG P R S SH T TH V W Y Z ZH
10 monophthongs AA AE AH AO EH ER IH IY UH UW
 5 diphthongs   AW AY EY OW OY
--------------- 39 total, 0 unclassified
```

**Should diphthongs be listed separately?** Yes. `AW AY EY OW OY` are separate
phonemes in this inventory, they need their own articulation images (a
diphthong is a *movement* between two tongue positions, which a single static
diagram represents poorly), and they are separately reportable by the engine.
They are tagged `"category": "diphthong"` in the manifest.

---

## 3. Consonants (24)

| ARPAbet | IPA | Example | GoWord target |
|---|---|---|---|
| B | b | be | ✅ `B` |
| CH | tʃ | cheese | ✅ `CH` |
| D | d | dee | ❌ |
| DH | ð | thee | ✅ `TH_VOICED` |
| F | f | fee | ❌ |
| G | ɡ | green | ❌ |
| HH | h | he | ❌ |
| JH | dʒ | gee | ✅ `J` |
| K | k | key | ❌ |
| L | l | lee | ✅ `L` |
| M | m | me | ❌ |
| N | n | knee | ❌ |
| NG | ŋ | ping | ❌ |
| P | p | pee | ✅ `P` |
| R | ɹ | read | ✅ `R` |
| S | s | sea | ❌ |
| SH | ʃ | she | ✅ `SH` |
| T | t | tea | ❌ |
| TH | θ | theta | ✅ `TH_VOICELESS` |
| V | v | vee | ✅ `V` |
| W | w | we | ✅ `W` |
| Y | j | yield | ❌ |
| Z | z | zee | ❌ |
| ZH | ʒ | seizure | ❌ |

## 4. Monophthongs (10)

| ARPAbet | IPA | Example | GoWord target |
|---|---|---|---|
| AA | ɑ | odd | ❌ |
| AE | æ | at | ✅ `VOWEL_A_CAT` |
| AH | ʌ / ə | hut / about | ⚠️ `VOWEL_U_CUT` — see §8.1 |
| AO | ɔ | ought | ❌ |
| EH | ɛ | Ed | ❌ |
| ER | ɝ / ɚ | hurt | ❌ — see §8.2 |
| IH | ɪ | it | ✅ `VOWEL_SHORT_I` |
| IY | i | eat | ✅ `VOWEL_LONG_E` |
| UH | ʊ | hood | ❌ |
| UW | u | two | ❌ |

## 5. Diphthongs (5)

| ARPAbet | IPA | Example | GoWord target |
|---|---|---|---|
| AW | aʊ | cow | ❌ |
| AY | aɪ | hide | ❌ |
| EY | eɪ | ate | ❌ |
| OW | oʊ | oat | ❌ |
| OY | ɔɪ | toy | ❌ |

---

## 6. GoWord implementation surveyed

| Concern | Location |
|---|---|
| Engine phone inventory | `services/pronunciation-gopt/app/phone_ids.json` (39) |
| Teaching-target keys | `src/lib/pronunciation/phoneSounds.ts` → `SOUND_KEYS` (15) |
| Phone → target mapping | `src/lib/pronunciation/phoneSounds.ts` → `PHONE_TO_SOUND` |
| Catalogue (labels, examples, tips, assets) | `src/lib/pronunciation/sounds.ts` |
| Asset licence gate | `src/lib/pronunciation/sounds.ts` → `isUsableAsset()` |
| Feedback rendering | `src/components/quiz/PronunciationStudyActivity.tsx` |
| Asset directory + policy | `public/assets/sounds/README.md` |
| Whether sound feedback is shown at all | `src/lib/pronunciation/config.ts` → `soundFeedbackEnabled` (**currently `false`**) |

## 7. Mapping: academic sound → GoWord

15 of 39 phones are teaching targets. **24 have no target**, so a failure on any
of them can only ever produce the word-level lesson.

| ARPAbet | SoundKey | Label | Example | Image status |
|---|---|---|---|---|
| TH | `TH_VOICELESS` | TH sound | think | MISSING |
| DH | `TH_VOICED` | TH sound | this | MISSING |
| R | `R` | R sound | red | MISSING |
| L | `L` | L sound | light | MISSING |
| V | `V` | V sound | very | MISSING |
| W | `W` | W sound | water | MISSING |
| P | `P` | P sound | pen | MISSING |
| B | `B` | B sound | book | MISSING |
| SH | `SH` | SH sound | she | MISSING |
| CH | `CH` | CH sound | chair | MISSING |
| JH | `J` | J sound | jump | MISSING |
| IH | `VOWEL_SHORT_I` | Short I sound | ship | MISSING |
| IY | `VOWEL_LONG_E` | Long E sound | sheep | MISSING |
| AE | `VOWEL_A_CAT` | A sound | cat | MISSING |
| AH | `VOWEL_U_CUT` | U sound | cut | MISSING |

**Unmapped (24):** `K AO T EH Z OW F AY N UW S G AA M NG HH EY D UH AW ER Y OY ZH`

The 15 targets are a defensible Arabic-L1 curriculum: /θ ð/, /p~b/, /v/, /r/,
/l/, /w/, and the *ship–sheep* and *cat–cut* contrasts are the classic
difficulties. This is a **teaching-target list, not an inventory**, and that is
a legitimate design choice — but it should be a recorded decision, not an
accident.

## 8. Problems found in the current mapping

### 8.1 `VOWEL_U_CUT` silently merges schwa with the STRUT vowel — mislabelled

> **Superseded by [`TEACHING_INVENTORY_DECISION.md`](./TEACHING_INVENTORY_DECISION.md) §3.**
> Two claims below are corrected there: `AH2` is **STRUT**, not schwa (only
> `AH0` is schwa — verified in the LibriSpeech lexicon: `ADJUNCT AE1 JH AH2 NG
> K T`), and `purePhone()` is not where the stress digit is lost — the service
> response already carries pure phones.

`purePhone()` strips the stress digit (`src/lib/pronunciation/phoneSounds.ts`),
and in CMUdict the stress digit on `AH` **carries the vowel quality**:
`AH1` → /ʌ/ (*cut*), `AH0`/`AH2` → /ə/ (*about*). Verified in code:

```
AH0 -> purePhone=AH -> VOWEL_U_CUT     (this is schwa, not "cut")
AH1 -> purePhone=AH -> VOWEL_U_CUT     (this is /ʌ/, correct)
```

Schwa is the most frequent vowel in English, so **most** `AH` failures are
schwa, yet the student would be told to work on the *"U sound as in cut"* and
shown a /ʌ/ mouth position. The fix is to keep the stress digit for `AH` and
split the target, or to relabel the target so it is honest for both. **Do not
commission a `VOWEL_U_CUT` image until this is decided** — the correct
articulation differs.

### 8.2 `ER` is unmapped although `R` is a teaching target

/ɝ ɚ/ (*hurt*, *letter*) is a distinct phoneme and a well-known difficulty for
Arabic-L1 learners. `R` is taught but the r-coloured vowel is not, so a student
failing *bird* gets no sound lesson. Highest-value addition.

### 8.3 `F` is not a target while `V` is

/f/–/v/ is a minimal pair and a standard confusion. Teaching only the voiced
half is asymmetric. (`F` existed in the pre-fix catalogue but was never
reachable — no phone mapped to it.)

### 8.4 Two distinct phonemes share the label "TH sound"

`TH_VOICELESS` and `TH_VOICED` both render as *"TH sound"*, separated only by
the example word. The English-label rule is correct and must stay, but the
labels need to distinguish themselves, e.g. *"TH sound (think)"* vs
*"TH sound (this)"*.

### 8.5 No duplicates or incorrect phone→key mappings otherwise

Every one of the 15 mappings is 1:1 and phonetically correct. There is no
allophone counted as a phoneme.

---

## 9. Image source candidates — **ALL UNVERIFIED**

> None of these was opened. Every licence statement below came from a search
> summary. All are `NEEDS_LICENSE_REVIEW` until confirmed at the source.

### 9.1 Wright & McCloy IPA sagittal sections — **best lead**

- **What:** a complete, single-style set of mid-sagittal vocal-tract SVGs
  covering IPA consonants *and* vowels.
- **Reported origin:** Richard Wright and Dan McCloy, Linguistics 450/550,
  University of Washington, 2011-09-23; uploaded to GitHub by Dan McCloy
  (GitHub user `drammock`) on 2023-06-13.
- **Reported licence:** CC0 (public domain dedication) — would permit
  commercial use with no attribution required.
- **Mirror:** [Wikimedia Commons, `Category:Articulation place diagrams`](https://commons.wikimedia.org/wiki/Category:Articulation_place_diagrams);
  example file pages
  [IPA n](https://commons.wikimedia.org/wiki/File:IPA_n_Sagittal_Section.svg),
  [IPA ð](https://commons.wikimedia.org/wiki/File:IPA_%C3%B0_Sagittal_Section.svg),
  [IPA i](https://commons.wikimedia.org/wiki/File:IPA_i_Sagittal_Section.svg).
- **Why it suits GoWord:** one consistent visual style across the whole
  inventory (the task rightly prefers this over mixing styles); SVG scales to
  any size and recolours for the dark theme; shows tongue, teeth, lips and palate
  in profile; no IPA symbol burned into the artwork, so nothing violates the
  "no IPA to students" rule.
- **Blocked because:** the exact repository name is unknown. `github.com` HTML
  is 403 and the GitHub API is scoped to this session's own repository, so it
  could not be listed. Probing 12 plausible names under `drammock/` returned
  nothing. `raw.githubusercontent.com` **does** work, so once the repo name and
  paths are known the files can be fetched directly.
- **Must still be checked:** the repository's actual LICENSE file; whether the
  CC0 dedication covers every file; per-file Commons licence tags; image
  dimensions; whether vowels and diphthongs are covered as well as consonants.

### 9.2 Interactive Sagittal Section ("Sammy")

- [https://incl.pl/sammy/](https://incl.pl/sammy/) — interactive articulator
  diagram, could in principle export static positions.
- **Licence unknown.** Not investigated further.

### 9.3 *Essentials of Linguistics* (OER textbook)

- [open.maricopa.edu](https://open.maricopa.edu/essentialsoflinguistics/chapter/2-3-articulators/) ·
  [ecampusontario.pressbooks.pub](https://ecampusontario.pressbooks.pub/essentialsoflinguistics/chapter/2-3-articulators/)
- Openly licensed textbook (Creative Commons; **exact variant unconfirmed** — if
  it is BY-NC, it is unusable for a commercial product).
- Contains articulator diagrams, but likely as illustrations of anatomy rather
  than a per-phoneme set.

### 9.4 Rejected without further work

- Quizlet decks of sagittal diagrams — redistributions with no licence of their
  own. `NOT_SUITABLE`.
- Any general image-search result. `NOT_SUITABLE`.

## 10. Licensing status

| Candidate | Classification | Blocker |
|---|---|---|
| Wright & McCloy sagittal SVGs | `NEEDS_LICENSE_REVIEW` | Repo not locatable; CC0 claim unconfirmed at source |
| Sammy (incl.pl) | `NEEDS_LICENSE_REVIEW` | No licence information seen |
| *Essentials of Linguistics* figures | `NEEDS_LICENSE_REVIEW` | CC variant unconfirmed; NC would disqualify |
| Everything else | `NOT_SUITABLE` | No traceable licence |

**Zero assets qualify as `SAFE_TO_USE` at this time.**

## 11. Attribution requirements

Cannot be stated. CC0 would require none; CC BY would require a specific line.
Neither is confirmed. The manifest's attribution fields are `null` rather than
guessed.

## 12. Asset download locations

**Nothing was downloaded.** `public/assets/sounds/` is unchanged and still
contains only its policy `README.md`. Every `articulationImage.status` in the
manifest is `MISSING`.

Reserved paths for the 15 current targets are already declared in
`src/lib/pronunciation/sounds.ts` (`/assets/sounds/<key>.svg`). The existing flat
layout is kept — the per-sound subdirectory scheme sketched in the task brief is
not needed for one image per sound, and the task says not to invent a new
architecture unless necessary. No existing file was touched or overwritten.

## 13. Unresolved gaps

1. **The whole asset-collection phase is blocked by the network policy.**
   Wikimedia (both the wiki and the image host), `github.com`, and every
   university/OER host are unreachable from this environment. Licences cannot be
   verified at source, so nothing may be downloaded under the project's own
   asset policy.
2. **The Wright & McCloy repository name is unknown**, and it is the single
   highest-value lead.
3. **`AH` (§8.1) must be resolved before any image is commissioned or chosen**
   for `VOWEL_U_CUT`.
4. **Inventory scope is undecided:** assets for 15 teaching targets, or all 39
   phones? This changes the sourcing effort by ~2.5×.
5. **Diphthong images are conceptually hard.** A static mid-sagittal section
   shows one tongue position; a diphthong is a movement. A two-panel
   (start → end) treatment is probably needed, which most sets do not provide.
6. **Isolated-sound audio is entirely out of scope here** and remains
   unsourced. Per the brief, GoWord's TTS must **not** be used for it — TTS
   would read the words *"TH sound"*, not produce /θ/.

## 14. Recommendations for the next phase

1. **Unblock the network or run locally.** Allow-list
   `commons.wikimedia.org`, `upload.wikimedia.org` and `github.com`, or run the
   collection step from a normal workstation. Everything else here is ready.
2. **Locate and verify the Wright & McCloy set first.** Open
   `https://github.com/drammock?tab=repositories`, find the sagittal-sections
   repository, read its `LICENSE`, and confirm the CC0 tag on two or three
   Commons file pages. If CC0 holds, this single set likely covers the whole
   inventory in one consistent style — the best possible outcome.
3. **Decide §8.1 (`AH`) before sourcing vowel images**, and fold in §8.2 (`ER`),
   §8.3 (`F`) and §8.4 (TH labels). These are inventory decisions; asset work
   depends on them.
4. **Fetch via `raw.githubusercontent.com`**, which is reachable, once exact
   paths are known.
5. **Record every asset through the existing gate.** Set `status: "AVAILABLE"`
   with full `provenance` in `sounds.ts`, mirror it into the manifest, and let
   `isUsableAsset()` decide. A file on disk alone still shows nothing.
6. **Keep both gates in mind.** Even with perfect assets, no sound lesson
   appears until `soundFeedbackEnabled` is turned on — and that is blocked on
   Arabic-L1 attribution validation (`services/pronunciation-gopt/LIMITATIONS.md`
   §2). Assets are necessary but not sufficient.

---

## Sources

All consulted via web search; **none could be opened directly** (§0).

- [The CMU Pronouncing Dictionary](http://www.speech.cs.cmu.edu/cgi-bin/cmudict)
- [ARPABET](https://en.wikipedia.org/wiki/ARPABET)
- [CMU Pronouncing Dictionary](https://en.wikipedia.org/wiki/CMU_Pronouncing_Dictionary)
- [UNLV — *Analyzing Language in Context*, ch. 11.4 Consonants](https://alic.sites.unlv.edu/chapter-11-4-consonants/)
- [UNLV — *Analyzing Language in Context*, ch. 11.5 Vowels](https://alic.sites.unlv.edu/chapter-11-5-vowels/)
- [Global Speech Therapy — Consonants of General American English](https://globalspeechtherapy.com/consonants-of-general-american-english/)
- [Global Speech Therapy — Vowels of General American English](https://globalspeechtherapy.com/vowels-of-general-american-english/)
- [*How Many Phonemes Does the English Language Have?*](https://www.researchgate.net/publication/321151067_How_Many_Phonemes_Does_the_English_Language_Have)
- [CMUdict phone/stress notes (aparrish)](https://github.com/aparrish/gen-text-workshop/blob/master/cmu_pronouncing_dictionary_notes.md)
- [cmudict-ipa — AH1 → ʌ, AH0/AH2 → ə](https://github.com/menelik3/cmudict-ipa)
- [Wikimedia Commons — Category:Articulation place diagrams](https://commons.wikimedia.org/wiki/Category:Articulation_place_diagrams)
- [Wikimedia Commons — File:IPA n Sagittal Section.svg](https://commons.wikimedia.org/wiki/File:IPA_n_Sagittal_Section.svg)
- [Dan McCloy (drammock) — GitHub repositories](https://github.com/drammock?tab=repositories)
- [Interactive Sagittal Section (Sammy)](https://incl.pl/sammy/)
- [*Essentials of Linguistics* — 2.2 Articulators](https://open.maricopa.edu/essentialsoflinguistics/chapter/2-3-articulators/)

Primary in-repo evidence (directly verified):

- `services/pronunciation-gopt/app/phone_ids.json` — the 39-phone table
- `services/pronunciation-gopt/app/phone_ids.md` — how it was derived
- `src/lib/pronunciation/phoneSounds.ts` — `SOUND_KEYS`, `PHONE_TO_SOUND`, `purePhone()`
- `src/lib/pronunciation/sounds.ts` — catalogue and `isUsableAsset()`
