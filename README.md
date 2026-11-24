# FujiFrame AI

FujiFrame AI is a local photography workspace with a light editorial Gallery and a dark Studio. The Gallery stores multiple JPEG, PNG and WebP originals in IndexedDB and displays thumbnails in a responsive masonry layout. It reads available camera EXIF locally and supports manually entered photo journals. The Studio reads one JPEG or PNG through the local FastAPI service. Switching views preserves the Studio selection, and both views support a lightbox. Film recipes, collections, histogram analysis and image editing are not implemented yet.

## Current progress

- Phase 1 foundation: local Gallery import and storage, thumbnails, loading/error states, and available camera/lens/exposure EXIF. Responsive CSS is present; visual regression verification is still pending.
- Phase 2 in progress: Gallery lightbox with previous/next controls, manual photo journals, and collection assignment/filtering. Film Recipe entries remain a next step.
- Phase 3 onward: Studio currently reports format, dimensions and file size only. No technical image analysis or machine-learning model is implemented.

Open a Gallery photo, scroll below the image, and choose **Chỉnh sửa nhật ký** to enter a title, collection, location or description. **Lưu nhật ký** persists these fields in the browser; **Hủy** discards the form draft. Each photo can belong to one named collection; the Gallery filter lists collections that currently contain photos. Empty titles fall back to the original filename. Journal values are explicitly user-entered and stored separately from extracted EXIF; saving a journal never rewrites the original image. Save before navigating to another photo or closing the lightbox. Other open Gallery tabs are notified after saving.

EXIF extraction currently includes camera make/model, lens, focal length, aperture, shutter speed, ISO and capture date when present. Missing values are omitted. GPS and Fujifilm recipes are not extracted or inferred.

## Run on Windows

Use Python 3.12 and Node.js with npm. This setup was tested with 64-bit Python 3.12.10 and Node.js 26.13.1. Open two PowerShell terminals in the project root.

### Terminal 1 — Backend

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements-dev.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```

If your Python installation exposes a versioned executable instead of the Windows launcher, use `python3.12.exe -m venv .venv` for the first command. On subsequent runs only the Uvicorn command is needed. The health endpoint is available at [local API health](http://127.0.0.1:8000/api/health).

### Terminal 2 — Frontend

```powershell
Set-Location frontend
npm.cmd ci
npm.cmd run dev
```

Open [FujiFrame Studio](http://127.0.0.1:5173). In Gallery, use **Thêm ảnh** or drop multiple JPEG, PNG or WebP files, up to 32 MiB and 64 million pixels each. **Xóa tất cả** asks for confirmation. Originals and thumbnails are saved atomically in IndexedDB and survive page reloads and browser restarts. Gallery storage belongs to the current browser profile and origin, so `localhost` and `127.0.0.1` have separate libraries. Clearing site data removes these images, and browser storage policies can also evict data. Keep your source files as a backup.

In AI Studio, choose **Chọn ảnh** or drop one JPEG or PNG to read its metadata. Use **Đổi ảnh**, **Gỡ ảnh**, or **Thử đọc lại** to manage the Studio selection independently of the Gallery. On subsequent runs use `npm.cmd run dev` from `frontend`. Stop each service with `Ctrl+C`.

## How the Studio upload works

1. React creates a browser-local preview of the selected file. Replacing the file clears the previous result and cancels any pending upload from the interface.
2. Selecting an image sends a single multipart field named `file` to `POST /api/images/upload`. Vite forwards `/api` requests to FastAPI on loopback.
3. The Backend accepts files up to **32 MiB** and **64,000,000 pixels**. Pillow identifies the format from the content, checks the file structure and decodes the image before returning metadata. Width and height describe the stored pixel grid before EXIF display rotation.
4. Backend file handling is scoped to the request. The multipart parser may spool large uploads to a temporary file. Reloading the page clears the Studio selection. Gallery originals remain in browser-local IndexedDB.

For example, the browser check used a small JPEG and received the following metadata.

```json
{"format": "JPEG", "width": 75, "height": 125, "size_bytes": 821}
```

| HTTP status | Meaning |
| --- | --- |
| 200 | The service read the image successfully. |
| 400 | The multipart form is invalid or contains extra files or text fields. |
| 413 | The request, file size or pixel count exceeds its limit. |
| 415 | The content could not be identified as a supported image. |
| 422 | The file is missing, empty, or recognized but corrupt. |

## Verify the project

Run these commands in a new PowerShell terminal from the project root after setup. The Backend tests generate their own images in memory.

```powershell
.\.venv\Scripts\python.exe -m pytest -q
Push-Location frontend
npm.cmd run build
npm.cmd test
Pop-Location
```

The API routes live in `backend/app/api`, and Pillow inspection lives in `backend/app/image_processing`. The React upload interface lives in `frontend/src/components`, with the API call in `frontend/src/services`.
