import json
import os

with open('/home/aquistus/Documents/Project/drl_20261_raw.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Difficulty Mapping based on criteria ID and description
# Level 1: Tự động / Nhiệm vụ bắt buộc / Rất dễ đạt
LEVEL_1_FREE = {114, 115, 116, 117, 118, 119, 129, 140, 149, 170, 171}
# Level 2: Dễ đạt (Chỉ cần đăng ký tham gia / quét QR / nộp minh chứng đơn giản)
LEVEL_2_EASY = {120, 122, 123, 125, 133, 134, 135, 141, 142, 143, 144, 146, 152}
# Level 3: Trung bình (Cần tham gia CLB, khóa kỹ năng, chứng chỉ, thực tập)
LEVEL_3_MEDIUM = {121, 124, 128, 130, 131, 132, 136, 137, 138, 139, 145, 147, 148, 150, 151, 153, 157, 161, 162, 163}
# Level 4: Khó / Cao cấp (Chức vụ BCS/Đoàn/Hội, NCKH, Olympic, Giải thưởng, Bằng khen)
LEVEL_4_HARD = {126, 127, 154, 155, 156, 158, 159, 160, 164, 165, 166, 167, 168, 169}
# Level 0: Điểm trừ
LEVEL_PENALTY = {172, 173, 174, 175, 176}

def get_level(cid):
    if cid in LEVEL_1_FREE:
        return 1
    elif cid in LEVEL_2_EASY:
        return 2
    elif cid in LEVEL_3_MEDIUM:
        return 3
    elif cid in LEVEL_4_HARD:
        return 4
    elif cid in LEVEL_PENALTY:
        return 0
    return 2 # default fallback

output_md = """# Phân Tích & Phân Loại Điểm Rèn Luyện HUST Kỳ 20261

Bảng tổng hợp chi tiết toàn bộ **63 tiêu chí ĐRL HUST Kỳ 20261** trích xuất từ dữ liệu eHUST / iCTSV, phân loại theo **4 mức độ từ Dễ đến Khó** giúp sinh viên tối ưu hóa lộ trình tích điểm.

---

## 📊 Tổng quan 6 danh mục tiêu chí ĐRL

| Mã Danh Mục | Tên Danh Mục | Điểm Tối Đa |
| :---: | :--- | :---: |
| **CT 6** | Chấp hành pháp luật và nội quy, quy chế nhà trường | **25.0đ** |
| **CT 7** | Trách nhiệm, tinh thần và thái độ trong học tập | **20.0đ** |
| **CT 8** | Trách nhiệm tham gia HĐ chính trị - xã hội, văn hóa, thể thao... | **20.0đ** |
| **CT 9** | Điểm ý thức công dân trong quan hệ cộng đồng | **15.0đ** |
| **CT 10** | Trách nhiệm tham gia công tác cán bộ, khen thưởng, NCKH | **20.0đ** |
| **CT 11** | Các trường hợp vi phạm bị trừ điểm | **-110.0đ** |

---

## 🎯 Phân Loại Chi Tiết 63 Tiêu Chí Theo Độ Dễ

"""

items_by_level = {1: [], 2: [], 3: [], 4: [], 0: []}

for ct in data["CriteriaTypeDetailsLst"]:
    ct_name = ct["CTName"]
    for cg in ct["CriteriaGroupDetailsLst"]:
        cg_name = cg["CGName"]
        for c in cg["UserCriteriaDetailsLst"]:
            cid = c["CId"]
            cname = c["CName"]
            max_p = c["CMaxPoint"]
            proof_type = "Tự động (Hệ thống tính)" if c["Proof"] == 0 else "Cần minh chứng / Quét QR"
            lvl_code = get_level(cid)
            items_by_level[lvl_code].append({
                "id": cid,
                "name": cname,
                "max": max_p,
                "ct": ct_name,
                "cg": cg_name,
                "proof": proof_type
            })

level_titles = {
    1: "🌟 Level 1: Cực Dễ / Tự Động / Thủ Tục Bắt Buộc (Khuyên làm 100% - Điểm tiềm năng: 40-50đ)",
    2: "🟢 Level 2: Mức Dễ (Chỉ cần tham gia / quét QR / nộp MC đơn giản) (Điểm tiềm năng: 25-35đ)",
    3: "🟡 Level 3: Mức Trung Bình (Tham gia CLB, Khóa kỹ năng, Ngoại ngữ, Thực tập) (Điểm tiềm năng: 20-30đ)",
    4: "🔴 Level 4: Mức Khó / Nâng Cao (Yêu cầu Chức vụ, Giải NCKH/Olympic, Bằng khen)",
    0: "⚠️ Các Trường Hợp Vi Phạm Bị Trừ Điểm (Cần tuyệt đối né tránh)"
}

for lvl in [1, 2, 3, 4, 0]:
    output_md += f"### {level_titles[lvl]}\n\n"
    output_md += f"Tổng số: **{len(items_by_level[lvl])} tiêu chí**\n\n"
    output_md += "| ID | Tên tiêu chí | Điểm tối đa | Loại minh chứng | Nhóm tiêu chí |\n"
    output_md += "| :---: | :--- | :---: | :--- | :--- |\n"
    for item in items_by_level[lvl]:
        output_md += f"| `{item['id']}` | **{item['name']}** | `{item['max']}đ` | {item['proof']} | *{item['cg']}* |\n"
    output_md += "\n---\n\n"

output_md += """
## 💡 Lộ Trình Tối Ưu Điểm Rèn Luyện (Dành cho Sinh Viên HUST)

### 🟢 Lộ trình 1: ĐRL KHÁ (70 - 79 điểm) - Tiết kiệm thời gian nhất (~3-5h cả kỳ)
1. **Hoàn thành 100% Level 1**:
   - `CId 114` (Chấp hành pháp luật - 6đ)
   - `CId 115` (Sinh hoạt công dân - 6đ)
   - `CId 116` (Khai báo cư trú - 4đ)
   - `CId 117` (Họp lớp - 6đ)
   - `CId 118` (Nắm vững quy chế - 6đ)
   - `CId 119` (Cam kết mục tiêu - 6đ)
   - `CId 140` (Khảo sát thông tin - 3đ)
   - `CId 149` (Tích cực trên mạng - 3đ)
   *Tổng Level 1: ~40 điểm.*
2. **Chọn 4-5 tiêu chí Level 2**:
   - Hiến máu nhân đạo (`CId 143`: 6đ)
   - Thể thao / BKRun (`CId 135`: 4đ)
   - Cổ vũ phong trào (`CId 134`: 3đ)
   - Tư vấn kế hoạch học tập (`CId 122`: 3đ)
   - Trà đá cộng đồng / Quyên góp (`CId 142`: 3đ)
   - Bảo vệ môi trường / Ngày chủ nhật xanh (`CId 146`: 4đ)
   *Tổng Level 2: ~23 điểm.*
3. **Tổng điểm dự kiến: ~73 - 78 điểm (Loại Khá)**.

---

### 🟡 Lộ trình 2: ĐRL GIỎI (80 - 89 điểm) - Chuẩn cho Sinh viên chăm chỉ
1. **Level 1**: **~40 điểm** (Hoàn thành đầy đủ các thủ tục bắt buộc).
2. **Level 2**: **~25 điểm** (Tham gia hiến máu, giải thể thao, khảo sát, tư vấn hướng nghiệp).
3. **Level 3** (Chọn 3-4 mục tùy thế mạnh):
   - Thành viên CLB/Đội/Nhóm (`CId 139`: 6đ)
   - Tham gia khóa đào tạo kỹ năng mềm/nghề nghiệp (`CId 124`/`138`: 6đ)
   - Chứng chỉ TOEIC 600+ (`CId 131`: 6đ) hoặc Thực tập sinh > 30 ngày (`CId 132`: 6đ)
   - Kết quả học tập kỳ trước GPA ≥ 3.2 (`CId 171` tự động: 4đ) hoặc nỗ lực tăng GPA (`CId 129`: 6đ)
   *Tổng Level 3: ~18 - 24 điểm.*
4. **Tổng điểm dự kiến: ~83 - 89 điểm (Loại Giỏi)**.

---

### 🔴 Lộ trình 3: ĐRL XUẤT SẮC (90 - 100 điểm) - Dành cho SV Săn Học bổng / SV5T
1. **Level 1 + Level 2**: **~65 điểm**.
2. **Level 3**: **~25 điểm** (CLB + TOEIC/Ngoại ngữ + Khóa kỹ năng + Portfolio + NCKH/Học thuật).
3. **Level 4** (Ít nhất 1-2 mục nâng cao):
   - Ban cán sự Lớp / Ban điều hành Đoàn - Hội - CLB (`CId 158-160`: 4-6đ)
   - Đạt giải NCKH / Olympic / Cuộc thi SV / Giấy khen Đoàn Hội (`CId 154`, `166-169`: 6-10đ)
4. **Tổng điểm dự kiến: 92 - 98 điểm (Loại Xuất sắc)**.
"""

artifact_path = '/home/aquistus/.gemini/antigravity-cli/brain/0768a491-ae97-4122-ae5f-676e45153375/drl_20261_analysis.md'
os.makedirs(os.path.dirname(artifact_path), exist_ok=True)
with open(artifact_path, 'w', encoding='utf-8') as f:
    f.write(output_md)

print("Analysis artifact generated successfully.")
