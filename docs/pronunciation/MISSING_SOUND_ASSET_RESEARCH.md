# Missing articulation assets — research for the six open slots

Research only. **No asset was downloaded, no manifest or catalogue entry was
touched, no production file changed.**

Scope: the six image slots left open by
[`SOUND_ASSET_RESEARCH.md`](./SOUND_ASSET_RESEARCH.md) — `R`, `L`, `W`,
`VOWEL_ER`, `CH`, `J`. Researched 2026-09-16.

---

## 0. Method and network conditions

Network access changed **again** this session, in the opposite direction to the
previous phase:

| Host | Previous phase | This session |
|---|---|---|
| `api.github.com`, `github.com` | 200 | **200** (repo-scoped API; anonymous git reads work) |
| `raw.githubusercontent.com` | 200 | **200** |
| `commons.wikimedia.org` | 200 | **blocked (no route)** |
| `upload.wikimedia.org` | 200 | **blocked (no route)** |
| `en.wikipedia.org` | 200 | **blocked (no route)** |

**Consequence:** the CC BY-SA candidates on Wikimedia (Tavin & Nardog, Spazzo)
**could not be re-verified at source today**. They were verified at source in
the previous phase, and that verification is cited as such — it is not repeated
work, and nothing new is claimed about them here.

What *was* done this session, first-hand:

- Cloned the CC0 source repository and confirmed its identity
  (`git remote get-url origin` → `https://github.com/drammock/phonetics-teaching-assets`,
  HEAD `4d02e4aadcef2f8f6b92d2e55b43e8d61e8ce39e`).
- Read `LICENSE` in the clone: full **CC0 1.0 Universal** legal code.
- **Enumerated every file in the set** rather than relying on the previous
  phase's summary (§1). This changed three of the six conclusions.
- Confirmed all 11 already-downloaded assets are **byte-identical** to their
  upstream originals (11/11 SHA-256 match), which is what lets style match be
  asserted rather than guessed for anything else from the same repo.
- Inspected candidate SVG structure (dimensions, `viewBox`, `<text>` count,
  path composition) — metadata only. No rendering, no cropping, per the brief.

---

## 1. The CC0 set, fully enumerated

The previous phase reported "44 drawings" and listed the six sounds as
uncovered. The complete listing from the clone:

**`midsaggital_articulations/consonants/svg/` (37 files)**

```
b  c  d  eth  f  g  k  kǃ_1  kǃ_2  kǃ_3  m  n  neutral  p  q
r_retroflex  s_apical  s_laminal  t  v  z_apical  z_laminal
ç  ħ  ŋ  ɟ  ɢ  ɲ  ɴ  ʁ  ʃ_apical  ʃ_laminal  ʒ_apical  ʕ  ʝ  θ  χ
```

**`midsaggital_articulations/vowels/svg/` (7 files)**

```
a  i  u  æ  ɛ  ɪ  ʊ
```

Three findings follow that the previous phase did not record:

1. **`r_retroflex.svg` exists.** The set is not silent on English R.
2. **`t`, `c`, `d`, `ɟ`, `ʃ_apical`, `ʃ_laminal`, `ʒ_apical` all exist** — i.e.
   both components of both affricates are present, in style, under CC0.
3. **No `l`, no `ɫ`, no `w`, no `ɜ`/`ɝ`.** Those gaps are real and confirmed by
   exhaustive listing, not inference.

Upstream will not close them. The repository README states the illustrations are
distributed as-is and that requests for additions will be refused, so the set is
final.

**Every file shares one geometry** — `173.03751mm × 244.73958mm`,
`viewBox="0 0 173.03751 244.73958"`, 5 `<path>` elements, **0 `<text>`
elements** — identical to the 11 files already in `public/assets/sounds/`.
Anything taken from this repository is therefore **STYLE MATCH: HIGH** by
construction, and carries no phonetic notation to leak into the student UI.

A structural detail worth recording, because it bears on R (§2.1): path index 2
differs systematically between voiced and voiceless drawings — 786 characters in
`d`, `n`, `ʒ_apical`; 339 in `t`, `p`, `θ`, `ʃ_*`, `neutral`. It appears to encode
larynx state. **`r_retroflex.svg` carries the 339 (voiceless-pattern) path**,
which is unexpected for an approximant and is the main thing needing eyes on it.

---

## 2. Candidate table

| SoundKey | Candidate | Source | Creator | License | Attribution | Style Match | Pedagogical Fit | Status |
|---|---|---|---|---|---|---|---|---|
| `R` | `consonants/svg/r_retroflex.svg` | [phonetics-teaching-assets](https://github.com/drammock/phonetics-teaching-assets) | Richard Wright, Dan McCloy (UW Linguistics) | CC0-1.0 | None required | **HIGH** | **MEDIUM–HIGH** (retroflex is one of two valid GA variants) | `NEEDS_REVIEW` |
| `R` (alt) | `Voiced alveolar approximant.svg` | Wikimedia Commons | Tavin, Nardog | CC BY-SA 4.0 | Required + share-alike | LOW | HIGH | `NEEDS_ATTRIBUTION` (not re-verified today) |
| `VOWEL_ER` | `consonants/svg/r_retroflex.svg` (shared with `R`) | same as above | Wright, McCloy | CC0-1.0 | None required | **HIGH** | **MEDIUM** (same rhotic gesture, sustained) | `NEEDS_REVIEW` |
| `VOWEL_ER` (alt) | `Bunched r.svg` | Wikimedia Commons | Tavin, Nardog | CC BY-SA 4.0 | Required + share-alike | LOW | HIGH | `NEEDS_ATTRIBUTION` (not re-verified today) |
| `W` | `vowels/svg/u.svg` | same repo | Wright, McCloy | CC0-1.0 | None required | **HIGH** | **MEDIUM** (glide counterpart of [u]) | `NEEDS_REVIEW` |
| `W` (alt) | `Voiced labial-velar approximant.svg` | Wikimedia Commons | Tavin, Nardog | CC BY-SA 4.0 | Required + share-alike | LOW | HIGH | `NEEDS_ATTRIBUTION` (not re-verified today) |
| `L` | — (nothing in the CC0 set) | — | — | — | — | — | — | **`NO_ACCEPTABLE_SOURCE`** |
| `L` (alt) | `Non-velarised l.png` | Wikimedia Commons | Spazzo | CC BY-SA 3.0 | Required + share-alike | LOW (raster, 3rd style) | HIGH | `NEEDS_REVIEW` (not re-verified today) |
| `CH` | Two panels: `t.svg` **or** `c.svg` → `ʃ_laminal.svg` **or** `ʃ_apical.svg` | same repo | Wright, McCloy | CC0-1.0 | None required | **HIGH** | **HIGH as two panels / LOW as one** | `NEEDS_REVIEW` |
| `J` | Two panels: `d.svg` **or** `ɟ.svg` → `ʒ_apical.svg` | same repo | Wright, McCloy | CC0-1.0 | None required | **HIGH** | **HIGH as two panels / LOW as one** | `NEEDS_REVIEW` |

Nothing is `VERIFIED` yet. Every CC0 candidate has a clean licence but needs one
visual confirmation that cannot be done here (rendering is out of scope for this
session, and for `L` there is no candidate at all).

---

## 3. Recommendations per sound

### 3.1 R — `NEEDS_REVIEW`, promising

**Use `r_retroflex.svg` from the CC0 set, if a visual check confirms it.**

The previous phase recorded this slot as uncovered and went to a CC BY-SA
source. The file exists, and the phonetics support it: General American /ɹ/ has
two standard realisations — **retroflex** (tongue tip raised/curled toward the
alveolar ridge) and **bunched/molar** (tongue body humped). They are
[acoustically and perceptually indistinguishable in the first three formants](https://pmc.ncbi.nlm.nih.gov/articles/PMC2680662/)
and speech-language pedagogy routinely teaches
[whichever one the learner produces more easily](https://thepedispeechie.com/2020/10/retroflex-r-vs-bunched-r-in-speech-therapy.html).
A retroflex diagram is therefore a legitimate GA R teaching image, not a
dialectal mismatch.

Two things to confirm on the laptop before adopting:

1. **Does it depict the approximant?** The filename says "retroflex" but not
   which manner. The set contains no other retroflex sound, so it is probably
   the approximant, but this is an inference from absence.
2. **The larynx path anomaly (§1).** The file carries the voiceless-pattern path
   while English /ɹ/ is voiced. Either the author did not vary larynx state for
   approximants, or the drawing is of something else. Worth 30 seconds of
   looking.

If both check out: CC0, no attribution, perfect style match, and the CC BY-SA
dependency for this slot disappears.

**Caveat to carry into the UI phase:** a retroflex-only image teaches one of two
valid shapes. The accompanying tip text should not insist on curling the tongue
as the only way.

### 3.2 VOWEL_ER — `NEEDS_REVIEW`, contingent on R

**/ɝ/ is the same rhotic gesture as /ɹ/, held as a syllable nucleus**, so the R
diagram is the articulatorily correct picture. Reusing `r_retroflex.svg` for
both slots has direct precedent in this project: `VOWEL_STRUT` and
`VOWEL_SCHWA` already share `vowel-mid-central.svg` by an explicit recorded
decision.

**On the dialect trap the brief flags:** there is no risk of grabbing British
non-rhotic /ɜː/ from this set — its seven vowels are `a i u æ ɛ ɪ ʊ`, and none is
`ɜ`. Any candidate for this slot must show **tongue retraction/bunching with
r-colouring**; a plain mid-central vowel with no rhotic gesture (which is what a
British /ɜː/ diagram shows) is the wrong sound and must be rejected on sight.
Note that `vowel-mid-central.svg` — already in the project — is exactly such a
non-rhotic neutral tract, so **it must not be reused for `VOWEL_ER`**.

### 3.3 W — `NEEDS_REVIEW`, reasonable CC0 option

The set has no `w`. But **[w] is the non-syllabic counterpart of [u]** — the same
lip rounding and the same high-back tongue position — and `vowels/svg/u.svg`
exists in the CC0 set. For the two things the brief asks a W image to show (lip
rounding, tongue position) this is articulatorily correct.

The honest limitation: it is a *vowel* drawing, so it shows the steady posture
and not the glide off it, and it would be the same picture the `u` sound would
use if `UW` ever became a teaching target (it is not one today, so there is no
collision). Weigh against the CC BY-SA `Voiced labial-velar approximant.svg`,
which is purpose-drawn but brings attribution, share-alike, and a second visual
style for one slot.

### 3.4 L — `NO_ACCEPTABLE_SOURCE` within the CC0 set

Confirmed by exhaustive listing: no `l`, no `ɫ`, no lateral of any kind. This is
the one slot with no CC0 answer.

**Do not substitute `n.svg`.** It shows the right alveolar closure but is nasal:
the airflow is through the nose, whereas /l/'s defining property is *lateral*
oral airflow around the tongue sides. That would teach the wrong thing, which
the brief explicitly forbids.

Realistic options, in order:

1. **Accept the CC BY-SA 3.0 raster** (`Non-velarised l.png`, Spazzo) — needs
   visible attribution in the player and brings a third visual style and a
   raster into an SVG set.
2. **Commission or draw one** in the CC0 set's style. Since the base drawing is
   CC0, a new lateral can be produced by modifying an existing file's tongue
   path with no licence obligation at all, and it would match perfectly.
   Laterality needs a convention (e.g. a cross-section inset or an airflow
   arrow) because a mid-sagittal section cannot show side airflow by definition.
3. **Leave `MISSING`** and let the word-level fallback handle /l/. This is
   already the live behaviour and harms nobody.

Option 2 is the best long-term answer; option 3 is the correct interim state.

### 3.5 CH — `NEEDS_REVIEW`; **a single static image would be misleading**

**Stating this explicitly, as the brief asks: yes, one static diagram is
pedagogically wrong for /tʃ/.**

An affricate is a *sequence* — a complete closure, then release into a
homorangic fricative — so any single frame shows only half the sound. Picking
the closure frame teaches a student to stop; picking the fricative frame teaches
them to say "sh". Neither is /tʃ/.

**The CC0 set can supply both panels**, which is the finding that changes this
slot from "no source" to "workable":

| Panel | Candidate | Note |
|---|---|---|
| 1 — closure | `t.svg` (alveolar) or `c.svg` (palatal) | /tʃ/'s closure is *post-alveolar*, between the two. `t` is slightly too far forward, `c` slightly too far back. Neither is exact. |
| 2 — release | `ʃ_laminal.svg` or `ʃ_apical.svg` | `ʃ_laminal.svg` is already the project's `SH` asset, so reusing it visually links "CH ends like SH". |

Blocker: the player renders **one** image per sound. Two-panel support is a UI
change, explicitly out of scope for this phase and the next. Until then this
slot should stay `MISSING` rather than take a misleading single frame.

### 3.6 J — `NEEDS_REVIEW`; same conclusion as CH

Identical reasoning. Panels: `d.svg` (or `ɟ.svg`) → `ʒ_apical.svg`.

One consistency wrinkle to decide: the set has `ʃ_apical` **and** `ʃ_laminal`
but only `ʒ_apical`. If CH uses `ʃ_laminal` (matching the existing `SH` asset)
while J uses `ʒ_apical`, the two affricates' release panels are drawn with
different tongue postures for no reason a student could interpret. Using
`ʃ_apical` + `ʒ_apical` keeps the pair internally consistent at the cost of not
matching the `SH` slot. This is a judgement call for the artwork phase, not a
licensing one.

---

## 4. Best complete source found

**Still Wright & McCloy, `drammock/phonetics-teaching-assets`, CC0-1.0** — and it
covers more than was previously credited. With `r_retroflex` and the affricate
component pairs, it can reach **16 of 17 slots** (all but `L`), in one visual
style, under one unconditional licence, with no attribution burden and no
share-alike.

No new complete set was found. Searches surfaced only the same two Wikimedia
families already assessed.

Licence chain, verified first-hand this session:

| Question | Answer | Evidence |
|---|---|---|
| Creator | Richard Wright, Dan McCloy (UW Linguistics, c. 2010) | repo `README.md` in the clone |
| Source URL | https://github.com/drammock/phonetics-teaching-assets | `git remote get-url origin` on the clone |
| Licence | CC0 1.0 Universal | `LICENSE` in the clone — full legal code |
| Licence URL | https://creativecommons.org/publicdomain/zero/1.0/ | CC0 deed referenced by the legal code |
| Modification | Permitted, unconditionally | CC0 waives all rights |
| Commercial use | Permitted | CC0 |
| Attribution | **Not required** | CC0 |

---

## 5. Unresolved licensing issues

1. **The CC BY-SA candidates could not be re-verified today** — Wikimedia is
   unreachable from this session (§0). Their licences were read at source in the
   previous phase; nothing here adds to or subtracts from that. If any of them is
   actually adopted, re-verify at the file page first.
2. **No CC0 answer exists for `L`.** Every route to filling it either adds a
   licence obligation or requires new artwork.
3. **Adopting any CC BY-SA asset changes the product, not just the file**: the
   attribution must be rendered wherever the image appears, and any recolour or
   crop for the dark theme makes that adaptation CC BY-SA too. The existing
   assets carry no such obligation.
4. **Not a licensing issue but it gates everything**: the 11 downloaded files
   still need the `viewBox` crop recorded in `SOUND_ASSET_RESEARCH.md` §6 before
   any of them is legible at the 128px the player uses. CC0 permits that freely.

## 6. Do CH and J need special two-stage artwork?

**Yes.** Not because of licensing — because of phonetics. Affricates are a stop
followed by a homorganic fricative release; a static mid-sagittal section can
represent exactly one instant, so it necessarily shows either the stop or the
fricative and mislabels it as the whole sound.

Two panels from the existing CC0 set solve the artwork problem. They do not
solve the **UI** problem: `PronunciationStudyActivity` renders a single `<img>`
per sound, and the catalogue models one `imageAsset` per `SoundKey`. Supporting
a sequence means a data-model and component change, which this phase and the
immediate next one must not make.

The same argument applies to diphthongs if they ever become teaching targets —
already recorded in the inventory decision document.

---

## 7. Exact next local action for the laptop phase

In order, and nothing beyond it:

1. **Render `r_retroflex.svg` and look at it.** Confirm (a) it shows a retroflex
   *approximant* tongue posture, and (b) whether the larynx detail contradicts
   voicing (§1). This single check decides `R` and, through it, `VOWEL_ER` — and
   determines whether the CC BY-SA dependency can be dropped entirely.
2. **Render `vowels/svg/u.svg`** and judge whether the lip rounding reads
   clearly enough to serve `W`.
3. **Do the §4 crop work** on the 11 existing files first, since a cropped
   `viewBox` is what makes any of these judgeable at 128px. Crop candidates the
   same way before deciding.
4. **Only then** copy accepted files into `public/assets/sounds/`, update
   `sounds.ts` provenance and the manifest together, and let `isUsableAsset()`
   gate them.
5. **Leave `L`, `CH`, `J` `MISSING`** for now. `CH`/`J` are blocked on two-panel
   UI support; `L` is blocked on a licence decision or new artwork. All three
   fall back to the word-level lesson, which is live behaviour today.
6. **Do not flip `soundFeedbackEnabled`.** It remains blocked on Arabic-L1
   attribution validation, independent of assets.

## 8. Sources

First-hand this session:

- `https://github.com/drammock/phonetics-teaching-assets` — cloned, HEAD
  `4d02e4a`; `LICENSE` (CC0 1.0 full legal code), `README.md`, complete file tree
- Local: `public/assets/sounds/` (11 files, SHA-256 matched to upstream)
- [`SOUND_ASSET_RESEARCH.md`](./SOUND_ASSET_RESEARCH.md),
  [`TEACHING_INVENTORY_DECISION.md`](./TEACHING_INVENTORY_DECISION.md)

Consulted via web search (Wikimedia and most academic hosts were unreachable, so
these informed the phonetic reasoning, not any licence claim):

- [MRI study of retroflex vs bunched American /r/ (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC2680662/)
- [Retroflex R vs Bunched R in speech therapy](https://thepedispeechie.com/2020/10/retroflex-r-vs-bunched-r-in-speech-therapy.html)
- [Bunched R vs. Retroflex R: which to teach](https://peachiespeechie.com/blogs/posts/bunched-r-vs-retroflex-r-which-one-should-i-teach)
- [*Essentials of Linguistics* 2e, 3.4 Manner of articulation](https://ecampusontario.pressbooks.pub/essentialsoflinguistics2/chapter/3-4-describing-consonants-manner/)
- [HKBU animated glossary — Affricate](https://digital.lib.hkbu.edu.hk/linguisticglossary/PDF-HO/Affricate.pdf)
- [SFU LING 221 lecture 3 — phonetics](https://www.sfu.ca/~mcrobbie/Ling221/Lecture3.pdf)
