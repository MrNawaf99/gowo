#!/usr/bin/env bash
# GOP feature extraction for ONE recording, replicating
# kaldi/egs/gop_speechocean762/s5/run.sh (stages 3-12) with the LibriSpeech
# chain model (kaldi-asr.org/models/m13), as used to train GOPT.
#
# Usage: assess_one.sh <work_dir> <model_dir>
#   work_dir must contain: clip.wav, text (utt WORD...), text-phone (utt.i PH_B PH_E ...)
#   writes:                work_dir/feat.txt  (Kaldi text vectors: "utt.i [ pure_phone_id f1 .. f84 ]")
set -euo pipefail
: "${KALDI_ROOT:?KALDI_ROOT must be set}"

work=$1
models=$2
chain=$models/chain
extractor=$models/extractor
lang=$models/lang_nosp
utt=utt

cd "$work"

# ---- data dir (utt2spk: one speaker per recording) ----
printf '%s %s\n' "$utt" "$work/clip.wav" > wav.scp
printf '%s %s\n' "$utt" "$utt" > utt2spk
printf '%s %s\n' "$utt" "$utt" > spk2utt

# ---- stage 3: high-resolution MFCC + CMVN stats ----
compute-mfcc-feats --verbose=0 --config="$models/conf/mfcc_hires.conf" scp:wav.scp ark:- 2>>kaldi.log \
  | copy-feats --compress=false ark:- ark,scp:feats.ark,feats.scp 2>>kaldi.log
compute-cmvn-stats --spk2utt=ark:spk2utt scp:feats.scp ark,scp:cmvn.ark,cmvn.scp 2>>kaldi.log

# ---- stage 4: online i-vectors (steps/online/nnet2/extract_ivectors_online.sh) ----
ivector-extract-online2 --config="$models/conf/ivector_extractor.conf" \
  ark:spk2utt scp:feats.scp ark,scp:ivector_online.ark,ivector_online.scp 2>>kaldi.log

# ---- stage 5: log-likelihoods (steps/nnet3/compute_output.sh defaults) ----
cmvn_opts=$(cat "$chain/cmvn_opts")
nnet3-compute --use-gpu=no \
  --online-ivectors=scp:ivector_online.scp --online-ivector-period=10 \
  --frames-per-chunk=50 --extra-left-context=0 --extra-right-context=0 \
  --extra-left-context-initial=-1 --extra-right-context-final=-1 \
  "$chain/final.mdl" \
  "ark,s,cs:apply-cmvn $cmvn_opts --utt2spk=ark:utt2spk scp:cmvn.scp scp:feats.scp ark:- |" \
  ark:output.ark 2>>kaldi.log

# ---- stage 7: integer transcripts ----
"$KALDI_ROOT/egs/wsj/s5/utils/sym2int.pl" --map-oov "$(cat "$lang/oov.int")" -f 2- "$lang/words.txt" text > text.int
"$KALDI_ROOT/egs/wsj/s5/utils/sym2int.pl" -f 2- "$lang/phones.txt" text-phone > text-phone.int

# ---- stage 8: alignment graph ----
compile-train-graphs-without-lexicon --read-disambig-syms="$lang/phones/disambig.int" \
  "$chain/tree" "$chain/final.mdl" ark,t:text.int ark,t:text-phone.int ark:fsts.ark 2>>kaldi.log

# ---- stage 9: align (steps/align_mapped.sh defaults) ----
align-compiled-mapped --transition-scale=1.0 --acoustic-scale=0.1 --self-loop-scale=0.1 \
  --beam=10 --retry-beam=40 --careful=false \
  "$chain/final.mdl" ark:fsts.ark ark:output.ark ark,t:ali.ark 2>>kaldi.log
if [ ! -s ali.ark ]; then
  echo "ALIGNMENT_FAILED" >&2
  exit 3
fi

# ---- stage 11: per-frame phone ids ----
ali-to-phones --per-frame=true "$chain/final.mdl" ark,t:ali.ark ark,t:ali-phone.ark 2>>kaldi.log

# ---- stage 12: GOP + GOP-based features ----
compute-gop --phone-map="$lang/phone-to-pure-phone.int" --skip-phones-string=0:1:2 \
  "$chain/final.mdl" ark,t:ali.ark ark,t:ali-phone.ark ark:output.ark \
  ark,t:gop.txt ark,t:feat.txt 2>>kaldi.log

[ -s feat.txt ] || { echo "NO_GOP_FEATURES" >&2; exit 4; }
