from fastapi import APIRouter, HTTPException, UploadFile

from ..image_processing.inspection import (
    MAX_FILE_BYTES,
    ImageLimitError,
    ImageMetadata,
    InvalidImageError,
    UnsupportedImageError,
    inspect_image,
)

router = APIRouter(tags=["images"])


@router.post(
    "/upload",
    response_model=ImageMetadata,
    # Allow room for the multipart header in addition to the file itself.
    max_body_size=MAX_FILE_BYTES + 64 * 1024,
    form_limits={"max_files": 1, "max_fields": 0},
)
def upload_image(file: UploadFile) -> ImageMetadata:
    try:
        return inspect_image(file.file)
    except ImageLimitError as error:
        raise HTTPException(status_code=413, detail=str(error)) from error
    except UnsupportedImageError as error:
        raise HTTPException(status_code=415, detail=str(error)) from error
    except InvalidImageError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
