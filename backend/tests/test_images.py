from io import BytesIO

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.image_processing import inspection
from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def make_image(image_format):
    stream = BytesIO()
    with Image.new("RGB", (40, 30), (32, 96, 112)) as image:
        image.save(stream, format=image_format)
    return stream.getvalue()


def upload(client, data):
    return client.post(
        "/api/images/upload",
        files={"file": ("photo.jpg", data, "image/jpeg")},
    )


@pytest.mark.parametrize("image_format", ["JPEG", "PNG"])
def test_metadata_comes_from_file_contents(client, image_format):
    data = make_image(image_format)
    response = upload(client, data)
    assert response.status_code == 200
    result = response.json()
    analysis = result.pop("analysis")
    recommendations = result.pop("recommendations")
    assert isinstance(recommendations, list)
    assert analysis["pixel_count"] == 1200
    exposure = analysis["exposure"]
    assert sum(exposure[band]["pixel_count"] for band in (
        "shadows", "midtones", "highlights"
    )) == 1200
    assert exposure["midtones"] == {
        "minimum": 64, "maximum": 191, "pixel_count": 1200, "fraction": 1.0,
    }
    assert exposure["near_black"]["fraction"] == 0
    assert exposure["near_white"]["fraction"] == 0
    for channel in ("red", "green", "blue", "brightness"):
        assert len(analysis[channel]) == 256
        assert sum(analysis[channel]) == 1200
    assert result == {
        "format": image_format,
        "width": 40,
        "height": 30,
        "size_bytes": len(data),
    }


@pytest.mark.parametrize("data", [b"plain text", make_image("GIF")])
def test_unsupported_content(client, data):
    assert upload(client, data).status_code == 415


def test_empty_file(client):
    assert upload(client, b"").status_code == 422


def test_missing_file(client):
    assert client.post("/api/images/upload").status_code == 422


def test_multiple_files_rejected(client):
    part = ("file", ("photo.png", make_image("PNG"), "image/png"))
    assert client.post("/api/images/upload", files=[part, part]).status_code == 400


def test_photo_larger_than_one_mib(client):
    stream = BytesIO()
    with Image.new("RGB", (800, 600)) as image:
        image.save(stream, format="PNG", compress_level=0)
    data = stream.getvalue()
    assert len(data) > 1024 * 1024
    response = upload(client, data)
    assert response.status_code == 200
    assert response.json()["size_bytes"] == len(data)


@pytest.mark.parametrize("image_format", ["JPEG", "PNG"])
def test_truncated_image(client, image_format):
    assert upload(client, make_image(image_format)[:-16]).status_code == 422


def test_byte_limit_includes_boundary(client, monkeypatch):
    data = make_image("PNG")
    monkeypatch.setattr(inspection, "MAX_FILE_BYTES", len(data))
    assert upload(client, data).status_code == 200
    assert upload(client, data + b"x").status_code == 413


def test_pixel_limit_includes_boundary(client, monkeypatch):
    data = make_image("PNG")
    monkeypatch.setattr(inspection, "MAX_PIXELS", 40 * 30)
    assert upload(client, data).status_code == 200
    monkeypatch.setattr(inspection, "MAX_PIXELS", 40 * 30 - 1)
    assert upload(client, data).status_code == 413
