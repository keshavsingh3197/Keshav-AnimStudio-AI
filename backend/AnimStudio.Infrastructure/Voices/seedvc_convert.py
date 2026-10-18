"""Converts several voice parts with Seed-VC in one run, loading the models only once.

Written into each render's workspace by the API and run with Seed-VC's own Python:

    python seedvc_convert.py <seed-vc dir> <manifest.json>

The manifest is a JSON object: {"diffusionSteps": 25, "jobs": [{"source", "target", "output"}]}
where every path is absolute. Each job turns the performance in `source` into the voice heard
in `target` (a sample of the person) and writes a WAV to `output`. Exit code 0 means every
output exists; anything else is a failure the API reports without these details.
"""
import json
import os
import shutil
import sys
import tempfile
from argparse import Namespace


def main() -> int:
    seed_vc_dir, manifest_path = sys.argv[1], sys.argv[2]
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    # Seed-VC reads its configs and model cache relative to its own folder.
    os.chdir(seed_vc_dir)
    sys.path.insert(0, seed_vc_dir)

    import torch
    import transformers

    if not torch.cuda.is_available():
        # Half precision is a GPU optimisation; on a CPU it is slower or unsupported.
        original = transformers.WhisperModel.from_pretrained

        def float32_from_pretrained(*args, **kwargs):
            kwargs["torch_dtype"] = torch.float32
            return original(*args, **kwargs)

        transformers.WhisperModel.from_pretrained = float32_from_pretrained

    import inference

    # main() loads every model per call; load them once for the whole manifest.
    loaded = {}
    original_load = inference.load_models

    def load_once(args):
        if "models" not in loaded:
            loaded["models"] = original_load(args)
        return loaded["models"]

    inference.load_models = load_once

    for job in manifest["jobs"]:
        out_dir = tempfile.mkdtemp(prefix="seedvc-")
        try:
            inference.main(Namespace(
                source=job["source"],
                target=job["target"],
                output=out_dir,
                diffusion_steps=int(manifest.get("diffusionSteps", 25)),
                length_adjust=1.0,
                inference_cfg_rate=0.7,
                f0_condition=False,
                auto_f0_adjust=False,
                semi_tone_shift=0,
                checkpoint=None,
                config=None,
                fp16=False,
            ))
            produced = [name for name in os.listdir(out_dir) if name.endswith(".wav")]
            if len(produced) != 1:
                print(f"no output for {os.path.basename(job['source'])}", file=sys.stderr)
                return 2
            shutil.move(os.path.join(out_dir, produced[0]), job["output"])
            print(f"converted {os.path.basename(job['source'])}", flush=True)
        finally:
            shutil.rmtree(out_dir, ignore_errors=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
