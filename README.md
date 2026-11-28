# FujiFrame AI

FujiFrame AI is a local photography workspace with a light editorial Gallery, a dark Studio and a browser-local Color Lab. The Gallery stores multiple JPEG, PNG and WebP originals in IndexedDB and displays thumbnails in a responsive masonry layout. It reads available camera EXIF locally and supports manually entered photo journals, collection filtering and Film Recipes. The Studio reads one JPEG or PNG through the local FastAPI service. Switching views preserves the Studio selection, and both Gallery and Studio support a lightbox. Color Lab offers non-destructive preview adjustments and PNG export.

## Current progress

- Phase 1 foundation: local Gallery import and storage, thumbnails, loading/error states, and available camera/lens/exposure EXIF. Responsive CSS is present; visual regression verification is still pending.
- Phase 2 in progress: Gallery lightbox with previous/next controls, manual photo journals, collection assignment/filtering and manual Film Recipes. Dedicated local photo pages are available; further portfolio polish remains future work.
- Phase 3 in progress: Studio reports histogram, exposure, contrast, color and reference sharpness metrics, with explainable editing suggestions. Applying edits and machine-learning models are not implemented.
- Phase 4: Color Lab preview with tonal and color adjustments, HSL bands, Tone Curve points, Film Grain, style presets, Before/After, Reset and PNG export. Advanced RAW editing and full-resolution export are not supported.

### Color Lab preview

Open **Color Lab** and choose or drop one JPEG, PNG or WebP (up to 32 MiB / 64 MP). Processing stays in the browser and does not call the Backend. The preview preserves the aspect ratio and is limited to 1600 pixels on the longest edge. Browser decoding determines orientation/color conversion and the displayed frame for animated formats. The working canvas uses 8-bit sRGB; this is not a RAW or wide-gamut editor.

Exposure (-3 to +3 EV) decodes sRGB channels to linear light, multiplies by `2^EV`, clips to [0,1], and re-encodes to sRGB. Contrast (-100 to +100) then applies a slope of `2^(contrast/100)` around encoded midpoint 0.5, followed by clipping. Highlights/Shadows use luminance-weighted offsets; Temperature/Tint use simple channel shifts. Saturation/Vibrance and the eight HSL bands operate in HSL space. The three Tone Curve controls change output at 25%, 50% and 75%, with linear interpolation between control points. Film Grain adds deterministic monochrome noise. Alpha remains unchanged. These are project controls, not an exact match for Photoshop or Fujifilm processing. Clipped highlights are not recovered.

The optional Classic Chrome-inspired and Velvia-inspired presets are artistic approximations, not reproductions of Fujifilm's proprietary rendering. Choosing a preset starts from neutral settings; moving a slider makes it a custom edit.

Every adjustment starts from the same unedited preview pixels. **Xem trước** temporarily shows those pixels; changing a slider returns to the edited view. **Reset** restores every control to zero. Switching tabs preserves the current session; replacing/removing the image or reloading clears edits. Preview adjustments do not update Studio analysis or Gallery data. Original image bytes and metadata are never rewritten. **Export PNG** downloads the adjusted preview, even while Before is displayed. Export is limited to the preview resolution (longest edge at most 1600 px), contains no original EXIF, and does not replace the source file.

Open a Gallery photo, scroll below the image, and choose **Chỉnh sửa nhật ký** to enter a title, collection, location or description. **Lưu nhật ký** persists these fields in the browser; **Hủy** discards the form draft. Each photo can belong to one named collection; the Gallery filter lists collections that currently contain photos. Empty titles fall back to the original filename. Journal values are explicitly user-entered and stored separately from extracted EXIF; saving a journal never rewrites the original image. Save before navigating to another photo or closing the lightbox. Other open Gallery tabs are notified after saving.

EXIF extraction currently includes camera make/model, lens, focal length, aperture, shutter speed, ISO and capture date when present. Missing values are omitted. GPS and Fujifilm recipes are not extracted or inferred.

### Film Recipe journal

In the Gallery lightbox, scroll below the photo journal and choose **Thêm recipe**. Enter only known settings supported by your camera, then choose **Lưu recipe**. All fields are optional: Film Simulation, Dynamic Range, White Balance, WB Shift, Highlight/Shadow Tone, Color, Sharpness, Noise Reduction, Grain Effect, Color Chrome Effect, Color Chrome FX Blue and Clarity. A recipe name and notes about post-processing can also be recorded. Clear all fields and save to remove the recipe entry without removing the photo.

Recipes store user-entered text with explicit `manual` provenance, separately from EXIF and journal data. Unknown fields are omitted; zero and signed values are preserved. Settings are not validated against a camera-specific capability database. No settings are inferred from image colors, no Fujifilm MakerNotes are decoded, and saving does not apply color adjustments or rewrite the original file. Light and post-processing can also affect the final colors.

The lightbox asks before abandoning unsaved recipe edits and prevents navigation while a recipe save is pending. Browser reloads can still discard drafts. Saved recipes persist in the same browser storage as the Gallery. Concurrent recipe edits in different tabs use the last successful save; they are not merged.

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

In AI Studio, choose **Chọn ảnh** or drop one JPEG or PNG to read its metadata and analyze its pixels. Use **Đổi ảnh**, **Gỡ ảnh**, or **Thử đọc lại** to manage the Studio selection independently of the Gallery. On subsequent runs use `npm.cmd run dev` from `frontend`. Stop each service with `Ctrl+C`.

## How the Studio upload works

1. React creates a browser-local preview of the selected file. Replacing the file clears the previous result and cancels any pending upload from the interface.
2. Selecting an image sends a single multipart field named `file` to `POST /api/images/upload`. Vite forwards `/api` requests to FastAPI on loopback.
3. The Backend accepts files up to **32 MiB** and **64,000,000 pixels**. Pillow identifies the format from the content, checks the file structure and decodes the image before returning metadata and histogram analysis. Width and height describe the stored pixel grid before EXIF display rotation.
4. Backend file handling is scoped to the request. The multipart parser may spool large uploads to a temporary file. Reloading the page clears the Studio selection. Gallery originals remain in browser-local IndexedDB.

The following is a metadata-only excerpt from an earlier JPEG check. Responses now also contain an `analysis` object described below.

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

### Explainable editing suggestions

The upload response includes `recommendations`, each with `id`, `title`, `reason` and `consideration`. Rules live separately in `backend/app/services/recommendations.py`. They suggest directions, not editor-specific slider values:

- Near-black fraction at least 10%: consider lifting Shadows if darker tones are not intentional.
- Near-white fraction at least 10%: consider lowering Highlights if brighter tones are not intentional.
- Luma P5–P95 span strictly between 0 and 60, and standard deviation below 20: consider a small Contrast increase.
- Mean HSV saturation strictly between 0 and 15%: consider a small Saturation increase. Exactly monochrome images receive no saturation prompt.

These are project heuristics, not photography standards or defect diagnoses. Reasons show measurements and thresholds. No recovery of clipped detail is promised. White balance and sharpening suggestions are intentionally not inferred from channel means or neighbor differences. Suggestions inherit the measurement limitations described below.

The Studio lets you dismiss and restore suggestions for the current result; changing the image or reloading clears that choice. Empty suggestions do not imply a perfect image. Nothing is automatically applied or saved to the original. Color Lab offers independent tonal and color previews; Studio suggestions are not applied automatically.

### Studio sharpness reference

`analysis.sharpness` contains `rms_neighbor_difference` (0–255 or null) and `pair_count`. It measures the square root of the mean squared luma difference across horizontal and vertical neighbors, without resizing. Pairs crossing 1024-pixel tile boundaries are omitted; this keeps intermediate memory bounded. Grayscale 16-bit and images without any neighbor pairs return null rather than a fabricated zero. Other modes use the existing 8-bit, white-composited luma conversion.

This is a global detail indicator, not a focus verdict or quality score. Noise, contrast, scene texture, resolution and post-processing affect it. Compare only matching scenes and processing conditions. No sharpening is applied. ICC and initial-frame limitations still apply.

### Studio color analysis

`analysis.color` contains `mean_red`, `mean_green`, `mean_blue` (0–255), `mean_saturation` (0–1), and `saturation` (256 integer counts). Saturation is measured for each pixel using Pillow's 8-bit HSV conversion, then averaged; it is not computed from average RGB. In HSV, S is `(max(R,G,B) - min(R,G,B)) / max(R,G,B)`, or zero for black, quantized to 8-bit. Grayscale has zero saturation. Every pixel has equal weight. Opposing saturated colors can have a neutral RGB average, so channel means are not a white-balance diagnosis.

The existing tile loop accumulates saturation after compositing alpha on white. It does not decode the image a second time, install another dependency or modify originals. The same ICC, initial-frame and 16-bit limitations apply as for the luma histogram. Neither a channel imbalance nor low saturation is automatically considered an error. Optional saturation suggestions use the separate rules above; no correction is applied.

### Studio contrast analysis

`analysis.contrast` reports the population `standard_deviation` of 8-bit luma, `percentile_05`, `percentile_95`, and their difference `percentile_span`. Percentiles use the nearest-rank rule: the first bin whose cumulative count reaches `ceil(p * pixel_count)`. These statistics reuse the full-image luma histogram, with no extra image decode or dependency. Constant-tone images have zero spread; equal black/white pixels have a standard deviation of 127.5. The percentile span reduces sensitivity to sparse extreme pixels, but does not guarantee exactly 90% coverage when values repeat.

Values inherit the histogram's transparency, ICC and first-frame limitations. They describe global encoded-luma spread, not local contrast, scene dynamic range, or artistic quality. No automatic contrast correction is applied.

### Studio histogram analysis

The upload response adds `analysis`: `red`, `green`, `blue` and `brightness` (256 integer counts each), `pixel_count`, `mean_brightness` (0–255), and `transparency_composited`. Every channel sums to the pixel count. Counts cover the full decoded image, using tiles up to 1024 × 1024 to bound additional conversion memory; decoding still requires memory for the original image. No original file or EXIF is rewritten.

Brightness uses Pillow's rounded BT.601 luma, `Y′ = 0.299R + 0.587G + 0.114B`. The mean is the sum of each level multiplied by its count, divided by the number of pixels. This is encoded luma, not linear-light luminance or an artistic quality score. See the [Pillow conversion documentation](https://pillow.readthedocs.io/en/stable/reference/Image.html#PIL.Image.Image.convert).

Alpha and transparency keys are composited on white for measurement; the dark preview can look different. Grayscale 16-bit PNG values are reduced to 8-bit with a fixed scale, without auto-stretching. Other formats use Pillow's decoded 8-bit channels. Embedded ICC profiles are not transformed, so wide-gamut and CMYK measurements can differ from a color-managed preview. Animated PNG analysis covers only the initial frame. Each chart uses its own peak for the vertical scale, with that peak labeled. This is deterministic image processing, not machine learning; suggestions are generated separately from these measurements.

### Tone distribution

The response also includes `analysis.exposure`. Each range contains inclusive `minimum` and `maximum` luma levels, `pixel_count`, and an unrounded `fraction` between 0 and 1. The UI formats fractions as percentages and displays exact counts. Ranges are project conventions, not universal exposure standards:

| Range | Inclusive luma levels |
| --- | --- |
| Shadows | 0–63 |
| Midtones | 64–191 |
| Highlights | 192–255 |
| Near black | 0–5 |
| Near white | 250–255 |

The three broad bands partition all analyzed pixels. Near-black/white are subsets and must not be added to that total. Rounded percentages may not sum to exactly 100%. Calculations reuse the existing luma histogram without decoding the image again and inherit its white alpha-compositing, ICC and first-frame limitations. These ratios do not establish sensor clipping, lost detail, exposure errors or artistic quality. No automatic adjustments or recommendations are applied.

Boundary tests cover both sides of every threshold, weighted pixel counts, partition totals, invalid inputs and API serialization.

### Test commands

Run these commands in a new PowerShell terminal from the project root after setup. The Backend tests generate their own images in memory.

```powershell
.\.venv\Scripts\python.exe -m pytest -q
Push-Location frontend
npm.cmd run build
npm.cmd test
Pop-Location
```

The API routes live in `backend/app/api`, and Pillow inspection lives in `backend/app/image_processing`. The React upload interface lives in `frontend/src/components`, with the API call in `frontend/src/services`.

### Local photo detail pages

Choose **Chi tiết** below a Gallery photo to open its full-size image, saved journal, EXIF summary and Film Recipe on a dedicated page. The hash URL supports reload and browser Back/Forward without server routing. Missing images show an error with a retry action. Return to the Gallery lightbox to edit entries.

These links refer to browser-local IndexedDB records: they do not publish photos or transfer them to another browser, device or origin. No new dependencies are required.
