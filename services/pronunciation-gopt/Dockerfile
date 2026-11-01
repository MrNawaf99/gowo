# GoWord GOPT pronunciation service.
#
# Kaldi (GOP feature extraction) + GOPT (scoring) behind a small FastAPI app.
# Base image pinned by date tag: it contains Kaldi built after the June 2024
# compute-gop fix (one feature row per canonical phone), which the service relies on.
FROM kaldiasr/kaldi:cpu-debian12-openblas-2025-07-28

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    KALDI_ROOT=/opt/kaldi \
    MODEL_DIR=/models \
    NLTK_DATA=/usr/share/nltk_data

RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 python3-venv curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Kaldi binaries used by kaldi/assess_one.sh must be on PATH (same as egs/*/path.sh).
ENV PATH=/opt/venv/bin:$KALDI_ROOT/src/bin:$KALDI_ROOT/src/featbin:$KALDI_ROOT/src/nnet3bin:$KALDI_ROOT/src/online2bin:$KALDI_ROOT/src/ivectorbin:$KALDI_ROOT/src/gmmbin:$KALDI_ROOT/src/latbin:$KALDI_ROOT/src/fstbin:$KALDI_ROOT/tools/openfst/bin:$PATH

RUN set -eux; \
    test -x "$KALDI_ROOT/src/bin/compute-gop"; \
    test -f "$KALDI_ROOT/egs/gop_speechocean762/s5/local/prepare_dict.sh"; \
    compute-gop 2>&1 | grep -q "transition-alignments"  # post-2024 six-argument interface

COPY requirements.txt /app/requirements.txt
RUN python3 -m venv /opt/venv \
 && pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu torch==2.4.1 \
 && pip install --no-cache-dir -r /app/requirements.txt \
 && python -c "import nltk; [nltk.download(p, download_dir='$NLTK_DATA', quiet=True) for p in ('averaged_perceptron_tagger_eng', 'averaged_perceptron_tagger', 'cmudict')]"

COPY kaldi/prepare_models.sh /app/kaldi/prepare_models.sh
RUN bash /app/kaldi/prepare_models.sh

COPY app /app/app
COPY kaldi /app/kaldi
COPY fixtures/speechocean762/three_correct.wav /app/selftest/selftest.wav
COPY third_party /app/third_party

RUN useradd --system --uid 10001 --home-dir /nonexistent gopt \
 && chown -R gopt /app

USER gopt
WORKDIR /app
ENV SELFTEST_WAV=/app/selftest/selftest.wav \
    SELFTEST_TEXT="THREE FOUR THREE NINE" \
    MAX_CONCURRENT=2 \
    QUEUE_TIMEOUT_S=10 \
    TORCH_THREADS=1 \
    ENGINE_VERSION=gopt-bed909d+kaldi-m13

EXPOSE 8000
HEALTHCHECK --interval=15s --timeout=5s --start-period=120s --retries=3 \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/ready', timeout=4).status == 200 else 1)"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--no-access-log"]
