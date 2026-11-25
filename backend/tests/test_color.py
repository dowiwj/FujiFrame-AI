from io import BytesIO

import pytest
from PIL import Image

from app.image_processing.color import analyze_color
from app.image_processing.histogram import analyze_histogram
from app.image_processing.inspection import inspect_image


def test_equal_primary_colors_are_saturated_despite_neutral_mean():
    with Image.new("RGB", (3, 1)) as image:
        image.putdata([(255, 0, 0), (0, 255, 0), (0, 0, 255)])
        result = analyze_histogram(image).color
    assert (result.mean_red, result.mean_green, result.mean_blue) == (85, 85, 85)
    assert result.mean_saturation == 1
    assert result.saturation[255] == 3
    assert sum(result.saturation) == 3


@pytest.mark.parametrize("mode,value", [("L", 0), ("L", 128), ("L", 255), ("I;16", 32768)])
def test_gray_has_zero_saturation(mode, value):
    with Image.new(mode, (4, 3), value) as image:
        result = analyze_histogram(image).color
    assert result.mean_saturation == 0
    assert result.saturation[0] == 12
    assert sum(result.saturation) == 12


def test_alpha_compositing_and_source_preservation_through_inspection():
    stream = BytesIO()
    with Image.new("RGBA", (2, 1)) as image:
        image.putdata([(255, 0, 0, 0), (255, 0, 0, 255)])
        image.save(stream, "PNG")
    original = stream.getvalue()
    result = inspect_image(stream).analysis.color
    assert result.mean_saturation == 0.5
    assert (result.mean_red, result.mean_green, result.mean_blue) == (255, 127.5, 127.5)
    assert result.saturation[0] == result.saturation[255] == 1
    assert stream.getvalue() == original


def test_saturation_accumulates_across_tiles():
    with Image.new("RGB", (1025, 1), (128, 64, 64)) as image:
        result = analyze_histogram(image).color
    assert sum(result.saturation) == 1025
    assert result.mean_saturation == pytest.approx(0.5, abs=1 / 255)


def test_invalid_or_inconsistent_histograms():
    valid = [1] + [0] * 255
    for invalid in ([], [0] * 256, [2] + [0] * 255, [-1] + [0] * 255,
                    [True] + [0] * 255, [1.5] + [0] * 255):
        with pytest.raises(ValueError):
            analyze_color(valid, valid, valid, invalid)
