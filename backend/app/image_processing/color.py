"""Descriptive RGB and HSV saturation statistics, not white-balance advice."""

from collections.abc import Sequence
from dataclasses import dataclass


@dataclass(frozen=True)
class ColorAnalysis:
    mean_red: float
    mean_green: float
    mean_blue: float
    mean_saturation: float
    saturation: list[int]


def analyze_color(
    red: Sequence[int], green: Sequence[int], blue: Sequence[int],
    saturation: Sequence[int],
) -> ColorAnalysis:
    """Summarize equally weighted pixels from four 256-bin histograms.

    RGB means use 0..255; mean saturation is the mean of each pixel's
    quantized HSV S divided by 255, not saturation of the average RGB.
    """
    channels = (red, green, blue, saturation)
    for counts in channels:
        if len(counts) != 256 or any(
            type(count) is not int or count < 0 for count in counts
        ):
            raise ValueError("Expected 256 non-negative integer histogram counts.")
    total = sum(red)
    if not total or any(sum(counts) != total for counts in channels[1:]):
        raise ValueError("Color histograms must have equal, positive pixel counts.")
    means = [
        sum(level * count for level, count in enumerate(counts)) / total
        for counts in channels
    ]
    return ColorAnalysis(*means[:3], means[3] / 255, list(saturation))
