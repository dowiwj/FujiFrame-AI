from io import BytesIO

import pytest
from PIL import Image

from app.image_processing.histogram import analyze_histogram
from app.image_processing.inspection import inspect_image


@pytest.mark.parametrize("level", [0, 128, 255])
def test_uniform_grayscale(level):
    with Image.new("L", (9, 7), level) as image:
        result = analyze_histogram(image)
    assert result.mean_brightness == level
    assert result.pixel_count == 63
    for counts in (result.red, result.green, result.blue, result.brightness):
        assert counts[level] == 63
        assert sum(counts) == 63


def test_primary_colors_have_known_luma_and_channel_counts():
    with Image.new("RGB", (3, 1)) as image:
        image.putdata([(255, 0, 0), (0, 255, 0), (0, 0, 255)])
        result = analyze_histogram(image)
    for counts in (result.red, result.green, result.blue):
        assert counts[0] == 2
        assert counts[255] == 1
    assert [result.brightness[level] for level in (76, 150, 29)] == [1, 1, 1]
    assert result.mean_brightness == 85


def test_all_gray_levels_and_multiple_tiles():
    with Image.new("L", (1025, 1025), 0) as image:
        for value in range(256):
            image.putpixel((1024, value), value)
        result = analyze_histogram(image)
    assert result.pixel_count == 1025 * 1025
    assert result.brightness[0] == result.pixel_count - 255
    assert result.brightness[1:] == [1] * 255
    assert result.mean_brightness == pytest.approx(sum(range(256)) / result.pixel_count)


@pytest.mark.parametrize("mode", ["RGBA", "LA", "P"])
def test_transparency_is_composited_on_white(mode):
    with Image.new(mode, (1, 1), 0) as image:
        if mode == "P":
            image.info["transparency"] = 0
        result = analyze_histogram(image)
    assert result.transparency_composited
    assert result.brightness[255] == 1


def test_partial_alpha_on_white():
    with Image.new("RGBA", (1, 1), (0, 0, 0, 128)) as image:
        result = analyze_histogram(image)
    assert result.mean_brightness == 127


def test_grayscale_16bit_fixed_range_through_inspection():
    stream = BytesIO()
    with Image.new("I;16", (3, 1)) as image:
        for x, value in enumerate([0, 32768, 65535]):
            image.putpixel((x, 0), value)
        image.save(stream, "PNG")
    original = stream.getvalue()
    result = inspect_image(stream).analysis
    assert [result.brightness[level] for level in (0, 128, 255)] == [1, 1, 1]
    assert result.mean_brightness == pytest.approx(383 / 3)
    assert stream.getvalue() == original


def test_cmyk_and_rgb_transparency():
    with Image.new("CMYK", (2, 1), (0, 0, 0, 0)) as image:
        assert analyze_histogram(image).mean_brightness == 255
    with Image.new("RGB", (1, 1), (12, 34, 56)) as image:
        image.info["transparency"] = (12, 34, 56)
        assert analyze_histogram(image).mean_brightness == 255
