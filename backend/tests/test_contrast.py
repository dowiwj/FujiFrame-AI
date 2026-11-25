from io import BytesIO

import pytest
from PIL import Image

from app.image_processing.contrast import analyze_contrast
from app.image_processing.inspection import inspect_image


def test_uniform_and_extreme_distributions():
    counts = [0] * 256
    counts[128] = 1
    result = analyze_contrast(counts)
    assert result.standard_deviation == 0
    assert result.percentile_05 == result.percentile_95 == 128
    assert result.percentile_span == 0
    counts[128] = 0
    counts[0] = counts[255] = 50
    result = analyze_contrast(counts)
    assert result.standard_deviation == 127.5
    assert result.percentile_span == 255


def test_nearest_rank_boundaries_and_inspection_preserves_source():
    stream = BytesIO()
    with Image.new("L", (100, 1)) as image:
        image.putdata([0] * 4 + [64] * 90 + [200] + [255] * 5)
        image.save(stream, "PNG")
    original = stream.getvalue()
    result = inspect_image(stream).analysis.contrast
    assert (result.percentile_05, result.percentile_95) == (64, 200)
    assert result.percentile_span == 136
    assert result.standard_deviation > 0
    assert stream.getvalue() == original


@pytest.mark.parametrize("counts", [[], [0] * 256, [-1] + [0] * 255,
                                    [True] + [0] * 255, [1.5] + [0] * 255])
def test_invalid_histograms(counts):
    with pytest.raises(ValueError):
        analyze_contrast(counts)
