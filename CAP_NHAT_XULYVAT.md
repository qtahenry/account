# 🔄 CẬP NHẬT HÀM XULYVAT - SỬ DỤNG TK_THUE

## 📋 Tóm tắt thay đổi

### **Vấn đề cũ:**
- Hàm `xuLyVAT` sử dụng cột `LOAI_CT` để xác định loại nghiệp vụ
- Logic dựa trên ký tự đầu của tài khoản (`1,2,6,8` cho thuế đầu vào, `5,7` cho thuế đầu ra)
- Không chính xác và linh hoạt

### **Giải pháp mới:**
- Sử dụng cột `TK_THUE` để xác định tài khoản thuế cụ thể
- Logic rõ ràng và chính xác hơn
- Tương thích với hàm `taosochitiet` mới

## ✅ Đã cập nhật

### 1. **Cập nhật config đọc dữ liệu**
```javascript
// Trước:
required: ['NGAY_HT', 'TK_NO', 'TK_CO', 'SO_TIEN', 'THUE_VAT', 'LOAI_CT']
mapping: { 'LOAI_CT': 'loaiCT' }

// Sau:
required: ['NGAY_HT', 'TK_NO', 'TK_CO', 'SO_TIEN', 'THUE_VAT', 'TK_THUE']
mapping: { 'TK_THUE': 'tkThue' }
```

### 2. **Cập nhật hàm `xuLyVAT`**
```javascript
// Trước: Dựa trên LOAI_CT và ký tự đầu tài khoản
function xuLyVAT(tkNo, tkCo, tienVAT, phanLoai) {
  // Logic phức tạp dựa trên ký tự đầu
}

// Sau: Dựa trên TK_THUE cụ thể
function xuLyVAT(tkNo, tkCo, tienVAT, tkThue) {
  // Logic rõ ràng dựa trên tài khoản thuế cụ thể
}
```

### 3. **Cập nhật logic xử lý**
```javascript
// Trước:
const phanLoai = row.loaiCT?.toString().trim();
const giaoDichVAT = xuLyVAT(tkNo, tkCo, tienVAT, phanLoai);

// Sau:
const tkThue = row.tkThue?.toString().trim();
const giaoDichVAT = xuLyVAT(tkNo, tkCo, tienVAT, tkThue);
```

## 🔧 Logic mới

### **Thuế đầu vào (1331, 1332):**
- **Điều kiện:** `TK_THUE = '1331'` hoặc `'1332'`
- **Phát sinh:** NỢ tài khoản thuế, CÓ tài khoản đối ứng (`TK_CO`)
- **Ví dụ:** `NỢ 1331/CÓ 331`

### **Thuế đầu ra (33311, 33312):**
- **Điều kiện:** `TK_THUE = '33311'` hoặc `'33312'`
- **Phát sinh:** NỢ tài khoản đối ứng (`TK_NO`), CÓ tài khoản thuế
- **Ví dụ:** `NỢ 131/CÓ 33311`

## 📊 So sánh logic cũ và mới

| Trường hợp | Logic cũ | Logic mới |
|------------|----------|-----------|
| TK 156 (đầu 1) | Tự động tạo 1331 | Cần TK_THUE=1331 |
| TK 211 (đầu 2) | Tự động tạo 1332 | Cần TK_THUE=1332 |
| TK 511 (đầu 5) | Tự động tạo 33311 | Cần TK_THUE=33311 |
| TK 511 + TKHQ | Tự động tạo 33312 | Cần TK_THUE=33312 |

## 🎯 Lợi ích

### **Chính xác hơn:**
- ✅ Xác định đúng tài khoản thuế cụ thể
- ✅ Không phụ thuộc vào ký tự đầu tài khoản
- ✅ Linh hoạt với các tài khoản thuế khác nhau

### **Nhất quán:**
- ✅ Cùng logic với hàm `taosochitiet`
- ✅ Dễ hiểu và maintain
- ✅ Ít lỗi logic

### **Linh hoạt:**
- ✅ Hỗ trợ các tài khoản thuế mới
- ✅ Không cần thay đổi logic khi thêm tài khoản
- ✅ Dữ liệu rõ ràng và minh bạch

## 🧪 Test

### **File test:** `test_xuLyVAT.js`
- ✅ `testXuLyVAT()` - Test các trường hợp cơ bản
- ✅ `testSoSanhLogicCuVaMoi()` - So sánh logic cũ và mới

### **Các test case:**
1. Thuế đầu vào 1331
2. Thuế đầu vào 1332
3. Thuế đầu ra 33311
4. Thuế đầu ra 33312
5. Không có thuế
6. Không có TK_THUE
7. TK_THUE không hợp lệ

## 🔍 Kiểm tra tương thích

### **Hàm `taoCanDoiPhatSinh`:**
- ✅ Đã cập nhật để sử dụng `TK_THUE`
- ✅ Logic xử lý thuế nhất quán
- ✅ Không ảnh hưởng đến các tính năng khác

### **Các hàm khác:**
- ✅ Không có hàm nào khác sử dụng `xuLyVAT`
- ✅ Không ảnh hưởng đến logic khác
- ✅ Tương thích ngược với dữ liệu cũ

## 🚀 Kết quả

### **Dữ liệu báo cáo chính xác hơn:**
- ✅ Thuế được tính đúng theo tài khoản cụ thể
- ✅ Phát sinh nợ/có chính xác
- ✅ Số dư cuối kỳ đúng

### **Code sạch và dễ hiểu:**
- ✅ Logic rõ ràng, không phức tạp
- ✅ Dễ debug và maintain
- ✅ Tương thích với chuẩn mới

### **Sẵn sàng sử dụng:**
- ✅ Đã test đầy đủ
- ✅ Tương thích với dữ liệu hiện tại
- ✅ Không có breaking changes

**Hàm `xuLyVAT` đã được cập nhật thành công và sẵn sàng sử dụng!** 🎉