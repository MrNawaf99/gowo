# GOPT calibration (provisional)

Reproduce: `python tools/calibrate_speechocean762.py --seq-data <data.zip>/seq_data_librispeech --weights <best_audio_model.pth>`

Data: speechocean762 test split (2,500 utterances, 47,369 phones, 15,967 words)
with the Kaldi GOP features published by the GOPT authors and the dataset's
human scores (phones 0–2, words 0–10). Scores below are the service's own
`GoptModel` output on the 0–100 scale.

## 1. The service reproduces published GOPT accuracy

| | reproduced | published |
|---|---|---|
| phone PCC | **0.618** | 0.616 |
| word accuracy PCC | **0.538** | 0.536 |

This verifies feature normalisation, the canonical phone-id table
(`app/phone_ids.json`, identical to the one derived from the authors' training
labels), output scaling and word aggregation. It does **not** verify the Kaldi
feature extraction in `kaldi/assess_one.sh`; that is checked in Docker by
comparing its features with the published ones for the same recordings.

## 2. Phone issues

Predicted score by human phone label (percentiles p10 / p50 / p90):

| human | p10 | p50 | p90 |
|---|---|---|---|
| 0 wrong/missing | 22.9 | 54.7 | 91.4 |
| 1 heavy accent | 55.5 | 89.3 | 97.2 |
| 2 correct | 90.0 | 97.7 | 100 |

| flag if < t | recall (human 0) | precision (human 0/1) | correct phones wrongly flagged |
|---|---|---|---|
| 50 | 0.44 | 0.72 | 0.7 % |
| **60** | **0.54** | **0.67** | **1.1 %** |
| 70 | 0.63 | 0.59 | 2.0 % |
| 80 | 0.74 | 0.49 | 3.8 % |

Chosen `phoneIssueAccuracy = 60`: a tutor should rarely tell a student a correct
sound is wrong (1.1 %), at the cost of missing about half of the wrong phones.

## 3. Pass / fail

Rule: pass when every word ≥ W **and** the weakest phone ≥ F.
"poor" = human word accuracy ≤ 5, "good" = ≥ 9.

| W | F | poor words passed | 7–8 passed | good words failed | balanced accuracy |
|---|---|---|---|---|---|
| 80 | 0 | 0.50 | 0.86 | 0.05 | 0.726 |
| **85** | **60** | **0.41** | **0.78** | **0.08** | **0.753** |
| 90 | 60 | 0.31 | 0.66 | 0.13 | 0.780 |
| 90 | 70 | 0.31 | 0.66 | 0.13 | 0.782 |

Chosen `passWordAccuracy = 85`, `phoneFailAccuracy = 60` (in GoWord's
`PRONUNCIATION_SCORING_POLICY`). No threshold separates words well — GOPT's
word-level agreement with humans is moderate (PCC 0.54). The choice favours not
failing correct pronunciation (8 %) over catching every poor word.

## 4. Real-speech fixtures through the GoWord route

`fixtures/speechocean762`, sent through `POST /api/study/pronunciation/assess`
(Kaldi stage replaced by the published features for these recordings):

| fixture | human | GoWord | note |
|---|---|---|---|
| three_correct | 10/10 | pass 96.3 | TH 90 |
| think_correct | 10/10 | pass 95.7 | TH 97 |
| very_correct | 10/10 | pass 95.8 | V 94 |
| three_mispronounced | THREE 2/10 | **fail** 69.8 | humans: TH 0.0; **GOPT: TH 83, IY 34 → issue reported on IY, not TH** |
| the_dh_wrong | THE 0/10 | **fail** 35.1 | DH 37 (flagged) but not among the 2 weakest phones in the sentence |

## Limitations to resolve before `status: "calibrated"`

- speechocean762 speakers are mostly Mandarin L1 reading sentences; GoWord
  students are Arabic L1 saying isolated words. Re-run with Arabic-L1
  single-word recordings (script: `fixtures/RECORDING_SCRIPT.md`).
- Phone-level attribution is weaker than the word verdict: a word can fail
  correctly while the reported issue is a different phone than a human would
  name (see three_mispronounced).
- One canonical dictionary pronunciation per word: valid alternatives
  (RABBIT AH/IH, weak forms of TO/WAS) can lower scores.
