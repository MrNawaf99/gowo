# Sound Teaching assets

Files here are shown to students when an attempt fails on a specific sound.
The catalogue that references them is `src/lib/pronunciation/sounds.ts`.

## Nothing is served until it is verified

`isUsableAsset()` is the only gate. An asset reaches a student **only** when
its catalogue entry is `status: "AVAILABLE"` **and** carries complete
`provenance` whose `commercialUse` is `true`. Every other state — `MISSING`,
or `UNVERIFIED` because the licence has not been confirmed — is treated as
absent, and the student gets the word-level lesson instead.

Dropping a file into this folder does **not** make it live. The catalogue entry
must be updated too, and that is the step where the licence is recorded.

## Current state

**Images: 11 of the 17 slots are filled** by the Wright & McCloy mid-sagittal
set (CC0 1.0, no attribution required), downloaded on 2026-09-16 with their
licence verified at source. See
[`docs/pronunciation/SOUND_ASSET_RESEARCH.md`](../../../docs/pronunciation/SOUND_ASSET_RESEARCH.md).

The remaining six — `R`, `L`, `W`, `CH`, `J`, `VOWEL_ER` — are still `MISSING`
and fall back to the word-level lesson. Their filenames are reserved paths, not
existing files.

**Before sound feedback is switched on**, the downloaded SVGs must be cropped to
the oral cavity: they are the original whole-head drawings, and at 128px two
different sounds look identical (research doc §6). CC0 permits the crop outright.

**Audio: every slot is `MISSING`.** No isolated-sound recording has been sourced.

Sound feedback is additionally switched off at the policy level
(`PRONUNCIATION_SCORING_POLICY.soundFeedbackEnabled === false`) until phone
attribution is validated on Arabic-L1 recordings. Both gates must open before a
sound lesson appears: assets alone are never enough.

## Adding a verified asset

1. Obtain the file from a source whose licence you have actually read.
   Acceptable: public domain / CC0, a licence that explicitly permits
   commercial use and redistribution, or artwork commissioned for GoWord.
   Not acceptable: "found on a search engine", unclear provenance, NC-only
   licences, or stock previews.
2. Save it here using the exact filename the catalogue reserves
   (e.g. `th-voiceless.svg`, `r.mp3`).
3. Fill in the catalogue entry:

   ```ts
   imageAsset: {
     status: "AVAILABLE",
     url: `${SOUND_ASSET_DIR}/th-voiceless.svg`,
     provenance: {
       source: "https://example.org/the-exact-page",
       license: "CC0-1.0",
       attribution: null,          // or the exact line the licence requires
       commercialUse: true,
       verifiedOn: "2026-09-15",
       verifiedBy: "<who checked>",
     },
   },
   ```

4. If the licence requires attribution, `attribution` must hold the exact line,
   and it has to be rendered wherever the asset is shown.
5. If you cannot confirm the licence, leave the entry `MISSING`, or mark it
   `UNVERIFIED` with a `note`. Never guess.

## What the assets should be

**Images** — a clear illustration of mouth, tongue and teeth placement for the
sound, readable at 128px, legible on the app's dark background, and
understandable by a young learner. Prefer a simple side-profile cutaway over a
technical articulatory diagram. No IPA symbols, no phonetic notation.

**Isolated sound audio** — the English sound on its own, said by a clear
speaker, short, no background noise, no music, and no surrounding word. A
recording of a whole word is not a substitute. If no suitable verified
recording exists, leave the slot `MISSING`; a poor clip teaches the wrong
thing.

**Labels** stay in English in every locale ("TH sound"), paired with the
catalogue's `exampleWord` ("think"). Tips are GoWord's own text and live in
`sounds.ts`, not here.
