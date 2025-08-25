# HƯỚNG DẪN SỬ DỤNG HÀM TAOSOCHITIET MỚI

## 📋 Tổng quan

Hàm `taosochitiet` là phiên bản cải tiến của hàm `taosochitiettaikhoan_V2` với các tính năng mới:

### 🆕 Tính năng mới:
1. **Xử lý thuế từ cột TK_THUE**: Tự động tạo bút toán thuế dựa trên cột TK_THUE
2. **Tổng hợp theo cấp tài khoản**: Tự động tổng hợp phát sinh từ tài khoản cấp thấp lên cấp cao
3. **Cải thiện hiệu suất**: Tối ưu hóa xử lý dữ liệu lớn

## 📊 Cấu trúc dữ liệu đầu vào

### Sheet DMTK (Danh mục tài khoản):
- `MA_TK`: Mã tài khoản
- `TEN_TK`: Tên tài khoản  
- `LOAI`: Phân cấp tài khoản
- `DU_NO`: Số dư nợ đầu kỳ
- `DU_CO`: Số dư có đầu kỳ

### Sheet DL_* (Dữ liệu phát sinh):
- `NGAY_HT`: Ngày phát sinh giao dịch
- `NGAY_CT`: Ngày tháng của chứng từ
- `SO_CT`: Số chứng từ
- `DIEN_GIAI`: Nội dung giao dịch
- `TK_THUE`: **Tài khoản định khoản thuế (MỚI)**
- `TK_NO`: Tài khoản phát sinh nợ
- `TK_CO`: Tài khoản phát sinh có
- `SO_TIEN`: Số tiền phát sinh
- `THUE_VAT`: Số tiền thuế phát sinh

## 🧮 Logic xử lý giao dịch và thuế

### Quy tắc xử lý giao dịch:
1. **Tất cả giao dịch hợp lệ** sẽ được đưa vào báo cáo nếu có:
   - Ngày ghi sổ (NGAY_HT)
   - Tài khoản nợ (TK_NO)
   - Tài khoản có (TK_CO)
   - Số tiền > 0 (SO_TIEN)

2. **Giao dịch có thuế** sẽ được tạo thêm bút toán thuế nếu có:
   - Thuế VAT > 0 (THUE_VAT)
   - Tài khoản thuế (TK_THUE)

### Quy tắc tạo bút toán thuế:
1. **Nếu TK_THUE = "1331" hoặc "1332"**:
   - Tạo phát sinh **NỢ** tài khoản thuế
   - Tài khoản đối ứng = `TK_CO`
   - Bút toán: NỢ 1331/1332, CÓ [TK_CO]

2. **Nếu TK_THUE = "33311" hoặc "33312"**:
   - Tạo phát sinh **CÓ** tài khoản thuế  
   - Tài khoản đối ứng = `TK_NO`
   - Bút toán: NỢ [TK_NO], CÓ 33311/33312

## 📈 Tổng hợp theo cấp tài khoản

### Nguyên tắc:
- Phát sinh tài khoản cấp thấp → tổng hợp cho tài khoản cấp cao
- Ví dụ: Phát sinh cấp 4 → tổng hợp cho cấp 3, 2, 1

### Xác định cấp tài khoản:
- Dựa vào cột `LOAI` trong sheet DMTK
- Nhóm tài khoản: 3 ký tự đầu giống nhau = cùng nhóm

## 🎯 Cách sử dụng

### 1. Từ Sidebar:
1. Mở sidebar "Kế Toán Pro - Bảng Điều Khiển"
2. Chọn tab "📊 Báo Cáo Kế Toán"
3. Chọn tài khoản cần báo cáo
4. Chọn kỳ báo cáo (từ ngày - đến ngày)
5. Nhấn nút "🆕 Sổ Chi Tiết (Mới)"

### 2. Từ Code:
```javascript
// Gọi hàm trực tiếp
taosochitiet('2024-01-01', '2024-12-31', ['111', '112', '131']);

// Tham số:
// - startDateStr: Ngày bắt đầu (YYYY-MM-DD)
// - endDateStr: Ngày kết thúc (YYYY-MM-DD)  
// - taiKhoanCanXem: Mảng mã tài khoản cần báo cáo
```

## 📊 Cấu trúc báo cáo đầu ra

### Các cột trong báo cáo:
1. **Ngày Ghi Sổ**: Ngày phát sinh giao dịch
2. **Số Chứng Từ**: Số chứng từ gốc
3. **Ngày Chứng Từ**: Ngày tháng chứng từ
4. **Diễn Giải**: Nội dung giao dịch
5. **TK Đối Ứng**: Tài khoản đối ứng
6. **Phát Sinh Nợ**: Số tiền phát sinh nợ
7. **Phát Sinh Có**: Số tiền phát sinh có
8. **Dư Nợ Cuối Kỳ**: Số dư nợ cuối kỳ
9. **Dư Có Cuối Kỳ**: Số dư có cuối kỳ

### Các dòng đặc biệt:
- **Số dư đầu kỳ**: Tính động từ DMTK + phát sinh trước kỳ
- **Cộng phát sinh trong kỳ**: Tổng phát sinh nợ/có trong kỳ
- **Số dư cuối kỳ**: Số dư cuối kỳ sau khi cộng phát sinh

## 🧪 Test và Debug

### Các hàm test có sẵn:
```javascript
// Test toàn bộ hàm
testTaosochitiet();

// Test đọc dữ liệu với TK_THUE
testReadDataWithThue();

// Test tạo bút toán thuế
testTaoPhatSinhThue();

// Test xử lý giao dịch với và không có thuế
testXuLyGiaoDichVaThue();
```

### Kiểm tra log:
- Mở Developer Console trong Google Apps Script
- Xem các log với emoji để theo dõi tiến trình
- Các lỗi sẽ được hiển thị chi tiết

## ⚠️ Lưu ý quan trọng

1. **Dữ liệu TK_THUE**: Phải có định dạng chính xác (1331, 1332, 33311, 33312)
2. **Cấu trúc sheet**: Đảm bảo các sheet DL_* có đầy đủ cột bắt buộc
3. **Phân cấp tài khoản**: Cột LOAI trong DMTK phải được định nghĩa đúng
4. **Hiệu suất**: Với dữ liệu lớn, quá trình có thể mất vài phút

## 🔧 Xử lý lỗi thường gặp

### Lỗi "Không tìm thấy sheet":
- Kiểm tra tên sheet DMTK và SO_CT
- Đảm bảo có ít nhất một sheet bắt đầu bằng "DL_"

### Lỗi "Thiếu cột bắt buộc":
- Kiểm tra tiêu đề cột trong các sheet DL_*
- Đảm bảo có đầy đủ: NGAY_HT, TK_NO, TK_CO, SO_TIEN

### Lỗi "Dữ liệu không hợp lệ":
- Kiểm tra định dạng ngày tháng
- Kiểm tra số tiền không âm
- Kiểm tra mã tài khoản hợp lệ

## 📞 Hỗ trợ

Nếu gặp vấn đề, hãy:
1. Kiểm tra log trong Developer Console
2. Chạy các hàm test để debug
3. Kiểm tra cấu trúc dữ liệu đầu vào
4. Liên hệ developer để được hỗ trợ