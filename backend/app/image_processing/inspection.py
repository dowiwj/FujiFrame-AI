from dataclasses import dataclass
from os import SEEK_END
from typing import BinaryIO

from PIL import Image, UnidentifiedImageError

from .histogram import HistogramAnalysis, analyze_histogram

MAX_FILE_BYTES = 32 * 1024 * 1024
MAX_PIXELS = 64_000_000
SUPPORTED_FORMATS = ("JPEG", "PNG")


class ImageLimitError(Exception):
    pass


class UnsupportedImageError(ValueError):
    pass


class InvalidImageError(ValueError):
    pass


@dataclass(frozen=True)
class ImageMetadata:
    format: str
    width: int
    height: int
    size_bytes: int
    analysis: HistogramAnalysis


def inspect_image(stream: BinaryIO) -> ImageMetadata:
    size_bytes = stream.seek(0, SEEK_END)
    if size_bytes == 0:
        raise InvalidImageError("Tệp đã chọn trống.")
    if size_bytes > MAX_FILE_BYTES:
        raise ImageLimitError("Dung lượng ảnh vượt quá 32 MiB.")
    stream.seek(0)

    try:
        with Image.open(stream, formats=SUPPORTED_FORMATS) as image:
            width, height = image.size
            if width * height > MAX_PIXELS:
                raise ImageLimitError("Độ phân giải ảnh vượt quá 64 megapixel.")
            image_format = image.format
            image.verify()

        # Pillow requires reopening after verify(). Decode to catch truncated JPEGs.
        stream.seek(0)
        with Image.open(stream, formats=SUPPORTED_FORMATS) as image:
            image.load()
            analysis = analyze_histogram(image)
    except Image.DecompressionBombError as error:
        raise ImageLimitError("Độ phân giải ảnh vượt quá 64 megapixel.") from error
    except UnidentifiedImageError as error:
        raise UnsupportedImageError(
            "Hãy chọn tệp có nội dung JPEG hoặc PNG hợp lệ."
        ) from error
    except (OSError, SyntaxError, ValueError) as error:
        raise InvalidImageError("Tệp ảnh bị hỏng hoặc thiếu dữ liệu.") from error

    return ImageMetadata(image_format, width, height, size_bytes, analysis)
