from dataclasses import replace

from PIL import Image

from app.image_processing.histogram import analyze_histogram
from app.services.recommendations import suggest_adjustments


def baseline():
    with Image.new("L", (10, 10), 128) as image:
        return analyze_histogram(image)


def test_flat_gray_has_no_saturation_or_contrast_suggestion():
    assert suggest_adjustments(baseline()) == []


def test_extreme_thresholds_and_deterministic_reasons():
    analysis = baseline()
    for key, suggestion_id in (("near_black", "shadows"), ("near_white", "highlights")):
        tone = getattr(analysis.exposure, key)
        below = replace(analysis, exposure=replace(
            analysis.exposure, **{key: replace(tone, fraction=0.099, pixel_count=9)}
        ))
        assert suggest_adjustments(below) == []
        boundary = replace(analysis, exposure=replace(
            analysis.exposure, **{key: replace(tone, fraction=0.10, pixel_count=10)}
        ))
        result = suggest_adjustments(boundary)
        assert [item.id for item in result] == [suggestion_id]
        assert "10.00%" in result[0].reason
        assert result[0].consideration
        assert result == suggest_adjustments(boundary)


def test_contrast_and_saturation_bounds():
    analysis = baseline()
    for span, deviation, expected in ((59, 19, True), (60, 19, False), (59, 20, False), (0, 0, False)):
        measured = replace(analysis, contrast=replace(
            analysis.contrast, percentile_span=span, standard_deviation=deviation,
        ))
        assert bool(suggest_adjustments(measured)) is expected
    for saturation, expected in ((0, False), (0.01, True), (0.149, True), (0.15, False), (1, False)):
        measured = replace(analysis, color=replace(analysis.color, mean_saturation=saturation))
        assert bool(suggest_adjustments(measured)) is expected
