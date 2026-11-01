"""Compare this service's Kaldi GOP features with the GOPT authors' published ones.

Runs INSIDE the service container (needs Kaldi + /models):

    docker run --rm -v <repo>/services/pronunciation-gopt:/work:ro \
        -v <features.json>:/data/official.json:ro goword/gopt-pronunciation:1 \
        python /work/tools/compare_kaldi_features.py --official /data/official.json

For every fixture in fixtures/speechocean762/manifest.json it runs
kaldi/assess_one.sh on the WAV with the utterance's ANNOTATED phones (the
published features follow those, not a dictionary), then compares phone count,
phone ids, dimensionality and values with the published rows, and finally
scores both feature sets with GOPT to show whether any difference matters.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np

WORK = Path(__file__).resolve().parents[1]
sys.path.insert(0, "/app")

from app.gopt_model import GoptModel  # noqa: E402
from app.kaldi import load_pure_phone_ids, parse_feat_text  # noqa: E402

MODEL_DIR = Path(os.environ.get("MODEL_DIR", "/models"))
SCRIPT = Path("/app/kaldi/assess_one.sh")


def position_marked(phones: list[str]) -> list[str]:
    n = len(phones)
    if n == 1:
        return [f"{phones[0]}_S"]
    return [f"{p}_{'B' if i == 0 else 'E' if i == n - 1 else 'I'}" for i, p in enumerate(phones)]


def run_pipeline(wav: Path, words: list[dict]) -> tuple[np.ndarray, list[int], float]:
    import time

    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp)
        (work / "clip.wav").write_bytes(wav.read_bytes())
        (work / "text").write_text("utt " + " ".join(w["text"] for w in words) + "\n")
        (work / "text-phone").write_text("".join(f"utt.{i} {' '.join(position_marked(w['phones']))}\n" for i, w in enumerate(words)))
        started = time.perf_counter()
        proc = subprocess.run(["bash", str(SCRIPT), str(work), str(MODEL_DIR)], capture_output=True, text=True, timeout=120)
        elapsed = time.perf_counter() - started
        if proc.returncode != 0:
            log = (work / "kaldi.log").read_text(errors="replace")[-3000:] if (work / "kaldi.log").exists() else ""
            raise RuntimeError(f"pipeline exit {proc.returncode}: {proc.stderr[-800:]}\n{log}")
        rows = parse_feat_text((work / "feat.txt").read_text())
    return np.stack([r[2] for r in rows]), [r[1] for r in rows], elapsed


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--official", type=Path, required=True)
    ap.add_argument("--out", type=Path, default=None)
    args = ap.parse_args()

    official = json.loads(args.official.read_text())
    manifest = json.loads((WORK / "fixtures" / "speechocean762" / "manifest.json").read_text())
    pure_ids = load_pure_phone_ids(MODEL_DIR / "lang_nosp" / "phones-pure.txt")
    id_to_pure = {v: k for k, v in pure_ids.items()}
    model = GoptModel(MODEL_DIR / "gopt_librispeech" / "best_audio_model.pth", Path("/app/app/phone_ids.json"))

    report = []
    for item in manifest:
        words = item["human"]["words"]
        ours, our_ids, seconds = run_pipeline(WORK / "fixtures" / "speechocean762" / item["file"], words)
        ref = np.array(official[item["speechocean762_utt"]], dtype=np.float32)
        ref_ids, ref_feats = ref[:, 0].astype(int).tolist(), ref[:, 1:]
        pure = [id_to_pure[i] for i in ref_ids]

        entry = {
            "file": item["file"],
            "kaldi_seconds": round(seconds, 2),
            "phones_ours": len(our_ids),
            "phones_official": len(ref_ids),
            "dims_ours": int(ours.shape[1]),
            "dims_official": int(ref_feats.shape[1]),
            "phone_ids_identical": our_ids == ref_ids,
        }
        if ours.shape == ref_feats.shape:
            diff = np.abs(ours - ref_feats)
            per_phone_corr = [float(np.corrcoef(a, b)[0, 1]) for a, b in zip(ours, ref_feats)]
            s_ours, s_ref = model.score(ours, pure), model.score(ref_feats, pure)
            gopt_diff = np.abs(np.array(s_ours.phone) - np.array(s_ref.phone))
            entry.update(
                {
                    "max_abs_diff": round(float(diff.max()), 4),
                    "mean_abs_diff": round(float(diff.mean()), 4),
                    "mean_rel_diff": round(float((diff / (np.abs(ref_feats) + 1e-3)).mean()), 4),
                    "min_per_phone_corr": round(min(per_phone_corr), 4),
                    "gopt_phone_score_max_diff": round(float(gopt_diff.max()), 2),
                    "gopt_phone_score_mean_diff": round(float(gopt_diff.mean()), 2),
                    "phones": [
                        {"phone": p, "gopt_ours": round(o, 1), "gopt_official": round(r, 1)}
                        for p, o, r in zip(pure, s_ours.phone, s_ref.phone)
                    ],
                }
            )
        report.append(entry)
        print(json.dumps({k: v for k, v in entry.items() if k != "phones"}))

    if args.out:
        args.out.write_text(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
