"""
B1: Automated Image Quality Gate
Laplacian variance blur detector + brightness histogram filter
"""

import cv2
import numpy as np
import os
import glob
from pathlib import Path

# ─── Thresholds ───────────────────────────────────────────────────────────────
BLUR_THRESHOLD = 80.0    # Laplacian variance < this → blurry
BRIGHT_MIN     = 90      # Avg brightness < this → too dark
BRIGHT_MAX     = 170     # Avg brightness > this → too bright

# ─── Image folders ────────────────────────────────────────────────────────────
ROUND1_DIR = "test-images/round1"   # Acceptable images (should PASS)
ROUND2_DIR = "test-images/round2"   # Failure images   (should FAIL)

IMAGE_EXTS = ["*.jpg", "*.jpeg", "*.png", "*.webp", "*.heic"]


def load_images(folder: str) -> list[str]:
    paths = []
    for ext in IMAGE_EXTS:
        paths.extend(glob.glob(os.path.join(folder, ext)))
        paths.extend(glob.glob(os.path.join(folder, ext.upper())))
    return sorted(set(paths))


def laplacian_score(gray: np.ndarray) -> float:
    """Higher = sharper. Low = blurry."""
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


def brightness_stats(gray: np.ndarray) -> dict:
    avg = float(np.mean(gray))
    hist = cv2.calcHist([gray], [0], None, [256], [0, 256]).flatten()
    total = gray.size
    dark_pct   = hist[:50].sum()  / total * 100
    bright_pct = hist[210:].sum() / total * 100
    return {"avg": avg, "dark_pct": round(dark_pct, 1), "bright_pct": round(bright_pct, 1)}


def quality_gate(image_path: str) -> dict:
    img = cv2.imread(image_path)
    if img is None:
        return {"file": Path(image_path).name, "pass": False,
                "reason": "Cannot read", "blur": None, "brightness": None}

    gray  = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur  = laplacian_score(gray)
    bstat = brightness_stats(gray)

    reasons = []
    if blur < BLUR_THRESHOLD:
        reasons.append(f"Blurry (Laplacian={blur:.1f} < {BLUR_THRESHOLD})")
    if bstat["avg"] < BRIGHT_MIN:
        reasons.append(f"Too dark (avg={bstat['avg']:.1f} < {BRIGHT_MIN})")
    if bstat["avg"] > BRIGHT_MAX:
        reasons.append(f"Too bright (avg={bstat['avg']:.1f} > {BRIGHT_MAX})")

    passed = len(reasons) == 0
    return {
        "file":       Path(image_path).name,
        "pass":       passed,
        "reason":     "; ".join(reasons) if reasons else "OK",
        "blur":       round(blur, 1),
        "brightness": round(bstat["avg"], 1),
        "dark_pct":   bstat["dark_pct"],
        "bright_pct": bstat["bright_pct"],
    }


def evaluate(folder: str, expected_pass: bool, label: str):
    paths = load_images(folder)
    if not paths:
        print(f"\n⚠️  No images found in {folder}")
        return [], 0.0

    results = [quality_gate(p) for p in paths]
    n = len(results)

    if expected_pass:
        # Round 1: count how many were wrongly rejected (false rejection)
        wrong = [r for r in results if not r["pass"]]
        rate  = len(wrong) / n * 100
        label_rate = "False Rejection Rate"
    else:
        # Round 2: count how many were correctly rejected (true rejection)
        correct = [r for r in results if not r["pass"]]
        rate    = len(correct) / n * 100
        label_rate = "True Rejection Rate"

    print(f"\n{'='*55}")
    print(f"  {label}  ({n} images)")
    print(f"{'='*55}")
    header = f"{'File':<28} {'Pass':^6} {'Blur':>7} {'Bright':>7}  Reason"
    print(header)
    print("-" * 70)
    for r in results:
        mark = "✅" if r["pass"] else "❌"
        print(f"{r['file']:<28} {mark:^6} {str(r['blur']):>7} {str(r['brightness']):>7}  {r['reason']}")
    print("-" * 70)
    print(f"  {label_rate}: {rate:.1f}%  ({int(rate*n/100)}/{n})")
    return results, rate


def main():
    print("\n🔍  B1: Automated Image Quality Gate")
    print(f"    Blur threshold  : Laplacian variance < {BLUR_THRESHOLD}")
    print(f"    Brightness range: {BRIGHT_MIN} – {BRIGHT_MAX} (avg pixel 0–255)")

    r1_results, false_reject = evaluate(ROUND1_DIR, expected_pass=True,
                                         label="Round 1 — Acceptable images")
    r2_results, true_reject  = evaluate(ROUND2_DIR, expected_pass=False,
                                         label="Round 2 — Failure images")

    print(f"\n{'='*55}")
    print("  SUMMARY")
    print(f"{'='*55}")
    print(f"  Round 1 False Rejection Rate : {false_reject:.1f}%")
    print(f"  Round 2 True  Rejection Rate : {true_reject:.1f}%")
    accuracy = (true_reject + (100 - false_reject)) / 2
    print(f"  Gate Accuracy (balanced)     : {accuracy:.1f}%")
    print()


if __name__ == "__main__":
    main()
