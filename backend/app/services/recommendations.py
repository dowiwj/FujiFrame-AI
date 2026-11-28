"""Conservative, deterministic editing prompts; not automatic corrections."""

from dataclasses import dataclass

from ..image_processing.histogram import HistogramAnalysis


@dataclass(frozen=True)
class Recommendation:
    id: str
    title: str
    reason: str
    consideration: str


def suggest_adjustments(analysis: HistogramAnalysis) -> list[Recommendation]:
    """Use project heuristics, not universal definitions of correct exposure.

    Only suggest directions. Slider amounts depend on the editor and intent.
    Never infer white balance, recoverable detail, or focus from these metrics.
    """
    suggestions = []
    dark = analysis.exposure.near_black
    light = analysis.exposure.near_white
    if dark.fraction >= 0.10:
        suggestions.append(Recommendation(
            "shadows", "Thử nâng Shadows nếu muốn thấy rõ vùng tối",
            f"{dark.fraction:.2%} pixel nằm ở Y′ {dark.minimum}–{dark.maximum} "
            "(ngưỡng tham khảo: từ 10%).",
            "Bỏ qua nếu bạn muốn giữ phong cách low-key. Nâng Shadows có thể "
            "làm lộ nhiễu và không bảo đảm phục hồi chi tiết đã mất.",
        ))
    if light.fraction >= 0.10:
        suggestions.append(Recommendation(
            "highlights", "Thử giảm Highlights nếu muốn dịu vùng sáng",
            f"{light.fraction:.2%} pixel nằm ở Y′ {light.minimum}–{light.maximum} "
            "(ngưỡng tham khảo: từ 10%).",
            "Bỏ qua nếu vùng trắng hoặc phong cách high-key là chủ đích. "
            "Giảm Highlights không bảo đảm phục hồi chi tiết đã mất.",
        ))
    contrast = analysis.contrast
    if 0 < contrast.percentile_span < 60 and contrast.standard_deviation < 20:
        suggestions.append(Recommendation(
            "contrast", "Thử tăng Contrast nhẹ nếu muốn tách các vùng sáng",
            f"Khoảng P5–P95 là {contrast.percentile_span} (<60) và độ lệch chuẩn "
            f"luma là {contrast.standard_deviation:.2f} (<20).",
            "Ảnh sương mù hoặc phong cách mềm có thể cần tương phản thấp. "
            "Tăng Contrast có thể làm mất chi tiết ở hai đầu sáng/tối.",
        ))
    saturation = analysis.color.mean_saturation
    if 0 < saturation < 0.15:
        suggestions.append(Recommendation(
            "saturation", "Thử tăng Saturation nhẹ nếu muốn màu rõ hơn",
            f"Saturation HSV trung bình là {saturation:.2%} "
            "(ngưỡng tham khảo: lớn hơn 0% và dưới 15%).",
            "Bỏ qua nếu màu trầm hoặc gần đơn sắc là chủ đích. Quan sát màu da "
            "và các vùng vốn đã rực; trung bình thấp không có nghĩa mọi vùng đều nhạt.",
        ))
    return suggestions
