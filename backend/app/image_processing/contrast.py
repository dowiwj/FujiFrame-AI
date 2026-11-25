"""Global contrast summaries of an 8-bit luma histogram."""

from collections.abc import Sequence
from dataclasses import dataclass
from math import sqrt


@dataclass(frozen=True)
class ContrastAnalysis:
    standard_deviation: float
    percentile_05: int
    percentile_95: int
    percentile_span: int


def analyze_contrast(brightness: Sequence[int]) -> ContrastAnalysis:
    """Measure population spread and nearest-rank P5/P95, without scoring.

    These global measures describe encoded luma, not scene dynamic range,
    local contrast, linear-light luminance, or artistic quality.
    """
    if len(brightness) != 256 or any(
        type(count) is not int or count < 0 for count in brightness
    ):
        raise ValueError("Expected 256 non-negative integer histogram counts.")
    total = sum(brightness)
    if total == 0:
        raise ValueError("Cannot analyze an empty histogram.")
    mean = sum(level * count for level, count in enumerate(brightness)) / total
    variance = sum(
        count * (level - mean) ** 2
        for level, count in enumerate(brightness)
    ) / total

    def percentile(percent: int) -> int:
        rank = (percent * total + 99) // 100
        cumulative = 0
        for level, count in enumerate(brightness):
            cumulative += count
            if cumulative >= rank:
                return level
        raise ValueError("Invalid histogram total.")

    low, high = percentile(5), percentile(95)
    return ContrastAnalysis(sqrt(variance), low, high, high - low)
