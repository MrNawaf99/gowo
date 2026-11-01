#!/usr/bin/env bash
# Build-time model preparation. Every download is verified by SHA-256 so the
# image is reproducible and a tampered or changed upstream file fails the build.
#
# Produces $MODEL_DIR/{chain,extractor,conf,lang_nosp,gopt_librispeech,librispeech-lexicon.txt}
set -euo pipefail
: "${KALDI_ROOT:?}"
MODEL_DIR=${MODEL_DIR:-/models}
S5=$KALDI_ROOT/egs/gop_speechocean762/s5
WSJ=$KALDI_ROOT/egs/wsj/s5
mkdir -p "$MODEL_DIR" && cd "$MODEL_DIR"

fetch() {  # url sha256 output
  local url=$1 sum=$2 out=$3
  if [ ! -f "$out" ] || ! echo "$sum  $out" | sha256sum -c --status; then
    curl -fsSL --retry 5 --retry-delay 5 -o "$out.part" "$url"
    mv "$out.part" "$out"
  fi
  echo "$sum  $out" | sha256sum -c
}

# --- LibriSpeech chain acoustic model + i-vector extractor (kaldi-asr.org/models/m13) ---
fetch https://kaldi-asr.org/models/13/0013_librispeech_v1_chain.tar.gz \
  47cb7cc2fbe91c7a60fd3d46266c3d459bd766aaffa1dfad789ef57875f1be01 chain.tar.gz
fetch https://kaldi-asr.org/models/13/0013_librispeech_v1_extractor.tar.gz \
  431e44aa6c5efdd76566199ffb96e14a3052e025a8c6ee495eb66703663850a7 extractor.tar.gz
tar -xzf chain.tar.gz && tar -xzf extractor.tar.gz
rm -rf chain extractor
mkdir -p chain extractor
# Keep only what inference needs (drops training-only files such as den.fst, 0.mdl, ref.raw).
for f in final.mdl tree phones.txt cmvn_opts frame_subsampling_factor; do cp -L "exp/chain_cleaned/tdnn_1d_sp/$f" chain/; done
cp -L exp/nnet3_cleaned/extractor/{final.ie,final.dubm,final.mat,global_cmvn.stats,splice_opts,online_cmvn.conf} extractor/
rm -rf exp chain.tar.gz extractor.tar.gz

# --- LibriSpeech lexicon (openslr.org/11, public domain) ---
fetch https://www.openslr.org/resources/11/librispeech-lexicon.txt \
  d722bc29908cd338ae738edd70f61826a6fca29aaa704a9493f0006773f79d71 librispeech-lexicon.txt

# --- GOPT (Librispeech) weights, pinned to the YuanGongND/gopt commit ---
mkdir -p gopt_librispeech
fetch https://github.com/YuanGongND/gopt/raw/bed909daf8eca035095871e51642525acc5b9b55/pretrained_models/gopt_librispeech/best_audio_model.pth \
  ab07451e51648f9d2455505a51055b20ac4ad7921d771ccc5170ff486a826259 gopt_librispeech/best_audio_model.pth

# --- feature configs (egs/gop_speechocean762/s5/conf, extract_ivectors_online.sh defaults) ---
mkdir -p conf
cp "$S5/conf/mfcc_hires.conf" conf/mfcc_hires.conf
for x in $(cat extractor/splice_opts); do echo "$x"; done > conf/splice.conf
cat > conf/ivector_extractor.conf <<EOF
--cmvn-config=$MODEL_DIR/extractor/online_cmvn.conf
--ivector-period=10
--splice-config=$MODEL_DIR/conf/splice.conf
--lda-matrix=$MODEL_DIR/extractor/final.mat
--global-cmvn-stats=$MODEL_DIR/extractor/global_cmvn.stats
--diag-ubm=$MODEL_DIR/extractor/final.dubm
--ivector-extractor=$MODEL_DIR/extractor/final.ie
--num-gselect=5
--min-post=0.025
--posterior-scale=0.1
--max-remembered-frames=1000
--max-count=0
EOF

# --- lang (stage 6 + stage 10 of the recipe) ---
work=$(mktemp -d)
pushd "$S5" >/dev/null
. ./path.sh
local/prepare_dict.sh "$MODEL_DIR/librispeech-lexicon.txt" "$work/dict_nosp"
utils/prepare_lang.sh --phone-symbol-table "$MODEL_DIR/chain/phones.txt" \
  "$work/dict_nosp" "<UNK>" "$work/lang_tmp" "$MODEL_DIR/lang_nosp"
local/remove_phone_markers.pl "$MODEL_DIR/chain/phones.txt" \
  "$MODEL_DIR/lang_nosp/phones-pure.txt" "$MODEL_DIR/lang_nosp/phone-to-pure-phone.int"
popd >/dev/null
rm -rf "$work"
# Only the files the aligner reads are needed at runtime.
find "$MODEL_DIR/lang_nosp" -name 'G.fst' -delete

test "$(wc -l < "$MODEL_DIR/lang_nosp/phones-pure.txt")" -eq 42
echo "models ready in $MODEL_DIR"
du -sh "$MODEL_DIR"/*
