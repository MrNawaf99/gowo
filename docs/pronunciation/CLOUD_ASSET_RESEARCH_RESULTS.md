# Cloud asset research results

Research and documentation only. **No production asset, manifest entry,
catalogue entry or source file was changed in this session.**

Continues [`MISSING_SOUND_ASSET_RESEARCH.md`](./MISSING_SOUND_ASSET_RESEARCH.md)
(commit `0700ff8`) and opens a second track for isolated phoneme audio.
Researched 2026-09-16 from a cloud session.

---

## 0. What this session could and could not do

Network access was re-tested at the start. It is **narrower** than the session
that downloaded the 11 images:

| Host | This session |
|---|---|
| `api.github.com`, anonymous git reads | **reachable** |
| `raw.githubusercontent.com` | **reachable** |
| `commons.wikimedia.org`, `upload.wikimedia.org`, `en.wikipedia.org` | blocked |
| `freesound.org`, `archive.org`, `zenodo.org`, `openslr.org` | blocked |
| `phonetics.ucla.edu` | 403 |

**Two consequences, stated plainly:**

1. **No audio source could be verified at its origin.** Everything in §7–§9 is a
   researched lead. **Nothing is marked `VERIFIED_SOURCE`.**
2. **Nothing was visually inspected.** No SVG was rendered. Where this document
   makes a claim about a drawing it is from **geometric measurement of the path
   data**, which is stated as such and is *not* a substitute for looking at it.

What the session *could* do first-hand: analyse the cloned CC0 image set
(`drammock/phonetics-teaching-assets`, HEAD `4d02e4a`, `LICENSE` = full CC0 1.0
legal code) in depth. That produced three findings that change earlier
recommendations — §1, §3 and §6.

### How the drawings are built (measured, and it underpins everything below)

Every one of the 44 files is the same 5-path document. Across the whole set:

| Path | Distinct values in 44 files | What it is |
|---|---|---|
| `path[0]` | **1** — constant | head/face outline |
| `path[1]` | **1** — constant | fixed anatomy |
| `path[2]` | **2** | larynx / voicing marker (voiceless vs voiced) |
| `path[3]` | **4** | velum (lowered for nasals) |
| `path[4]` | **27** | the moving articulator — tongue **and lips** |

Confirmation that `path[4]` really does carry the lips: `p`, `b` and `m` share
one identical lip-region geometry (bilabial), `f` and `v` share a different
identical one (labiodental), and both differ from `neutral`. The set is not
tongue-only, which matters for `W`.

---

## 1. L — still `NO_ACCEPTABLE_SOURCE`

Exhaustively re-confirmed against the clone. The consonant set is:

```
b c d eth f g k kǃ_1 kǃ_2 kǃ_3 m n neutral p q r_retroflex s_apical s_laminal
t v z_apical z_laminal ç ħ ŋ ɟ ɢ ɲ ɴ ʁ ʃ_apical ʃ_laminal ʒ_apical ʕ ʝ θ χ
```

**No `l`, no `ɫ`, no lateral of any manner.** Upstream will not add one — the
repository README states the illustrations are distributed as-is and that
requests for additions will be refused.

**Why no substitute works.** A mid-sagittal section is a slice down the
*midline*, and /l/'s defining property is airflow around the tongue's *sides*.
The sagittal plane literally cannot show laterality — this is a limitation of
the projection, not of this particular set. Any diagram must therefore add a
convention (an airflow arrow, a coronal inset, a cutaway) on top of the sagittal
view.

Specifically rejected, with reasons:

| Rejected | Why |
|---|---|
| `n.svg` | Correct alveolar closure, but nasal airflow. Teaches the wrong sound. |
| `d.svg` / `t.svg` | Alveolar closure with *complete* oral blockage — the opposite of a lateral. |
| Any "generic alveolar" diagram | Same problem; place is right, manner is wrong. |

**Options, unchanged in substance from the previous phase:**

1. **CC BY-SA 3.0 raster** — `File:Non-velarised l.png` (Commons, creator
   "Spazzo"). Could not be re-verified this session (Commons blocked). Brings
   attribution, share-alike, a raster into an SVG set, and a third visual style.
2. **Draw one in the CC0 style.** The base drawing is CC0, so a new lateral
   derived from it carries **no licence obligation at all** and matches
   perfectly. `n.svg` already supplies the correct alveolar closure geometry;
   what must be added is a laterality convention. This is the best long-term
   answer.
3. **Leave `MISSING`.** Current live behaviour: `L` falls back to the word-level
   lesson. Harms nobody, and `soundFeedbackEnabled` is `false` anyway.

**Recommendation: option 3 now, option 2 when there is artwork time.** Do not
take option 1 for a single slot.

## 2. R — `NEEDS_REVIEW`, and the geometry now supports it strongly

Candidate: `midsaggital_articulations/consonants/svg/r_retroflex.svg`, CC0-1.0,
Wright & McCloy. Style match **HIGH** (same document geometry as the 11 already
in the project, all of which are byte-identical to upstream — 11/11 SHA-256).

**New evidence this session.** Extracting the tongue's upper surface per 5mm
x-bin and differencing against `neutral.svg` (y grows downward, so negative =
raised toward the palate):

| x-bin | 100 | 105 | 110 | 115 | 120 | 125 | 130 | 135 | 140 | 145 |
|---|---|---|---|---|---|---|---|---|---|---|
| `neutral` | 140.7 | 135.8 | 132.0 | 130.2 | 129.2 | 128.9 | 128.9 | 129.8 | 131.9 | 135.0 |
| `r_retroflex` | 148.2 | 144.7 | 140.1 | 138.8 | 137.0 | 133.4 | 128.8 | **124.9** | **124.8** | 139.7 |
| `t` | 144.7 | 138.6 | 134.5 | 132.0 | 130.3 | 128.7 | 128.1 | 127.5 | 127.5 | 128.2 |

`r_retroflex` is the **only file in the set** that combines a **raised front**
(x≈135–140, 7.1 above neutral) with a **markedly lowered body** (x≈100–125, up to
8.9 *below* neutral). That hollowed-body-plus-raised-tip shape is the textbook
retroflex configuration, and it is what distinguishes retroflex from bunched —
a bunched /ɹ/ would show the body *humped*, not hollowed.

Sanity check that the measurement means what it appears to: the same method puts
`k`'s maximum raise at x=95 (velar, back), `θ`'s at x=150 and shallow (tip
forward between the teeth), `t`'s at x=145 (alveolar), and `ʃ`/`ʒ`'s at x=140
(postalveolar). Every one lands where its phonetics says it should.

**Phonetic correctness for General American.** GA /ɹ/ has two standard
realisations, **retroflex** and **bunched/molar**. They are
[acoustically indistinguishable in the first three formants and perceptually
equivalent](https://pmc.ncbi.nlm.nih.gov/articles/PMC2680662/), vary
idiosyncratically between speakers, and clinical practice
[teaches whichever the learner produces more easily](https://thepedispeechie.com/2020/10/retroflex-r-vs-bunched-r-in-speech-therapy.html).
A retroflex diagram is therefore correct GA, not a dialect error.

**Better alternative in the same CC0 set? No.** `ʁ` is a uvular fricative (the
French R) and would be actively misleading. There is no bunched-R drawing.

**Still requires the laptop:**

- **Does the tongue tip contact the palate?** Approximants must not. The global
  path-distance test was inconclusive: path ordering is not stable across the
  set (`ʃ_laminal` puts the tongue at `path[3]`, not `path[4]`), so the palate
  contour could not be isolated reliably. **This needs eyes.**
- **The larynx marker.** `r_retroflex.svg` carries the *voiceless* `path[2]`
  (339 chars) while English /ɹ/ is voiced. Compare it side by side with `d.svg`
  (voiced, 786) and decide whether the difference is even visible at 128px.

**Known limitation to carry into the UI phase:** a retroflex-only image teaches
one of two valid shapes. The tip text must not present curling the tongue as the
only correct way.

## 3. W — `NEEDS_REVIEW`; the earlier reasoning was incomplete, the candidate survives

Candidate: `midsaggital_articulations/vowels/svg/u.svg`, CC0-1.0. Style match
**HIGH**.

The previous document recommended this on the articulatory argument that **[w]
is the non-syllabic counterpart of [u]** — same lip rounding, same high-back
tongue. That argument is sound, but it was about what the *sound* is, not about
what the *drawing shows*. Two things were checked this session:

1. **Does the set draw lips at all?** Yes — established in §0. `p`/`b`/`m` share
   one lip geometry and `f`/`v` share another, so lip articulation is encoded in
   `path[4]`.
2. **Do `u` and `i` differ in the lip region?** Yes, `path[4]` differs between
   them and the difference extends into the front region (x ≥ 148).

So the candidate is not refuted. **But the size of that difference could not be
established from coordinates** — the front-region bounding box is dominated by
the face outline (nose to chin), not by the lip aperture, so the measurement
does not isolate rounding. Whether the rounding *reads* at 128px is exactly the
kind of question that needs rendering.

**Alternative:** Commons `Voiced labial-velar approximant.svg` (Tavin & Nardog,
CC BY-SA 4.0) is purpose-drawn for /w/, but brings attribution, share-alike and a
second visual style for one slot, and could not be re-verified this session.

**Recommendation:** try `u.svg` first on the laptop; fall back to the CC BY-SA
file only if the rounding is genuinely illegible.

## 4. VOWEL_ER — `NEEDS_REVIEW`, contingent on R

Candidate: the same `r_retroflex.svg`, shared with the `R` slot.

/ɝ/ **is** the /ɹ/ gesture held as a syllable nucleus, so the R diagram is the
articulatorily correct picture. Sharing one image across two lessons already has
precedent in this project: `VOWEL_STRUT` and `VOWEL_SCHWA` share
`vowel-mid-central.svg` by explicit recorded decision, with different labels,
examples, tips and (separate) audio slots.

**On the rhotic/non-rhotic trap the brief flags — three checks:**

1. The CC0 vowel set is `a i u æ ɛ ɪ ʊ`. **There is no `ɜ`**, so British
   non-rhotic /ɜː/ cannot be picked up by accident from this source.
2. **`vowel-mid-central.svg` must NOT be reused for `VOWEL_ER`.** It is the
   neutral rest-position tract already serving STRUT/schwa — a mid-central vowel
   with *no rhotic gesture*, which is precisely what a British /ɜː/ diagram
   looks like. Reusing it would ship the exact error the brief warns against.
3. Any accepted `VOWEL_ER` image must show **tongue retraction or bunching with
   r-colouring**. This is the acceptance criterion for the laptop check.

## 5. CH — `NEEDS_REVIEW`; **a single static image is pedagogically wrong**

Stating it directly, as the brief asks: **yes, one static diagram would be
misleading for /tʃ/.**

An affricate is a *sequence*: a complete closure released into a homorganic
fricative
([*Essentials of Linguistics* 2e §3.4](https://ecampusontario.pressbooks.pub/essentialsoflinguistics2/chapter/3-4-describing-consonants-manner/)).
Any single frame shows half the sound. The closure frame teaches a student to
stop; the release frame teaches them to say "sh". Neither is /tʃ/.

**Both panels exist in the CC0 set, in style, under one unconditional licence:**

| Panel | Candidate | Note |
|---|---|---|
| 1 — closure | `t.svg` (alveolar) or `c.svg` (palatal) | /tʃ/'s closure is *post-alveolar*, between the two. `t` is slightly too far forward, `c` slightly too far back. Neither is exact; `t` is the more familiar shape to a learner. |
| 2 — release | `ʃ_laminal.svg` or `ʃ_apical.svg` | `ʃ_laminal.svg` is already the project's `SH` asset, so reusing it visually teaches "CH ends like SH". |

No better openly-licensed two-stage set was found. The one animated Commons
candidate (`Voiceless alveolar sibilant affricate.gif`) is the wrong sound
(/ts/), the wrong medium, and CC BY-SA.

**Blocker is the UI, not the artwork.** `PronunciationStudyActivity` renders one
`<img>` per sound and the catalogue models one `imageAsset` per `SoundKey`.
Two-panel support is a data-model plus component change. **Until that exists,
`CH` should stay `MISSING`** rather than ship a misleading single frame.

## 6. J — `NEEDS_REVIEW`; same conclusion, plus one consistency decision

Panels: `d.svg` (or `ɟ.svg`) → `ʒ_apical.svg`. Same licence, same style, same UI
blocker.

**The decision to make:** the set has both `ʃ_apical` and `ʃ_laminal` but only
`ʒ_apical`. If `CH` uses `ʃ_laminal` (matching the existing `SH` asset) while
`J` uses `ʒ_apical`, the two affricates' release panels are drawn with different
tongue postures for a reason no student could interpret. Either:

- **`ʃ_laminal` + `ʒ_apical`** — CH's release matches the `SH` lesson, but the
  affricate pair is internally inconsistent; or
- **`ʃ_apical` + `ʒ_apical`** — the pair is consistent, but CH's release no
  longer matches the `SH` lesson.

This is an artwork judgement, not a licensing one. It needs the same rendering
pass as everything else.

## 7. Image sources — consolidated

| Source | Licence | Attribution | Covers | Verified at source |
|---|---|---|---|---|
| **Wright & McCloy** — [`drammock/phonetics-teaching-assets`](https://github.com/drammock/phonetics-teaching-assets) | **CC0-1.0** | **None** | 16 of 17 slots (all but `L`), incl. R, ER, W and both affricates as two-panel | **Yes** — clone, `LICENSE` read, HEAD `4d02e4a` |
| Tavin & Nardog (Commons) | CC BY-SA 4.0 | Required + share-alike | R, W, ER | Verified in the *previous* session; **not re-verifiable today** |
| Spazzo (Commons) | CC BY-SA 3.0 | Required + share-alike | L only (raster) | Verified in the *previous* session; **not re-verifiable today** |

**Best complete source: unchanged — Wright & McCloy, CC0.** With
`r_retroflex` and the affricate pairs it reaches **16 of 17 slots** in one visual
style, with no attribution and no share-alike obligation.

Licence chain, verified first-hand this session:

| Question | Answer | Evidence |
|---|---|---|
| Creator | Richard Wright, Dan McCloy (UW Linguistics, c. 2010) | repo `README.md` |
| Source URL | `https://github.com/drammock/phonetics-teaching-assets` | `git remote get-url origin` |
| Licence | CC0 1.0 Universal | `LICENSE` — full legal code |
| Licence URL | https://creativecommons.org/publicdomain/zero/1.0/ | CC0 deed |
| Modification | Permitted, unconditionally | CC0 |
| Commercial use | Permitted | CC0 |
| Attribution | **Not required** | CC0 |

---

> **SUPERSEDED (2026-09-17).** The audio track has moved to
> [`PRONUNCIATION_AUDIO_INVENTORY.md`](./PRONUNCIATION_AUDIO_INVENTORY.md), which
> covers all 24 stated targets and carries measured evidence: the Commons
> *consonant* recordings are **not isolated** (they are vowel-framed), the vowel
> recordings **are** isolated but are **cardinal** rather than General American,
> and `VOWEL_STRUT` and `VOWEL_ER` have no candidate at all. The sections below
> are kept for history; treat the newer document as authoritative for audio.

## 8. Isolated phoneme audio — research track

### 8.1 The requirement, restated precisely

We need a **recording of the sound itself** — /θ/, /ʃ/, /ɹ/ — not a voice saying
the words *"TH sound"*, and not a word containing the sound. GoWord's Deepgram
TTS is for full-word reference audio only and **must not** be used here: asked
for "TH sound" it produces the English words, which teaches nothing about /θ/.

### 8.2 Is there a complete licensed collection? — **Probably one, unverified**

**Wikimedia Commons IPA phonetic sample set.** Consistently named per IPA
description (`Voiceless dental fricative.ogg`, `Voiceless palato-alveolar
affricate.ogg`, …), covering the IPA consonant chart, Ogg Vorbis, short (the
affricate file is 2.1 s, ~25 KB). Search results report **CC BY-SA 3.0 (+ GFDL)**
per file.

This is the closest thing to a single complete source. It is **not verified**:
Commons is unreachable from this session, so creator, exact per-file licence,
and — critically — whether each recording is *genuinely isolated* could not be
confirmed. Commons IPA samples are typically a phonetician demonstrating the
sound, sometimes sustained and sometimes in a `[Ca]`-type frame; which one
applies per file is exactly what needs checking.

### 8.3 Candidates examined and their problems

| Candidate | Licence | Why it does not solve this |
|---|---|---|
| [Freesound "English Phonemes" pack (margo_heston)](https://freesound.org/people/margo_heston/packs/12249/) | Per-upload (CC0 / BY / BY-NC) | Most promising non-Commons lead. Host blocked; licence is per-file and may be NC, which would disqualify it. |
| [IPA Handbook recordings](https://www.internationalphoneticassociation.org/content/sound-recordings) | Unclear; members-only area | Words and connected text illustrating languages — **not** isolated phonemes. |
| [Mozilla Common Voice](https://github.com/common-voice/common-voice) | **CC0** | Sentences, not phonemes. Licence is ideal, content is wrong. |
| [English word pronunciation MP3s (thousandlemons)](https://github.com/thousandlemons/English-words-pronunciation-mp3-audio-download) | Unclear — scraped | Word audio, and provenance unclear. Rejected. |
| [OpenPronounce](https://github.com/Halleck45/OpenPronounce) | MIT | An assessment model, not audio. |
| UCLA Phonetics Lab Archive | Unclear | Host returns 403; archive is language samples, not an EN teaching set. |
| Any TTS-generated phoneme audio | n/a | **Explicitly excluded** by the brief and by pedagogy. |

**Vowels are the harder half.** Commons vowel audio is generally *cardinal
vowel* demonstration, not General American English vowels. Six of our 18 targets
are vowels, and `VOWEL_ER` (/ɝ/) is specifically an English r-coloured vowel that
the cardinal-vowel tradition does not contain. A cardinal [ɜ] recording would
reproduce the non-rhotic error §4 warns about, in audio.

### 8.4 Audio coverage matrix — all 18 teaching targets

`Isolated?` = whether the recording is the sound alone. **Unknown for every row**
— that is the point of the column, and it cannot be answered without opening the
files.

| SoundKey | Phoneme | Audio required | Candidate source | License | Isolated? | Status |
|---|---|---|---|---|---|---|
| `TH_VOICELESS` | /θ/ | `th-voiceless.mp3` | Commons *Voiceless dental fricative* | CC BY-SA 3.0 (reported) | Unknown | `NEEDS_REVIEW` |
| `TH_VOICED` | /ð/ | `th-voiced.mp3` | Commons *Voiced dental fricative* | CC BY-SA 3.0 (reported) | Unknown | `NEEDS_REVIEW` |
| `R` | /ɹ/ | `r.mp3` | Commons *Voiced alveolar approximant* | CC BY-SA 3.0 (reported) | Unknown | `NEEDS_REVIEW` |
| `L` | /l/ | `l.mp3` | Commons *Voiced alveolar lateral approximant* | CC BY-SA 3.0 (reported) | Unknown | `NEEDS_REVIEW` |
| `F` | /f/ | `f.mp3` | Commons *Voiceless labiodental fricative* | CC BY-SA 3.0 (reported) | Unknown | `NEEDS_REVIEW` |
| `V` | /v/ | `v.mp3` | Commons *Voiced labiodental fricative* | CC BY-SA 3.0 (reported) | Unknown | `NEEDS_REVIEW` |
| `W` | /w/ | `w.mp3` | Commons *Voiced labial-velar approximant* | CC BY-SA 3.0 (reported) | Unknown | `NEEDS_REVIEW` |
| `P` | /p/ | `p.mp3` | Commons *Voiceless bilabial plosive* | CC BY-SA 3.0 (reported) | Unknown | `NEEDS_REVIEW` |
| `B` | /b/ | `b.mp3` | Commons *Voiced bilabial plosive* | CC BY-SA 3.0 (reported) | Unknown | `NEEDS_REVIEW` |
| `SH` | /ʃ/ | `sh.mp3` | Commons *Voiceless palato-alveolar sibilant* | CC BY-SA 3.0 (reported) | Unknown | `NEEDS_REVIEW` |
| `CH` | /tʃ/ | `ch.mp3` | Commons *Voiceless palato-alveolar affricate* (2.1 s, 25 KB) | CC BY-SA 3.0 (reported) | Unknown — see §9 | `NEEDS_REVIEW` |
| `J` | /dʒ/ | `j.mp3` | Commons *Voiced palato-alveolar affricate* | CC BY-SA 3.0 (reported) | Unknown — see §9 | `NEEDS_REVIEW` |
| `VOWEL_SHORT_I` | /ɪ/ | `vowel-short-i.mp3` | Commons cardinal-vowel audio | CC BY-SA (reported) | Unknown; **likely cardinal, not GA** | `NEEDS_REVIEW` |
| `VOWEL_LONG_E` | /i/ | `vowel-long-e.mp3` | Commons cardinal-vowel audio | CC BY-SA (reported) | Unknown; **likely cardinal, not GA** | `NEEDS_REVIEW` |
| `VOWEL_A_CAT` | /æ/ | `vowel-a-cat.mp3` | Commons cardinal-vowel audio | CC BY-SA (reported) | Unknown; **likely cardinal, not GA** | `NEEDS_REVIEW` |
| `VOWEL_STRUT` | /ʌ/ | `vowel-strut.mp3` | Commons cardinal-vowel audio | CC BY-SA (reported) | Unknown; **likely cardinal, not GA** | `NEEDS_REVIEW` |
| `VOWEL_SCHWA` | /ə/ | `vowel-schwa.mp3` | Commons *Mid central vowel* | CC BY-SA (reported) | Unknown | `NEEDS_REVIEW` |
| `VOWEL_ER` | /ɝ/ | `vowel-er.mp3` | **none identified** | — | — | **`NO_ACCEPTABLE_SOURCE`** |

Totals: **0 `VERIFIED_SOURCE`**, 17 `NEEDS_REVIEW`, 1 `NO_ACCEPTABLE_SOURCE`.

Note the asymmetry with images: `VOWEL_STRUT` and `VOWEL_SCHWA` share an image
slot but have **separate** audio slots, because they are different sounds even
though the mouth position is the same.

## 9. CH / J audio specifically

The brief is right to single these out. Three distinct risks, none resolvable
without listening to the files:

1. **Is it an affricate or a cluster?** A recording of [t] + [ʃ] as two segments
   is not /tʃ/. A genuine affricate has a single closure with a fricated release.
2. **Is it the right affricate?** Commons carries *alveolar* (/ts/),
   *alveolo-palatal* (/tɕ/), *palatal* (/cç/) and *palato-alveolar* (/tʃ/)
   affricates under very similar names. **Only *palato-alveolar* is English CH.**
   Picking `Voiceless alveolo-palatal affricate.ogg` by mistake would teach a
   Mandarin/Polish sound. This is the single easiest error to make in the whole
   audio set.
3. **Is it isolated, or in a frame?** A `[Ca]` frame is acceptable for teaching
   if consistent; a whole example word is not, and must not be substituted.

**Do not fall back to word audio for CH and J.** If no genuinely isolated
affricate recording verifies, leave both `MISSING` — the word-level lesson
already covers the student.

## 10. Attribution requirements

| Asset class | Attribution |
|---|---|
| The 11 downloaded images (CC0) | **None required.** `provenance.attribution` is `null` by the licence, not by omission. |
| Any further Wright & McCloy image (CC0) | **None required.** |
| Any Commons CC BY-SA image or audio | **Required, and must be rendered wherever the asset appears** — creator, licence link, and whether changes were made. This is a UI change. Share-alike also binds any recolour or crop. |

Adopting CC BY-SA audio is therefore a **product decision**, not just a file
copy: it puts a visible credit line into the student player. Worth weighing
against leaving the audio slots empty, which is the current, harmless state.

## 11. Recommended candidates

| Slot | Recommended | Licence | Confidence |
|---|---|---|---|
| `R` | `r_retroflex.svg` | CC0 | High on shape (measured); contact unverified |
| `VOWEL_ER` | `r_retroflex.svg`, shared | CC0 | Medium — follows from R |
| `W` | `vowels/svg/u.svg` | CC0 | Medium — lips are drawn; salience unverified |
| `CH` | `t.svg` → `ʃ_laminal.svg`, two panels | CC0 | High on phonetics; blocked on UI |
| `J` | `d.svg` → `ʒ_apical.svg`, two panels | CC0 | High on phonetics; blocked on UI |
| `L` | none — draw one in the CC0 style | n/a | — |
| All audio | none yet | — | Nothing verified |

## 12. Requires local visual verification

1. `r_retroflex.svg` — tongue–palate **gap** (approximant, must not contact);
   whether the voiceless larynx marker is visible at 128px.
2. `u.svg` — whether lip rounding **reads** at 128px against `i.svg`.
3. `r_retroflex.svg` as `VOWEL_ER` — does it show r-colouring clearly enough to
   stand alone as a vowel lesson?
4. The 11 existing images — the `viewBox` crop, without which none of them is
   legible at 128px (`SOUND_ASSET_RESEARCH.md` §6). **Do this first**: the crop
   is what makes every other judgement possible.
5. `t`/`c` and `ʃ_laminal`/`ʃ_apical`/`ʒ_apical` — the affricate panel choices.
6. Every candidate audio file — that it is isolated, the right sound, and
   (for CH/J) an affricate rather than a cluster.

## 13. Still unresolved

1. **`L` has no CC0 source** and a sagittal section cannot show laterality
   without an added convention.
2. **No audio source is verified.** Commons, Freesound and every archive host
   were unreachable; nothing may be downloaded under the project's asset policy.
3. **Vowel audio may be cardinal rather than General American**, which would be
   the audio equivalent of the non-rhotic error in §4.
4. **`VOWEL_ER` audio has no candidate at all.**
5. **CH/J two-panel rendering is unimplemented** in both the data model and the
   component.
6. **The crop debt** on the 11 downloaded images is still outstanding and gates
   every visual decision.
7. `soundFeedbackEnabled` stays `false` regardless — it is blocked on Arabic-L1
   attribution validation (`services/pronunciation-gopt/LIMITATIONS.md` §2),
   independent of assets.

## 13b. Phase-2 outcome — classification and what must be created

Re-searched this session (Commons, Freesound, archive.org, Zenodo, OpenSLR and
the UCLA archive all unreachable again; GitHub reachable). No new complete set
was found, and no new `L` source was found.

**Classification of every unresolved sound:**

| Sound | Classification |
|---|---|
| `R` | **FOUND — needs local visual verification** (`r_retroflex.svg`, CC0) |
| `W` | **FOUND — needs local visual verification** (`vowels/svg/u.svg`, CC0) |
| `VOWEL_ER` | **FOUND — needs local visual verification** (`r_retroflex.svg`, shared) |
| `CH` | **FOUND — needs local visual verification + UI work** (two CC0 panels) |
| `J` | **FOUND — needs local visual verification + UI work** (two CC0 panels) |
| `L` | **NO SUITABLE EXISTING ASSET — must be created** |

Only `L` requires new artwork. Its specification, including the measured style
contract the new file must satisfy, is in
[`ASSET_CREATION_SPEC.md`](./ASSET_CREATION_SPEC.md).

Further `L` searching this session surfaced only OER textbook figures
([Pressbooks NVCC](https://pressbooks.nvcc.edu/eng200h5p/chapter/3-4-describing-consonants-manner/),
[*Essentials of Linguistics* 2e](https://ecampusontario.pressbooks.pub/essentialsoflinguistics2/chapter/3-4-describing-consonants-manner/))
and [eNunciate (UBC)](https://enunciate.arts.ubc.ca/l/). All are
`NEEDS_LICENSE_REVIEW`: the hosts are unreachable, the CC variant is unconfirmed
(an NC variant would disqualify them outright), and they are a different visual
style from the CC0 baseline.

## 13c. Style contract of the CC0 set — measured across all 44 files

Extracted this session so new artwork can match exactly. Full detail in
`ASSET_CREATION_SPEC.md` §2.

- `viewBox` `0 0 173.03751 244.73958`, 5 paths, **0 `<text>`** — 44/44 identical.
- Palette is two greys only: fill `#e6e6e6`, stroke `#666666`, everywhere.
- Stroke widths: `0.35277778px` (1 pt) for anatomy, `0.70555556px` (2 pt) for the
  larynx line. No colour, no gradients, **no arrows**, no labels.
- Path roles, decoded by differencing against `neutral.svg`: `path[0]` face
  outline and `path[1]` fixed anatomy are **constant across all 44 files**;
  `path[2]` is the larynx/voicing marker (2 states), `path[3]` the velum
  (4 states), `path[4]` the moving articulator — tongue **and lips**.

That last point is what makes derivative work tractable: a new sound is a new
`path[4]` plus the correct `path[2]`/`path[3]` state copied from an existing
file, with paths 0 and 1 byte-identical.

## 14. Sources

First-hand this session:

- `drammock/phonetics-teaching-assets` — cloned, HEAD `4d02e4a`; `LICENSE`
  (CC0 1.0 full legal code), `README.md`, complete file tree, path-level geometry
- `public/assets/sounds/` — 11 files, SHA-256 matched to upstream
- `src/lib/pronunciation/{phoneSounds,sounds}.ts` — the 18 targets and 17 slots

Web search (hosts unreachable, so these informed reasoning and are recorded as
leads, never as verified licences):

- [MRI study of retroflex vs bunched American /r/ (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC2680662/)
- [Retroflex R vs Bunched R in speech therapy](https://thepedispeechie.com/2020/10/retroflex-r-vs-bunched-r-in-speech-therapy.html)
- [*Essentials of Linguistics* 2e §3.4 — manner of articulation](https://ecampusontario.pressbooks.pub/essentialsoflinguistics2/chapter/3-4-describing-consonants-manner/)
- [Commons — File:Voiceless dental fricative.ogg](https://commons.wikimedia.org/wiki/File:Voiceless_dental_fricative.ogg)
- [Commons — File:Voiceless palato-alveolar affricate.ogg](https://commons.wikimedia.org/wiki/File:Voiceless_palato-alveolar_affricate.ogg)
- [IPA — Sound Recordings](https://www.internationalphoneticassociation.org/content/sound-recordings)
- [Freesound — English Phonemes pack](https://freesound.org/people/margo_heston/packs/12249/)
- [Mozilla Common Voice](https://github.com/common-voice/common-voice)
