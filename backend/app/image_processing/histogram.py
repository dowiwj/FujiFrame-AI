"""Full-resolution, 8-bit histograms of decoded pixels (no ICC transform)."""

from dataclasses import dataclass

from PIL import Image

from .exposure import ExposureDistribution, analyze_exposure
from .contrast import ContrastAnalysis, analyze_contrast
from .color import ColorAnalysis, analyze_color
from .sharpness import (
    SharpnessAnalysis, measure_neighbor_differences, summarize_sharpness,
)


@dataclass(frozen=True)
class HistogramAnalysis:
    red: list[int]
    green: list[int]
    blue: list[int]
    brightness: list[int]
    pixel_count: int
    mean_brightness: float
    transparency_composited: bool
    exposure: ExposureDistribution
    contrast: ContrastAnalysis
    color: ColorAnalysis
    sharpness: SharpnessAnalysis


def analyze_histogram(image: Image.Image) -> HistogramAnalysis:
    """Count every pixel, using bounded tiles to limit conversion memory.

    Alpha is composited on white. Brightness is Pillow's rounded BT.601
    luma, not linear-light luminance. Animated PNG uses the initial frame.
    """
    channels = [[0] * 256 for _ in range(4)]
    saturation = [0] * 256
    edge_energy = edge_pairs = 0
    transparent = "A" in image.getbands() or "transparency" in image.info
    for top in range(0, image.height, 1024):
        for left in range(0, image.width, 1024):
            box = (
                left, top,
                min(left + 1024, image.width), min(top + 1024, image.height),
            )
            with image.crop(box) as tile:
                if image.mode.startswith("I;16") or image.mode == "I":
                    # PNG grayscale 16-bit: fixed range, never auto-stretch.
                    with tile.convert("I") as integers:
                        with integers.point(lambda value: value / 256) as scaled:
                            with scaled.convert("L") as grayscale:
                                counts = grayscale.histogram()
                    if "transparency" in image.info:
                        value = image.info["transparency"]
                        count = sum(
                            pixel == value for pixel in tile.get_flattened_data()
                        )
                        counts[value // 256] -= count
                        counts[255] += count
                    histograms = [counts] * 4
                    saturation[0] += tile.width * tile.height
                else:
                    with tile.convert("RGBA") as rgba:
                        with Image.new("RGBA", tile.size, "white") as background:
                            with Image.alpha_composite(background, rgba) as composite:
                                with composite.convert("RGB") as rgb:
                                    with rgb.convert("HSV") as hsv:
                                        with hsv.getchannel("S") as channel:
                                            for level, count in enumerate(channel.histogram()):
                                                saturation[level] += count
                                    values = rgb.histogram()
                                    with rgb.convert("L") as luma:
                                        energy, pairs = measure_neighbor_differences(luma)
                                        edge_energy += energy
                                        edge_pairs += pairs
                                        histograms = [
                                            values[:256], values[256:512],
                                            values[512:], luma.histogram(),
                                        ]
                for target, values in zip(channels, histograms):
                    for index, count in enumerate(values):
                        target[index] += count
    pixel_count = image.width * image.height
    mean = sum(
        level * count for level, count in enumerate(channels[3])
    ) / pixel_count
    return HistogramAnalysis(
        *channels, pixel_count, mean, transparent, analyze_exposure(channels[3]),
        analyze_contrast(channels[3]),
        analyze_color(*channels[:3], saturation),
        summarize_sharpness(edge_energy, edge_pairs),
    )
