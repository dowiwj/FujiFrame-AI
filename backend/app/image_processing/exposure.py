"""Descriptive tone ranges; thresholds are conventions, not exposure verdicts."""

from collections.abc import Sequence
from dataclasses import dataclass


@dataclass(frozen=True)
class ToneRange:
    minimum: int
    maximum: int
    pixel_count: int
    fraction: float


@dataclass(frozen=True)
class ExposureDistribution:
    shadows: ToneRange
    midtones: ToneRange
    highlights: ToneRange
    near_black: ToneRange
    near_white: ToneRange


def analyze_exposure(brightness: Sequence[int]) -> ExposureDistribution:
    """Summarize 256 luma bins, with inclusive bounds and unrounded ratios.

    Near-black/white are subsets of shadows/highlights. They do not prove
    sensor clipping, recoverable detail, or incorrect photographic exposure.
    """
    if len(brightness) != 256 or any(
        type(count) is not int or count < 0 for count in brightness
    ):
        raise ValueError("Expected 256 non-negative integer histogram counts.")
    total = sum(brightness)
    if total == 0:
        raise ValueError("Cannot analyze an empty histogram.")

    def measure(minimum: int, maximum: int) -> ToneRange:
        count = sum(brightness[minimum:maximum + 1])
        return ToneRange(minimum, maximum, count, count / total)

    return ExposureDistribution(
        shadows=measure(0, 63),
        midtones=measure(64, 191),
        highlights=measure(192, 255),
        near_black=measure(0, 5),
        near_white=measure(250, 255),
    )
