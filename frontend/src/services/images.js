export async function inspectImage(file, signal) {
  const form = new FormData();
  form.append("file", file);

  let response;
  try {
    response = await fetch("/api/images/upload", {
      method: "POST",
      body: form,
      signal,
    });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new Error("Mất kết nối. Hãy kiểm tra dịch vụ local rồi thử lại.");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const fallback = response.status >= 500
      ? "Dịch vụ đọc ảnh chưa sẵn sàng. Hãy kiểm tra Backend rồi thử lại."
      : "Không thể đọc tệp đã chọn. Hãy thử lại với một ảnh JPEG hoặc PNG.";
    throw new Error(typeof body?.detail === "string" ? body.detail : fallback);
  }
  return response.json();
}
