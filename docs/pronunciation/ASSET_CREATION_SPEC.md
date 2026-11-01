# Asset creation specification

For articulation images that **cannot be found** and must eventually be drawn.

**Nothing was created in this session.** No image was generated, no SVG was
modified, no file was added to `public/assets/sounds/`, and the manifest was not
touched. This document is the specification only.

Companion research: [`CLOUD_ASSET_RESEARCH_RESULTS.md`](./CLOUD_ASSET_RESEARCH_RESULTS.md).
Execution order: [`LOCAL_ASSET_EXECUTION_PLAN.md`](./LOCAL_ASSET_EXECUTION_PLAN.md).

---

## 1. Why creation is on the table at all

Searching is exhausted for one sound. The CC0 baseline set
([`drammock/phonetics-teaching-assets`](https://github.com/drammock/phonetics-teaching-assets),
HEAD `4d02e4a`, CC0-1.0 verified in the clone) contains 37 consonants and 7
vowels, and **none of them is a lateral**. Upstream will not add one — the README
states the illustrations are distributed as-is and that requests for additions
will be refused.

Everything else can be sourced. Only `L` genuinely requires new artwork, and one
open question (`CH`/`J` composition) requires assembly rather than drawing.

---

## 2. Style specification — measured from all 44 CC0 files

This is not a description of how the drawings look to the eye (nothing was
rendered). It is the **exact, machine-read specification** every file in the set
conforms to, so new artwork can match it precisely.

### 2.1 Document

| Property | Value | Consistency |
|---|---|---|
| Format | SVG 1.0, `standalone="no"` | 44/44 |
| `viewBox` | `0 0 173.03751 244.73958` | **44/44 identical** |
| `width` / `height` | `173.03751mm` × `244.73958mm` | 44/44 |
| Aspect ratio | 0.707 (portrait, ≈1:√2) | 44/44 |
| Path count | **exactly 5** | 44/44 |
| `<text>` elements | **0 across the entire set** | 44/44 |
| Raster content | none — pure vector | 44/44 |
| Background | none — transparent, no backdrop rect | 44/44 |
| Metadata | Dublin Core stub + an unused `WMFhbasepattern` (WMF export residue) | 44/44 |

The absence of `<text>` matters: it is what keeps the "no IPA shown to students"
rule safe automatically. **New artwork must also contain zero `<text>`.**

### 2.2 Colour and stroke — the entire palette is two greys

| Role | Value | Occurrences |
|---|---|---|
| Fill (anatomy) | `#e6e6e6` `fill-opacity:1` `fill-rule:nonzero` | 176 (4 paths × 44) |
| Fill (larynx line) | `none` | 44 (1 path × 44) |
| Stroke (everything) | `#666666` `stroke-opacity:1` | **220 — every path in the set** |
| Stroke width (anatomy) | `0.35277778px` (= 1 pt) | 176 |
| Stroke width (larynx) | `0.70555556px` (= 2 pt, exactly double) | 44 |
| `stroke-linecap` / `stroke-linejoin` | `round` / `round` | 220 |
| `stroke-miterlimit` | `4` | 220 |
| `stroke-dasharray` | `none` | 220 |

**No colour anywhere. No gradients. No arrows. No shading. No labels.** Light-grey
filled silhouettes with a mid-grey 1 pt outline, and one unfilled 2 pt line for
the larynx. Visual density is deliberately low.

### 2.3 Path roles — decoded by differencing all 44 files against `neutral.svg`

| Index | Distinct values in 44 files | Role | Fill | Stroke width |
|---|---|---|---|---|
| `path[0]` | **1 — constant** | head / face outline | `#e6e6e6` | 1 pt |
| `path[1]` | **1 — constant** | fixed anatomy (skull, nasal cavity, pharynx wall) | `#e6e6e6` | 1 pt |
| `path[2]` | 2 | **larynx / voicing marker** — 339 chars voiceless, 786 voiced | `none` | 2 pt |
| `path[3]` | 4 | **velum** (lowered for nasals `m`, `n`, `ŋ`, `ɲ`, `ɴ`) | `#e6e6e6` | 1 pt |
| `path[4]` | 27 | **the moving articulator — tongue AND lips** | `#e6e6e6` | 1 pt |

Two consequences for anyone drawing a new file:

1. **A new sound is a new `path[4]`** (plus the right `path[2]`/`path[3]` state
   picked from existing files). Paths 0 and 1 are copied byte-for-byte. This is
   what guarantees the set stays coherent.
2. **`path[4]` carries the lips.** Verified: `p`, `b` and `m` share one identical
   lip geometry (bilabial); `f` and `v` share a different identical one
   (labiodental); both differ from `neutral`. So lip articulation is expressible
   without inventing a new path.

### 2.4 Anatomical abstraction level

- **Mid-sagittal section**, head in profile, **facing right** (articulators at
  high x; pharynx/larynx at low x). Confirmed by the measured x-positions of each
  sound's maximum tongue raise: `k` peaks at x≈95 (back/velar), `t` at x≈145
  (front/alveolar), `ʃ`/`ʒ` at x≈140 (postalveolar), `θ` shallow at x≈150 (tip
  forward). Every one lands where its phonetics says it should.
- **Teeth are not individually drawn** — they are implied by the jaw/lip contour.
- **No tongue interior detail**, no muscle, no annotation.
- **No airflow indication of any kind.** This is the single most important gap
  for `L` (§3.1).

### 2.5 Dark-theme note

Fill `#e6e6e6` on the app's dark surface (`bg-gray-100` = `#111827`) reads as a
light silhouette with a slightly darker `#666666` edge — probably acceptable, but
**this has not been rendered and must be checked**. CC0 permits recolouring
freely if it is not.

---

## 3. Assets that must eventually be created

### 3.1 `L` — /l/, *light* — **MUST BE CREATED. No source exists.**

| | |
|---|---|
| SoundKey | `L` |
| Target phoneme | /l/ — voiced alveolar lateral approximant |
| Slot | `/assets/sounds/l.svg` (currently `MISSING`) |
| One image or two-stage | **One** |
| Base CC0 asset | `midsaggital_articulations/consonants/svg/n.svg` |
| Licence to derive | **CC0-1.0 — unconditional.** Modification, commercial use and redistribution all permitted, no attribution required. GoWord may distribute the result freely. |

**Articulation requirements.** Tongue tip/blade makes firm contact with the
alveolar ridge, blocking airflow **on the midline**; air escapes **around one or
both sides** of the tongue. Voiced. Velum raised (oral, not nasal).

**Why `n.svg` is the right base and not `t`/`d`.** `n` already has the correct
alveolar closure geometry and the correct voiced larynx state. What is wrong
about it is only `path[3]` — its velum is **lowered** (nasal). Swapping
`path[3]` for the raised-velum variant used by `t`/`d` gives an anatomically
correct voiced alveolar **oral** stop, which is exactly the tongue posture /l/
needs.

**Required modifications, in order:**

1. Copy `n.svg`.
2. Replace `path[3]` with the raised-velum path from `d.svg` (voiced, oral).
   Keep `path[2]` from `n.svg`/`d.svg` (786-char voiced larynx).
3. **Add a laterality indication.** This is the part that does not exist anywhere
   in the set and is the whole reason this file must be drawn rather than copied.

**The hard problem, stated honestly.** A mid-sagittal section is a slice down the
**midline**. /l/ is defined by airflow around the tongue's **sides**. The
projection is geometrically incapable of showing it — this is a limitation of the
view, not of this particular set. Three candidate conventions:

| Convention | Pros | Cons |
|---|---|---|
| **A. Coronal inset** — small front-view cross-section in a corner showing air gaps at both sides | Anatomically honest; shows the actual mechanism | Adds a second projection; no precedent in the set; hard to read at 128px |
| **B. Airflow arrows** curving around the tongue sides | Simple; readable small | The set contains **zero** arrows anywhere — introduces a new visual primitive |
| **C. Partial-transparency / cutaway** of the tongue side | Stays one projection | Ambiguous; may read as an error rather than a feature |

**Recommendation: B, minimally.** One or two arrows in the existing `#666666`
stroke at 1 pt, `stroke-linecap:round`, no arrowhead fill beyond a simple stroked
head. It introduces a new primitive but keeps one projection, one palette and one
line weight, and it is the only option that stays legible at 128px. **Decide by
rendering A and B side by side before committing.**

**Acceptance criteria — all must hold:**

- [ ] Alveolar contact visibly on the midline (tongue tip touches the ridge).
- [ ] Velum **raised** — it must not read as nasal. This is the specific error to
      avoid; `n.svg` unmodified would teach /n/.
- [ ] Voiced larynx state (`path[2]` = 786-char variant).
- [ ] Laterality communicated by the chosen convention.
- [ ] `viewBox`, fills, strokes and widths exactly per §2.
- [ ] Zero `<text>` elements.
- [ ] Distinguishable from `n.svg` and `d.svg` at 128px.

**If laterality cannot be communicated legibly, leave the slot `MISSING`.** §5.

### 3.2 `CH` and `J` — assembly, not drawing

Neither needs new artwork. Both panels already exist in the CC0 set:

| Slot | Panel 1 (closure) | Panel 2 (fricative release) |
|---|---|---|
| `CH` /tʃ/ | `t.svg` (alveolar) or `c.svg` (palatal) | `ʃ_laminal.svg` or `ʃ_apical.svg` |
| `J` /dʒ/ | `d.svg` (voiced alveolar) or `ɟ.svg` (voiced palatal) | `ʒ_apical.svg` |

/tʃ/'s true closure is **post-alveolar**, between `t` and `c`; neither is exact,
and `t` is the more familiar shape to a learner.

**Consistency decision required:** the set has `ʃ_apical` **and** `ʃ_laminal` but
only `ʒ_apical`. Either `ʃ_laminal` + `ʒ_apical` (CH's release matches the
existing `SH` lesson, but the affricate pair is internally inconsistent) or
`ʃ_apical` + `ʒ_apical` (pair consistent, CH no longer matches `SH`). This is an
artwork judgement, not a licensing one.

**What blocks it is the UI, not the assets** — see §4.

### 3.3 Nothing else requires creation

`R`, `W` and `VOWEL_ER` all have CC0 candidates already identified
(`r_retroflex.svg`, `u.svg`, and `r_retroflex.svg` shared). They need **visual
verification**, not artwork. If one fails verification it moves into this
document; until then, do not draw anything for them.

---

## 4. Recommended data model for two-stage images

**Conceptual only — do not change the schema in this phase.**

Today `PronunciationSound.imageAsset` is a single `SoundAsset`, and the component
renders one `<img>`. A shape that supports sequences without breaking the 16
single-image slots:

```ts
// CONCEPTUAL — not the real schema yet.
type ArticulationImage =
  | { type: "single"; image: SoundAsset }
  | { type: "two-stage"; start: SoundAsset; end: SoundAsset;
      /** Which phase each panel shows, for the caption and for a11y. */
      stages: { start: "closure"; end: "release" } };
```

Design notes worth carrying forward:

- **Keep `isUsableAsset()` as the gate, per panel.** A two-stage entry is usable
  only when **both** panels pass. A half-rendered affricate is worse than the
  word-level fallback.
- **Presentation: two static panels side by side**, in reading order, with a
  connector between them. Ruled out: a short animation (needs new tooling,
  autoplay/reduced-motion issues, and a student cannot pause on a frame) and a
  single blended frame (the misleading option this whole design exists to avoid).
- **RTL:** panel order must follow the *phonetic* sequence, not the text
  direction. Closure always precedes release. Do **not** mirror the panels in
  Arabic — a mirrored mouth diagram is anatomically wrong, and reversing the
  order would teach the sound backwards.
- **Caption:** English sound label as today, with the two panels labelled from
  `stages`, in the student's locale. Still no IPA.

---

## 5. Rules that override everything above

1. **Phonetic accuracy beats a complete asset count.** A missing image falls back
   to the word-level lesson, which is live behaviour today and harms nobody. A
   misleading one teaches the wrong articulation to every student who sees it.
2. **Never reuse a wrong-manner diagram to fill a slot.** Specifically: `n` is
   nasal, `t`/`d` are complete oral closures — none of them is /l/.
   `vowel-mid-central.svg` is a non-rhotic neutral tract — it is not
   `VOWEL_ER`.
3. **No AI image generation.** New artwork is either derived from the CC0 set by
   hand or commissioned.
4. **New artwork must belong to the same system** — §2 is the contract. Not a
   medical illustration, not a cartoon, not a photo, not a different IPA chart.
5. **A file on disk is never enough.** `status: "AVAILABLE"` requires complete
   provenance, and `isUsableAsset()` enforces it. A derived file's provenance
   records the CC0 base **and** that GoWord modified it.

## 6. Provenance for derived work

A file derived from the CC0 set is GoWord's own work built on a public-domain
base. Suggested shape, to be filled in when the file actually exists:

```
source:        "Derived from drammock/phonetics-teaching-assets <file>.svg (CC0-1.0)"
license:       "CC0-1.0"     // the base imposes nothing; GoWord may licence the derivative freely
attribution:   null          // not required by the base licence
commercialUse: true
verifiedOn:    "<date the derivation was reviewed>"
verifiedBy:    "<who reviewed it>"
```

Courtesy credit remains optional, never required:

> Articulation illustrations by Richard Wright and Dan McCloy, University of
> Washington — public domain (CC0 1.0).
