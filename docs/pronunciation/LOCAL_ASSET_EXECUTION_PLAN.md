# Local execution plan — pronunciation assets

> **STATUS: executed.** Findings and evidence are in
> [`LOCAL_ASSET_VERIFICATION_RESULTS.md`](./LOCAL_ASSET_VERIFICATION_RESULTS.md).
> The checklist below is kept as a record of what was planned; ✅/❌ marks the
> outcome of each item.

For the laptop session. Everything here needs something the cloud could not do:
a renderer, a browser, a microphone, or a network that reaches Wikimedia.

Research behind it: [`CLOUD_ASSET_RESEARCH_RESULTS.md`](./CLOUD_ASSET_RESEARCH_RESULTS.md).
Do not re-do that research — it is first-hand where it says so.

**Two rules that hold for the whole session:**

- **`soundFeedbackEnabled` stays `false`** until the very end, and only flips
  after the separate Arabic-L1 attribution validation
  (`services/pronunciation-gopt/LIMITATIONS.md` §2). Assets alone never justify it.
- **An asset is only ever `AVAILABLE` with complete provenance.** `isUsableAsset()`
  is the gate; a file on disk means nothing on its own.

---

## Checklist

```
IMAGES — inspection
[x]  1. Crop existing CC0 SVGs            -> viewBox="60 88 110 112", scripted over all files
[x]  2. Render all selected SVGs at 128px (real bg-orange-50; dark mode does not exist - see results §0)
[x]  3. Verify articulation readability at 128px         -> confirmed legible
[x]  4. Verify no unwanted text/IPA        -> 0 <text> elements, checked directly
[x]  5. Inspect R visually    -> ACCEPT: gap confirmed via tight overlay vs t.svg
[x]  6. Inspect W visually    -> REJECT: path overlay proves u.svg has zero rounding info
[x]  7. Inspect ER visually   -> ACCEPT: shares R's image, retraction/bunching confirmed
[x]  8. Inspect L candidate   -> none existed; a derivative was produced (item 9)

IMAGES — creation and assembly
[x]  9. Resolve L: derived from d.svg (== n.svg's tongue + raised velum) + a laterality cue
[x] 10. Decide the CH/J release-panel pair -> sh.svg (=ʃ_laminal, reuses the live SH asset) + zʒ_apical
[x] 11. Implement two-stage CH representation
[x] 12. Implement two-stage J representation

ASSETS
[x] 13. Download approved image assets (16 files; W's rejection left w.svg undownloaded)
[x] 14. Process/optimize images (viewBox crop only, scripted; L additionally got the cue path)
[ ] 15. Download approved isolated audio assets  -> NOTHING approved: genuine isolation needs
        listening, which this environment cannot do regardless of network access
[ ] 16. Normalize audio format                    -> moot, nothing downloaded

WIRING
[x] 17. Update sound catalogue (status + full provenance, incl. a `derived()` helper for L)
[x] 18. Update manifest (regenerated from the catalogue; new sha256 for every cropped/derived file)
[x] 19. Run asset validation (build-time assertions in the manifest generator + unit tests)

VALIDATION
[x] 20. Run unit tests        -> 173 pass / 0 fail (was 172; net +1 after updating 3, adding 2)
[x] 21. Run build             -> succeeds
[~] 22. Test Study Mode       -> markup verified pixel-for-pixel against real assets in a real
        browser (see results §8-9); full live session (Firestore + recorder) not run - flagged
        as the concrete next step, not skipped silently
[x] 23. Test Arabic RTL       -> rendered: sequence row stays ltr and unmirrored under dir="rtl"
[x] 24. Test English LTR      -> rendered
[x] 25. Test dark mode        -> N/A: this app has no dark mode (verified, not assumed - results §0)
[x] 26. Test mobile layout    -> rendered at 375px, no overflow
[x] 27. Keep soundFeedbackEnabled disabled until final QA -> false in every commit; confirmed
        via git status after a local-only, reverted, uncommitted flip used to test the gate
```

**Specification for anything that must be drawn:**
[`ASSET_CREATION_SPEC.md`](./ASSET_CREATION_SPEC.md). It carries the measured
style contract (viewBox, the two-grey palette, 1 pt / 2 pt strokes, the five path
roles) that new artwork must satisfy to belong to the same set.

---

## 1. Crop the existing CC0 SVGs — **do this first**

Why first: the drawings are whole-head illustrations. At the `w-32 h-32` (128px)
the player actually uses, the articulators are a few pixels across and different
sounds are indistinguishable (`SOUND_ASSET_RESEARCH.md` §6, measured). **Every
visual judgement below is meaningless until this is done.**

The source is CC0, so cropping carries no licence obligation.

- All 44 files share one document geometry: `viewBox="0 0 173.03751 244.73958"`,
  `173.03751mm × 244.73958mm`, 5 paths, **0 `<text>` elements**.
- The informative region is roughly `x ∈ [95, 165]`, `y ∈ [120, 195]` in user
  units — the oral cavity from pharynx to lips. Derived from the measured extent
  of the moving articulator path (`path[4]`) plus the lip region; treat it as a
  starting guess and tune by eye.
- Crop by editing `viewBox` only. Do not re-path, do not rescale, do not rewrite
  the geometry — a `viewBox` change is reversible and reviewable.
- Files currently stored byte-identical to upstream with SHA-256 recorded in the
  manifest. **After cropping they are modified**: update `sha256`, and record in
  provenance that the file is a crop of the upstream original.

Optional but worth it: since only `viewBox` changes, script it over all files so
the crop is identical everywhere and the set stays visually consistent.

## 2–3. Render at 128px and check readability

Render every candidate and every cropped existing file at exactly 128×128, on
**both** theme backgrounds (the palette is dark-native — `bg-gray-100` is
`#111827`). The line art is grey-on-white upstream; confirm it survives on dark,
and if not, decide recolouring now (CC0 permits it freely).

Acceptance bar, from `public/assets/sounds/README.md`: a student must be able to
tell **which articulator is doing what** at 128px. A useful concrete test —
render `θ`, `æ` and `neutral` side by side; before cropping they were
indistinguishable, and that is the failure this step exists to catch.

## 4. Inspect R — `r_retroflex.svg`

Candidate: `midsaggital_articulations/consonants/svg/r_retroflex.svg`, CC0.

Already established in the cloud by measurement (not by looking): it is the only
file in the set combining a **raised front** (x≈135–140) with a **hollowed body**
(x≈100–125) — the textbook retroflex shape, and the thing that distinguishes
retroflex from bunched.

**Two things only you can settle:**

- **Does the tongue tip touch the palate?** It must NOT — /ɹ/ is an approximant.
  The cloud test was inconclusive because path ordering is not stable across the
  set (`ʃ_laminal` carries the tongue at `path[3]`, not `path[4]`), so the palate
  contour could not be isolated. Compare against `t.svg`, which *is* a contact.
- **The larynx marker.** `r_retroflex.svg` carries the voiceless `path[2]` (339
  chars) while /ɹ/ is voiced. Compare with `d.svg` (voiced, 786). If the
  difference is invisible at 128px it does not matter; if it is visible, it is
  wrong and the file should be rejected.

**If it passes:** CC0, no attribution, perfect style match, and the CC BY-SA
dependency disappears for both R and ER.
**If it fails:** fall back to Commons `Voiced alveolar approximant.svg` (Tavin &
Nardog, CC BY-SA 4.0) — **re-verify the licence at the file page first**, and
accept that attribution must then be rendered in the player.

**Carry into the tip text either way:** retroflex is one of two valid GA shapes.
Do not tell students curling the tongue is the only correct way.

## 5. Inspect W — `vowels/svg/u.svg`

Established in the cloud: the set **does** draw lips (`p`/`b`/`m` share one lip
geometry, `f`/`v` share another), and `u.svg` differs from `i.svg` in the front
region. What could not be established is whether the rounding is *salient*.

**Check:** render `u.svg` next to `i.svg` at 128px. If a student cannot see that
one is rounded and the other spread, `u.svg` fails.

**If it fails:** Commons `Voiced labial-velar approximant.svg` (CC BY-SA 4.0),
licence re-verified at source.

## 6. Inspect ER — `r_retroflex.svg` shared with R

Only proceed if R passed. Precedent for sharing one image across two lessons
already exists: `VOWEL_STRUT` and `VOWEL_SCHWA` share `vowel-mid-central.svg`.

**Acceptance criterion:** the image must show **tongue retraction/bunching with
r-colouring**.

**Hard rule — do not reuse `vowel-mid-central.svg` for `VOWEL_ER`.** It is the
neutral rest-position tract, i.e. a mid-central vowel with no rhotic gesture,
which is exactly what a British non-rhotic /ɜː/ looks like. That is the specific
error to avoid here.

## 7. Resolve L

No CC0 source exists. Confirmed by exhaustive listing of the set — no `l`, no
`ɫ`, no lateral of any manner — and upstream will not add one (the README refuses
additions).

**Do not substitute `n.svg`** (right place, nasal manner) or `t`/`d` (complete
oral closure — the opposite of a lateral).

The deeper problem: a mid-sagittal section is a midline slice, and /l/ is defined
by airflow around the tongue's **sides**. The projection cannot show it without
an added convention.

Options, in preference order:

1. **Draw one in the CC0 style.** Start from `n.svg`'s alveolar closure (correct
   geometry) and add a laterality convention — an airflow arrow, or a small
   coronal inset. Base is CC0, so the derivative carries no obligation and
   matches the set perfectly.
2. **Commons `Non-velarised l.png`** (Spazzo, CC BY-SA 3.0) — re-verify at
   source. Costs: raster in an SVG set, a third visual style, a third attribution
   chain, share-alike.
3. **Leave `MISSING`.** Current behaviour, falls back to the word lesson, harms
   nobody.

**Recommended: 3 now, 1 when there is artwork time.** Do not take 2 for one slot.

## 8–9. Two-stage CH and J — only if you decide to build it

**A single static frame is pedagogically wrong for both.** An affricate is a
closure released into a homorganic fricative; one frame teaches either a stop or
"sh", neither of which is /tʃ/.

Panels, all CC0, all in style:

| Slot | Panel 1 (closure) | Panel 2 (release) |
|---|---|---|
| `CH` | `t.svg` (alveolar) or `c.svg` (palatal) | `ʃ_laminal.svg` or `ʃ_apical.svg` |
| `J` | `d.svg` or `ɟ.svg` | `ʒ_apical.svg` |

/tʃ/'s closure is *post-alveolar*, between `t` and `c`; neither is exact, and `t`
is the more familiar shape.

**Consistency decision to make:** the set has `ʃ_apical` **and** `ʃ_laminal` but
only `ʒ_apical`. Either `ʃ_laminal` + `ʒ_apical` (CH's release matches the
existing `SH` lesson, but the affricate pair is internally inconsistent) or
`ʃ_apical` + `ʒ_apical` (pair consistent, CH no longer matches `SH`).

**This is blocked on the UI, not the artwork.** `PronunciationStudyActivity`
renders one `<img>` per sound and the catalogue models one `imageAsset` per
`SoundKey`. Supporting a sequence is a data-model plus component change.

**If you are not building two-panel support this session, leave CH and J
`MISSING`.** Shipping one misleading frame is worse than the word-level fallback.

## 10. Download approved image assets

Copy from the clone (`/home/user/drammock/phonetics-teaching-assets` in the cloud
session; re-clone locally) into `public/assets/sounds/` under the existing
SoundKey filenames. Never overwrite blindly — inspect anything already present,
and keep the old file if replacement is uncertain.

## 11. Download approved isolated audio assets

**Nothing is approved yet.** No audio source could be verified in the cloud —
Commons, Freesound and every archive host were unreachable.

Before downloading anything, at the original file page:

- creator, exact licence, licence URL, commercial-use and modification rights,
  attribution requirement;
- **listen to it** and confirm it is the sound in isolation, not a word, and not
  a TTS voice reading a label;
- for **CH and J**, confirm it is a true affricate (single closure, fricated
  release) and not a `[t]`+`[ʃ]` cluster;
- for **CH**, confirm it is *palato-alveolar* — Commons also carries
  *alveolar* (/ts/), *alveolo-palatal* (/tɕ/) and *palatal* (/cç/) affricates
  under near-identical names. Picking the wrong one teaches a non-English sound.
  **This is the easiest mistake in the whole audio set.**
- for **vowels**, confirm it is General American and not a cardinal-vowel
  demonstration. A cardinal [ɜ] for `VOWEL_ER` would be the audio version of the
  non-rhotic error in §6.

**Never substitute word audio, and never use GoWord's TTS.** Asked for "TH
sound" it says the English words, which teaches nothing about /θ/. TTS is for
full-word reference audio only.

If a slot does not verify, leave it `MISSING`.

**Note on CC BY-SA audio:** adopting it puts a visible credit line into the
student player wherever the clip is used. That is a product decision, not a file
copy — weigh it against leaving the slots empty, which is harmless today.

## 12–13. Update catalogue and manifest **together**

In `src/lib/pronunciation/sounds.ts`, set `status: "AVAILABLE"` **only** with
full `provenance`: `source`, `license`, `attribution` (`null` for CC0),
`commercialUse`, `verifiedOn`, `verifiedBy`. Mirror the same facts into
`docs/pronunciation/soundAssets.manifest.json`, including the new `sha256` for
any cropped file.

The two must not drift — there is a test asserting the manifest matches the
catalogue, and it exists precisely so nobody licences an image for a sound that
no longer exists.

## 14–16. Validation

```
npm run test:unit          # includes catalogue/manifest consistency + asset-gate tests
npx tsc --noEmit
npm run build
npx eslint <changed files>
```

Expect the sound-catalogue tests to need updating: there is currently a test
asserting **no** asset is presented as verified, which is deliberate and must be
changed on purpose when the first one is.

## 17–21. Manual checks in the app

With `soundFeedbackEnabled` still `false`, sound lessons will not appear in the
normal flow — temporarily force one in a scratch branch, or flip the flag
locally **without committing it**.

- **Study Mode** — record, review, send; confirm the sound lesson renders.
- **Arabic RTL** — layout mirrors; the English sound label stays Latin script and
  LTR; the image is not mirrored (a mirrored mouth diagram is anatomically wrong).
- **English LTR** — same, unmirrored.
- **Dark mode** — the palette is dark-native; grey-on-white line art must not
  disappear. Recolour if needed (CC0 permits it).
- **Mobile** — 375px width, no horizontal overflow, image legible, touch targets
  ≥ 44px.

## 22. Leave the flag alone

`soundFeedbackEnabled` stays `false` until assets are done **and** the Arabic-L1
attribution work has validated that the sound a failure is attributed to is the
sound a human would name. Both gates, not just this one.
