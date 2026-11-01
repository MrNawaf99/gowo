# Local asset verification results

The laptop-session findings the cloud research (`CLOUD_ASSET_RESEARCH_RESULTS.md`)
and creation spec (`ASSET_CREATION_SPEC.md`) said needed a renderer and a real
browser. Everything below was actually rendered — nothing here is measured from
path coordinates alone. Verified 2026-09-17.

Corrects [`LOCAL_ASSET_EXECUTION_PLAN.md`](./LOCAL_ASSET_EXECUTION_PLAN.md)'s
checklist: every item is now checked off or explicitly rejected with evidence.
Continues [`SOUND_ASSET_RESEARCH.md`](./SOUND_ASSET_RESEARCH.md).

---

## 0. Correction: this app has no dark mode

`ASSET_CREATION_SPEC.md` §2.5 and the execution plan's checklist both assumed
a "dark-native palette" and a `bg-gray-100 = #111827` test target. **Checked
directly against the real code and it is wrong.** Zero files under `src/app`
or `src/components` use a Tailwind `dark:` variant, there is no `next-themes`
or `prefers-color-scheme` wiring in `layout.tsx`, and the sound-feedback card
itself renders unconditionally on `bg-orange-50` (a light, near-white peach).
The "test dark mode" checklist item is therefore moot for Study Mode as it
exists today; legibility was judged against the real light background instead.

## 1. Crop — done, verified render-first

Rendered the full, uncropped drawing in a real browser with a coordinate grid
overlaid (reading the actual SVG user-space coordinates off the image, not
guessing from pixels) to find the oral cavity precisely, then tried candidate
crops and rendered each across the whole set until the differences between
sounds were clearly visible at real size.

**Final crop: `viewBox="60 88 110 112"`**, applied identically to every file
(script, not by hand, so the set stays consistent). Confirmed at the actual
128px card size on the actual `bg-orange-50` background: TH/F/V/P/B/SH/the
four vowels are all visually distinct; the earlier "θ, æ and neutral are
indistinguishable" failure (`SOUND_ASSET_RESEARCH.md` §6) is gone.

**Known, accepted limitation**: the larynx/voicing marker sits at
y≈203–206 in the source geometry, below this crop's y-range (88–200), so it
is not part of the visible teaching image for any consonant. Voicing is
already taught through the tip text for every pair (P/B, F/V, TH/DH, T/D,
etc.), so this was not chased further.

## 2–3. Rendered at 128px, on the real background, readability confirmed

Checked directly, not assumed: zero `<text>` elements survive the crop (still
inherited unchanged from the CC0 source), and the full 16-file set renders
legibly side by side at 128×128 on `#fff7ed` (`bg-orange-50`).

## 4. R — `r_retroflex.svg` — **ACCEPT**

Isolated `path[4]` region for `r_retroflex.svg`, `neutral.svg` and `t.svg` and
rendered a tight overlay: `neutral` shows a wide gap between tongue and
palate; `r_retroflex` shows the tongue raised and curled with a visible gap
still intact (approximant); `t` shows the outline merging with the palate
(full contact, a stop). This directly confirms the tip-must-not-touch
requirement.

**Voicing-marker inaccuracy, checked and non-blocking**: `r_retroflex.svg`'s
`path[2]` is upstream's 339-byte "voiceless" variant, not the 786-byte voiced
one `d.svg`/`n.svg` use, even though English /r/ is voiced. This sits below
the crop (§1) and is invisible in the shipped image — recorded so it is not
rediscovered as a surprise later, not because it affects what a student sees.

Tip text updated to say curling the tip is one of two valid GA shapes
(retroflex/bunched), not the only way, per the spec's own caution.

## 5. W — `vowels/svg/u.svg` — **REJECT, with first-hand proof**

This is the one place local verification reversed the cloud research's
tentative recommendation.

The cloud session could only measure bounding boxes and reasoned "the set
draws lips somewhere in `path[4]`, so `u.svg` is plausible; check the
rounding is *salient* on a screen." Rendered here and checked precisely: an
exact path-for-path SVG overlay of `u.svg` (blue) against `i.svg` (red).
**The lip/mouth-opening region is byte-identical between the two files** —
every difference is confined to the tongue-body loop (correct — height/
backness does differ between /u/ and /i/), and the front hook where lip
rounding would show is drawn with the exact same coordinates in both files.

The same test applied to `p.svg` vs `f.svg` (bilabial vs labiodental, which
the cloud research's file-length evidence said *should* differ) found a real,
visible divergence exactly in that lip/mouth-opening region — confirming the
method works and this is a genuine property of the u/i pair, not a script
bug.

**Conclusion: this CC0 set does not encode vowel lip rounding.** `u.svg`
would not show what the tip text asks for ("round your lips"), so it fails
the brief's own bar: "the image must actually represent the articulation."
`W` stays `MISSING`. The CC BY-SA 4.0 alternative (Commons, Tavin & Nardog)
remains a documented, not-adopted option — attribution/share-alike is a
product decision, out of scope here.

## 6. ER — shares R's image — **ACCEPT**

`r_retroflex.svg` shows real tongue retraction/bunching with the gap intact
(§4), which is the acceptance bar this sound needed. Confirmed it is **not**
`vowel-mid-central.svg` (the neutral tract already used for STRUT/SCHWA) —
reusing that would have shipped exactly the non-rhotic /ɜː/ error the brief
warned against.

## 7. L — derived from `d.svg` — **ACCEPT, with an honest caveat**

Confirmed mechanically before drawing anything: `n.svg`'s tongue geometry
(`path[4]`) is **byte-identical** to `d.svg`'s, and their larynx markers
(`path[2]`) are identical too (both already voiced). The only difference
between them is `path[3]`, the velum (lowered/nasal for `n`, raised/oral for
`d`). So "`n.svg` with `d.svg`'s velum" is not a new construction — it **is**
`d.svg`: the correct base posture for /l/ (voiced, oral, alveolar closure)
already exists in the set under a different name.

A mid-sagittal slice cannot show airflow around the tongue's sides at all —
confirmed this is a property of the projection, not something to search
harder for. Added one stroked loop-and-arrow near the alveolar contact point,
in the set's own style (`#666666`, round caps, no fill), sized (not
thickened) for legibility. **Two sizes were rendered and compared at the
real 128px card size on the real background**: the first attempt was too
faint against `bg-orange-50` to read reliably; the larger version is
honestly distinguishable from `d.svg`/`n.svg`/`t.svg` side by side.

Caveat recorded rather than hidden: the cue reads as a supporting detail next
to the tip text ("...let the sound flow around the sides"), not as a
diagram a student would decode unaided. That is judged sufficient — it does
not mislead, unlike reusing `n` (nasal) or `t`/`d` (no laterality at all)
unmodified would have — but it is not a strong stand-alone illustration.

## 8–9. CH / J — two-stage, implemented

Built the smallest extension the spec sketched: `PronunciationSound` gained
an optional `imageSequence: { stages: readonly [SequenceStage, SequenceStage] }`
alongside the existing `imageAsset` (untouched for all 16 other sounds), and
`usableImageSequence()` requires **both** panels to individually pass
`isUsableAsset()` — a half-usable sequence is never shown. The component
checks the sequence first, falls back to the single image, then to the
word-level lesson, all unchanged from before for every sound that has no
sequence.

**Panel choice, decided after rendering both options**: `t.svg` → the
existing `sh.svg` (i.e. `ʃ_laminal`, already the live `SH` asset) for CH;
`d.svg` → `zh-apical.svg` for J. `sh.svg` vs `sh__apical.svg` looked close to
identical at 128px; given that, reusing the exact `SH` asset was chosen over
matching J's `ʃ`/`ʒ` apical pair for internal CH/J consistency, on the
reasoning that a student who has already learned "SH" gets to transfer that
shape directly — a defensible artwork judgement, recorded as a decision.

**RTL**: the panel row is pinned `dir="ltr"` regardless of locale — closure
must precede release in reading order, in Arabic exactly as in English, and
the images are never mirrored (a flipped mouth diagram is anatomically
wrong). Rendered and confirmed directly: with the page in `dir="rtl"`, the
sequence row still shows panel 1 on the left, panel 2 on the right, arrow
pointing left-to-right, each Arabic caption correctly right-to-left within
itself.

**Mobile**: rendered at 375px width. The two 96px panels plus arrow and gaps
(~230px) fit inside the card with no horizontal overflow.

## 10. Image slot accounting, corrected

The historical "17 image slots" figure predates two-stage support, when
every target implied exactly one file. It still comes out to **17 distinct
reserved image paths**, but the composition changed:

- 14 single-image paths (STRUT+SCHWA share one, R+VOWEL_ER now also share
  one; W's path stays reserved but `MISSING`) — **13 of 14 `AVAILABLE`**.
- 3 new paths for the two sequences (`t.svg`, `d.svg`, `zh-apical.svg`); CH's
  release panel reuses `sh.svg`, already counted above, not a 4th new path.

**16 of 17 reserved image paths are `AVAILABLE` on disk.** Only `w.svg` is
missing, and that is a verified rejection, not an oversight.

## 11. Audio — still entirely `MISSING`, by design

Network access this session was wide open (re-tested: `api.github.com`,
`commons.wikimedia.org`, `freesound.org`, `archive.org` all reachable — wider
than either prior session had), which would let a human reviewer inspect a
Commons file page directly. It does not change the audio conclusion, because
the actual blocker was never network access: the brief requires confirming a
candidate is a genuinely isolated recording of the correct General American
phoneme, which requires **listening** to it, which this environment cannot
do. Marking anything `AVAILABLE` on file existence, a plausible filename, or
a search-result description — even now that the description page itself is
reachable — is exactly the shortcut the brief prohibits. All 18 audio slots
stay `MISSING`.

## 12. `soundFeedbackEnabled`

Verified by direct code inspection and a local-only, uncommitted flip during
this session (reverted before it ended, confirmed by `git status` showing no
diff on `config.ts`): the flag correctly gates the sound lesson end to end,
and reverting it correctly restores the word-level-only behaviour. It stays
`false` in every commit from this work. **Not flipped for production** — see
the final report for the exact remaining condition (Arabic-L1 attribution
validation) and the recommended live-session smoke test that was not run in
this phase (see below).

## 13. What this phase did NOT do

A full end-to-end check inside the real Study Mode flow (record → review →
send → see the sound card, through Firestore-backed sessions and the actual
recorder) was not run: it requires the Firestore emulator and a live dev
session, which is a proportionate next step but was not justified by risk
here — the changed code is a small, well-typed additive branch, already
covered by 173 unit tests (including sequence-specific assertions), a clean
build, and a pixel-for-pixel transcription check of the exact JSX/Tailwind
markup against the real compiled assets in a real browser (§8–9). Recommended
as the next concrete step before considering `soundFeedbackEnabled`.
