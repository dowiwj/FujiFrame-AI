"""Neighbor-luma variation: a descriptive detail metric, not a focus score."""

from dataclasses import dataclass
from math import sqrt

from PIL import Image, ImageChops


@dataclass(frozen=True)
class SharpnessAnalysis:
    rms_neighbor_difference: float | None
    pair_count: int


def measure_neighbor_differences(luma: Image.Image) -> tuple[int, int]:
    """Return squared-difference sum and number of horizontal/vertical pairs."""
    if luma.mode != "L":
        raise ValueError("Expected 8-bit luma pixels.")
    energy = pairs = 0
    for dx, dy in ((1, 0), (0, 1)):
        width, height = luma.width - dx, luma.height - dy
        if width <= 0 or height <= 0:
            continue
        with luma.crop((0, 0, width, height)) as first:
            with luma.crop((dx, dy, dx + width, dy + height)) as second:
                with ImageChops.difference(first, second) as difference:
                    energy += sum(
                        level * level * count
                        for level, count in enumerate(difference.histogram())
                    )
        pairs += width * height
    return energy, pairs


def summarize_sharpness(energy: int, pairs: int) -> SharpnessAnalysis:
    return SharpnessAnalysis(sqrt(energy / pairs) if pairs else None, pairs)
