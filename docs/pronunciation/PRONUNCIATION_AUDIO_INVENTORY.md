# Pronunciation Audio Inventory

Isolated teaching-audio research for Study Mode — Pronunciation.
Researched 2026-09-17 from a cloud session. **Research only — no audio was
downloaded into the project, no catalogue or manifest entry changed,
`soundFeedbackEnabled` remains `false`.**

This supersedes the audio sections (§8–§9) of
[`CLOUD_ASSET_RESEARCH_RESULTS.md`](./CLOUD_ASSET_RESEARCH_RESULTS.md), which
remains the authority for **image** assets.

---

## 0. Two things to read before the tables

### 0.1 The repository does not match the stated inventory

The brief states the official inventory is **24 targets** and that the card
system landed in commit `448e4e4`. Checked against the repository, which the
brief correctly names as the source of truth:

| Claim | Repository |
|---|---|
| Commit `448e4e4` | **Does not exist.** `git cat-file -t 448e4e4` → *not a valid object name*, after `git fetch --all` across all three branches (`main`, `claude/goword-repo-inspection-fsd88q`, `claude/pronunciation-phonetic-review-f0840d`). |
| 24 teaching targets | **18.** `SOUND_KEYS` in `src/lib/pronunciation/phoneSounds.ts`. |
| `T D K G S Z` as first-class targets | **Absent** from `SOUND_KEYS`, the catalogue and the manifest. |
| 48 teaching cards (24 × 2 locales) | **No card system exists.** No match for `SoundTeachingCard`, `TeachingCard`, `cardEn`/`cardAr` anywhere in `src/` or `docs/`. |
| Six new vowel card images | Not present. |

So the card work is **not in this repository** — it is presumably local and
unpushed on the laptop, or on a fork this session cannot see.

**How this research is scoped in response.** The 24-target inventory is a
product decision and researching audio for 24 costs nothing more than 18, so
**this document covers all 24**, with the six not-yet-in-code targets marked
`NOT IN CODE`. No `SoundKey`, catalogue entry or manifest row was changed — the
brief forbids it, and inventing the six keys here would create exactly the
drift the catalogue tests exist to catch.

### 0.2 Nothing was heard

This environment has no audio output and no human listener. Every identity claim
below is either **measured** (signal analysis, stated as such) or **unverified**.
Filename and metadata claims are treated as claims, never as verification.

Network this session: `api.github.com` and `raw.githubusercontent.com` reachable;
`commons.wikimedia.org`, `upload.wikimedia.org`, `freesound.org`, `archive.org`,
`openslr.org` and `phonetics.ucla.edu` all unreachable. **No licence could be
verified at its origin, so nothing is `AVAILABLE`.**

---

## 1. Scope

**24 audio targets** — one isolated recording per teaching target.

The count is *not* reduced by shared assets. `VOWEL_STRUT` and `VOWEL_SCHWA`
share one articulation **image** slot (same mouth position) but have **separate
audio** slots, because they are different sounds. Confirmed in the catalogue:
`vowel-strut.mp3` and `vowel-schwa.mp3` are distinct paths.

Current state in code: 18 slots declared, **all 18 `MISSING`**. Zero audio files
exist in `public/assets/sounds/` (11 SVGs and a README only).

| Group | Targets | In code |
|---|---|---|
| Stops | P B T D K G | P, B only |
| Fricatives | F V TH_VOICELESS TH_VOICED S Z SH | F V TH_VOICELESS TH_VOICED SH |
| Affricates | CH J | both |
| Approximants / lateral | L R W | all three |
| Vowels | VOWEL_SHORT_I VOWEL_LONG_E VOWEL_A_CAT VOWEL_ER VOWEL_SCHWA VOWEL_STRUT | all six |

---

## 2. Inventory table

`Isolated?` answers: is the recording the sound *alone*? Where it says
**measured**, that is signal analysis performed this session (§3.2), not a guess
and not listening.

| SoundKey | Sound | Audio Required | Status | Candidate Source | License | Isolated? | Confidence | Notes |
|---|---|---|---|---|---|---|---|---|
| `P` | /p/ | Yes | `MISSING` | Commons *Voiceless bilabial plosive* | CC BY-SA 3.0 (reported) | **No — vowel frame (measured on the consonant set)** | Low | Consonant set is framed, not isolated |
| `B` | /b/ | Yes | `MISSING` | Commons *Voiced bilabial plosive* | CC BY-SA 3.0 (reported) | **No — vowel frame** | Low | |
| `T` | /t/ | Yes | `MISSING` | Commons *Voiceless alveolar plosive* | CC BY-SA 3.0 (reported) | **No — measured: voiced-unvoiced-voiced, 1.55 s** | Low | NOT IN CODE |
| `D` | /d/ | Yes | `MISSING` | Commons *Voiced alveolar plosive* | CC BY-SA 3.0 (reported) | **No — vowel frame** | Low | NOT IN CODE |
| `K` | /k/ | Yes | `MISSING` | Commons *Voiceless velar plosive* | CC BY-SA 3.0 (reported) | **No — measured: 1.56 s framed** | Low | NOT IN CODE |
| `G` | /ɡ/ | Yes | `MISSING` | Commons *Voiced velar plosive* | CC BY-SA 3.0 (reported) | **No — vowel frame** | Low | NOT IN CODE |
| `F` | /f/ | Yes | `MISSING` | Commons *Voiceless labiodental fricative* | CC BY-SA 3.0 (reported) | **No — measured: 1.59 s framed** | Low | |
| `V` | /v/ | Yes | `MISSING` | Commons *Voiced labiodental fricative* | CC BY-SA 3.0 (reported) | **No — vowel frame** | Low | |
| `TH_VOICELESS` | /θ/ | Yes | `MISSING` | Commons *Voiceless dental fricative* | CC BY-SA 3.0 (reported) | **No — measured: 1.81 s framed** | Low | Must not be swapped with `TH_VOICED` |
| `TH_VOICED` | /ð/ | Yes | `MISSING` | Commons *Voiced dental fricative* | CC BY-SA 3.0 (reported) | **No — measured: 1.89 s framed** | Low | Must not be swapped with `TH_VOICELESS` |
| `S` | /s/ | Yes | `MISSING` | Commons *Voiceless alveolar sibilant* | CC BY-SA 3.0 (reported) | **No — vowel frame** | Low | NOT IN CODE |
| `Z` | /z/ | Yes | `MISSING` | Commons *Voiced alveolar sibilant* | CC BY-SA 3.0 (reported) | **No — vowel frame** | Low | NOT IN CODE |
| `SH` | /ʃ/ | Yes | `MISSING` | Commons *Voiceless palato-alveolar sibilant* | CC BY-SA 3.0 (reported) | **No — vowel frame** | Low | |
| `CH` | /tʃ/ | Yes | `MISSING` | Commons *Voiceless palato-alveolar affricate* | CC BY-SA 3.0 (reported) | Unknown | Low | **Affricate-identity risk — §6** |
| `J` | /dʒ/ | Yes | `MISSING` | Commons *Voiced palato-alveolar affricate* | CC BY-SA 3.0 (reported) | Unknown | Low | **Affricate-identity risk — §6** |
| `L` | /l/ | Yes | `MISSING` | Commons *Voiced alveolar lateral approximant* | CC BY-SA 3.0 (reported) | **No — vowel frame** | Low | |
| `R` | /ɹ/ | Yes | `MISSING` | Commons *Voiced alveolar approximant* | CC BY-SA 3.0 (reported) | **No — vowel frame** | Low | Commons file is IPA /ɹ/, not necessarily GA rhotic quality |
| `W` | /w/ | Yes | `MISSING` | Commons *Voiced labial-velar approximant* | CC BY-SA 3.0 (reported) | **No — vowel frame** | Low | |
| `VOWEL_SHORT_I` | /ɪ/ | Yes | `MISSING` | Commons *Near-close near-front unrounded vowel* | CC BY-SA 3.0 (reported) | **Yes — measured: isolated, sustained** | Medium | **Cardinal, not GA — §3.3** |
| `VOWEL_LONG_E` | /i/ | Yes | `MISSING` | Commons *Close front unrounded vowel* | CC BY-SA 3.0 (reported) | **Yes — measured** | Medium | **Cardinal, not GA.** GA /i/ is diphthongal [ɪi] |
| `VOWEL_A_CAT` | /æ/ | Yes | `MISSING` | Commons *Near-open front unrounded vowel* | CC BY-SA 3.0 (reported) | **Yes — measured** | Medium | **Cardinal, not GA** |
| `VOWEL_SCHWA` | /ə/ | Yes | `MISSING` | Commons *Mid-central vowel* | CC BY-SA 3.0 (reported) | **Yes — measured** | Medium | Must not be swapped with STRUT |
| `VOWEL_STRUT` | /ʌ/ | Yes | `MISSING` | **none found** | — | — | — | **No /ʌ/ file in the Commons vowel set — §5** |
| `VOWEL_ER` | /ɝ/ | Yes | `MISSING` | **none found** | — | — | — | **No rhotic vowel file. `ɜ` exists and is the WRONG (non-rhotic) vowel — §5** |

**Counts: `AVAILABLE` 0 · `UNVERIFIED` 0 · `MISSING` 24.**

Everything is `MISSING` rather than `UNVERIFIED` because no candidate has both a
verified licence *and* a plausible identity: the consonant candidates are
measurably not isolated, the vowel candidates are cardinal rather than GA, and
two targets have no candidate at all.

---

## 3. Evidence gathered this session

### 3.1 What was examined

GitHub is the only reachable host, so the two GitHub-hosted phoneme-audio
collections were cloned and inspected directly:

| Repo | HEAD | Contents | LICENSE file | Upstream |
|---|---|---|---|---|
| [`151henry151/ipa-chart`](https://github.com/151henry151/ipa-chart) | `2b29830` | 246 `.wav` | **None** | Scraped from `phonetics.ucla.edu/course/chapter1/` — the repo contains `clone_ucla_ipa.py` with `BASE_URL = "https://phonetics.ucla.edu/course/chapter1/chapter1.html"` |
| [`joshstephenson/PhoneticFlashCards`](https://github.com/joshstephenson/PhoneticFlashCards) | `0fb0513` | 196 `.mp3` (22 consonants, 28 vowels) | **None** | README: *"downloaded from wikipedia with their original filenames"*, via `ripper.py` |

**Both are rejected as sources.** Neither carries a licence, both are
redistributions, and the brief is explicit that GitHub files with unclear
licence or source are not acceptable. They were used **only as evidence about
what the upstream recordings are**, which is legitimate research and is why the
measurements below exist.

The second repo preserves Commons filenames verbatim, which is what allowed the
upstream Commons files to be identified precisely without reaching Commons.

### 3.2 Measured: the Commons consonant recordings are **not isolated**

Signal analysis (frame-wise autocorrelation periodicity in a 70–320 Hz F0 band,
30 ms frames / 10 ms hop, silence-trimmed) on the preserved Commons copies.
`#` = voiced frame, `.` = unvoiced, each character ≈ 30 ms:

| Claimed identity | Duration | Profile |
|---|---|---|
| /θ/ voiceless dental fricative | 1.81 s | `########............#.#.##.#...#.#..#........#######...` |
| /ð/ voiced dental fricative | 1.89 s | `#######.#.#.#.............####..#####################...` |
| /t/ voiceless alveolar plosive | 1.55 s | `.########....#.........#.....#..##.#.#######.......` |
| /k/ voiceless velar plosive | 1.56 s | `.########.#..#.#....#.#..#...........#######.......` |
| /f/ voiceless labiodental fricative | 1.59 s | `......###....#........#...#.............####.....#..` |

Every file shows the same shape — **a voiced block, an unvoiced stretch, another
voiced block, over 1.5–1.9 seconds**. That is a consonant in a vowel frame
(an `[aCa]`-type citation form), not the consonant alone. An isolated /θ/ would
be a single unvoiced stretch of a few hundred milliseconds.

This is the answer to the brief's question 9 for the whole consonant set, and it
is the opposite of what the filenames imply. Previous sessions recorded
`Isolated? Unknown`; it is now measured.

**A corollary worth stating:** because every consonant file contains vowel
material, a naive voicing check on the whole file cannot verify voicing identity.
Measured median periodicity put the voiced member above its voiceless partner in
all four pairs tested (θ 0.44 < ð 0.54; t 0.46 < d 0.52; k 0.50 < g 0.60;
f 0.42 < v 0.43) — but there is **no global threshold**, because voiceless /k/
(0.50) outscores voiced /v/ (0.43). Any automated voicing check must first
segment out the frame vowels. §8 turns this into a usable procedure.

### 3.3 Measured: the Commons vowel recordings **are** isolated — but cardinal

| File | Duration | % voiced frames |
|---|---|---|
| Close-mid back unrounded /ɤ/ | 0.60 s | 84% |
| Close-mid central rounded /ɵ/ | 0.31 s | 96% |
| Close-mid central unrounded /ɘ/ | 0.46 s | 93% |
| Close-mid front rounded /ø/ | 0.57 s | 93% |
| Close back rounded /u/ | 0.61 s | 100% |

Short, continuously voiced, no frame — genuinely isolated sustained vowels.

But the naming is the **IPA cardinal vowel** scheme ("Close-mid back unrounded
vowel", "Near-open front unrounded vowel"), and the set spans the full cardinal
inventory including /ɶ ɞ ʏ ɐ ä/ — sounds English does not have. These are a
phonetician demonstrating the IPA chart, **not a General American speaker
producing English vowels**. For /ɪ æ ə/ the cardinal value is close enough to be
arguable; for `VOWEL_LONG_E` it is not — GA /i/ in *sheep* is noticeably
diphthongal [ɪi], while cardinal [i] is a pure steady vowel. Using cardinal
recordings would teach a vowel quality GoWord's own assessor was not calibrated
on.

**This is a product decision, not a technical one**, and it needs to be made
before any vowel audio is adopted.

---

## 4. `AVAILABLE` (verified)

**None.** No audio asset is verified. Zero files exist in the project.

A source reaches `AVAILABLE` only when all of these hold, and none does today:

1. Licence read at the original file page (Commons is unreachable).
2. Commercial use and redistribution permitted, attribution requirement recorded.
3. Identity confirmed by a human listening to the file.
4. Isolation confirmed — the sound alone, or a frame GoWord has explicitly decided to accept.
5. Variety confirmed appropriate for en-US / General American.

---

## 5. `MISSING` — no acceptable source found

All 24 are `MISSING`. Two are worse than the rest, because no candidate exists
at all:

### `VOWEL_STRUT` /ʌ/
The Commons vowel set inspected contains no open-mid back unrounded vowel. The
nearest files are `ɐ` (near-open central) and `ɜ` (open-mid central) — **neither
is /ʌ/**. Substituting either would teach the wrong vowel, and `ɐ`/`ɜ` are
exactly the sounds /ʌ/ is confused with.

### `VOWEL_ER` /ɝ/
No rhotic vowel file exists in the set. **`Open-mid_central_unrounded_vowel_ɜ`
is present and is the specific trap the brief warns about** — /ɜ/ is the
**British non-rhotic** vowel of *bird*. It has no r-colouring, it is not the GA
target, and its filename is close enough to be picked up by mistake.

> **Hard rule for the implementation phase: `VOWEL_ER` must never be filled with
> a /ɜ/ or /ɜː/ recording.** An acceptable file must carry audible r-colouring
> throughout.

This mirrors the identical rule already recorded for the ER *image*
(`vowel-mid-central.svg` must not be reused for `VOWEL_ER`).

---

## 6. CH and J — affricate identity

Neither cloned repo contains **any** affricate file, so nothing could be
measured for `CH` or `J`. They remain the least-evidenced targets.

The risk is unchanged and specific. Commons carries several affricates under
near-identical names:

| Commons name | IPA | Is it English CH/J? |
|---|---|---|
| Voiceless **palato-alveolar** affricate | /tʃ/ | ✅ **This is CH** |
| Voiced **palato-alveolar** affricate | /dʒ/ | ✅ **This is J** |
| Voiceless **alveolo-palatal** affricate | /tɕ/ | ❌ Mandarin/Polish |
| Voiceless **alveolar** affricate | /ts/ | ❌ German *z*, Italian *zz* |
| Voiceless **palatal** affricate | /cç/ | ❌ Not English |
| Voiceless palato-alveolar **sibilant** | /ʃ/ | ❌ That is `SH`, not `CH` |

Two further checks a listener must make, beyond picking the right filename:

- **Affricate, not cluster.** A recording of [t] then [ʃ] as two segments is not
  /tʃ/. A genuine affricate has one closure with a fricated release.
- **Affricate, not fricative.** Confirm an audible stop closure precedes the
  frication; without it the file is just `SH`/`ZH`.

Given that every other consonant file in the set proved to be vowel-framed, the
affricate files are very likely framed too. Assume so until heard.

---

## 7. Whole word vs isolated sound

The catalogue models `isolatedSoundAudio` as a single slot per sound and has no
field for an example-word recording, so **the architecture does not currently
support word examples** in the sound lesson.

Therefore, per the brief: **a whole-word recording is `NOT SUITABLE`** for these
slots. It must not be substituted.

Note the separate, already-built path for word audio: teacher target words get
reference audio from the project's own licensed TTS via
`POST /api/study/pronunciation/words/audio`, stored under `study_pronunciation/`.
That is a different feature with a different purpose. **GoWord's TTS must not be
used for these phoneme slots** — asked for "TH sound" it produces the English
words *T-H sound*, which teaches nothing about /θ/.

The vowel-frame recordings measured in §3.2 sit between "isolated" and "word".
They are not words, and a consistent `[aCa]` frame is a legitimate teaching
convention. Whether GoWord accepts that is a product decision (§9, step 2).

---

## 8. Licensing

| Source | Licence | Verified at origin? | Usable today |
|---|---|---|---|
| Wikimedia Commons IPA phonetic samples | CC BY-SA 3.0 (+ GFDL) **reported**, per-file | ❌ Commons unreachable | No |
| `151henry151/ipa-chart` | **No licence file** | ✅ checked in the clone | **No — rejected** |
| `joshstephenson/PhoneticFlashCards` | **No licence file** | ✅ checked in the clone | **No — rejected** |
| UCLA Phonetics Lab (upstream of the above) | Unknown | ❌ host unreachable | No |
| GoWord TTS | Owned | n/a | **Prohibited for phonemes** (§7) |

**If Commons CC BY-SA audio is adopted, it changes the product, not just the
files.** Attribution must be rendered wherever the clip is used — creator,
licence link, and whether changes were made — which means a visible credit line
in the student player. Share-alike also binds any edit: trimming a frame vowel
off a recording creates an adaptation that must itself be CC BY-SA.

That contrasts sharply with the articulation images, which are CC0 and carry no
obligation at all. Mixing a CC BY-SA audio track into a CC0 image set is a
deliberate choice and should be made explicitly.

---

## 9. Arabic-L1 status

**Unchanged by this work, and unrelated to it.** Recorded here only to keep the
two tracks from being confused.

What is known:

- `PRONUNCIATION_SCORING_POLICY.soundFeedbackEnabled` is **`false`**
  (`src/lib/pronunciation/config.ts:77`), so no sound lesson — and therefore no
  phoneme audio — reaches a student today regardless of assets.
- The blocker is documented in `services/pronunciation-gopt/LIMITATIONS.md` §2:
  GOPT's **phone-level attribution is weaker than its word-level verdict**. A
  word can fail correctly while the phone reported as the problem is not the one
  a human would name (`CALIBRATION.md` §4: humans mark TH wrong in
  *three*; GOPT scores TH 83 and IY 34, so the issue is reported on IY).
- Thresholds are `status: "provisional"` because speechocean762 is mostly
  **Mandarin-L1** speakers reading sentences, while GoWord students are
  **Arabic-L1** saying isolated words.

What remains unresolved:

- **No Arabic-L1 recordings have been collected.** The recording script exists
  (`services/pronunciation-gopt/fixtures/RECORDING_SCRIPT.md`); the data does not.
- Until that set is recorded and scored, neither the pass thresholds nor the
  phone attribution can be validated for the actual student population.

**No Arabic-L1 data was invented, and none is implied by this document.**
Audio assets do not unblock `soundFeedbackEnabled`; it has two independent
gates, and this is the other one.

---

## 10. Recommended next implementation step

Not "download the Commons set". The evidence says that would ship framed
consonants and cardinal vowels into an en-US teaching product.

**Step 1 — resolve the inventory discrepancy (blocking).** Establish where the
24-target card work lives. Until `SOUND_KEYS` actually contains `T D K G S Z`,
six of the targets in §2 have nowhere to attach. This is a five-minute check on
the laptop and everything downstream depends on it.

**Step 2 — make two product decisions (blocking, and cheap).**

1. **Are vowel-framed consonant recordings acceptable?** If yes, the Commons
   consonant set becomes viable and the work is licence verification plus
   listening. If no, the consonants need a different source or a recording
   session.
2. **Are cardinal vowels acceptable for teaching GA?** If no — and for
   `VOWEL_LONG_E` there is a real argument they are not — the six vowels need a
   GA speaker regardless of what happens with the consonants.

Neither needs more research. They need someone to decide.

**Step 3 — if Commons is chosen, verify properly.** For each file, at its
Commons file page: read the licence template, record creator and attribution
text, then **listen** and confirm identity, isolation, and for CH/J that it is a
palato-alveolar affricate rather than /ts/, /tɕ/, /cç/ or a plain fricative.
Only then may a slot become `AVAILABLE`, with full provenance in both
`sounds.ts` and the manifest.

**Step 4 — consider commissioning instead.** A single GA speaker recording 24
isolated sounds in one session would give consistent voice, consistent level, a
licence GoWord owns outright, no attribution line in the player, correct GA vowel
quality, and genuinely isolated consonants. Against the alternative — a CC BY-SA
dependency, a visible credit line, share-alike on every edit, framed consonants
and cardinal vowels — that is very likely the cheaper path overall. `VOWEL_STRUT`
and `VOWEL_ER` have no Commons candidate at all, so **some** recording or
commissioning is required no matter which route is taken.

**Step 5 — nothing here touches `soundFeedbackEnabled`.** It stays `false` until
the Arabic-L1 attribution work in §9 is done, independently of audio.

---

## 11. Does human listening remain required?

**Yes, and it cannot be substituted.** Signal analysis established *isolation*
(§3.2, §3.3) and can support a voicing check once frame vowels are segmented out,
but it cannot confirm that a file labelled /tʃ/ contains English CH rather than
/tɕ/, or that an /ɝ/ file carries real r-colouring. Place of articulation and
vowel quality are perceptual judgements.

The measurements narrow what must be listened to; they do not replace it.

---

## Sources

First-hand this session:

- Repository: `SOUND_KEYS` (`src/lib/pronunciation/phoneSounds.ts`), catalogue
  (`src/lib/pronunciation/sounds.ts`), `public/assets/sounds/`,
  `src/lib/pronunciation/config.ts`, `git cat-file` / `git fetch --all`
- [`151henry151/ipa-chart`](https://github.com/151henry151/ipa-chart) @ `2b29830` — cloned, no LICENSE, `clone_ucla_ipa.py` names the UCLA upstream
- [`joshstephenson/PhoneticFlashCards`](https://github.com/joshstephenson/PhoneticFlashCards) @ `0fb0513` — cloned, no LICENSE, README names the Wikipedia upstream; preserved Commons filenames; audio measured with `soundfile` + `numpy`

Consulted, unreachable (leads only, never licence evidence):

- [Commons — File:Voiceless dental fricative.ogg](https://commons.wikimedia.org/wiki/File:Voiceless_dental_fricative.ogg)
- [Commons — File:Voiceless palato-alveolar affricate.ogg](https://commons.wikimedia.org/wiki/File:Voiceless_palato-alveolar_affricate.ogg)
- [UCLA Phonetics Lab — *A Course in Phonetics* chapter 1](https://phonetics.ucla.edu/course/chapter1/chapter1.html)
- [IPA — Sound Recordings](https://www.internationalphoneticassociation.org/content/sound-recordings)
