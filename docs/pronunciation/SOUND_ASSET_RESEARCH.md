# Articulation asset research — Study Mode Pronunciation

Research → verify → download → manifest, for the 17 articulation image slots
fixed by [`TEACHING_INVENTORY_DECISION.md`](./TEACHING_INVENTORY_DECISION.md)
(18 teaching targets; `VOWEL_STRUT` and `VOWEL_SCHWA` share one slot). The
teaching inventory was **not** changed by this phase.

Researched 2026-09-16. Every licence below was read at its original source, not
taken from a search result.

---

## 0. Network conditions — re-tested, and they have changed

The previous phase recorded Wikimedia, `github.com` and every university host as
blocked. **That is no longer true.** Re-tested at the start of this phase:

| Host | Previously | Now |
|---|---|---|
| `commons.wikimedia.org` | blocked | **200** |
| `upload.wikimedia.org` | blocked | **200** |
| `en.wikipedia.org` | blocked | **200** |
| `github.com` (HTML) + `api.github.com` | 403 | **200** |
| `raw.githubusercontent.com` | 200 | 200 |
| `depts.washington.edu` (the UW source PDF) | no route | reachable, but the file itself is **404 — dead link** |

The Commons API requires a `User-Agent`; requests without one get 403, which is
a client error rather than a network block.

## 1. Sources searched

- **Wikimedia Commons**, via the MediaWiki API (`list=search`, `list=categorymembers`,
  `prop=imageinfo&iiprop=extmetadata`) — the authoritative per-file licence
  metadata, which is generated from the file page itself:
  - `Category:Articulation place diagrams` (102 files)
  - `Category:SVG plain gray articulation place diagrams` (146 files)
  - title searches for *Sagittal Section*, *lateral approximant*, *affricate*,
    *alveolar lateral*, *dark l*
- **GitHub**, via the REST API and `raw.githubusercontent.com`:
  `drammock/phonetics-teaching-assets` — repository metadata, full file tree,
  `LICENSE`, `README.md`.
- **University source**: `depts.washington.edu/lingta/` (the origin cited by the
  Commons files). Recorded as a dead link, not as verification.
- Individual Commons **file description pages**, fetched as HTML for the two
  candidate sets, to read the licence template as rendered rather than trusting
  API metadata alone.

Not used as evidence: search-engine snippets, image search, Quizlet/Pinterest
redistributions, or any page that does not state its own licence.

## 2. Complete-set candidates

Two coherent sets exist. Neither covers all 17 slots.

### 2.1 Wright & McCloy — *selected*

- **What**: 44 mid-sagittal vocal-tract drawings (37 consonants, 7 vowels) plus
  glottis and airstream diagrams, all in one grey-on-white line style, as SVG.
- **Creator**: Richard Wright and Dan McCloy, Linguistics Department,
  University of Washington, c. 2010.
- **Origin**: <https://github.com/drammock/phonetics-teaching-assets>, mirrored
  on Commons as `File:IPA <symbol> Sagittal Section.svg`.
- **Licence**: **CC0 1.0** — verified twice, see §4.
- **Covers**: 11 of our 17 slots, including **all six vowel targets**, which the
  other set cannot do at all.
- **Does not cover**: ɹ (R), l (L), w (W), tʃ (CH), dʒ (J), ɝ (ER).

### 2.2 Tavin & Nardog ("VocalTract" derivatives) — verified, not adopted

- **What**: ~110 articulation diagrams on Commons, zoomed to the oral cavity,
  bold black line style, all derived from `File:VocalTract.svg`.
- **Creators**: Commons users Tavin and Nardog; base drawing by Tavin.
- **Licence**: **CC BY-SA 4.0** (base `VocalTract.svg` is CC BY 3.0).
- **Covers**: ɹ, w, ɝ (bunched r) — three of our six gaps — plus alternatives
  for most consonants we already have. **No vowels**, no affricates, no /l/.
- **Why not adopted**: see §4.2. Summary: attribution plus share-alike
  obligations, and a second visual style, for three slots.

### 2.3 Others examined and rejected

| Candidate | Verdict | Why |
|---|---|---|
| `File:Non-velarised l.png`, `File:Velarised l.png` (Spazzo, CC BY-SA 3.0) | `NEEDS_REVIEW` | The only /l/ diagrams found. Raster PNG, a third visual style, and a third attribution chain — for one slot. |
| `File:Voiceless alveolar sibilant affricate.gif` (Tavin & Nardog, CC BY-SA 4.0) | `NOT_SUITABLE` | Animated GIF; not a static articulation image, and it is the /ts/ affricate, not our /tʃ/. |
| *An outline of English phonetics* figures (Commons, PD) | `NOT_SUITABLE` | 1920s RP textbook line-cuts; different variety, inconsistent style, poor legibility. |
| General image-search results | `NOT_SUITABLE` | No traceable licence. |

## 3. Selected source

**Wright & McCloy, CC0 1.0.** Chosen because the licence is unconditional
(no attribution, no share-alike, commercial use and modification explicitly
permitted), the style is uniform across consonants *and* vowels, the files are
SVG, and — checked, not assumed — **no file carries an IPA symbol or any other
text**: all 11 downloaded files contain zero `<text>` elements, so nothing
violates the "no phonetic notation shown to students" rule.

## 4. Licence verification

### 4.1 The selected set

| Question | Answer | Where verified |
|---|---|---|
| Creator | Richard Wright, Dan McCloy | Commons file page `Author` field; repo `README.md` |
| Original source | UW Linguistics teaching materials, 2011-09-23; published by the author as a GitHub repository | Commons `Source` field; repo README |
| Licence | CC0 1.0 Universal (public domain dedication) | [`LICENSE`](https://github.com/drammock/phonetics-teaching-assets/blob/main/LICENSE) — full CC0 legal code, committed 2024-06-13 **by Daniel McCloy himself**, i.e. by the creator; and the CC0 template on [File:IPA θ Sagittal Section.svg](https://commons.wikimedia.org/wiki/File:IPA_%CE%B8_Sagittal_Section.svg) |
| Modification permitted | Yes | CC0 waives all rights |
| Commercial use permitted | Yes | CC0, verbatim: use "even for commercial purposes, all without asking permission" |
| Attribution required | **No** | CC0; Commons `AttributionRequired: false` |
| Redistribution inside a commercial/educational app | Yes | CC0 imposes no conditions |

**Classification: `SAFE_TO_USE`.**

The one caveat recorded honestly: the UW PDF cited as the historical origin
(`depts.washington.edu/lingta/2011.09.23_lingTaTrainingSampleIllustrations.pdf`)
now returns **404**. This does not weaken the dedication — the CC0 grant comes
from the creator's own repository — but the 2011 document could not be opened.

### 4.2 The Tavin & Nardog set

| Question | Answer |
|---|---|
| Creators | Tavin and Nardog (Wikimedia Commons users); base `VocalTract.svg` by Tavin |
| Licence | CC BY-SA 4.0 (base file CC BY 3.0) — verified on the file pages |
| Commercial use | Permitted |
| Modification | Permitted, but adaptations must be released under the same licence |
| Attribution | **Required**: credit the creators, link the licence, state whether changes were made |

**Classification: `NEEDS_ATTRIBUTION`** — legally usable, deliberately not
adopted in this phase. Three reasons, in order of weight:

1. **Share-alike is a product decision, not a technical one.** Using the files
   unmodified is safe, but the moment anyone recolours or crops one for the dark
   theme, that adaptation must itself be CC BY-SA 4.0. GoWord's asset policy has
   no such obligation today.
2. **Attribution must be rendered wherever the asset appears**, which means a
   visible credit line in the student player — a UI change this phase must not make.
3. **Style mixing**: they are a different drawing (zoomed oral cavity, black
   strokes) from the selected set (whole head, grey strokes).

They are recorded here, verified, so that adopting them later needs a decision
rather than fresh research.

## 5. Coverage matrix

All 17 slots. "Downloaded" means the file is in `public/assets/sounds/` and the
catalogue's `isUsableAsset()` gate accepts it.

| SoundKey | Sound | Image needed | Candidate source | Licence | Status |
|---|---|---|---|---|---|
| `TH_VOICELESS` | θ *think* | `th-voiceless.svg` | Wright & McCloy `θ.svg` | CC0-1.0 | **DOWNLOADED** |
| `TH_VOICED` | ð *this* | `th-voiced.svg` | Wright & McCloy `eth.svg` | CC0-1.0 | **DOWNLOADED** |
| `F` | f *fish* | `f.svg` | Wright & McCloy `f.svg` | CC0-1.0 | **DOWNLOADED** |
| `V` | v *very* | `v.svg` | Wright & McCloy `v.svg` | CC0-1.0 | **DOWNLOADED** |
| `P` | p *pen* | `p.svg` | Wright & McCloy `p.svg` | CC0-1.0 | **DOWNLOADED** |
| `B` | b *book* | `b.svg` | Wright & McCloy `b.svg` | CC0-1.0 | **DOWNLOADED** |
| `SH` | ʃ *she* | `sh.svg` | Wright & McCloy `ʃ_laminal.svg` | CC0-1.0 | **DOWNLOADED** |
| `VOWEL_SHORT_I` | ɪ *ship* | `vowel-short-i.svg` | Wright & McCloy `ɪ.svg` | CC0-1.0 | **DOWNLOADED** |
| `VOWEL_LONG_E` | i *sheep* | `vowel-long-e.svg` | Wright & McCloy `i.svg` | CC0-1.0 | **DOWNLOADED** |
| `VOWEL_A_CAT` | æ *cat* | `vowel-a-cat.svg` | Wright & McCloy `æ.svg` | CC0-1.0 | **DOWNLOADED** |
| `VOWEL_STRUT` | ʌ *cut* | `vowel-mid-central.svg` (shared) | Wright & McCloy `neutral.svg` | CC0-1.0 | **DOWNLOADED** |
| `VOWEL_SCHWA` | ə *about* | same file as above | Wright & McCloy `neutral.svg` | CC0-1.0 | **DOWNLOADED** |
| `R` | ɹ *red* | `r.svg` | Commons `Voiced alveolar approximant.svg` (Tavin, Nardog) | CC BY-SA 4.0 | `NEEDS_ATTRIBUTION` — not downloaded |
| `W` | w *water* | `w.svg` | Commons `Voiced labial-velar approximant.svg` (Tavin, Nardog) | CC BY-SA 4.0 | `NEEDS_ATTRIBUTION` — not downloaded |
| `VOWEL_ER` | ɝ *bird* | `vowel-er.svg` | Commons `Bunched r.svg` (Tavin, Nardog) | CC BY-SA 4.0 | `NEEDS_ATTRIBUTION` — not downloaded |
| `L` | l *light* | `l.svg` | Commons `Non-velarised l.png` (Spazzo) | CC BY-SA 3.0 | `NEEDS_REVIEW` — raster, third style, third attribution chain |
| `CH` | tʃ *chair* | `ch.svg` | — | — | **NO ACCEPTABLE SOURCE FOUND** |
| `J` | dʒ *jump* | `j.svg` | — | — | **NO ACCEPTABLE SOURCE FOUND** |

### Grouped as the brief asks

- **Covered by one complete set** (11 slots, CC0, one style): TH_VOICELESS,
  TH_VOICED, F, V, P, B, SH, VOWEL_SHORT_I, VOWEL_LONG_E, VOWEL_A_CAT, and the
  shared VOWEL_STRUT/VOWEL_SCHWA slot.
- **Requires another source** (4 slots): R, W, VOWEL_ER (CC BY-SA 4.0, verified)
  and L (CC BY-SA 3.0, raster).
- **No acceptable source found** (2 slots): CH and J. Affricates are a movement
  (stop → fricative release); no static diagram for /tʃ/ or /dʒ/ exists in either
  set, and the one animated candidate is both the wrong sound and the wrong
  medium. This mirrors the diphthong problem already documented in the decision
  doc §9 and would need the same two-panel treatment, or commissioned artwork.

## 6. Quality finding — the downloaded images need cropping before they are shown

This was measured, not assumed, and it is the most important caveat in this
document.

The selected drawings are **whole-head** illustrations: the informative part
(tongue, teeth, lips) occupies a small area at the right of a large silhouette.
Rendered at the size the player actually uses — `w-32 h-32`, i.e. **128px** — the
articulators are a few pixels across, and two different sounds are
indistinguishable. Rendering θ (*think*), æ (*cat*) and the neutral tract at
128–250px produced images a student could not tell apart.

`public/assets/sounds/README.md` already sets the bar: an image must be
"readable at 128px". As downloaded, these are not.

**This is fixable and costs nothing legally**: CC0 permits modification without
conditions, so the `viewBox` can simply be cropped to the oral cavity. That is
deliberately **not** done in this phase, which was scoped to research, verify,
download and manifest. The files are therefore stored byte-identical to
upstream (SHA-256 recorded in the manifest), and the catalogue entry carries a
`note` saying the crop is required.

**No student is affected meanwhile**: `soundFeedbackEnabled` is `false`, so the
player shows the word-level lesson regardless. The crop must land before that
flag flips.

## 7. Downloaded assets

Eleven files, byte-identical to the upstream repository, in the existing
`public/assets/sounds/` structure under the catalogue's existing
SoundKey-based filenames. No existing file was overwritten — the directory
previously contained only `README.md`, and the copy step refuses to replace an
existing file.

| Local path | Upstream file | Bytes | SHA-256 (first 32) |
|---|---|---|---|
| `public/assets/sounds/th-voiceless.svg` | `midsaggital_articulations/consonants/svg/θ.svg` | 15503 | `884ab6beb24edde6cb45bee846b9c10f` |
| `public/assets/sounds/th-voiced.svg` | `…/consonants/svg/eth.svg` | 15950 | `6bc6009bbd04a7cb15567a71c8e3bc75` |
| `public/assets/sounds/f.svg` | `…/consonants/svg/f.svg` | 15272 | `1d7b5da25f1f34baf9e9d10ec64e7a30` |
| `public/assets/sounds/v.svg` | `…/consonants/svg/v.svg` | 15719 | `3bd653fcb32c49189a2f2ad728c0d735` |
| `public/assets/sounds/p.svg` | `…/consonants/svg/p.svg` | 15323 | `ec9124ec9b293c72905c0d9a072a1d8f` |
| `public/assets/sounds/b.svg` | `…/consonants/svg/b.svg` | 15770 | `c9d6231d3843cfcfbb9f526c88ba4f3d` |
| `public/assets/sounds/sh.svg` | `…/consonants/svg/ʃ_laminal.svg` | 15344 | `6c4ee59cc735286f6b7a9cba662e8520` |
| `public/assets/sounds/vowel-short-i.svg` | `…/vowels/svg/ɪ.svg` | 15810 | `1285ca99626c7d9ccde4311fb5e6d3c3` |
| `public/assets/sounds/vowel-long-e.svg` | `…/vowels/svg/i.svg` | 15781 | `4a1d2b3e2abd6da8afe02c74701d7085` |
| `public/assets/sounds/vowel-a-cat.svg` | `…/vowels/svg/æ.svg` | 15932 | `d793a814dddd9ad00fe82f22be6d062d` |
| `public/assets/sounds/vowel-mid-central.svg` | `…/consonants/svg/neutral.svg` | 15376 | `5958063a8cebcfb3b84663b06953273f` |

`vowel-mid-central.svg` is the neutral (rest-position) vocal tract, which is the
correct articulation for schwa and close enough for the STRUT vowel — exactly
the shared-slot decision recorded in the decision document §8. It is also the
slot where the §6 crop matters most, since a neutral tract is defined by the
*absence* of a constriction.

**No audio was downloaded.** All 18 isolated-sound slots remain `MISSING`; the
brief for this phase was images, and GoWord's TTS must not be substituted.

## 8. Attribution text required

**None.** Every downloaded file is CC0 1.0, which requires no attribution, so
`provenance.attribution` is `null` by the licence rather than by omission and
nothing has to be rendered next to the image.

Courtesy credit, if GoWord ever wants an acknowledgements page (optional, not
required):

> Articulation illustrations by Richard Wright and Dan McCloy, University of
> Washington — public domain (CC0 1.0).

If the CC BY-SA candidates in §4.2 are adopted later, attribution becomes
**mandatory and must be visible wherever the image is shown**, in the form:

> "Voiced alveolar approximant" by Tavin and Nardog, Wikimedia Commons,
> [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) — modified.

(Drop "modified" if the file is used unchanged.)

## 9. Unresolved licensing and sourcing questions

1. **CH and J have no source at all.** Not a licensing problem — the artwork
   does not exist in either set. Options: commission two two-panel images, or
   leave both at word-level teaching. A decision is needed, not more searching.
2. **Share-alike for R, W and ER.** Legally clear; the open question is whether
   GoWord accepts a visible attribution line and share-alike on any adaptation,
   for three slots in a second visual style. Product decision.
3. **/l/ has only a raster, CC BY-SA 3.0, third-style candidate.** Weakest of
   all the gaps; commissioning is probably better than adopting it.
4. **The UW origin PDF is a dead link** (§4.1). The CC0 grant does not depend on
   it, but the 2011 provenance trail cannot be inspected first-hand any more.
5. **Cropping (§6) must happen before sound feedback is enabled**, and if the
   cropped files are committed, their SHA-256 will no longer match upstream —
   the manifest must then record them as modified derivatives of the CC0
   originals (permitted, but it should be written down rather than silently
   diverge).

---

## §Cards — supplied bilingual teaching cards (2026-09-17)

Everything above (§§1–14) concerns the legacy per-sound *diagram* system —
one plain mid-sagittal SVG per sound, paired with separately-rendered title
and tip text. That system is now the **fallback**, kept fully working. The
**primary** visual for all 24 teaching targets is a different kind of asset,
recorded here.

### What was supplied

The product owner provided two master infographic sheets — one English, one
Arabic, `1312×1199` px, 6 columns × 4 rows, 24 sound cards each — as the
**final approved artwork**. Each card bakes its title, a photographic/
illustrated diagram, and the full instructional paragraph into one image.
This is GoWord's own commissioned/authored artwork: there is no third-party
licence to verify, only provenance to record (`source: "Supplied by the
GoWord product owner…"`, `license: "GoWord-owned"`, `attribution: null`,
`commercialUse: true`).

### Extraction

Grid geometry was **measured**, not assumed: column and row boundaries were
located by scanning pixel brightness/variance across the full master image in
a real image-processing pass (not eyeballed), landing on
`COLS = [(2,215),(215,432),(432,645),(645,861),(861,1082),(1082,1310)]` and
`ROWS = [(10,298),(298,589),(589,872),(872,1180)]`, splitting exactly at each
gutter's midpoint so no card border, glow, icon, arrow, diagram or text is
clipped and no gap is left between neighbours. Verified by rendering a full
24-card contact sheet for both languages before proceeding (sent to the
product owner for QA) — every card's border is a complete rounded rectangle,
no neighbouring content bleeds in.

24 cards × 2 languages = **48 files**, saved under
`public/assets/sounds/cards/<soundkey-stem>-<en|ar>.png` (e.g. `p-en.png`,
`th-voiced-ar.png`, `vowel-schwa-en.png`) — the same kebab-case stems the
legacy SVGs already use, so the naming convention is not duplicated, only
extended with a locale suffix.

### The one modification: removing IPA from vowel titles

The six vowel cards' titles carried IPA in parentheses — `"Short I (ɪ)"`,
`"Long E (eɪ)"`, `"A (æ)"`, `"ER (ɜ)"`, `"Schwa (ə)"`, `"Strut (ʌ)"` — which
conflicts directly with GoWord's standing, tested rule that IPA is never
shown to students. Per the product owner's explicit decision, the
parenthetical was masked out of the image (not the whole card discarded, not
the whole title removed): a background-matched fill painted over exactly the
`(X)` glyph cluster, sampled per-row from a genuinely empty column on the
same card so the fill matches the local gradient, leaving the border, the
English word ("Short I", "Long E", "A", "ER", "Schwa", "Strut"), the diagram
and every instruction untouched. Glyph bounding boxes were **measured**
per-card (a naive fixed offset clipped real letters on the first attempt and
left visible fragments on the second; the third pass scanned actual glyph
pixel columns per card and used the true bounds) and verified by rendering
each masked title at the player's real size before committing. No other card
— none of the 18 consonant cards, none of the AR titles' "sound" suffix — was
touched.

### Integration

- `PronunciationSound` gained an optional `card?: { en: SoundAsset; ar:
  SoundAsset }`, additive alongside the existing `imageAsset`/`imageSequence`
  fields, which are untouched for every sound.
- `usableCard(sound, locale)` is the gate: same licence-check semantics as
  `isUsableAsset()`, evaluated per locale so a missing/broken file for one
  language degrades to the fallback system for that language only, never to
  showing the other language's card.
- The component checks the card first; when usable, it renders **only** that
  image (full width, `object-contain`, no duplicated label/tip text — the
  card already contains them, correctly localized) with the reader's own
  locale, then falls back to the two-stage sequence, then the single legacy
  diagram, then the word-level lesson, exactly as before for any sound
  without a usable card.
- `CH` and `J`'s cards already show both articulation stages in one image
  (numbered 1/2 panels baked into the art), so the card supersedes the coded
  `imageSequence` fallback rather than needing to reproduce it. `R`'s card
  likewise shows both the Retroflex and Bunched approaches in one image.
- RTL: verified by rendering the actual card markup with the page in
  `dir="rtl"` — the card is one flat image, so there is nothing to mirror or
  reorder; it displays identically regardless of page direction, and the
  English sound-name convention inside the Arabic card ("TH (voiceless)")
  matches the project's existing rule that sound names stay English.

### Inventory consequence

The master sheets cover 24 sounds, not the 18 the catalogue had. `T`, `D`,
`K`, `G`, `S`, `Z` are added as full teaching targets — see
`docs/pronunciation/TEACHING_INVENTORY_DECISION.md` §15 for the reasoning and
the corrected totals.

### Still not done

**Audio.** No isolated-phoneme audio was sourced in this phase either. The
network was open, but that was never the real blocker: confirming a
recording is genuinely isolated and the correct General American phoneme
requires listening to it, which this environment cannot do with confidence
for any candidate. All 24 targets' `isolatedSoundAudio` stay `MISSING`.
