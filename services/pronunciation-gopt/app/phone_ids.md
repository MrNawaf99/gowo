# phone_ids.json

GOPT's canonical-phone embedding is indexed by the order in which each pure
ARPAbet phone first appears in the speechocean762 **training** GOP features
(`gen_phn_dict` in `src/prep_data/gen_seq_data_phn.py`). The official repo does
not ship this table, so it was reconstructed from speechocean762
`train/text` + `resource/text-phone` in Kaldi utterance order.

The Kaldi recipe concatenates per-job feature files in shell-glob order, which
could in principle reorder late-appearing phones. Re-deriving the table under
that order for nj = 1, 8, 10, 16, 20, 25 and 30 gives the identical mapping
(only OY and ZH first appear after the first job, and they keep ids 37 and 38).

Validation: scoring the speechocean762 test set through this service must
reproduce GOPT's published phone-level PCC; a wrong table collapses it.
