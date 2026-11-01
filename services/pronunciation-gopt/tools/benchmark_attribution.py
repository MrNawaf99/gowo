"""Sound-attribution benchmark: can GOPT name WHICH sound was wrong?

Separate from pass/fail. Uses the speechocean762 test split (human phone scores
0-2) with the GOPT authors' published Kaldi GOP features.

Cases:
  single-error words : exactly one phone scored <= 0.5 by annotators, all other
                       phones >= 1.5  -> ground-truth wrong sound is known
  clean words        : every phone >= 1.5 -> no sound should be blamed

For each single-error word the prediction is GOPT's weakest phone. Reported:
  exact match rate, false attribution rate (a different sound blamed),
  no-attribution rate (weakest phone not below the issue threshold),
  and the same under a confidence gate (weakest < T and margin to the
  second-weakest >= M), per target sound.

    python tools/benchmark_attribution.py --seq-data <.../seq_data_librispeech> --weights <best_audio_model.pth>
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import sys
import types
from collections import defaultdict
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
FOCUS = {"TH": "TH", "DH": "TH (voiced)", "R": "R", "L": "L", "V": "V", "W": "W", "P": "P", "B": "B", "SH": "SH", "CH": "CH", "JH": "J"}


def load_model(weights: Path):
    pkg = types.ModuleType("app")
    pkg.__path__ = [str(ROOT / "app")]
    sys.modules["app"] = pkg
    for name in ("gopt", "gopt_model"):
        spec = importlib.util.spec_from_file_location(f"app.{name}", ROOT / "app" / f"{name}.py")
        module = importlib.util.module_from_spec(spec)
        sys.modules[f"app.{name}"] = module
        spec.loader.exec_module(module)
    return sys.modules["app.gopt_model"].GoptModel(weights, ROOT / "app" / "phone_ids.json")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--seq-data", type=Path, required=True)
    ap.add_argument("--weights", type=Path, required=True)
    ap.add_argument("--out", type=Path, default=None)
    args = ap.parse_args()

    model = load_model(args.weights)
    inverse = {v: k for k, v in model.phone_ids.items()}
    feat = np.load(args.seq_data / "te_feat.npy")
    lab_phn = np.load(args.seq_data / "te_label_phn.npy")
    lab_word = np.load(args.seq_data / "te_label_word.npy")

    single, clean = [], []
    for u in range(feat.shape[0]):
        n = int((lab_phn[u, :, 0] >= 0).sum())
        phones = [inverse[int(i)] for i in lab_phn[u, :n, 0]]
        scores = model.score(feat[u, :n], phones)
        word_ids, start = lab_word[u, :n, 3], 0
        for j in range(1, n + 1):
            if j == n or word_ids[j] != word_ids[start]:
                wp = phones[start:j]
                human = lab_phn[u, start:j, 1]
                pred = np.array(scores.phone[start:j])
                bad = np.where(human <= 0.5)[0]
                if len(wp) >= 2:
                    if len(bad) == 1 and np.all(np.delete(human, bad[0]) >= 1.5):
                        single.append({"phones": wp, "target": int(bad[0]), "pred": pred.tolist()})
                    elif np.all(human >= 1.5):
                        clean.append({"phones": wp, "pred": pred.tolist()})
                start = j

    def attribution(case, threshold, margin):
        order = np.argsort(case["pred"])
        weakest = int(order[0])
        low = case["pred"][weakest]
        second = case["pred"][int(order[1])]
        if low >= threshold or second - low < margin:
            return "none"
        return "match" if weakest == case["target"] else "wrong"

    result = {"single_error_words": len(single), "clean_words": len(clean), "gates": []}
    print(f"single-error words: {len(single)}   clean words: {len(clean)}\n")
    print("gate (weakest < T, margin >= M) | match | wrong sound | no attribution | precision when attributing | clean words falsely blamed")
    for threshold, margin in [(101, 0), (60, 0), (60, 15), (60, 25), (50, 25), (40, 30)]:
        tally = defaultdict(int)
        for case in single:
            tally[attribution(case, threshold, margin)] += 1
        attributed = tally["match"] + tally["wrong"]
        false_blame = sum(1 for c in clean if min(c["pred"]) < threshold and (sorted(c["pred"])[1] - min(c["pred"])) >= margin)
        row = {
            "threshold": threshold, "margin": margin,
            "match": tally["match"] / len(single), "wrong": tally["wrong"] / len(single), "none": tally["none"] / len(single),
            "precision": tally["match"] / attributed if attributed else None,
            "clean_false_blame": false_blame / len(clean),
        }
        result["gates"].append(row)
        label = "argmin, no gate" if threshold > 100 else f"T={threshold} M={margin}"
        prec = f"{row['precision']:.2f}" if row["precision"] is not None else "  - "
        print(f"  {label:30} | {row['match']:.2f}  | {row['wrong']:.2f}        | {row['none']:.2f}           | {prec}                       | {row['clean_false_blame']:.3f}")

    print("\nPer target sound (argmin, no gate; and gate T=60 M=25):")
    print("  sound        | cases | match (argmin) | precision @gate | coverage @gate")
    per_sound = {}
    for phone, label in FOCUS.items():
        cases = [c for c in single if c["phones"][c["target"]] == phone]
        if not cases:
            print(f"  {label:12} |     0 | (no labelled cases)")
            per_sound[label] = {"cases": 0}
            continue
        argmin = sum(1 for c in cases if int(np.argmin(c["pred"])) == c["target"]) / len(cases)
        gated = [attribution(c, 60, 25) for c in cases]
        attributed = [g for g in gated if g != "none"]
        precision = sum(1 for g in attributed if g == "match") / len(attributed) if attributed else None
        coverage = len(attributed) / len(cases)
        per_sound[label] = {"cases": len(cases), "argmin_match": argmin, "gate_precision": precision, "gate_coverage": coverage}
        prec = f"{precision:.2f}" if precision is not None else "  - "
        print(f"  {label:12} | {len(cases):5} | {argmin:14.2f} | {prec:15} | {coverage:.2f}")
    result["per_sound"] = per_sound

    if args.out:
        args.out.write_text(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
