"""Reproduce GOPT accuracy and calibrate GoWord's pass/issue thresholds.

Runs the service's own GoptModel (app/gopt_model.py) over the speechocean762
test split using the GOP features released by the GOPT authors, and compares
the predictions with the dataset's human scores.

Usage (from services/pronunciation-gopt, no Kaldi or FastAPI needed):
    python tools/calibrate_speechocean762.py \
        --seq-data <gopt data.zip>/seq_data_librispeech \
        --weights  <gopt_librispeech/best_audio_model.pth>

Data: GOPT features/labels from the link in YuanGongND/gopt README (derived
from speechocean762, CC BY 4.0).
"""

from __future__ import annotations

import argparse
import importlib.util
import sys
import types
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]


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
    args = ap.parse_args()

    model = load_model(args.weights)
    inverse = {v: k for k, v in model.phone_ids.items()}
    feat = np.load(args.seq_data / "te_feat.npy")
    lab_phn = np.load(args.seq_data / "te_label_phn.npy")
    lab_word = np.load(args.seq_data / "te_label_word.npy")

    phone_pred, phone_human = [], []
    word_pred, word_min_phone, word_human = [], [], []
    for u in range(feat.shape[0]):
        n = int((lab_phn[u, :, 0] >= 0).sum())
        scores = model.score(feat[u, :n], [inverse[int(i)] for i in lab_phn[u, :n, 0]])
        phone_pred += scores.phone
        phone_human += list(lab_phn[u, :n, 1])  # 0 wrong/missing, 1 heavy accent, 2 correct
        word_ids, start = lab_word[u, :n, 3], 0
        for j in range(1, n + 1):
            if j == n or word_ids[j] != word_ids[start]:
                word_pred.append(float(np.mean(scores.word_accuracy_per_phone[start:j])))
                word_min_phone.append(min(scores.phone[start:j]))
                word_human.append(round(float(lab_word[u, start, 0])))  # 0-10
                start = j

    P, W, M, Wh = np.array(phone_pred), np.array(word_pred), np.array(word_min_phone), np.array(word_human)
    raw_phone_human = np.array(phone_human)  # speechocean762 averages annotators, e.g. 1.8
    pcc = lambda a, b: float(np.corrcoef(a, b)[0, 1])
    print(f"test utterances {feat.shape[0]}, phones {len(P)}, words {len(W)}")
    # PCC uses the unrounded labels, as in the GOPT paper; buckets below use rounded 0/1/2.
    print(f"phone PCC {pcc(P, raw_phone_human):.3f} (published 0.616)   word accuracy PCC {pcc(W, Wh):.3f} (published 0.536)")
    Ph = np.round(raw_phone_human).astype(int)

    print("\nPhone issue threshold (flag if predicted < t)")
    print("   t | recall human-0 | recall human-0/1 | precision | correct phones flagged")
    for t in (50, 55, 60, 65, 70, 75, 80):
        flag = P < t
        print(f"  {t:2} | {(flag & (Ph == 0)).sum() / (Ph == 0).sum():14.2f} | {(flag & (Ph < 2)).sum() / (Ph < 2).sum():16.2f} "
              f"| {(flag & (Ph < 2)).sum() / max(1, flag.sum()):9.2f} | {(flag & (Ph == 2)).sum() / (Ph == 2).sum():.3f}")

    poor, ok, good = Wh <= 5, (Wh >= 7) & (Wh <= 8), Wh >= 9
    print(f"\nPass rule: word >= W and weakest phone >= F   (poor {poor.sum()}, ok 7-8 {ok.sum()}, good {good.sum()})")
    print("   W  F | poor passed | 7-8 passed | good failed | balanced")
    for w in (75, 80, 85, 90):
        for f in (0, 50, 60, 70):
            ps = (W >= w) & (M >= f)
            pp, op, gf = (ps & poor).sum() / poor.sum(), (ps & ok).sum() / ok.sum(), (~ps & good).sum() / good.sum()
            print(f"  {w:2} {f:2} | {pp:11.2f} | {op:10.2f} | {gf:11.2f} | {((1 - pp) + (1 - gf)) / 2:.3f}")


if __name__ == "__main__":
    main()
