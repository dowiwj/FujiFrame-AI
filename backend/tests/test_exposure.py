import pytest

from app.image_processing.exposure import analyze_exposure


@pytest.mark.parametrize(
    "level,band,extreme",
    [
        (0, "shadows", "near_black"),
        (5, "shadows", "near_black"),
        (6, "shadows", None),
        (63, "shadows", None),
        (64, "midtones", None),
        (191, "midtones", None),
        (192, "highlights", None),
        (249, "highlights", None),
        (250, "highlights", "near_white"),
        (255, "highlights", "near_white"),
    ],
)
def test_inclusive_boundaries(level, band, extreme):
    histogram = [0] * 256
    histogram[level] = 100
    result = analyze_exposure(histogram)
    for name in ("shadows", "midtones", "highlights", "near_black", "near_white"):
        value = getattr(result, name)
        assert value.pixel_count == (100 if name in (band, extreme) else 0)
        assert value.fraction == (1 if name in (band, extreme) else 0)


def test_uniform_ramp_partition_and_subsets():
    result = analyze_exposure([1] * 256)
    assert result.shadows.pixel_count == result.highlights.pixel_count == 64
    assert result.midtones.pixel_count == 128
    assert result.near_black.pixel_count == result.near_white.pixel_count == 6
    assert result.near_white.fraction == 6 / 256
    assert result.shadows.fraction + result.midtones.fraction + result.highlights.fraction == 1
    assert (result.shadows.minimum, result.shadows.maximum) == (0, 63)
    assert (result.midtones.minimum, result.midtones.maximum) == (64, 191)
    assert (result.highlights.minimum, result.highlights.maximum) == (192, 255)


def test_weighted_counts_not_occupied_bins_and_no_mutation():
    histogram = [0] * 256
    histogram[0], histogram[100], histogram[255] = 1, 2, 7
    before = histogram.copy()
    result = analyze_exposure(histogram)
    assert result.shadows.fraction == 0.1
    assert result.midtones.fraction == 0.2
    assert result.highlights.fraction == 0.7
    assert histogram == before


@pytest.mark.parametrize("histogram", [[], [1] * 255, [1] * 257, [0] * 256,
                                        [-1] + [1] * 255, [1.5] + [1] * 255])
def test_rejects_invalid_histograms(histogram):
    with pytest.raises(ValueError):
        analyze_exposure(histogram)
