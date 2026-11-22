# FujiFrame AI

FujiFrame AI is a local photography workspace. You can preview one JPEG or PNG, send it to a local FastAPI service, and inspect its encoded dimensions, format and exact file size. AI critique and color editing are planned for later stages.

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

Open [FujiFrame Studio](http://127.0.0.1:5173). Choose **Chọn ảnh** or drop a file onto the preview, then choose **Đọc thông số**. Use **Đổi ảnh** to inspect another photo. On subsequent runs use `npm.cmd run dev` from `frontend`. Stop each service with `Ctrl+C`.

## How the upload works

1. React creates a browser-local preview of the selected file. Replacing the file clears the previous result and cancels any pending upload from the interface.
2. Pressing **Đọc thông số** sends a single multipart field named `file` to `POST /api/images/upload`. Vite forwards `/api` requests to FastAPI on loopback.
3. The Backend accepts files up to **32 MiB** and **64,000,000 pixels**. Pillow identifies the format from the content, checks the file structure and decodes the image before returning metadata. Width and height describe the stored pixel grid before EXIF display rotation.
4. File handling is scoped to the request. The multipart parser may spool large uploads to a temporary file. The app keeps no image library or upload history. Reloading the page clears the selection.

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
Pop-Location
```

The API routes live in `backend/app/api`, and Pillow inspection lives in `backend/app/image_processing`. The React upload interface lives in `frontend/src/components`, with the API call in `frontend/src/services`.
