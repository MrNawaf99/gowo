# Isolated-phoneme recording specification

Developer-facing specification for the 24 `isolatedSoundAudio` slots, all
still `MISSING`. Builds directly on
[`PRONUNCIATION_AUDIO_INVENTORY.md`](./PRONUNCIATION_AUDIO_INVENTORY.md) (the
research: what was measured, what was rejected, why) — this document does not
repeat that evidence, it turns the recommendation (§10, step 4: commission one
GA speaker) into a spec a recording session can be run against, plus the
metadata schema and rejected-source list the task brief asked for explicitly.

**Nothing here is a recording. No audio was produced or downloaded.**
`soundFeedbackEnabled` stays `false`; this is preparation only.

---

## 1. Format

| Property | Value |
|---|---|
| Container | WAV, PCM |
| Sample rate | 48 kHz |
| Channels | Mono |
| Bit depth | 16-bit minimum (24-bit acceptable; downsample for delivery, keep the master) |
| Noise floor | Clean room / booth; no hum, hiss, HVAC, or room reverb audible at normal playback level |
| Level | Peak-normalized, no clipping; consistent level across all 24 files (same speaker, same session, same mic distance) |
| Naming | `<soundkey-stem>.wav` master, e.g. `th-voiceless.wav`, `vowel-schwa.wav` — same kebab-case stems the image assets already use |

## 2. Per-category targets

The measured problem in the research (§3.2–3.3) is the discipline this table
exists to enforce: **the sound alone**, not a citation frame, not a cardinal
IPA demonstration, not a whole word.

| Category | Targets | Duration | Rule |
|---|---|---|---|
| **Fricatives** | `F` `V` `TH_VOICELESS` `TH_VOICED` `S` `Z` `SH` | ~0.4–1.0 s | Clean sustained frication only. No vowel before or after — the measured Commons files fail exactly this bar (§3.2 of the inventory doc: 1.5–1.9 s, voiced-unvoiced-voiced). |
| **Stops** | `P` `B` `T` `D` `K` `G` | Natural closure + release, no fixed duration | The isolated release/burst only. **Do not add an artificial vowel frame** to make the stop audible — that reintroduces the exact framing problem the research rejected Commons audio for. |
| **Affricates** | `CH` `J` | Natural closure + fricated release | **One continuous articulation**: a single closure releasing into frication. Never fabricate by concatenating a separately-recorded stop and fricative — a spliced [t]+[ʃ] is a cluster, not /tʃ/, and is exactly the identity risk flagged in the inventory doc §6. |
| **Approximants / lateral** | `L` `R` `W` | ~0.3 s | `R` must be unambiguously rhotic General American quality — not the British non-rhotic vowel, not a tap or trill. This is the audio equivalent of the image rule already enforced for `R`/`VOWEL_ER` (never substitute a non-rhotic sound). |
| **Vowels** | `VOWEL_SHORT_I` `VOWEL_LONG_E` `VOWEL_A_CAT` `VOWEL_ER` `VOWEL_SCHWA` `VOWEL_STRUT` | ~0.4 s | Clean, model General American pronunciation. Per the inventory doc §3.3: GA `/i/` (`VOWEL_LONG_E`) is mildly diphthongal ([ɪi]) — a pure cardinal [i] is the wrong target. `VOWEL_STRUT` (/ʌ/) and `VOWEL_ER` (/ɝ/, rhotic) have **no Commons candidate at all**; they need this recording regardless of any decision made about the other 22. |

**All 24 should come from the same speaker and the same session** — this is
what makes voice, level and variety consistent across the whole set, and is
cheaper than reconciling 24 recordings from 24 different sources.

## 3. Metadata schema

One record per target, filled in only once a real recording exists. Proposed
shape, matching the project's existing `AssetProvenance` fields so it drops
into `sounds.ts`/the manifest without inventing a second schema:

```ts
interface AudioProvenance extends AssetProvenance {
  // AssetProvenance already carries: source, license, attribution,
  // commercialUse, verifiedOn, verifiedBy.
}

interface AudioRecordingMeta {
  soundKey: SoundKey;
  studentLabel: string;       // same displayLabel already in the catalogue
  phoneticDescription: string; // internal only, e.g. "voiceless dental fricative" — never shown to students
  accent: "General American";
  speakerId: string;          // stable id, not a name, if anonymity is preferred
  recordingSource: "commissioned" | "licensed-third-party";
  recordingDate: string;      // ISO date
  license: string;
  masterFilename: string;     // e.g. "th-voiceless_master_48k.wav"
  webFilename: string;        // e.g. "th-voiceless.mp3"
  status: "MISSING" | "UNVERIFIED" | "AVAILABLE";
}
```

No row exists yet for any of the 24 targets — filling one in before a
recording exists would be exactly the "invent metadata for a recording that
doesn't exist" the brief prohibits.

## 4. Rejected sources — complete list

Two were independently measured and rejected in
`PRONUNCIATION_AUDIO_INVENTORY.md` (§3, §8): `151henry151/ipa-chart` (scraped
from UCLA course pages, no `LICENSE` file) and
`joshstephenson/PhoneticFlashCards` (scraped from Wikipedia, no `LICENSE`
file, and the recordings it preserves were measured to be vowel-framed, not
isolated).

The third named source was checked directly in this phase:

| Source | Checked | Finding |
|---|---|---|
| `liaminhawai-cmd/Phonics` | ✅ `GET /repos/liaminhawai-cmd/Phonics` and `/license` via the GitHub API | Public repo, described as "Phonics app". `/license` returns `404` — **no LICENSE file**, matching the brief's stated reason. Rejected on that basis alone; audio content and accent were not further inspected since the licence question is already disqualifying. |

Also excluded, per the inventory doc and unchanged:

- Arbitrary Wikimedia/Commons audio, unless a specific file's licence and
  content are independently verified at the Commons page (unreachable this
  session and the prior one).
- Arbitrary TTS-generated phoneme audio — explicitly prohibited by the brief
  and by the same reasoning that already excludes GoWord's own TTS from this
  slot (`PRONUNCIATION_AUDIO_INVENTORY.md` §7): a TTS engine asked for "TH
  sound" produces the English words, not /θ/.

## 5. What this unblocks, and what it does not

Ready the moment a verified recording exists for a target: the catalogue
(`sounds.ts`) already declares an `isolatedSoundAudio` slot for **all 24**
targets (`missing("<stem>.mp3", NO_AUDIO)`), so adding a real file is a
provenance edit, not a new field — the exact "explicit audio entry even
while `MISSING`" state the brief asks for.

**Not unblocked by any of this:** `soundFeedbackEnabled`. That gate is
independent and unrelated to audio — see
`PRONUNCIATION_AUDIO_INVENTORY.md` §9 and
`services/pronunciation-gopt/LIMITATIONS.md` §2 (Arabic-L1 phone-attribution
validation, still not done).
