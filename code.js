function onOpen() {
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu('⚡ Kế toán Pro');
  
  // Đã lược bỏ: menu.addItem('📦 Tạo Nhập Xuất Tồn', 'taoNhapXuatTon');
  menu.addItem('🚀 Bảng Điều Khiển Tổng Hợp', 'moSidebarUnified');
  menu.addSeparator();
  
  // Menu con đầy đủ cho chức năng Tính giá xuất kho
  const tinhGiaMenu = ui.createMenu('⚙️ Tính giá Xuất kho');
  tinhGiaMenu.addItem('Bình quân Gia quyền Theo Tháng', 'runBQGQ_Thang');
  tinhGiaMenu.addItem('Bình quân Di động', 'runBQDD');
  tinhGiaMenu.addItem('Nhập trước, Xuất trước (FIFO)', 'runFIFO');
  tinhGiaMenu.addItem('Nhập sau, Xuất trước (LIFO)', 'runLIFO');
  
  menu.addSubMenu(tinhGiaMenu);
  menu.addSeparator();
  
  // Ghi chú: Chức năng hàng hóa đã được tích hợp vào Bảng Điều Khiển Tổng Hợp
  // menu.addItem('📦 Chọn Hàng hóa', 'moSidebarHangHoa');
  
  menu.addToUi();
}

// Các hàm nhỏ để gọi hàm chính với đúng tham số
function runBQGQ_Thang() {
  tinhGiaXuatKho('BQGQ_THANG');
}
function runBQDD() {
  tinhGiaXuatKho('BQDD');
}
function runFIFO() {
  tinhGiaXuatKho('FIFO');
}
function runLIFO() {
  tinhGiaXuatKho('LIFO');
}

/**
 * HÀM PHỤ: Tạo Map lookup thông tin hàng hóa từ sheet DMHH
 * Sử dụng cache để tăng hiệu suất
 */
function getHangHoaLookupMap() {
  try {
    const cache = CacheService.getScriptCache();
    const CACHE_KEY = 'HANGHOA_LOOKUP_MAP';
    
    // Kiểm tra cache trước
    const cachedData = cache.get(CACHE_KEY);
    if (cachedData != null) {
      console.log('✅ Loaded hangHoaMap from CACHE');
      return new Map(JSON.parse(cachedData));
    }
    
    // Cache miss - đọc từ sheet DMHH
    console.log('⚠️ Cache miss. Reading products from Sheet "DMHH" for auto-fill...');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetDMHH = ss.getSheetByName('DMHH');
    
    if (!sheetDMHH) {
      throw new Error('Không tìm thấy sheet "DMHH"');
    }
    
    const data = sheetDMHH.getDataRange().getValues();
    const hangHoaMap = new Map();
    
    // Bắt đầu từ dòng 2 để bỏ qua tiêu đề
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const maKho = row[0]?.toString().trim();
      const maHang = row[1]?.toString().trim();
      
      if (maKho && maHang) { // Chỉ lấy hàng hóa có đủ mã kho và mã hàng
        const key = `${maKho}|${maHang}`;
        hangHoaMap.set(key, {
          tenHang: row[2]?.toString().trim() || '',
          quyCach: row[3]?.toString().trim() || '',
          dvt: row[4]?.toString().trim() || ''
        });
      }
    }
    
    // Lưu vào cache trong 15 phút (900 giây)
    const mapArray = Array.from(hangHoaMap.entries());
    cache.put(CACHE_KEY, JSON.stringify(mapArray), 300);
    
    console.log(`✅ Loaded and cached ${hangHoaMap.size} products for auto-fill.`);
    return hangHoaMap;
    
  } catch (e) {
    console.error('❌ Error in getHangHoaLookupMap: ' + e.toString());
    return new Map(); // Trả về Map rỗng nếu có lỗi
  }
}

function onEdit(e) {
  try {
    const range = e.range;
    const sheet = range.getSheet();
    const sheetName = sheet.getName();
    const startRow = range.getRow();
    const startCol = range.getColumn();
    const numRows = range.getNumRows();

    // --- TÁC VỤ 1: Tự động chạy báo cáo Cân đối phát sinh ---
    if (sheetName === 'CDPS' && numRows === 1 && ( (startRow === 1 && startCol === 12) || (startRow === 2 && startCol === 12) )) {
      SpreadsheetApp.getActiveSpreadsheet().toast('Đang tính toán lại Cân đối phát sinh...');
      Utilities.sleep(1000);
      taoCanDoiPhatSinh();
      return;
    }

    // --- TÁC VỤ 2: Tự động điền thông tin hàng hóa (Nâng cấp) ---
    // Chỉ xử lý các sheet có tên bắt đầu bằng DL_
    if (!sheetName.startsWith('DL_') || startRow <= 1) return;

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Lấy header row để tìm vị trí các cột cần thiết
    const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const cleanHeaders = headerRow.map(h => h.toString().trim().toUpperCase());
    
    // Tìm vị trí các cột cần thiết
    const colIndexMaKho = cleanHeaders.indexOf('MA_KHO');
    const colIndexMaHang = cleanHeaders.indexOf('MA_HANG');
    const colIndexTenHang = cleanHeaders.indexOf('TEN_HANG');
    const colIndexQuyCach = cleanHeaders.indexOf('QUY_CACH');
    const colIndexDVT = cleanHeaders.indexOf('DVT');

    // Kiểm tra xem có đủ các cột cần thiết không
    if (colIndexMaKho === -1 || colIndexMaHang === -1) {
      console.log(`⚠️ Sheet ${sheetName} không có cột MA_KHO hoặc MA_HANG`);
      return;
    }

    // Kiểm tra xem có ít nhất một cột để điền không
    if (colIndexTenHang === -1 && colIndexQuyCach === -1 && colIndexDVT === -1) {
      console.log(`⚠️ Sheet ${sheetName} không có cột nào để điền (TEN_HANG, QUY_CACH, DVT)`);
      return;
    }

    // Kiểm tra xem vùng được chỉnh sửa có liên quan đến cột MA_KHO hoặc MA_HANG không
    const endCol = startCol + range.getNumColumns() - 1;
    const isRelevantColumnEdited = (endCol >= colIndexMaKho + 1 && startCol <= colIndexMaKho + 1) || 
                                   (endCol >= colIndexMaHang + 1 && startCol <= colIndexMaHang + 1);

    // Nếu không có sự thay đổi nào ở 2 cột này -> thoát hàm
    if (!isRelevantColumnEdited) {
      return;
    }

    // Thông báo đang xử lý
    ss.toast(`Đang xử lý ${numRows} dòng...`, 'Tự động điền thông tin hàng hóa', 5);
    
    // Lấy Map thông tin hàng hóa
    const hangHoaMap = getHangHoaLookupMap();
    if (hangHoaMap.size === 0) {
      ss.toast('Không thể đọc dữ liệu từ sheet DMHH', 'Lỗi', 10);
      return;
    }

    // Lấy dữ liệu từ vùng được chỉnh sửa
    const dataRange = sheet.getRange(startRow, 1, numRows, sheet.getLastColumn()).getValues();
    
    // Chuẩn bị dữ liệu để điền
    const tenHangValues = [];
    const quyCachValues = [];
    const dvtValues = [];
    let filledCount = 0;

    // Xử lý từng dòng
    for (let i = 0; i < numRows; i++) {
      const currentRow = dataRange[i];
      const maKho = currentRow[colIndexMaKho]?.toString().trim();
      const maHang = currentRow[colIndexMaHang]?.toString().trim();

      if (maKho && maHang) {
        const key = `${maKho}|${maHang}`;
        if (hangHoaMap.has(key)) {
          const itemInfo = hangHoaMap.get(key);
          tenHangValues.push([itemInfo.tenHang]);
          quyCachValues.push([itemInfo.quyCach]);
          dvtValues.push([itemInfo.dvt]);
          filledCount++;
          console.log(`✅ Tìm thấy: ${maKho} - ${maHang} → ${itemInfo.tenHang}`);
        } else {
          tenHangValues.push(['']);
          quyCachValues.push(['']);
          dvtValues.push(['']);
          console.log(`⚠️ Không tìm thấy: ${maKho} - ${maHang}`);
        }
      } else {
        tenHangValues.push(['']);
        quyCachValues.push(['']);
        dvtValues.push(['']);
      }
    }

    // Điền dữ liệu vào các cột tương ứng
    if (colIndexTenHang > -1 && tenHangValues.length > 0) {
      sheet.getRange(startRow, colIndexTenHang + 1, numRows, 1).setValues(tenHangValues);
    }
    if (colIndexQuyCach > -1 && quyCachValues.length > 0) {
      sheet.getRange(startRow, colIndexQuyCach + 1, numRows, 1).setValues(quyCachValues);
    }
    if (colIndexDVT > -1 && dvtValues.length > 0) {
      sheet.getRange(startRow, colIndexDVT + 1, numRows, 1).setValues(dvtValues);
    }

    // Thông báo hoàn thành
    const message = `✅ Đã tự động điền ${filledCount}/${numRows} dòng từ sheet DMHH`;
    ss.toast(message, 'Hoàn thành!', 5);
    console.log(message);

  } catch (error) {
    console.error('❌ LỖI TRONG HÀM ONEDIT: ' + error.toString());
    SpreadsheetApp.getActiveSpreadsheet().toast('Gặp lỗi khi tự động điền, vui lòng xem Logs.', 'Lỗi Script', 10);
  }
}

// ==================== UNIVERSAL DATA READER ====================

const REPORT_COLUMN_CONFIGS = {
  CDPS: {
    // ⭐ THAY ĐỔI 1: Đã xóa 'TK_THUE' khỏi danh sách cột bắt buộc
    required: ['NGAY_HT', 'TK_NO', 'TK_CO', 'SO_TIEN', 'THUE_VAT'],
    mapping: {
      'NGAY_HT': 'ngay',
      'TK_NO': 'tkNo', 
      'TK_CO': 'tkCo',
      'SO_TIEN': 'soTien',
      'THUE_VAT': 'thueVAT',
      'TK_THUE': 'tkThue' // Vẫn giữ mapping để đọc dữ liệu nếu cột tồn tại
    }
  },
  NXT: {
    required: ['NGAY_HT', 'TK_NO', 'TK_CO', 'SO_TIEN', 'MA_KHO', 'MA_HANG', 'SO_LUONG', 'DON_GIA'],
    mapping: {
      'NGAY_HT': 'ngay',
      'TK_NO': 'tkNo', 
      'TK_CO': 'tkCo',
      'SO_TIEN': 'soTien',
      'MA_KHO': 'maKho',
      'MA_HANG': 'maHang',
      'SO_LUONG': 'soLuong',
      'DON_GIA': 'donGia'
    }
  },
  // ⭐ THAY ĐỔI: Thêm config mới cho Nhật Ký Chung
  NKC: {
    required: ['NGAY_HT', 'TK_NO', 'TK_CO', 'SO_TIEN'],
    mapping: {
      'NGAY_HT': 'ngay',
      'SO_CT': 'soCt',
      'NGAY_CT': 'ngayCt',
      'DIEN_GIAI': 'dienGiai',
      'TK_NO': 'tkNo',
      'TK_CO': 'tkCo',
      'SO_TIEN': 'soTien',
      'THUE_VAT': 'thueVAT',
      'TK_THUE': 'tkThue'
    }
  },
  BC_BANHANG: {
    required: ['NGAY_HT', 'MA_KHO', 'MA_HANG', 'CO_SO', 'SO_LUONG', 'SO_TIEN'],
    mapping: {
      'NGAY_HT': 'ngay',
      'MA_KHO': 'maKho',
      'MA_HANG': 'maHang',
      'CO_SO': 'coSo',
      'SO_LUONG': 'soLuong',
      'SO_TIEN': 'soTien',
      // ⭐ THAY ĐỔI: Sửa lại tên thuộc tính cho nhất quán
      'THUE_VAT': 'thueVAT'
    }
  }
};
// HÀM ĐỌC DỮ LIỆU UNIVERSAL
function getAllDataFromDLSheets(spreadsheet, reportType, filterCondition = null) {
  const config = REPORT_COLUMN_CONFIGS[reportType];
  if (!config) throw new Error(`Không tìm thấy config cho loại báo cáo: ${reportType}`);
  
  const dataSheets = spreadsheet.getSheets().filter(sheet => sheet.getName().startsWith('DL_'));
  if (dataSheets.length === 0) throw new Error('Không tìm thấy sheet nào bắt đầu với "DL_"');
  
  const combinedData = [];
  const processSummary = {
    totalSheets: dataSheets.length,
    validSheets: 0,
    totalRows: 0,
    errors: []
  };
  
  for (const sheet of dataSheets) {
    try {
      const sheetData = processUniversalDataSheet(sheet, config, filterCondition);
      if (sheetData.length > 0) {
        combinedData.push(...sheetData);
        processSummary.totalRows += sheetData.length;
        processSummary.validSheets++;
      }
    } catch (error) {
      processSummary.errors.push(`${sheet.getName()}: ${error.message}`);
      console.log(`⚠️ Lỗi sheet "${sheet.getName()}": ${error.message}`);
    }
  }
  
  console.log(`📊 Tổng kết ${reportType}: ${processSummary.validSheets}/${processSummary.totalSheets} sheets, ${processSummary.totalRows} dòng`);
  return { data: combinedData, summary: processSummary };
}
// HÀM XỬ LÝ UNIVERSAL CHO MỘT SHEET
function processUniversalDataSheet(sheet, config, filterCondition) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const headerRow = data[0];
  const columnMap = mapUniversalColumns(headerRow, config, sheet.getName());
  if (!columnMap.isValid) throw new Error(`Thiếu cột: ${columnMap.missingColumns.join(', ')}`);
  
  const processedData = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const processedRow = { sheet: sheet.getName(), row: i + 1 };
    
    let hasValidData = false;
    for (const [headerName, propName] of Object.entries(config.mapping)) {
      const colIndex = columnMap[propName];
      let value = (colIndex !== undefined) ? row[colIndex] : undefined;
      
      if (['soTien', 'thueVAT', 'soLuong', 'donGia'].includes(propName)) {
        value = parseFloat(value) || 0;
      } else if (propName === 'ngay') {
        if (!value) continue;
        hasValidData = true;
      } else {
        value = value?.toString().trim() || '';
      }
      
      processedRow[propName] = value;
      if (propName !== 'ngay' && value) hasValidData = true;
    }
    
    if (!hasValidData) continue;
    if (filterCondition && !filterCondition(processedRow)) continue;
    
    processedData.push(processedRow);
  }
  
  return processedData;
}
// HÀM MAP CỘT UNIVERSAL
function mapUniversalColumns(headerRow, config, sheetName) {
  const columnMap = {};
  const missingColumns = [];
  
  const headerMap = {};
  headerRow.forEach((h, i) => {
    const headerName = h?.toString().trim().toUpperCase();
    if (headerName) headerMap[headerName] = i;
  });
  
  for (const [headerName, propName] of Object.entries(config.mapping)) {
    if (headerMap.hasOwnProperty(headerName)) {
      columnMap[propName] = headerMap[headerName];
    } else if (config.required.includes(headerName)) {
      missingColumns.push(headerName);
    }
  }
  
  return { ...columnMap, isValid: missingColumns.length === 0, missingColumns };
}
// HÀM TẠO SUMMARY UNIVERSAL
function createDataSummary(spreadsheet, reportType) {
  const dataSheets = spreadsheet.getSheets().filter(sheet => sheet.getName().startsWith('DL_'));
  const config = REPORT_COLUMN_CONFIGS[reportType];
  
  let summary = `- Tìm thấy ${dataSheets.length} sheet dữ liệu:\n`;
  let totalRows = 0;
  let validSheets = 0;
  
  for (const sheet of dataSheets) {
    try {
      const data = sheet.getDataRange().getValues();
      const rowCount = data.length - 1;
      
      if (rowCount > 0) {
        const headerRow = data[0];
        const columnMap = mapUniversalColumns(headerRow, config, sheet.getName());
        
        if (columnMap.isValid) {
          summary += `  ✅ ${sheet.getName()}: ${rowCount} dòng\n`;
          totalRows += rowCount;
          validSheets++;
        } else {
          summary += `  ❌ ${sheet.getName()}: Thiếu cột ${columnMap.missingColumns.join(', ')}\n`;
        }
      } else {
        summary += `  ⚠️ ${sheet.getName()}: Trống\n`;
      }
    } catch (error) {
      summary += `  ❌ ${sheet.getName()}: Lỗi ${error.message}\n`;
    }
  }
  
  summary += `- Tổng: ${validSheets}/${dataSheets.length} sheet hợp lệ, ${totalRows} dòng dữ liệu`;
  return summary;
}

// ==================== HÀM BÁO CÁO CHÍNH ====================

function taoCanDoiPhatSinh(ngayBatDau = null, ngayKetThuc = null) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  
  try {
    const sheetDMTK = ss.getSheetByName('DMTK');
    const sheetCDPS = ss.getSheetByName('CDPS');
    if (!sheetDMTK || !sheetCDPS) throw new Error('Không tìm thấy sheet DMTK hoặc CDPS');
    
    let startDate, endDate;
    if (ngayBatDau && ngayKetThuc) {
      startDate = new Date(ngayBatDau);
      endDate = new Date(ngayKetThuc);
    } else {
      startDate = new Date(ss.getRangeByName('NgayBatDau_CDPS').getValue());
      endDate = new Date(ss.getRangeByName('NgayKetThuc_CDPS').getValue());
    }
    if (!startDate || !endDate) throw new Error('Vui lòng nhập ngày bắt đầu và ngày kết thúc');
    
    const selectedAccounts = getSelectedAccounts();
    const isFiltered = selectedAccounts.length > 0;
    
    ss.toast('Đang đọc dữ liệu...', 'Bước 1/4', -1);
    const dataResult = getAllDataFromDLSheets(ss, 'CDPS');
    const combinedData = dataResult.data;
    
    const taiKhoanMap = new Map();
    
    function xacDinhTinhChatTaiKhoan(maTK) {
      const kyTuDau = maTK.toString().charAt(0);
      if (['1', '2', '6', '8'].includes(kyTuDau)) return 'TAI_SAN_CHI_PHI';
      if (['3', '4', '5', '7'].includes(kyTuDau)) return 'NO_VON_DOANH_THU';
      return 'KHAC';
    }
    
    function tinhSoDuSauPhatSinh(duNoDauKy, duCoDauKy, phatSinhNo, phatSinhCo, tinhChatTK) {
      let soDuNoCuoi = 0, soDuCoCuoi = 0;
      if (tinhChatTK === 'TAI_SAN_CHI_PHI') {
        const soDuThuan = (duNoDauKy + phatSinhNo) - (duCoDauKy + phatSinhCo);
        if (soDuThuan >= 0) soDuNoCuoi = soDuThuan;
        else soDuCoCuoi = Math.abs(soDuThuan);
      } else { // NO_VON_DOANH_THU và KHAC
        const soDuThuan = (duCoDauKy + phatSinhCo) - (duNoDauKy + phatSinhNo);
        if (soDuThuan >= 0) soDuCoCuoi = soDuThuan;
        else soDuNoCuoi = Math.abs(soDuThuan);
      }
      return [soDuNoCuoi, soDuCoCuoi];
    }
    
    function xuLyVAT(tkNo, tkCo, tienVAT, tkThue) {
      if (!tienVAT || tienVAT <= 0 || !tkThue) return [];
      const tkThueStr = tkThue.toString().trim();
      if (['1331', '1332'].includes(tkThueStr)) return [{ tkNo: tkThueStr, tkCo, soTien: tienVAT }];
      if (['33311', '33312'].includes(tkThueStr)) return [{ tkNo, tkCo: tkThueStr, soTien: tienVAT }];
      return [];
    }
    
    function timTaiKhoanCha(maTK, capTaiKhoan) {
      const ma = maTK.toString().trim();
      const taiKhoanCha = [];
      if (capTaiKhoan === 3 && ma.length >= 4) {
        taiKhoanCha.push(ma.substring(0, 4));
        taiKhoanCha.push(ma.substring(0, 3));
      } else if (capTaiKhoan === 2 && ma.length >= 3) {
        taiKhoanCha.push(ma.substring(0, 3));
      }
      return taiKhoanCha;
    }
    
    function kiemTraTaiKhoanThuocFilter(maTK) {
      if (!isFiltered) return true;
      const ma = maTK.toString().trim();
      return selectedAccounts.some(selectedTK => ma.startsWith(selectedTK));
    }
    
    ss.toast('Đang đọc danh mục tài khoản...', 'Bước 2/4', -1);
    const dataDMTK = sheetDMTK.getDataRange().getValues();
    for (let i = 1; i < dataDMTK.length; i++) {
      const row = dataDMTK[i];
      const maTK = row[0]?.toString().trim();
      if (maTK) {
        taiKhoanMap.set(maTK, {
          ten: row[1]?.toString().trim(),
          loai: parseInt(row[2]) || 0,
          duNoDauKyGoc: parseFloat(row[3]) || 0,
          duCoDauKyGoc: parseFloat(row[4]) || 0,
          phatSinhNoTruocKy: 0, phatSinhCoTruocKy: 0,
          phatSinhNoTrongKy: 0, phatSinhCoTrongKy: 0,
          tinhChat: xacDinhTinhChatTaiKhoan(maTK)
        });
      }
    }
    
    ss.toast('Đang xử lý dữ liệu phát sinh...', 'Bước 3/4', -1);
    
    for (const row of combinedData) {
      const ngayHachToan = new Date(row.ngay);
      const tkNo = row.tkNo?.toString().trim();
      const tkCo = row.tkCo?.toString().trim();
      
      // ⭐ THAY ĐỔI 2: Logic xử lý tiền hàng và tiền thuế
      let tienHang = parseFloat(row.soTien) || 0;
      const tienVAT = parseFloat(row.thueVAT) || 0;
      const tkThue = row.tkThue?.toString().trim();

      // Nếu có tiền thuế nhưng không có tài khoản thuế, cộng gộp vào tiền hàng
      if (tienVAT > 0 && !tkThue) {
        tienHang += tienVAT;
      }
      
      const laGiaoDichTruocKy = ngayHachToan < startDate;
      const laGiaoDichTrongKy = ngayHachToan >= startDate && ngayHachToan <= endDate;
      
      if (laGiaoDichTruocKy || laGiaoDichTrongKy) {
        const capNhatPhatSinh = (maTK, soTien, loai) => {
          if (!taiKhoanMap.has(maTK)) {
            taiKhoanMap.set(maTK, {
              ten: `Tài khoản ${maTK}`, loai: maTK.length, duNoDauKyGoc: 0, duCoDauKyGoc: 0,
              phatSinhNoTruocKy: 0, phatSinhCoTruocKy: 0, phatSinhNoTrongKy: 0, phatSinhCoTrongKy: 0,
              tinhChat: xacDinhTinhChatTaiKhoan(maTK)
            });
          }
          const tk = taiKhoanMap.get(maTK);
          if (laGiaoDichTruocKy) {
            if (loai === 'NO') tk.phatSinhNoTruocKy += soTien; else tk.phatSinhCoTruocKy += soTien;
          } else {
            if (loai === 'NO') tk.phatSinhNoTrongKy += soTien; else tk.phatSinhCoTrongKy += soTien;
          }
        };
        
        if (tienHang > 0) {
          if (tkNo) capNhatPhatSinh(tkNo, tienHang, 'NO');
          if (tkCo) capNhatPhatSinh(tkCo, tienHang, 'CO');
        }
        
        if (tienVAT > 0 && tkThue) {
          const giaoDichVAT = xuLyVAT(tkNo, tkCo, tienVAT, tkThue);
          for (const vatGD of giaoDichVAT) {
            if (vatGD.tkNo) capNhatPhatSinh(vatGD.tkNo, vatGD.soTien, 'NO');
            if (vatGD.tkCo) capNhatPhatSinh(vatGD.tkCo, vatGD.soTien, 'CO');
          }
        }
      }
    }
    
    const sortedByLevel = Array.from(taiKhoanMap.entries()).sort((a, b) => b[1].loai - a[1].loai || a[0].localeCompare(b[0]));
    
    for (const [maTK, thongTin] of sortedByLevel) {
      const taiKhoanCha = timTaiKhoanCha(maTK, thongTin.loai);
      for (const maCha of taiKhoanCha) {
        if (taiKhoanMap.has(maCha)) {
          const thongTinCha = taiKhoanMap.get(maCha);
          thongTinCha.duNoDauKyGoc += thongTin.duNoDauKyGoc;
          thongTinCha.duCoDauKyGoc += thongTin.duCoDauKyGoc;
          thongTinCha.phatSinhNoTruocKy += thongTin.phatSinhNoTruocKy;
          thongTinCha.phatSinhCoTruocKy += thongTin.phatSinhCoTruocKy;
          thongTinCha.phatSinhNoTrongKy += thongTin.phatSinhNoTrongKy;
          thongTinCha.phatSinhCoTrongKy += thongTin.phatSinhCoTrongKy;
        }
      }
    }
    
    ss.toast('Đang tạo báo cáo...', 'Bước 4/4', -1);
    
    const outputData = [];
    const finalSorted = Array.from(taiKhoanMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    
    for (const [maTK, thongTin] of finalSorted) {
      const [duNoDauKy, duCoDauKy] = tinhSoDuSauPhatSinh(thongTin.duNoDauKyGoc, thongTin.duCoDauKyGoc, thongTin.phatSinhNoTruocKy, thongTin.phatSinhCoTruocKy, thongTin.tinhChat);
      const coPhatSinh = thongTin.phatSinhNoTrongKy !== 0 || thongTin.phatSinhCoTrongKy !== 0;
      const coSoDu = duNoDauKy !== 0 || duCoDauKy !== 0;

      if (kiemTraTaiKhoanThuocFilter(maTK) && (coPhatSinh || coSoDu)) {
        const [duNoCuoiKy, duCoCuoiKy] = tinhSoDuSauPhatSinh(duNoDauKy, duCoDauKy, thongTin.phatSinhNoTrongKy, thongTin.phatSinhCoTrongKy, thongTin.tinhChat);
        outputData.push([maTK, thongTin.ten, thongTin.loai, duNoDauKy, duCoDauKy, thongTin.phatSinhNoTrongKy, thongTin.phatSinhCoTrongKy, duNoCuoiKy, duCoCuoiKy]);
      }
    }
    
    const lastRow = sheetCDPS.getLastRow();
    if (lastRow >= 4) sheetCDPS.getRange(4, 1, lastRow - 3, 10).clear();
    
    if (outputData.length > 0) {
      sheetCDPS.getRange(5, 1, outputData.length, 9).setValues(outputData);
      sheetCDPS.getRange(5, 4, outputData.length, 6).setNumberFormat('#,##0');
      
      for (let i = 0; i < outputData.length; i++) {
        if (outputData[i][2] === 1) {
          sheetCDPS.getRange(5 + i, 1, 1, 10).setFontWeight('bold').setBackground('#E7E6E6');
        }
      }
    }

    ss.toast('✅ Hoàn thành!', 'Thành công', 5);
    ui.alert(`✅ Báo cáo Cân đối Phát sinh đã hoàn thành cho kỳ báo cáo từ ${startDate.toLocaleDateString('vi-VN')} đến ${endDate.toLocaleDateString('vi-VN')}.`);
  
  } catch (error) {
    console.error("LỖI TẠO BÁO CÁO CDPS: " + error.toString() + error.stack);
    ss.toast('❌ Lỗi: ' + error.toString(), 'Lỗi', 10);
    SpreadsheetApp.getUi().alert('❌ Lỗi khi tạo báo cáo Cân đối Phát sinh:\n\n' + error.toString());
  }
}

//--------------------------------------------------------------------------------------------

// ==================== CÁC HÀM KHÁC GIỮ NGUYÊN ====================

function openAccountFilter() {
  const html = HtmlService.createTemplateFromFile('sidebarLocCDPS');
  html.accounts = getLevel1Accounts();
  html.selectedAccounts = getSelectedAccounts();
  
  const htmlOutput = html.evaluate()
    .setWidth(350)
    .setTitle('🏦 Lọc Tài khoản Cấp 1');
  
  SpreadsheetApp.getUi().showSidebar(htmlOutput);
}

function getLevel1Accounts() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetDMTK = ss.getSheetByName('DMTK');
  
  if (!sheetDMTK) return [];
  
  const data = sheetDMTK.getDataRange().getValues();
  const level1Accounts = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const maTK = row[0]?.toString().trim();
    const tenTK = row[1]?.toString().trim();
    const loaiTK = parseInt(row[2]) || 0;
    
    if (maTK && loaiTK === 1) {
      level1Accounts.push({
        ma: maTK,
        ten: tenTK
      });
    }
  }
  
  return level1Accounts.sort((a, b) => a.ma.localeCompare(b.ma));
}

function getSelectedAccounts() {
  const selected = PropertiesService.getDocumentProperties().getProperty('selectedAccounts');
  return selected ? JSON.parse(selected) : [];
}

function saveSelectedAccounts(selectedAccounts) {
  PropertiesService.getDocumentProperties().setProperty('selectedAccounts', JSON.stringify(selectedAccounts));
  return true;
}

function clearAccountFilter() {
  PropertiesService.getDocumentProperties().deleteProperty('selectedAccounts');
  return true;
}


/**
 * HÀM PHỤ: Kiểm tra tính hợp lệ của dữ liệu đầu vào
 */
function validateInputData(startDateStr, endDateStr, taiKhoanCanXem) {
  const errors = [];
  
  // Kiểm tra ngày
  if (!startDateStr || !endDateStr) {
    errors.push('Thiếu tham số ngày bắt đầu hoặc kết thúc');
  } else {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      errors.push('Định dạng ngày không hợp lệ');
    } else if (startDate > endDate) {
      errors.push('Ngày bắt đầu không thể lớn hơn ngày kết thúc');
    }
  }
  
  // Kiểm tra tài khoản
  if (!taiKhoanCanXem || !Array.isArray(taiKhoanCanXem) || taiKhoanCanXem.length === 0) {
    errors.push('Thiếu danh sách tài khoản cần xem');
  } else {
    taiKhoanCanXem.forEach((tk, index) => {
      if (!tk || typeof tk !== 'string' || tk.trim() === '') {
        errors.push(`Tài khoản thứ ${index + 1} không hợp lệ`);
      }
    });
  }
  
  return errors;
}




/**
 * HÀM PHỤ: Xây dựng cấu trúc phân cấp tài khoản
 */
function buildAccountHierarchy(taiKhoanList) {
  const hierarchy = new Map();
  
  // Phân loại tài khoản theo cấp độ
  taiKhoanList.forEach(tk => {
    const level = determineAccountLevel(tk.ma, tk.loai);
    
    if (!hierarchy.has(level)) {
      hierarchy.set(level, []);
    }
    hierarchy.get(level).push(tk);
  });
  
  return hierarchy;
}

/**
 * HÀM PHỤ: Xác định cấp độ tài khoản
 */
function determineAccountLevel(maTK, loai) {
  // Nếu có cột LOAI, ưu tiên sử dụng
  if (loai && loai > 0) {
    return loai;
  }
  
  // Tự động xác định cấp độ dựa vào độ dài và pattern
  const length = maTK.length;
  
  if (length === 3) return 1;        // Cấp 1: 111, 112, 131
  if (length === 4) return 2;        // Cấp 2: 1111, 1112, 131KH
  if (length === 5) return 3;        // Cấp 3: 11111, 11121, 1111chinhanh
  if (length >= 6) return 4;         // Cấp 4+: 111111, 1111111...
  
  return 1; // Mặc định là cấp 1
}



/**
 * HÀM PHỤ: Kiểm tra xem một tài khoản có phải là con của tài khoản cha không (bao gồm tất cả các cấp)
 * SỬA LẠI: Tổng hợp tất cả các cấp con, không chỉ con trực tiếp
 */
function isChildAccount(parentAccount, childAccount) {
  // Tài khoản con phải dài hơn tài khoản cha và bắt đầu bằng mã của cha
  return childAccount.length > parentAccount.length && childAccount.startsWith(parentAccount);
}

/**
 * HÀM PHỤ: Tìm tài khoản con sử dụng index (SỬA LẠI - TÌM TẤT CẢ CÁC CẤP CON)
 */
function findChildAccountsOptimized(parentAccount, accountIndex) {
  const children = [];
  const parentPattern = parentAccount;
  
  // Sử dụng index để tìm kiếm nhanh
  if (accountIndex.has(parentPattern)) {
    const potentialChildren = accountIndex.get(parentPattern);
    
    potentialChildren.forEach(acc => {
      if (acc.ma !== parentAccount && isChildAccount(parentAccount, acc.ma)) {
        children.push(acc);
      }
    });
  }
  
  return children;
}



/**
 * HÀM PHỤ: Kiểm tra xem một tài khoản có thuộc hệ thống tài khoản cha-con không
 */
function isAccountInHierarchy(accountCode, parentAccount, childAccounts) {
  if (accountCode === parentAccount) return true;
  return childAccounts.some(child => child.ma === accountCode);
}

/**
 * HÀM PHỤ: Tính số dư đầu kỳ động cho tài khoản đơn lẻ (KHÔNG có tài khoản con)
 * SỬA LẠI: Chỉ tính cho tài khoản được yêu cầu, không tính trùng lặp
 */
function tinhSoDuDauKyDongChoTaiKhoanDonLe(taiKhoan, allTransactions, ngayBatDau, taiKhoanMap) {
  let duNo = 0;
  let duCo = 0;
  
  // 1. Số dư gốc của tài khoản
  const tkInfo = taiKhoanMap.get(taiKhoan);
  if (tkInfo) {
    duNo += tkInfo.duNoGoc;
    duCo += tkInfo.duCoGoc;
  }
  
  // 2. Cộng tất cả giao dịch TRƯỚC kỳ báo cáo (CHỈ tính cho tài khoản này)
  allTransactions.forEach(trans => {
    if (new Date(trans.NGAY_HT) < ngayBatDau) {
      // Giao dịch liên quan đến tài khoản được yêu cầu
      if (trans.TK_NO === taiKhoan) {
        duNo += trans.SO_TIEN; // Tăng dư nợ
      }
      if (trans.TK_CO === taiKhoan) {
        duCo += trans.SO_TIEN; // Tăng dư có
      }
    }
  });
  
  // 3. Tính số dư động đầu kỳ theo tính chất tài khoản
  return tinhSoDuDongDauKy(duNo, duCo);
}

/**
 * HÀM PHỤ: Tính số dư đầu kỳ động cho tài khoản cha (bao gồm TẤT CẢ các cấp con)
 * SỬA LẠI: Tính tất cả các cấp con, không chỉ con trực tiếp
 */
function tinhSoDuDauKyDongChoTaiKhoanCha(parentAccount, childAccounts, allTransactions, ngayBatDau, taiKhoanMap) {
  let duNo = 0;
  let duCo = 0;
  
  // 1. Số dư gốc của tài khoản cha
  const parentInfo = taiKhoanMap.get(parentAccount);
  if (parentInfo) {
    duNo += parentInfo.duNoGoc;
    duCo += parentInfo.duCoGoc;
  }
  
  // 2. Số dư gốc của TẤT CẢ tài khoản con (mọi cấp)
  childAccounts.forEach(child => {
    const childInfo = taiKhoanMap.get(child.ma);
    if (childInfo) {
      duNo += childInfo.duNoGoc;
      duCo += childInfo.duCoGoc;
    }
  });
  
  // 3. Cộng tất cả giao dịch TRƯỚC kỳ báo cáo (tính cho tài khoản cha và TẤT CẢ con)
  allTransactions.forEach(trans => {
    if (new Date(trans.NGAY_HT) < ngayBatDau) {
      // Giao dịch liên quan đến tài khoản cha
      if (trans.TK_NO === parentAccount) {
        duNo += trans.SO_TIEN; // Tăng dư nợ
      }
      if (trans.TK_CO === parentAccount) {
        duCo += trans.SO_TIEN; // Tăng dư có
      }
      
      // Giao dịch liên quan đến TẤT CẢ tài khoản con (mọi cấp)
      if (isChildAccount(parentAccount, trans.TK_NO)) {
        duNo += trans.SO_TIEN; // Tăng dư nợ
      }
      if (isChildAccount(parentAccount, trans.TK_CO)) {
        duCo += trans.SO_TIEN; // Tăng dư có
      }
    }
  });
  
  // 4. Tính số dư động đầu kỳ theo tính chất tài khoản
  return tinhSoDuDongDauKy(duNo, duCo);
}

/**
 * HÀM PHỤ: Tính số dư đầu kỳ động cho tài khoản (SỬA LẠI - GỌI ĐÚNG FUNCTION)
 */
function tinhSoDuDauKyDongChoTaiKhoan(parentAccount, childAccounts, allTransactions, ngayBatDau, taiKhoanMap) {
  // Nếu có tài khoản con (mọi cấp) -> gọi function tổng hợp
  if (childAccounts.length > 0) {
    return tinhSoDuDauKyDongChoTaiKhoanCha(parentAccount, childAccounts, allTransactions, ngayBatDau, taiKhoanMap);
  }
  
  // Nếu không có tài khoản con -> gọi function đơn lẻ
  return tinhSoDuDauKyDongChoTaiKhoanDonLe(parentAccount, allTransactions, ngayBatDau, taiKhoanMap);
}

/**
 * HÀM PHỤ: Tính số dư động đầu kỳ theo tính chất tài khoản kế toán
 * SỬA LẠI: Logic tính toán chính xác
 */
function tinhSoDuDongDauKy(duNo, duCo) {
  // Nếu cả dư nợ và dư có đều = 0
  if (duNo === 0 && duCo === 0) {
    return [0, 0];
  }
  
  // Nếu chỉ có dư nợ
  if (duNo > 0 && duCo === 0) {
    return [duNo, 0];
  }
  
  // Nếu chỉ có dư có
  if (duCo > 0 && duNo === 0) {
    return [0, duCo];
  }
  
  // Nếu cả dư nợ và dư có đều > 0 (có phát sinh trái dấu)
  if (duNo > 0 && duCo > 0) {
    if (duNo > duCo) {
      return [duNo - duCo, 0]; // Dư nợ
    } else {
      return [0, duCo - duNo]; // Dư có
    }
  }
  
  // Trường hợp âm (không nên xảy ra trong thực tế)
  if (duNo < 0) {
    return [0, Math.abs(duNo)];
  }
  if (duCo < 0) {
    return [Math.abs(duCo), 0];
  }
  
  return [0, 0];
}

/**
 * HÀM PHỤ: Xác định tính chất tài khoản kế toán
 */
function getAccountNature(maTK) {
  const firstDigit = maTK.charAt(0);
  
  // Tài khoản dư nợ (Tài sản, Chi phí)
  if (['1', '2', '6', '8'].includes(firstDigit)) {
    return 'NO'; // Dư nợ
  }
  
  // Tài khoản dư có (Nguồn vốn, Doanh thu)
  if (['3', '4', '5', '7'].includes(firstDigit)) {
    return 'CO'; // Dư có
  }
  
  // Mặc định
  return 'NO';
}

/**
 * HÀM PHỤ: Tính toán số dư cuối kỳ với xử lý giao dịch nội bộ (SỬA LẠI)
 */
function calculateFinalBalanceWithInternalHandling(parentAccount, childAccounts, duNoDauKy, duCoDauKy, transactionsInPeriod) {
  let duNoCuoiKy = duNoDauKy;
  let duCoCuoiKy = duCoDauKy;
  
  // Xử lý giao dịch nội bộ
  const filteredTransactions = handleInternalTransactions(transactionsInPeriod, parentAccount, childAccounts);
  
  filteredTransactions.forEach(trans => {
    const [phatSinhNo, phatSinhCo] = calculateAggregatedPhatSinh(trans, parentAccount, childAccounts);
    
    // Cập nhật số dư cuối kỳ (GIỮ NGUYÊN LOGIC HIỆN TẠI)
    let duNoMoi = duNoCuoiKy + phatSinhNo;
    let duCoMoi = duCoCuoiKy + phatSinhCo;
    [duNoCuoiKy, duCoCuoiKy] = tinhSoDu(duNoMoi, duCoMoi);
  });
  
  return [duNoCuoiKy, duCoCuoiKy];
}

/**
 * HÀM PHỤ: Tính toán phát sinh tổng hợp từ tài khoản cha và con (SỬA LẠI)
 */

function calculateAggregatedPhatSinh(trans, parentAccount, childAccounts) {
  const accounts = [parentAccount, ...childAccounts.map(c => c.ma)];
  const isInternalNo = accounts.includes(trans.TK_NO);
  const isInternalCo = accounts.includes(trans.TK_CO);

  let phatSinhNo = 0, phatSinhCo = 0;
  if (isInternalNo && !isInternalCo) phatSinhNo = trans.SO_TIEN;
  if (isInternalCo && !isInternalNo) phatSinhCo = trans.SO_TIEN;

  return [phatSinhNo, phatSinhCo];
}

/**
 * HÀM PHỤ: Lấy giao dịch trong kỳ báo cáo cho tài khoản cha (bao gồm tài khoản con)
 */
function getTransactionsForParentAccount(parentAccount, childAccounts, allTransactions, ngayBatDau, ngayKetThuc) {
  return allTransactions.filter(trans => {
    const ngayGiaoDich = new Date(trans.NGAY_HT);
    const inPeriod = ngayGiaoDich >= ngayBatDau && ngayGiaoDich <= ngayKetThuc;
    
    if (!inPeriod) return false;
    
    // Giao dịch liên quan đến tài khoản cha
    if (trans.TK_NO === parentAccount || trans.TK_CO === parentAccount) {
      return true;
    }
    
    // Giao dịch liên quan đến tài khoản con
    if (isAccountInHierarchy(trans.TK_NO, parentAccount, childAccounts) ||
        isAccountInHierarchy(trans.TK_CO, parentAccount, childAccounts)) {
      return true;
    }
    
    return false;
  }).sort((a, b) => new Date(a.NGAY_HT) - new Date(b.NGAY_HT));
}

/**
 * HÀM PHỤ: Xử lý danh sách giao dịch thô, tạo ra các bút toán thuế GTGT ảo.
 */



/**
 * HÀM PHỤ: Tính toán số dư cuối kỳ từ tổng nợ và tổng có.
 */
function tinhSoDu(tongNo, tongCo) {
  if (tongNo > tongCo) {
    return [tongNo - tongCo, 0];
  } else {
    return [0, tongCo - tongNo];
  }
}
/**
 * Lấy toàn bộ danh sách tài khoản từ DMTK để hiển thị trên sidebar.
 */
function getAccountsForSidebar() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetDMTK = ss.getSheetByName('DMTK');
    if (!sheetDMTK) return [];

    const data = sheetDMTK.getDataRange().getValues();
    const accounts = [];
    for (let i = 1; i < data.length; i++) {
      const maTK = data[i][0]?.toString().trim();
      const tenTK = data[i][1]?.toString().trim();
      if (maTK && tenTK) {
        accounts.push({ ma: maTK, ten: tenTK });
      }
    }
    return accounts.sort((a, b) => a.ma.localeCompare(b.ma));
  } catch (e) {
    console.error("Lỗi khi lấy danh sách tài khoản: " + e.toString());
    return [];
  }
}

/**
 * Hàm mới để mở sidebar Unified - Bảng điều khiển tổng hợp
 */
function moSidebarUnified() {
  const html = HtmlService.createHtmlOutputFromFile('SidebarUnified')
    .setWidth(450)
    .setTitle('🚀 Bảng Điều Khiển');
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Hàm mới để mở sidebar Sổ chi tiết (giữ lại để tương thích)
 */
function moSidebarSoChiTiet() {
  const html = HtmlService.createHtmlOutputFromFile('sidebarSoChiTiet')
    .setWidth(400)
    .setTitle('📖 Tùy chọn Sổ Chi Tiết');
  SpreadsheetApp.getUi().showSidebar(html);
}

// ==================== SIDEBAR TÀI KHOẢN - GIẢI PHÁP 1 ====================

// Hàm mở sidebar tài khoản (đã đơn giản hóa)
function moSidebarTaiKhoan() {
  const html = HtmlService.createHtmlOutputFromFile('sidebarTaiKhoan') // Tên file HTML của bạn
    .setWidth(400)
    .setTitle('💼 Chọn Tài khoản');
  SpreadsheetApp.getUi().showSidebar(html);
}

// Lấy dữ liệu tài khoản cho sidebar (đã đơn giản hóa)
function getTaiKhoanDataForSidebar() {
  // Lấy ra bộ nhớ đệm của script
  const cache = CacheService.getScriptCache();
  const CACHE_KEY = 'DANH_SACH_TAI_KHOAN';

  // 1. Thử lấy dữ liệu từ cache trước
  const cachedData = cache.get(CACHE_KEY);
  if (cachedData != null) {
    console.log('✅ Loaded accounts from CACHE.');
    // Nếu có, giải nén và trả về ngay lập tức
    return {
      accounts: JSON.parse(cachedData)
    };
  }

  // 2. Nếu cache không có, đọc từ Sheet như bình thường
  console.log('⚠️ Cache miss. Reading accounts from Sheet.');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetDMTK = ss.getSheetByName('DMTK');
  
  if (!sheetDMTK) {
    throw new Error('Không tìm thấy sheet DMTK');
  }
  
  try {
    const data = sheetDMTK.getDataRange().getValues();
    const accounts = [];
    
    // Bỏ qua dòng tiêu đề (i = 1)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const ma = row[0]?.toString().trim();
      const ten = row[1]?.toString().trim();
      const loai = row[2] || null;
      if (ma && ten) {
        accounts.push({ ma, ten, loai });
      }
    }
    
    accounts.sort((a, b) => a.ma.localeCompare(b.ma));
    
    // 3. Lưu dữ liệu vào cache cho lần sử dụng tiếp theo
    // Dữ liệu sẽ được lưu trong 15 phút (900 giây)
    cache.put(CACHE_KEY, JSON.stringify(accounts), 900);
    console.log(`✅ Loaded and cached ${accounts.length} accounts.`);
    
    return {
      accounts: accounts
    };
    
  } catch (error) {
    console.error('Lỗi lấy dữ liệu tài khoản:', error.toString());
    throw new Error('Không thể lấy dữ liệu tài khoản: ' + error.toString());
  }
}

/**
 * **SỬA LỖI**: Ghi tài khoản vào Ô ĐANG HOẠT ĐỘNG (ACTIVE CELL) mới nhất.
 * Hàm này không còn nhận tham số 'context' từ sidebar nữa.
 * Nó sẽ tự động xác định ô người dùng đang chọn và ghi dữ liệu vào đó.
 */
function ghiTaiKhoanVaoCell(maTK) {
  try {
    // 1. Kiểm tra đầu vào
    if (!maTK || typeof maTK !== 'string' || maTK.trim() === '') {
      return { success: false, error: 'Mã tài khoản không hợp lệ' };
    }
    
    // 2. Lấy ô đang hoạt động (active cell) mới nhất
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const activeCell = ss.getActiveCell();

    if (!activeCell) {
      return { 
        success: false, 
        error: 'Không thể xác định vị trí cell. Vui lòng chọn một cell trước.' 
      };
    }
    
    // 3. Ghi dữ liệu vào ô
    const maTKTrimmed = maTK.trim();
    activeCell.setValue(maTKTrimmed);
    
    const cellAddress = activeCell.getA1Notation();
    const sheetName = activeCell.getSheet().getName();
    console.log(`✅ Written "${maTKTrimmed}" to ${sheetName}!${cellAddress}`);
    
    // (Tùy chọn) Lưu tài khoản gần đây - không ảnh hưởng logic chính
    saveRecentAccount(maTKTrimmed);

    return { success: true };

  } catch (error) {
    const errorMessage = `Lỗi hệ thống: ${error.toString()}`;
    console.error('❌ Error in ghiTaiKhoanVaoCell:', errorMessage);
    return { 
      success: false, 
      error: errorMessage 
    };
  }
}

// Hàm lưu tài khoản gần đây (giữ nguyên, không cần sửa)
function saveRecentAccount(maTK) {
  try {
    const properties = PropertiesService.getDocumentProperties();
    let recentAccounts = [];
    const recentData = properties.getProperty('RECENT_ACCOUNTS');
    if (recentData) {
      recentAccounts = JSON.parse(recentData);
    }
    recentAccounts = recentAccounts.filter(acc => acc !== maTK);
    recentAccounts.unshift(maTK);
    if (recentAccounts.length > 10) {
      recentAccounts = recentAccounts.slice(0, 10);
    }
    properties.setProperty('RECENT_ACCOUNTS', JSON.stringify(recentAccounts));
    return true;
  } catch (error) {
    console.error('Lỗi lưu recent account:', error.toString());
    return false;
  }
}

// Thêm hàm này vào file .gs của bạn
function clearAccountCache() {
  CacheService.getScriptCache().remove('DANH_SACH_TAI_KHOAN');
  console.log('🧹 Account cache cleared.');
}

/**
 * Hàm lấy danh sách tài khoản gần đây
 */
function getRecentAccounts() {
  try {
    const properties = PropertiesService.getDocumentProperties();
    const recentData = properties.getProperty('RECENT_ACCOUNTS');
    if (recentData) {
      return JSON.parse(recentData);
    }
    return [];
  } catch (error) {
    console.error('Lỗi lấy tài khoản gần đây:', error.toString());
    return [];
  }
}

/**
 * Hàm lưu ngày báo cáo vào Properties Service
 */
function saveReportDates(startDate, endDate) {
  try {
    const properties = PropertiesService.getDocumentProperties();
    const datesData = { startDate, endDate };
    properties.setProperty('REPORT_DATES', JSON.stringify(datesData));
    return true;
  } catch (error) {
    console.error('Lỗi lưu ngày báo cáo:', error.toString());
    return false;
  }
}

/**
 * Hàm lấy ngày báo cáo từ Properties Service
 */
function getReportDates() {
  try {
    const properties = PropertiesService.getDocumentProperties();
    const datesData = properties.getProperty('REPORT_DATES');
    if (datesData) {
      return JSON.parse(datesData);
    }
    return null;
  } catch (error) {
    console.error('Lỗi lấy ngày báo cáo:', error.toString());
    return null;
  }
}

/**
 * Hàm mới để lấy dữ liệu hàng hóa cho sidebar Unified
 */

function getHangHoaForSidebar() {
  try {
    const cache = CacheService.getScriptCache();
    const CACHE_KEY = 'DANH_SACH_HANG_HOA';
    const cachedData = cache.get(CACHE_KEY);
    
    if (cachedData != null) {
      console.log('✅ Loaded products from CACHE for Unified sidebar.');
      const hangHoaList = JSON.parse(cachedData);
      // Khi tải từ cache, uniqueId đã được đảm bảo là duy nhất từ lần lưu trước.
      return hangHoaList;
    }

    console.log('⚠️ Cache miss. Reading products from Sheet "DMHH" for Unified sidebar.');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetDMHH = ss.getSheetByName('DMHH');
    if (!sheetDMHH) {
      throw new Error('Không tìm thấy sheet "DMHH"');
    }

    // *** SỬA ĐỔI 1: Chỉ lấy vùng dữ liệu có chứa nội dung để tránh timeout ***
    // Giả sử dữ liệu nằm từ cột A đến E
    const lastRow = sheetDMHH.getLastRow();
    // Nếu sheet chỉ có header hoặc không có gì, trả về mảng rỗng
    if (lastRow < 2) return []; 
    const data = sheetDMHH.getRange('A2:E' + lastRow).getValues();

    const hangHoaList = [];
    
    // Bắt đầu từ dòng 2 (chỉ số 0 trong mảng data)
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const maKho = row[0]?.toString().trim();
      const maHang = row[1]?.toString().trim();
      
      if (maKho && maHang) {
        // *** SỬA ĐỔI 2: Đảm bảo uniqueId LUÔN LUÔN là duy nhất bằng cách thêm chỉ số dòng ***
        // Chỉ số i + 2 tương ứng với số dòng thực tế trên sheet
        const uniqueId = `${maKho}|${maHang}|${i + 2}`;

        const item = {
          maKho: maKho,
          maHang: maHang,
          tenHang: row[2]?.toString().trim() || '',
          quyCach: row[3]?.toString().trim() || '',
          dvt: row[4]?.toString().trim() || '',
          uniqueId: uniqueId // Gán ID đã được đảm bảo duy nhất
        };
        hangHoaList.push(item);
      }
    }

    hangHoaList.sort((a, b) => a.maKho.localeCompare(b.maKho) || a.maHang.localeCompare(b.maHang));
    
    cache.put(CACHE_KEY, JSON.stringify(hangHoaList), 900); // Lưu vào cache trong 15 phút
    console.log(`✅ Loaded and cached ${hangHoaList.length} products for Unified sidebar.`);

    return hangHoaList;
  } catch (e) {
    console.error('Error in getHangHoaForSidebar: ' + e.toString());
    return []; // Trả về mảng rỗng khi có lỗi
  }
}

/**
 * HÀM HỖ TRỢ: Chạy hàm này thủ công để xóa cache khi cần kiểm tra dữ liệu mới.
 * 1. Mở trình chỉnh sửa Apps Script.
 * 2. Chọn hàm 'clearHangHoaCache' từ danh sách.
 * 3. Nhấn nút ▶ Run.
 */
function clearHangHoaCache() {
  CacheService.getScriptCache().remove('DANH_SACH_HANG_HOA');
  console.log('Cache hàng hóa đã được xóa.');
}
/**
 * Hàm ghi hàng hóa vào sheet từ sidebar Unified (tương thích với cấu trúc dữ liệu mới)
 * @param {Array<Object>} selectedItems Mảng các đối tượng hàng hóa đã chọn từ sidebar Unified
 */
function ghiHangHoaVaoSheet(selectedItems) {
  try {
    if (!selectedItems || selectedItems.length === 0) {
      return { success: false, error: 'Không có hàng hóa nào được chọn.' };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const activeCell = ss.getActiveCell();
    const sheet = activeCell.getSheet();
    const startRow = activeCell.getRow();
    const startCol = activeCell.getColumn();
    
    // Tạo mảng 2 chiều với đầy đủ 5 thông tin
    const outputData = selectedItems.map(item => [
      item.maKho, 
      item.maHang, 
      item.tenHang, 
      item.quyCach || '', 
      item.dvt || ''      
    ]);
    
    // Ghi dữ liệu ra một vùng rộng 5 cột
    sheet.getRange(startRow, startCol, outputData.length, 5).setValues(outputData);

    console.log(`✅ Unified Sidebar: Written ${outputData.length} items (5 columns) to ${sheet.getName()}`);
    return { success: true, count: outputData.length }; 

  } catch (e) {
    console.error('Error in ghiHangHoaVaoSheet: ' + e.toString());
    return { success: false, error: e.toString() };
  }
}

/**
 * Hàm tạo báo cáo Nhập Xuất Tồn từ sidebar với hàng hóa đã chọn
 * Hoạt động tương tự như taoCanDoiPhatSinh - nhận tham số trực tiếp từ sidebar
 * @param {string} startDate Ngày bắt đầu (YYYY-MM-DD)
 * @param {string} endDate Ngày kết thúc (YYYY-MM-DD)
 * @param {Array<Object>} selectedHangHoa Mảng hàng hóa đã chọn từ sidebar
 */


function taoNhapXuatTonFromSidebar(startDate, endDate, selectedHangHoa, reportType) {
  try {
    console.log(`🚀 Bắt đầu tạo báo cáo NXT (${reportType}) từ sidebar: ${startDate} → ${endDate}`);
    console.log(`📦 Số lượng hàng hóa được chọn: ${selectedHangHoa.length}`);
    
    if (!selectedHangHoa || selectedHangHoa.length === 0) {
      throw new Error('Không có hàng hóa nào được chọn');
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    const sheetDMHH = ss.getSheetByName('DMHH');
    const sheetNXT = ss.getSheetByName('NXT');
    
    if (!sheetDMHH || !sheetNXT) {
      throw new Error('Không tìm thấy sheet DMHH hoặc NXT');
    }
    
    const ngayBatDau = new Date(startDate + 'T00:00:00');
    const ngayKetThuc = new Date(endDate + 'T23:59:59');
    
    const selectedHangHoaKeys = selectedHangHoa.map(item => `${item.maKho}|${item.maHang}`);
    
    const result = xuLyDuLieuNhapXuatTon(sheetDMHH, sheetNXT, ngayBatDau, ngayKetThuc, selectedHangHoaKeys, reportType);
    
    console.log(`✅ Hoàn thành báo cáo NXT cho ${selectedHangHoa.length} hàng hóa`);
    
    return { 
      success: true, 
      message: `Đã tạo báo cáo NXT cho ${selectedHangHoa.length} hàng hóa`,
      data: result
    };
    
  } catch (error) {
    console.error('❌ Lỗi trong taoNhapXuatTonFromSidebar: ' + error.toString());
    throw new Error('Lỗi tạo báo cáo NXT: ' + error.toString());
  }
}

/**
 * HÀM PHỤ: Xử lý dữ liệu Nhập Xuất Tồn
 * ⭐ CẬP NHẬT: Thêm logic lấy thứ tự gốc từ DMHH
 */
function xuLyDuLieuNhapXuatTon(sheetDMHH, sheetNXT, ngayBatDau, ngayKetThuc, selectedHangHoaKeys, reportType) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dataDMHH = sheetDMHH.getDataRange().getValues();
  const headerRowDMHH = 1;
  
  const filterCondition = (row) => row.maKho && row.maHang && row.soLuong !== 0;
  const dataResult = getAllDataFromDLSheets(ss, 'NXT', filterCondition);
  const combinedData = dataResult.data;
  
  const hangHoaMap = new Map();
  const dmhhKeysInOrder = []; // Mảng lưu thứ tự gốc

  function kiemTraDieuKienLoc(maKho, maHang) {
    const key = `${maKho}|${maHang}`;
    return selectedHangHoaKeys.includes(key);
  }

  function phanLoaiGiaoDich(tkNo, tkCo) {
    if (tkNo.startsWith('154')) return 'XUAT_SX';
    if (tkCo.startsWith('154')) return 'NHAP';
    if (tkNo.startsWith('15')) return 'NHAP';
    if (tkCo.startsWith('15')) return 'XUAT';
    return null;
  }
  
  // BƯỚC 1: Đọc dữ liệu và thứ tự từ DMHH
  for (let i = headerRowDMHH; i < dataDMHH.length; i++) {
    const row = dataDMHH[i];
    const maKho = row[0]?.toString().trim();
    const maHang = row[1]?.toString().trim();
    
    if (maKho && maHang) {
      const key = `${maKho}|${maHang}`;
      // Lưu lại thứ tự của tất cả các mã hàng trong DMHH
      dmhhKeysInOrder.push(key);

      if (kiemTraDieuKienLoc(maKho, maHang)) {
        hangHoaMap.set(key, {
          maKho: maKho,
          maHang: maHang,
          tenHang: row[2]?.toString().trim(),
          quyCache: row[3]?.toString().trim(),
          dvt: row[4]?.toString().trim(),
          slDauKyGoc: parseFloat(row[5]) || 0,
          gtDauKyGoc: parseFloat(row[6]) || 0,
          slNhapTruocKy: 0, gtNhapTruocKy: 0,
          slXuatTruocKy: 0, gtXuatTruocKy: 0,
          slXuatSXTruocKy: 0, gtXuatSXTruocKy: 0,
          slNhapTrongKy: 0, gtNhapTrongKy: 0,
          slXuatTrongKy: 0, gtXuatTrongKy: 0,
          slXuatSXTrongKy: 0, gtXuatSXTrongKy: 0
        });
      }
    }
  }
  
  // BƯỚC 2: Xử lý dữ liệu giao dịch
  for (let i = 0; i < combinedData.length; i++) {
    const row = combinedData[i];
    const key = `${row.maKho}|${row.maHang}`;
    if (!kiemTraDieuKienLoc(row.maKho, row.maHang)) continue;
    
    const loaiGiaoDich = phanLoaiGiaoDich(row.tkNo, row.tkCo);
    if (loaiGiaoDich === null) continue;
    
    if (!hangHoaMap.has(key)) {
         hangHoaMap.set(key, {
            maKho: row.maKho, maHang: row.maHang, tenHang: `Hàng ${row.maHang}`,
            quyCache: '', dvt: '', slDauKyGoc: 0, gtDauKyGoc: 0,
            slNhapTruocKy: 0, gtNhapTruocKy: 0, slXuatTruocKy: 0, gtXuatTruocKy: 0, slXuatSXTruocKy: 0, gtXuatSXTruocKy: 0,
            slNhapTrongKy: 0, gtNhapTrongKy: 0, slXuatTrongKy: 0, gtXuatTrongKy: 0, slXuatSXTrongKy: 0, gtXuatSXTrongKy: 0
        });
    }

    const hangHoa = hangHoaMap.get(key);
    const ngayHachToan = new Date(row.ngay);
    const laTruocKy = ngayHachToan < ngayBatDau;
    
    if (laTruocKy) {
      if (loaiGiaoDich === 'NHAP') { hangHoa.slNhapTruocKy += row.soLuong; hangHoa.gtNhapTruocKy += row.soTien; }
      if (loaiGiaoDich === 'XUAT') { hangHoa.slXuatTruocKy += row.soLuong; hangHoa.gtXuatTruocKy += row.soTien; }
      if (loaiGiaoDich === 'XUAT_SX') { hangHoa.slXuatSXTruocKy += row.soLuong; hangHoa.gtXuatSXTruocKy += row.soTien; }
    } else if (ngayHachToan <= ngayKetThuc) {
      if (loaiGiaoDich === 'NHAP') { hangHoa.slNhapTrongKy += row.soLuong; hangHoa.gtNhapTrongKy += row.soTien; }
      if (loaiGiaoDich === 'XUAT') { hangHoa.slXuatTrongKy += row.soLuong; hangHoa.gtXuatTrongKy += row.soTien; }
      if (loaiGiaoDich === 'XUAT_SX') { hangHoa.slXuatSXTrongKy += row.soLuong; hangHoa.gtXuatSXTrongKy += row.soTien; }
    }
  }
  
  // BƯỚC 3: Lọc hàng hóa có dữ liệu
  const hangHoaCoData = new Map();
  for (const [key, hangHoa] of hangHoaMap.entries()) {
    const slTonDauKy = hangHoa.slDauKyGoc + hangHoa.slNhapTruocKy - hangHoa.slXuatTruocKy - hangHoa.slXuatSXTruocKy;
    if (slTonDauKy !== 0 || hangHoa.slNhapTrongKy !== 0 || hangHoa.slXuatTrongKy !== 0 || hangHoa.slXuatSXTrongKy !== 0) {
      hangHoaCoData.set(key, hangHoa);
    }
  }
  
  // BƯỚC 4: Ghi dữ liệu vào sheet NXT, truyền thứ tự gốc vào
  ghiDuLieuVaoSheetNXT(sheetNXT, hangHoaCoData, ngayBatDau, ngayKetThuc, reportType, dmhhKeysInOrder);
  
  const thongKe = {}; 
  return thongKe;
}

/**
 * HÀM PHỤ: Ghi dữ liệu vào sheet NXT
 * ⭐ CẬP NHẬT: Sử dụng thứ tự từ DMHH thay vì sắp xếp lại
 */
function ghiDuLieuVaoSheetNXT(sheetNXT, hangHoaCoData, ngayBatDau, ngayKetThuc, reportType, dmhhKeysInOrder) {
  let headers1, headers2, outputColumns, mergeCellsDef;
  let numCols, numberFormatDef, dataStartRow = 6, headerRows = 2;

  const formatSL = '#,##0.00;-#,##0.00;';
  const formatGT = '#,##0;-#,##0;';

  if (reportType === 'SL') {
    numCols = 11;
    headerRows = 1;
    dataStartRow = 5;
    headers1 = ['Mã kho', 'Mã hàng', 'Tên hàng', 'Quy cách', 'ĐVT', 'SL Tồn đầu kỳ', 'SL Nhập trong kỳ', 'SL Xuất trong kỳ', 'SL Xuất SX trong kỳ', 'SL Tồn cuối kỳ', 'Ghi chú'];
    headers2 = null;
    outputColumns = item => [item.maKho, item.maHang, item.tenHang, item.quyCache, item.dvt, item.slTonDauKy, item.slNhapTrongKy, item.slXuatTrongKy, item.slXuatSXTrongKy, item.slTonCuoiKy, ''];
    mergeCellsDef = [];
    numberFormatDef = { format: formatSL, range: { col: 6, count: 5 } };
  } else if (reportType === 'GT') {
    numCols = 11;
    headerRows = 1;
    dataStartRow = 5;
    headers1 = ['Mã kho', 'Mã hàng', 'Tên hàng', 'Quy cách', 'ĐVT', 'GT Tồn đầu kỳ', 'GT Nhập trong kỳ', 'GT Xuất trong kỳ', 'GT Xuất SX trong kỳ', 'GT Tồn cuối kỳ', 'Ghi chú'];
    headers2 = null;
    outputColumns = item => [item.maKho, item.maHang, item.tenHang, item.quyCache, item.dvt, item.gtTonDauKy, item.gtNhapTrongKy, item.gtXuatTrongKy, item.gtXuatSXTrongKy, item.gtTonCuoiKy, ''];
    mergeCellsDef = [];
    numberFormatDef = { format: formatGT, range: { col: 6, count: 5 } };
  } else { // 'ALL'
    numCols = 16;
    headers1 = ['Mã kho', 'Mã hàng', 'Tên hàng', 'Quy cách', 'ĐVT', 'Tồn đầu kỳ', '', 'Nhập trong kỳ', '', 'Xuất trong kỳ', '', 'Xuất SX trong kỳ', '', 'Tồn cuối kỳ', '', 'Ghi chú'];
    headers2 = ['', '', '', '', '', 'SL', 'Tiền', 'SL', 'Tiền', 'SL', 'Tiền', 'SL', 'Tiền', 'SL', 'Tiền', ''];
    outputColumns = item => [item.maKho, item.maHang, item.tenHang, item.quyCache, item.dvt, item.slTonDauKy, item.gtTonDauKy, item.slNhapTrongKy, item.gtNhapTrongKy, item.slXuatTrongKy, item.gtXuatTrongKy, item.slXuatSXTrongKy, item.gtXuatSXTrongKy, item.slTonCuoiKy, item.gtTonCuoiKy, ''];
    mergeCellsDef = [[4, 1, 2, 1], [4, 2, 2, 1], [4, 3, 2, 1], [4, 4, 2, 1], [4, 5, 2, 1], [4, 6, 1, 2], [4, 8, 1, 2], [4, 10, 1, 2], [4, 12, 1, 2], [4, 14, 1, 2], [4, 16, 2, 1]];
    numberFormatDef = null;
  }

  const lastRow = sheetNXT.getLastRow();
  if (lastRow >= 4) {
    sheetNXT.getRange(4, 1, lastRow - 3, sheetNXT.getMaxColumns()).clear();
  }
  
  sheetNXT.getRange(4, 1, 1, headers1.length).setValues([headers1]);
  if (headers2) {
    sheetNXT.getRange(5, 1, 1, headers2.length).setValues([headers2]);
  }

  if (mergeCellsDef.length > 0) {
    for (const [row, col, numRows, numCols] of mergeCellsDef) {
      sheetNXT.getRange(row, col, numRows, numCols).merge();
    }
  }
  
  const outputData = [];
  const processedKeys = new Set();

  // ⭐ THAY ĐỔI: Duyệt theo thứ tự của DMHH trước
  for (const key of dmhhKeysInOrder) {
    if (hangHoaCoData.has(key) && !processedKeys.has(key)) {
      const hangHoa = hangHoaCoData.get(key);
      const slTonDauKy = hangHoa.slDauKyGoc + hangHoa.slNhapTruocKy - hangHoa.slXuatTruocKy - hangHoa.slXuatSXTruocKy;
      const gtTonDauKy = hangHoa.gtDauKyGoc + hangHoa.gtNhapTruocKy - hangHoa.gtXuatTruocKy - hangHoa.gtXuatSXTruocKy;
      const slTonCuoiKy = slTonDauKy + hangHoa.slNhapTrongKy - hangHoa.slXuatTrongKy - hangHoa.slXuatSXTrongKy;
      const gtTonCuoiKy = gtTonDauKy + hangHoa.gtNhapTrongKy - hangHoa.gtXuatTrongKy - hangHoa.gtXuatSXTrongKy;
      
      const itemData = { ...hangHoa, slTonDauKy, gtTonDauKy, slTonCuoiKy, gtTonCuoiKy };
      outputData.push(outputColumns(itemData));
      processedKeys.add(key);
    }
  }

  // Thêm các mã hàng có phát sinh nhưng không có trong DMHH (nếu có)
  for (const [key, hangHoa] of hangHoaCoData.entries()) {
    if (!processedKeys.has(key)) {
      const slTonDauKy = hangHoa.slDauKyGoc + hangHoa.slNhapTruocKy - hangHoa.slXuatTruocKy - hangHoa.slXuatSXTruocKy;
      const gtTonDauKy = hangHoa.gtDauKyGoc + hangHoa.gtNhapTruocKy - hangHoa.gtXuatTruocKy - hangHoa.gtXuatSXTruocKy;
      const slTonCuoiKy = slTonDauKy + hangHoa.slNhapTrongKy - hangHoa.slXuatTrongKy - hangHoa.slXuatSXTrongKy;
      const gtTonCuoiKy = gtTonDauKy + hangHoa.gtNhapTrongKy - hangHoa.gtXuatTrongKy - hangHoa.gtXuatSXTrongKy;
      
      const itemData = { ...hangHoa, slTonDauKy, gtTonDauKy, slTonCuoiKy, gtTonCuoiKy };
      outputData.push(outputColumns(itemData));
    }
  }
  
  if (outputData.length > 0) {
    sheetNXT.getRange(dataStartRow, 1, outputData.length, numCols).setValues(outputData);
    
    if (numberFormatDef) {
      const { format, range } = numberFormatDef;
      sheetNXT.getRange(dataStartRow, range.col, outputData.length, range.count).setNumberFormat(format);
    } else {
      const slColumns = [6, 8, 10, 12, 14];
      for (const col of slColumns) sheetNXT.getRange(dataStartRow, col, outputData.length, 1).setNumberFormat(formatSL);
      const tienColumns = [7, 9, 11, 13, 15];
      for (const col of tienColumns) sheetNXT.getRange(dataStartRow, col, outputData.length, 1).setNumberFormat(formatGT);
    }
    
    const headerRange = sheetNXT.getRange(4, 1, headerRows, numCols);
    headerRange.setBackground('#4472C4')
             .setFontColor('white')
             .setFontWeight('bold')
             .setHorizontalAlignment('center')
             .setVerticalAlignment('middle')
             .setWrap(true);
             
    const allDataRange = sheetNXT.getRange(4, 1, outputData.length + headerRows, numCols);
    allDataRange.setBorder(true, true, true, true, true, true);
  }
}
/**
 * HÀM PHỤ: Cache cấu trúc phân cấp tài khoản để tăng hiệu suất
 */
function getCachedAccountHierarchy() {
  try {
    const cache = CacheService.getScriptCache();
    const CACHE_KEY = 'ACCOUNT_HIERARCHY_CACHE';
    
    const cachedData = cache.get(CACHE_KEY);
    if (cachedData != null) {
      console.log('✅ Loaded account hierarchy from CACHE.');
      return JSON.parse(cachedData);
    }
    
    return null;
  } catch (e) {
    console.error('Lỗi khi đọc cache phân cấp tài khoản:', e.toString());
    return null;
  }
}

/**
 * HÀM PHỤ: Lưu cấu trúc phân cấp tài khoản vào cache
 */
function cacheAccountHierarchy(hierarchy) {
  try {
    const cache = CacheService.getScriptCache();
    const CACHE_KEY = 'ACCOUNT_HIERARCHY_CACHE';
    
    // Cache trong 30 phút (1800 giây)
    cache.put(CACHE_KEY, JSON.stringify(hierarchy), 1800);
    console.log('✅ Account hierarchy cached for 30 minutes.');
  } catch (e) {
    console.error('Lỗi khi cache phân cấp tài khoản:', e.toString());
  }
}

/**
 * HÀM PHỤ: Xóa cache phân cấp tài khoản
 */
function clearAccountHierarchyCache() {
  try {
    CacheService.getScriptCache().remove('ACCOUNT_HIERARCHY_CACHE');
    console.log('🧹 Account hierarchy cache cleared.');
  } catch (e) {
    console.error('Lỗi khi xóa cache phân cấp tài khoản:', e.toString());
  }
}

/**
 * HÀM PHỤ: Tối ưu hóa việc tìm kiếm tài khoản con với index
 */
function buildAccountIndex(taiKhoanList) {
  const accountIndex = new Map();
  
  taiKhoanList.forEach(tk => {
    // Tạo index cho tất cả các pattern có thể
    for (let i = 1; i <= tk.ma.length; i++) {
      const pattern = tk.ma.substring(0, i);
      if (!accountIndex.has(pattern)) {
        accountIndex.set(pattern, []);
      }
      accountIndex.get(pattern).push(tk);
    }
  });
  
  return accountIndex;
}

/**
 * HÀM PHỤ: Tìm tài khoản con sử dụng index (tối ưu hiệu suất)
 */
function findChildAccountsOptimized(parentAccount, accountIndex) {
  const children = [];
  const parentPattern = parentAccount;
  
  // Sử dụng index để tìm kiếm nhanh
  if (accountIndex.has(parentPattern)) {
    const potentialChildren = accountIndex.get(parentPattern);
    
    potentialChildren.forEach(acc => {
      if (acc.ma !== parentAccount && isChildAccount(parentAccount, acc.ma)) {
        children.push(acc);
      }
    });
  }
  
  return children;
}

/**
 * HÀM PHỤ: Kiểm tra xem có cần tổng hợp dữ liệu không
 */
function needsAggregation(parentAccount, childAccounts) {
  return childAccounts.length > 0;
}

/**
 * HÀM PHỤ: Tạo tiêu đề báo cáo với thông tin tổng hợp
 */
function createReportTitle(parentAccount, parentInfo, childAccounts) {
  let title = `SỔ CHI TIẾT TÀI KHOẢN: ${parentAccount} - ${parentInfo.ten}`;
  
  if (childAccounts.length > 0) {
    const childCodes = childAccounts.map(child => child.ma).join(', ');
    title += ` (Tổng hợp từ: ${childCodes})`;
  }
  
  return title;
}



/**
 * HÀM PHỤ: Xử lý giao dịch theo batch để tối ưu hiệu suất
 */
function processTransactionsInBatches(transactions, batchSize = 100) {
  const results = [];
  
  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize);
    // Xử lý batch này
    batch.forEach(trans => {
      // Xử lý từng giao dịch
      results.push(trans);
    });
  }
  
  return results;
}

/**
 * HÀM PHỤ: Xử lý trường hợp đặc biệt - tài khoản có giao dịch nội bộ (SỬA LẠI)
 */
function handleInternalTransactions(transactions, parentAccount, childAccounts) {
  // Lọc bỏ giao dịch nội bộ giữa tài khoản cha và con để tránh tính trùng lặp
  return transactions.filter(trans => {
    const isInternalNo = isAccountInHierarchy(trans.TK_NO, parentAccount, childAccounts);
    const isInternalCo = isAccountInHierarchy(trans.TK_CO, parentAccount, childAccounts);
    
    // Nếu cả TK Nợ và TK Có đều thuộc hệ thống tài khoản cha-con, đây là giao dịch nội bộ
    if (isInternalNo && isInternalCo) {
      console.log(`⚠️ Bỏ qua giao dịch nội bộ: ${trans.TK_NO} -> ${trans.TK_CO} (${trans.SO_TIEN})`);
      return false; // Bỏ qua giao dịch nội bộ
    }
    
    return true;
  });
}

/**
 * HÀM PHỤ: Tạo báo cáo chi tiết cho từng tài khoản con (tùy chọn)
 */
function createDetailedChildReport(childAccount, transactions, ngayBatDau, ngayKetThuc) {
  const childTransactions = transactions.filter(trans => {
    const ngayGiaoDich = new Date(trans.NGAY_HT);
    const inPeriod = ngayGiaoDich >= ngayBatDau && ngayGiaoDich <= ngayKetThuc;
    
    return inPeriod && (trans.TK_NO === childAccount.ma || trans.TK_CO === childAccount.ma);
  });
  
  return childTransactions.map(trans => {
    const phatSinhNo = (trans.TK_NO === childAccount.ma) ? trans.SO_TIEN : 0;
    const phatSinhCo = (trans.TK_CO === childAccount.ma) ? trans.SO_TIEN : 0;
    const tkDoiUng = (trans.TK_NO === childAccount.ma) ? trans.TK_CO : trans.TK_NO;
    
    let dienGiai = trans.DIEN_GIAI || '';
    const tenHang = trans.TEN_HANG?.toString().trim();
    const quyCach = trans.QUY_CACH?.toString().trim();
    if (tenHang) dienGiai += ` - ${tenHang}`;
    if (quyCach) dienGiai += ` (${quyCach})`;
    
    return {
      ngay: new Date(trans.NGAY_HT),
      soCT: trans.SO_CT || '',
      ngayCT: trans.NGAY_CT ? new Date(trans.NGAY_CT) : '',
      dienGiai: dienGiai,
      tkDoiUng: tkDoiUng,
      phatSinhNo: phatSinhNo,
      phatSinhCo: phatSinhCo
    };
  });
}

/**
 * HÀM PHỤ: Tối ưu hóa việc xử lý giao dịch lớn
 */
function optimizeLargeTransactionProcessing(transactions, batchSize = 500) {
  if (transactions.length <= batchSize) {
    return transactions; // Không cần xử lý batch
  }
  
  console.log(`⚡ Tối ưu hóa xử lý ${transactions.length} giao dịch với batch size ${batchSize}`);
  
  const optimizedTransactions = [];
  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize);
    optimizedTransactions.push(...batch);
    
    // Thêm delay nhỏ để tránh quá tải
    if (i + batchSize < transactions.length) {
      Utilities.sleep(10);
    }
  }
  
  return optimizedTransactions;
}

/**
 * HÀM PHỤ: Tạo báo cáo tóm tắt quá trình xử lý
 */
function createProcessingSummary(taiKhoanCanXem, childAccountsMap, processingTime) {
  console.log('\n📊 BÁO CÁO TÓM TẮT QUÁ TRÌNH XỬ LÝ:');
  console.log(`⏱️  Tổng thời gian xử lý: ${processingTime}ms`);
  console.log(`📋 Số lượng tài khoản được xử lý: ${taiKhoanCanXem.length}`);
  
  let totalChildAccounts = 0;
  taiKhoanCanXem.forEach(tk => {
    const childAccounts = childAccountsMap.get(tk) || [];
    totalChildAccounts += childAccounts.length;
    
    if (childAccounts.length > 0) {
      console.log(`   - TK ${tk}: Tổng hợp từ ${childAccounts.length} tài khoản con`);
    } else {
      console.log(`   - TK ${tk}: Không có tài khoản con`);
    }
  });
  
  console.log(`📈 Tổng số tài khoản con được xử lý: ${totalChildAccounts}`);
  console.log('✅ Hoàn thành xử lý!\n');
}

/**
 * HÀM MỚI: Tạo báo cáo sổ chi tiết tài khoản với xử lý thuế từ TK_THUE
 * Phiên bản cải tiến với logic xử lý thuế mới và tổng hợp theo cấp tài khoản
 */
function taosochitiet(startDateStr, endDateStr, taiKhoanCanXem) {
  const startTime = Date.now();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  try {
    // Kiểm tra tham số đầu vào
    const validationErrors = validateInputData(startDateStr, endDateStr, taiKhoanCanXem);
    if (validationErrors.length > 0) {
      throw new Error('Lỗi validation: ' + validationErrors.join(', '));
    }

    const ngayBatDau = new Date(startDateStr);
    ngayBatDau.setHours(0, 0, 0, 0);
    const ngayKetThuc = new Date(endDateStr);
    ngayKetThuc.setHours(23, 59, 59, 999);
    
    console.log(`📅 Tạo báo cáo sổ chi tiết mới cho ${taiKhoanCanXem.length} tài khoản từ ${ngayBatDau.toLocaleDateString('vi-VN')} đến ${ngayKetThuc.toLocaleDateString('vi-VN')}`);

    // Kiểm tra sheet báo cáo
    const sheetSoCT = ss.getSheetByName('SO_CT');
    if (!sheetSoCT) throw new Error('Không tìm thấy sheet báo cáo "SO_CT"');

    ss.toast('Bắt đầu xử lý...', 'Sổ Chi Tiết Mới', -1);
    ss.toast('Đang đọc dữ liệu từ DMTK và các sheet DL_...', 'Bước 1/5');

    // Đọc dữ liệu DMTK
    const sheetDMTK = ss.getSheetByName('DMTK');
    if (!sheetDMTK) throw new Error('Không tìm thấy sheet "DMTK"');
    const dataDMTK = sheetDMTK.getDataRange().getValues();
    
    // Xây dựng map tài khoản và cấu trúc phân cấp
    const taiKhoanMap = new Map();
    const taiKhoanList = [];
    
    dataDMTK.slice(1).forEach(row => {
      const maTK = row[0]?.toString().trim();
      if (maTK) {
        const taiKhoanInfo = { 
          ma: maTK,
          ten: row[1]?.toString().trim(), 
          loai: parseInt(row[2]) || 0, 
          duNoGoc: parseFloat(row[3]) || 0, 
          duCoGoc: parseFloat(row[4]) || 0 
        };
        taiKhoanMap.set(maTK, taiKhoanInfo);
        taiKhoanList.push(taiKhoanInfo);
      }
    });

    // Xây dựng cấu trúc phân cấp tài khoản
    let accountHierarchy = getCachedAccountHierarchy();
    if (!accountHierarchy) {
      accountHierarchy = buildAccountHierarchy(taiKhoanList);
      cacheAccountHierarchy(accountHierarchy);
    }
    
    // Xây dựng index tài khoản để tối ưu hiệu suất tìm kiếm
    const accountIndex = buildAccountIndex(taiKhoanList);

    ss.toast('Đang đọc dữ liệu phát sinh...', 'Bước 2/5');
    
    // Đọc dữ liệu phát sinh bao gồm TK_THUE
    const allTransactionsRaw = readDataFromPrefixedSheetsWithThue(ss, 'DL_', ['NGAY_HT', 'TK_NO', 'TK_CO', 'SO_TIEN', 'TK_THUE', 'THUE_VAT']);
    
    ss.toast('Đang xử lý phát sinh thuế...', 'Bước 3/5');
    
    // Xử lý phát sinh thuế từ TK_THUE
    const allTransactions = xuLyPhatSinhThueTuTK_THUE(allTransactionsRaw);
    
    // Tối ưu hóa xử lý giao dịch lớn
    const optimizedTransactions = optimizeLargeTransactionProcessing(allTransactions);

    ss.toast('Đang tính toán số dư và phát sinh...', 'Bước 4/5');
    const outputData = [];
    const headers = ['Ngày Ghi Sổ', 'Số Chứng Từ', 'Ngày Chứng Từ', 'Diễn Giải', 'TK Đối Ứng', 'Phát Sinh Nợ', 'Phát Sinh Có', 'Dư Nợ Cuối Kỳ', 'Dư Có Cuối Kỳ'];

    for (const tk of taiKhoanCanXem) {
      if (!taiKhoanMap.has(tk)) continue;
      const tkInfo = taiKhoanMap.get(tk);

      // Tìm tài khoản con của tài khoản hiện tại
      const childAccounts = findChildAccountsOptimized(tk, accountIndex);
      
      // Tạo tiêu đề báo cáo với thông tin tổng hợp
      const titleRow = createReportTitle(tk, tkInfo, childAccounts);
      
      outputData.push([titleRow, '', '', '', '', '', '', '', '']);
      outputData.push(headers);

      // Tính số dư đầu kỳ động
      let [duNoDauKy, duCoDauKy] = tinhSoDuDauKyDongChoTaiKhoan(tk, childAccounts, optimizedTransactions, ngayBatDau, taiKhoanMap);
      
      outputData.push(['', '', '', 'Số dư đầu kỳ', '', '', '', duNoDauKy, duCoDauKy]);

      let duNoCuoiKy = duNoDauKy;
      let duCoCuoiKy = duCoDauKy;
      let tongPhatSinhNo = 0;
      let tongPhatSinhCo = 0;

      // Lấy giao dịch trong kỳ báo cáo (bao gồm tài khoản cha và con)
      const transactionsInPeriod = getTransactionsForParentAccount(tk, childAccounts, optimizedTransactions, ngayBatDau, ngayKetThuc);

      transactionsInPeriod.forEach(trans => {
        const phatSinhNo = (trans.TK_NO === tk) ? trans.SO_TIEN : 0;
        const phatSinhCo = (trans.TK_CO === tk) ? trans.SO_TIEN : 0;
        const tkDoiUng = (trans.TK_NO === tk) ? trans.TK_CO : trans.TK_NO;

        // Tính toán phát sinh tổng hợp từ tài khoản cha và con
        const [totalPhatSinhNo, totalPhatSinhCo] = calculateAggregatedPhatSinh(trans, tk, childAccounts);

        tongPhatSinhNo += totalPhatSinhNo;
        tongPhatSinhCo += totalPhatSinhCo;

        let finalDienGiai = trans.DIEN_GIAI || '';
        const tenHang = trans.TEN_HANG?.toString().trim();
        const quyCach = trans.QUY_CACH?.toString().trim();
        if (tenHang) finalDienGiai += ` - ${tenHang}`;
        if (quyCach) finalDienGiai += ` (${quyCach})`;

        // Cập nhật số dư cuối kỳ
        let duNoMoi = duNoCuoiKy + totalPhatSinhNo;
        let duCoMoi = duCoCuoiKy + totalPhatSinhCo;
        [duNoCuoiKy, duCoCuoiKy] = tinhSoDu(duNoMoi, duCoMoi);

        outputData.push([ 
          new Date(trans.NGAY_HT), 
          trans.SO_CT || '', 
          trans.NGAY_CT ? new Date(trans.NGAY_CT) : '', 
          finalDienGiai, 
          tkDoiUng, 
          totalPhatSinhNo, 
          totalPhatSinhCo, 
          duNoCuoiKy, 
          duCoCuoiKy 
        ]);
      });

      outputData.push(['', '', '', 'Cộng phát sinh trong kỳ', '', tongPhatSinhNo, tongPhatSinhCo, '', '']);
      outputData.push(['', '', '', 'Số dư cuối kỳ', '', '', '', duNoCuoiKy, duCoCuoiKy]);
      outputData.push(['', '', '', '', '', '', '', '', '']);
    }

    ss.toast('Đang ghi dữ liệu ra báo cáo...', 'Bước 5/5');
    if(sheetSoCT.getLastRow() >= 1) {
        sheetSoCT.clear();
    }

    if (outputData.length > 0) {
      sheetSoCT.getRange(1, 1, outputData.length, 9).setValues(outputData);
    }

    ss.toast('Đang định dạng báo cáo...', 'Hoàn thiện');
    for (let i = 0; i < outputData.length; i++) {
        const currentRow = i + 1;
        const rowData = outputData[i];
        const dienGiai = rowData[3]?.toString() || '';

        if (dienGiai.startsWith('SỔ CHI TIẾT TÀI KHOẢN')) {
            sheetSoCT.getRange(currentRow, 1, 1, 9).merge().setFontWeight('bold').setBackground('#c9daf8').setHorizontalAlignment('center');
        } else if (rowData[0] === 'Ngày Ghi Sổ') {
            sheetSoCT.getRange(currentRow, 1, 1, 9).setFontWeight('bold').setBackground('#4a86e8').setFontColor('white');
        } else if (dienGiai.includes('Số dư đầu kỳ') || dienGiai.includes('Cộng phát sinh') || dienGiai.includes('Số dư cuối kỳ')) {
             sheetSoCT.getRange(currentRow, 4, 1, 6).setFontWeight('bold');
        }
    }

    ss.toast('Hoàn thành!', 'Thành công', 5);
    
    // Tạo báo cáo tóm tắt quá trình xử lý
    const totalProcessingTime = Date.now() - startTime;
    const childAccountsMap = new Map();
    taiKhoanCanXem.forEach(tk => {
      const childAccounts = findChildAccountsOptimized(tk, accountIndex);
      childAccountsMap.set(tk, childAccounts);
    });
    createProcessingSummary(taiKhoanCanXem, childAccountsMap, totalProcessingTime);
    
  } catch (e) {
    console.error("LỖI TẠO SỔ CHI TIẾT MỚI: " + e.toString() + e.stack);
    throw new Error('Lỗi khi tạo báo cáo: ' + e.toString());
  }
}

/**
 * HÀM PHỤ: Đọc dữ liệu từ các sheet có prefix bao gồm cột TK_THUE
 */
function readDataFromPrefixedSheetsWithThue(spreadsheet, sheetPrefix, requiredColumns) {
  const allSheets = spreadsheet.getSheets();
  const dataSheets = allSheets.filter(sheet => sheet.getName().startsWith(sheetPrefix));
  
  if (dataSheets.length === 0) {
    console.log(`Không tìm thấy sheet nào bắt đầu với "${sheetPrefix}"`);
    return [];
  }

  const combinedData = [];
  for (const sheet of dataSheets) {
    const sheetData = processSingleSheetWithThue(sheet, requiredColumns);
    if (sheetData.length > 0) {
      combinedData.push(...sheetData);
    }
  }
  return combinedData;
}

/**
 * HÀM PHỤ: Xử lý dữ liệu cho một sheet duy nhất bao gồm TK_THUE
 */
function processSingleSheetWithThue(sheet, requiredColumns) {
  try {
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    const headerRow = data[0].map(h => h.toString().trim().toUpperCase());
    
    // Tìm vị trí của cột NGAY_HT
    const colIndexNgayHT = headerRow.indexOf('NGAY_HT');

    // Kiểm tra xem có đủ các cột bắt buộc không
    const missingCols = requiredColumns.filter(col => !headerRow.includes(col));
    if (missingCols.length > 0) {
      console.error(`Sheet "${sheet.getName()}" thiếu các cột bắt buộc: ${missingCols.join(', ')}`);
      return [];
    }

    const processedData = [];
    // Lặp từ dòng 2 (index = 1) để bỏ qua tiêu đề
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Kiểm tra điều kiện NGAY_HT trước tiên
      const ngayHTValue = (colIndexNgayHT !== -1) ? row[colIndexNgayHT] : null;
      if (!ngayHTValue) {
        continue; // Bỏ qua dòng này và chuyển sang dòng tiếp theo
      }
      
      // Thêm validation dữ liệu
      if (!isValidRowDataWithThue(row, headerRow, requiredColumns)) {
        console.warn(`Sheet "${sheet.getName()}", dòng ${i + 1}: Dữ liệu không hợp lệ, bỏ qua`);
        continue;
      }
      
      const rowData = {
        sheet: sheet.getName(),
        row: i + 1
      };
      
      headerRow.forEach((header, index) => {
        rowData[header] = row[index];
      });
      
      processedData.push(rowData);
    }
    return processedData;
  } catch (error) {
    console.error(`Lỗi xử lý sheet "${sheet.getName()}": ${error.toString()}`);
    return [];
  }
}

/**
 * HÀM PHỤ: Kiểm tra tính hợp lệ của dữ liệu dòng bao gồm TK_THUE
 */
function isValidRowDataWithThue(row, headerRow, requiredColumns) {
  try {
    for (const requiredCol of requiredColumns) {
      const colIndex = headerRow.indexOf(requiredCol);
      if (colIndex === -1) continue;
      
      const value = row[colIndex];
      
      // Đối với TK_THUE và THUE_VAT, cho phép rỗng (không bắt buộc)
      if (requiredCol === 'TK_THUE' || requiredCol === 'THUE_VAT') {
        continue;
      }
      
      if (value === null || value === undefined || value === '') {
        return false;
      }
      
      // Kiểm tra đặc biệt cho các cột số
      if (requiredCol === 'SO_TIEN') {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue <= 0) {
          return false;
        }
      }
      
      // Đối với THUE_VAT, nếu có giá trị thì phải >= 0
      if (requiredCol === 'THUE_VAT' && value !== null && value !== undefined && value !== '') {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 0) {
          return false;
        }
      }
    }
    return true;
  } catch (error) {
    console.error('Lỗi kiểm tra dữ liệu:', error.toString());
    return false;
  }
}

/**
 * HÀM PHỤ: Xử lý phát sinh thuế từ cột TK_THUE
 */
function xuLyPhatSinhThueTuTK_THUE(transactionsRaw) {
  const finalTransactions = [];
  
  for (const trans of transactionsRaw) {
    const soTien = parseFloat(trans.SO_TIEN) || 0;
    const thueVAT = parseFloat(trans.THUE_VAT) || 0;
    const tkNo = trans.TK_NO?.toString().trim();
    const tkCo = trans.TK_CO?.toString().trim();
    const tkThue = trans.TK_THUE?.toString().trim();
    
    // Thêm TẤT CẢ giao dịch gốc nếu có đủ điều kiện cơ bản
    // Điều kiện: có ngày ghi sổ, tài khoản nợ, tài khoản có, số tiền > 0
    if (trans.NGAY_HT && tkNo && tkCo && soTien > 0) {
      finalTransactions.push({ ...trans, SO_TIEN: soTien });
    }

    // Xử lý phát sinh thuế từ TK_THUE (nếu có)
    // Chỉ tạo bút toán thuế khi có thuế VAT > 0 và có TK_THUE
    if (thueVAT > 0 && tkThue) {
      const phatSinhThue = taoPhatSinhThue(tkThue, tkNo, tkCo, thueVAT, trans);
      if (phatSinhThue) {
        finalTransactions.push(phatSinhThue);
      }
    }
  }
  
  return finalTransactions;
}

/**
 * HÀM PHỤ: Tạo bút toán thuế từ TK_THUE
 */
function taoPhatSinhThue(tkThue, tkNo, tkCo, thueVAT, transGoc) {
  // Kiểm tra tài khoản thuế và tạo bút toán tương ứng
  if (tkThue === '1331' || tkThue === '1332') {
    // Phát sinh NỢ tài khoản thuế, tài khoản đối ứng là TK_CO
    return {
      ...transGoc,
      TK_NO: tkThue,
      TK_CO: tkCo,
      SO_TIEN: thueVAT,
      DIEN_GIAI: `Thuế GTGT của ${transGoc.DIEN_GIAI || 'chứng từ ' + transGoc.SO_CT}`,
      NGAY_HT: transGoc.NGAY_HT,
      NGAY_CT: transGoc.NGAY_CT,
      SO_CT: transGoc.SO_CT
    };
  } else if (tkThue === '33311' || tkThue === '33312') {
    // Phát sinh CÓ tài khoản thuế, tài khoản đối ứng là TK_NO
    return {
      ...transGoc,
      TK_NO: tkNo,
      TK_CO: tkThue,
      SO_TIEN: thueVAT,
      DIEN_GIAI: `Thuế GTGT của ${transGoc.DIEN_GIAI || 'chứng từ ' + transGoc.SO_CT}`,
      NGAY_HT: transGoc.NGAY_HT,
      NGAY_CT: transGoc.NGAY_CT,
      SO_CT: transGoc.SO_CT
    };
  }
  
  // Nếu không phải tài khoản thuế đặc biệt, trả về null
  return null;
}

/**
 * ⭐ HÀM MỚI: Tạo báo cáo Sổ Nhật Ký Chung
 */
function taoNhatKyChung(startDateStr, endDateStr) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  try {
    const ngayBatDau = new Date(startDateStr);
    ngayBatDau.setHours(0, 0, 0, 0);
    const ngayKetThuc = new Date(endDateStr);
    ngayKetThuc.setHours(23, 59, 59, 999);

    const sheetNKC = ss.getSheetByName('NKC');
    if (!sheetNKC) {
      throw new Error('Không tìm thấy sheet báo cáo "NKC". Vui lòng tạo sheet này.');
    }

    ss.toast('Đang đọc dữ liệu phát sinh...', 'Bước 1/4');
    const dataResult = getAllDataFromDLSheets(ss, 'NKC', trans => {
      const ngayGiaoDich = new Date(trans.ngay);
      return ngayGiaoDich >= ngayBatDau && ngayGiaoDich <= ngayKetThuc;
    });
    const transactions = dataResult.data;

    ss.toast('Đang xử lý bút toán...', 'Bước 2/4');
    const journalEntries = [];
    let tongPsNo = 0; // ⭐ THAY ĐỔI: Biến tính tổng Nợ
    let tongPsCo = 0; // ⭐ THAY ĐỔI: Biến tính tổng Có

    for (const trans of transactions) {
      // Bút toán chính
      if (trans.soTien > 0) {
        journalEntries.push({
          ngayGhiSo: new Date(trans.ngay), soCt: trans.soCt || '', ngayCt: trans.ngayCt ? new Date(trans.ngayCt) : '',
          dienGiai: trans.dienGiai || '', tkNo: trans.tkNo, tkCo: trans.tkCo, psNo: trans.soTien, psCo: 0
        });
        journalEntries.push({
          ngayGhiSo: new Date(trans.ngay), soCt: trans.soCt || '', ngayCt: trans.ngayCt ? new Date(trans.ngayCt) : '',
          dienGiai: trans.dienGiai || '', tkNo: trans.tkCo, tkCo: trans.tkNo, psNo: 0, psCo: trans.soTien
        });
        // ⭐ THAY ĐỔI: Cộng dồn vào tổng
        tongPsNo += trans.soTien;
        tongPsCo += trans.soTien;
      }

      // Bút toán thuế
      if (trans.thueVAT > 0 && trans.tkThue) {
        const dienGiaiThue = `Thuế GTGT của ${trans.dienGiai || 'CT ' + trans.soCt}`;
        if (['1331', '1332'].includes(trans.tkThue)) { // Thuế đầu vào
          journalEntries.push({
            ngayGhiSo: new Date(trans.ngay), soCt: trans.soCt || '', ngayCt: trans.ngayCt ? new Date(trans.ngayCt) : '',
            dienGiai: dienGiaiThue, tkNo: trans.tkThue, tkCo: trans.tkCo, psNo: trans.thueVAT, psCo: 0
          });
          journalEntries.push({
            ngayGhiSo: new Date(trans.ngay), soCt: trans.soCt || '', ngayCt: trans.ngayCt ? new Date(trans.ngayCt) : '',
            dienGiai: dienGiaiThue, tkNo: trans.tkCo, tkCo: trans.tkThue, psNo: 0, psCo: trans.thueVAT
          });
        } else if (['33311', '33312'].includes(trans.tkThue)) { // Thuế đầu ra
          journalEntries.push({
            ngayGhiSo: new Date(trans.ngay), soCt: trans.soCt || '', ngayCt: trans.ngayCt ? new Date(trans.ngayCt) : '',
            dienGiai: dienGiaiThue, tkNo: trans.tkNo, tkCo: trans.tkThue, psNo: trans.thueVAT, psCo: 0
          });
          journalEntries.push({
            ngayGhiSo: new Date(trans.ngay), soCt: trans.soCt || '', ngayCt: trans.ngayCt ? new Date(trans.ngayCt) : '',
            dienGiai: dienGiaiThue, tkNo: trans.tkThue, tkCo: trans.tkNo, psNo: 0, psCo: trans.thueVAT
          });
        }
        // ⭐ THAY ĐỔI: Cộng dồn vào tổng
        tongPsNo += trans.thueVAT;
        tongPsCo += trans.thueVAT;
      }
    }

    ss.toast('Đang sắp xếp dữ liệu...', 'Bước 3/4');
    journalEntries.sort((a, b) => a.ngayGhiSo - b.ngayGhiSo || (a.soCt || '').localeCompare(b.soCt || ''));

    const outputData = journalEntries.map(e => [
      e.ngayGhiSo, e.soCt, e.ngayCt, e.dienGiai, e.tkNo, e.tkCo, e.psNo, e.psCo
    ]);

    ss.toast('Đang ghi và định dạng báo cáo...', 'Bước 4/4');
    sheetNKC.clear();
    
    const title = `SỔ NHẬT KÝ CHUNG`;
    const subtitle = `Từ ngày ${ngayBatDau.toLocaleDateString('vi-VN')} đến ngày ${ngayKetThuc.toLocaleDateString('vi-VN')}`;
    sheetNKC.getRange("A1").setValue(title).setFontWeight('bold').setFontSize(14).setHorizontalAlignment('center');
    sheetNKC.getRange("A2").setValue(subtitle).setFontStyle('italic').setHorizontalAlignment('center');
    sheetNKC.getRange("A1:H1").merge();
    sheetNKC.getRange("A2:H2").merge();

    const headers = [['Ngày ghi sổ', 'Số CT', 'Ngày CT', 'Diễn giải', 'TK Nợ', 'TK Có', 'Phát sinh Nợ', 'Phát sinh Có']];
    sheetNKC.getRange(4, 1, 1, 8).setValues(headers).setFontWeight('bold').setBackground('#4a86e8').setFontColor('white').setHorizontalAlignment('center');
    
    if (outputData.length > 0) {
      const dataStartRow = 5;
      sheetNKC.getRange(dataStartRow, 1, outputData.length, 8).setValues(outputData);
      
      const totalRow = dataStartRow + outputData.length;
      sheetNKC.getRange(totalRow, 4).setValue('Cộng phát sinh').setFontWeight('bold').setHorizontalAlignment('right');
      // ⭐ THAY ĐỔI: Ghi thẳng giá trị đã tính toán, không dùng công thức
      sheetNKC.getRange(totalRow, 7).setValue(tongPsNo).setFontWeight('bold');
      sheetNKC.getRange(totalRow, 8).setValue(tongPsCo).setFontWeight('bold');
      
      const allRange = sheetNKC.getRange(4, 1, outputData.length + 1, 8);
      allRange.setBorder(true, true, true, true, true, true).setVerticalAlignment('middle');
      sheetNKC.getRange(dataStartRow, 1, outputData.length, 1).setNumberFormat("dd/MM/yyyy");
      sheetNKC.getRange(dataStartRow, 3, outputData.length, 1).setNumberFormat("dd/MM/yyyy");
      sheetNKC.getRange(dataStartRow, 7, outputData.length + 1, 2).setNumberFormat("#,##0;(#,##0);");
      sheetNKC.getRange(4, 1, outputData.length + 1, 8).setWrap(true);
      sheetNKC.autoResizeColumns(1, 8);
    }

    ss.toast('Hoàn thành!', 'Thành công', 5);
    return { success: true };

  } catch (e) {
    console.error("LỖI TẠO NHẬT KÝ CHUNG: " + e.toString() + e.stack);
    throw new Error('Lỗi khi tạo báo cáo: ' + e.toString());
  }
}

function getInitialSidebarData() {
  try {
    // Gọi các hàm lấy dữ liệu khác ngay trên server
    const dates = getReportDates();
    const accounts = getAccountsForSidebar();
    
    // Trả về một đối tượng duy nhất chứa tất cả dữ liệu cần thiết khi khởi động
    return {
      dates: dates,
      accounts: accounts,
    };
  } catch (e) {
    console.error("Lỗi khi lấy dữ liệu khởi tạo cho sidebar: " + e.toString());
    // Trả về một đối tượng lỗi để client có thể xử lý
    return { error: e.toString() };
  }
}

/**
 * ⭐ HÀM MỚI: Tạo Báo cáo Bán hàng theo Đơn hàng
 * CẬP NHẬT: Sửa lỗi "Số cột không khớp"
 */
function taoBaoCaoBanHang(startDateStr, endDateStr, selectedDonHang) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  try {
    const ngayBatDau = new Date(startDateStr);
    ngayBatDau.setHours(0, 0, 0, 0);
    const ngayKetThuc = new Date(endDateStr);
    ngayKetThuc.setHours(23, 59, 59, 999);

    ss.toast('Đang đọc dữ liệu...', 'Bước 1/4');
    const sheetDMDH = ss.getSheetByName('DMDONHANG');
    const sheetBCBH = ss.getSheetByName('BC_BANHANG');
    if (!sheetDMDH || !sheetBCBH) throw new Error('Không tìm thấy sheet DMDONHANG hoặc BC_BANHANG');

    const allDonHangData = sheetDMDH.getDataRange().getValues();
    const allGiaoDich = getAllDataFromDLSheets(ss, 'BC_BANHANG').data;

    ss.toast('Đang lọc và tính tổng...', 'Bước 2/4');
    const donHangCoPhatSinhTrongKy = new Set();
    let tongSoLuongToanKy = 0;
    let tongSoTienToanKy = 0;
    let tongThueToanKy = 0;

    for (const gd of allGiaoDich) {
      const ngayGiaoDich = new Date(gd.ngay);
      if (ngayGiaoDich >= ngayBatDau && ngayGiaoDich <= ngayKetThuc) {
        const key = `${gd.maKho}|${gd.maHang}`;
        donHangCoPhatSinhTrongKy.add(key);
        
        if (selectedDonHang.length === 0 || selectedDonHang.includes(key)) {
            tongSoLuongToanKy += gd.soLuong;
            tongSoTienToanKy += gd.soTien;
            tongThueToanKy += gd.thueVAT || 0;
        }
      }
    }

    ss.toast('Đang tổng hợp dữ liệu...', 'Bước 3/4');
    const reportDataMap = new Map();
    const headerDMDH = allDonHangData[0].map(h => h.toString().trim().toUpperCase());
    
    const sizeCols = headerDMDH.map((h, i) => h.startsWith('SIZE') ? { index: i, name: h } : null).filter(Boolean);
    const slCols = headerDMDH.map((h, i) => h.startsWith('SL') ? { index: i, name: h } : null).filter(Boolean);

    for (let i = 1; i < allDonHangData.length; i++) {
      const row = allDonHangData[i];
      const maKho = row[headerDMDH.indexOf('MA_KHO')];
      const maHang = row[headerDMDH.indexOf('MA_HANG')];
      const key = `${maKho}|${maHang}`;

      const isSelected = selectedDonHang.length === 0 || selectedDonHang.includes(key);

      if (isSelected && donHangCoPhatSinhTrongKy.has(key)) {
        const donHang = {
          info: [maKho, maHang, row[headerDMDH.indexOf('TEN_HANG')], row[headerDMDH.indexOf('QUY_CACH')], row[headerDMDH.indexOf('DVT')]],
          ghiChu: row[headerDMDH.indexOf('GHI_CHU')] || '',
          soKeHoach: parseFloat(row[headerDMDH.indexOf('SO_KE_HOACH')]) || 0,
          sizes: [],
          slKeHoach: [],
          slTruocKy: [],
          slTrongKy: [],
          thanhTienTrongKy: 0,
          thueTrongKy: 0,
          sizeMap: new Map()
        };
        
        for(let j = 0; j < sizeCols.length; j++) {
            const sizeName = row[sizeCols[j].index];
            const slKeHoach = parseFloat(row[slCols[j].index]) || 0;
            if(sizeName) {
                donHang.sizes.push(sizeName);
                donHang.slKeHoach.push(slKeHoach);
                donHang.slTruocKy.push(0);
                donHang.slTrongKy.push(0);
                donHang.sizeMap.set(sizeName.toString(), j);
            }
        }
        reportDataMap.set(key, donHang);
      }
    }

    for (const gd of allGiaoDich) {
      const key = `${gd.maKho}|${gd.maHang}`;
      if (reportDataMap.has(key)) {
        const donHang = reportDataMap.get(key);
        const sizeIndex = donHang.sizeMap.get(gd.coSo.toString());
        if (sizeIndex !== undefined) {
          const ngayGiaoDich = new Date(gd.ngay);
          if (ngayGiaoDich < ngayBatDau) {
            donHang.slTruocKy[sizeIndex] += gd.soLuong;
          } else if (ngayGiaoDich <= ngayKetThuc) {
            donHang.slTrongKy[sizeIndex] += gd.soLuong;
            donHang.thanhTienTrongKy += gd.soTien;
            donHang.thueTrongKy += gd.thueVAT || 0;
          }
        }
      }
    }

    ss.toast('Đang ghi báo cáo...', 'Bước 4/4');
    sheetBCBH.clear();
    
    let maxSizes = 0;
    for (const [key, donHang] of reportDataMap.entries()) {
        if (donHang.sizes.length > maxSizes) maxSizes = donHang.sizes.length;
    }
    const maxCols = 11 + maxSizes; 

    const title = `BÁO CÁO BÁN HÀNG CHI TIET THEO ĐƠN HÀNG`;
    const subtitle = `Từ ngày ${ngayBatDau.toLocaleDateString('vi-VN')} đến ngày ${ngayKetThuc.toLocaleDateString('vi-VN')}`;
    sheetBCBH.getRange("A1").setValue(title).setFontWeight('bold').setFontSize(14).setHorizontalAlignment('center');
    sheetBCBH.getRange("A2").setValue(subtitle).setFontStyle('italic').setHorizontalAlignment('center');
    sheetBCBH.getRange(1, 1, 1, maxCols).merge();
    sheetBCBH.getRange(2, 1, 1, maxCols).merge();
    
    const mainHeader = [['Mã kho', 'Mã hàng', 'Tên hàng', 'Quy cách', 'Đơn vị tính', 'Ghi Chú', 'Tổng SL', 'Đơn Giá', 'Thành Tiền', 'Thuế VAT', 'Tổng Tiền', 'Cỡ số']];
    sheetBCBH.getRange(4, 1, 1, 12).setValues(mainHeader);
    if (maxSizes > 1) {
      sheetBCBH.getRange(4, 12, 1, maxSizes).merge();
    }
    sheetBCBH.getRange(4, 1, 1, maxCols).setFontWeight('bold').setBackground('#4a86e8').setFontColor('white').setHorizontalAlignment('center');

    // ⭐ THAY ĐỔI: Thêm dòng tổng hợp ngay dưới tiêu đề
    const tongCongTienToanKy = tongSoTienToanKy + tongThueToanKy;
    const summaryData = [['', '', 'Tổng phát sinh trong kỳ:', '', '', '', tongSoLuongToanKy, '', tongSoTienToanKy, tongThueToanKy, tongCongTienToanKy]];
    const summaryRange = sheetBCBH.getRange(5, 1, 1, 11);
    summaryRange.setValues(summaryData);
    summaryRange.setFontWeight('bold');
    sheetBCBH.getRange("C5").setHorizontalAlignment('right');
    sheetBCBH.getRange(5, 7, 1, 5).setNumberFormat("#,##0;(#,##0);");


    let currentRow = 6;

    for (let i = 1; i < allDonHangData.length; i++) {
        const row = allDonHangData[i];
        const maKho = row[headerDMDH.indexOf('MA_KHO')];
        const maHang = row[headerDMDH.indexOf('MA_HANG')];
        const key = `${maKho}|${maHang}`;

        if(reportDataMap.has(key)) {
            const donHang = reportDataMap.get(key);
            const numInfoCols = donHang.info.length; // 5
            const numSizes = donHang.sizes.length;
            
            let tongSlTrongKy = donHang.slTrongKy.reduce((a, b) => a + b, 0);
            let tongSlTruocKy = donHang.slTruocKy.reduce((a, b) => a + b, 0);
            let thanhTienTrongKy = donHang.thanhTienTrongKy;
            let thueTrongKy = donHang.thueTrongKy;
            let tongTien = thanhTienTrongKy + thueTrongKy;
            let donGia = (tongSlTrongKy > 0) ? (thanhTienTrongKy / tongSlTrongKy) : 0;

            const blockData = [
                [...donHang.info, donHang.ghiChu, '', '', '', '', '', ...donHang.sizes.map(s => `#${s}`)],
                ['', '', 'SL Kế hoạch', '', '', '', donHang.soKeHoach, '', '', '', '', ...donHang.slKeHoach],
                ['', '', 'SL đã báo cáo kỳ trước', '', '', '', tongSlTruocKy, '', '', '', '', ...donHang.slTruocKy],
                ['', '', 'SL phát sinh kỳ này', '', '', '', tongSlTrongKy, donGia, thanhTienTrongKy, thueTrongKy, tongTien, ...donHang.slTrongKy]
            ];
            
            const blockTotalCols = numInfoCols + 6 + numSizes;
            sheetBCBH.getRange(currentRow, 1, 4, blockTotalCols).setValues(blockData);

            const blockRange = sheetBCBH.getRange(currentRow, 1, 4, blockTotalCols);
            blockRange.setBorder(true, true, true, true, true, true);
            sheetBCBH.getRange(currentRow, 1, 1, numInfoCols + 1).setFontWeight('bold');
            sheetBCBH.getRange(currentRow, numInfoCols + 7, 1, numSizes).setFontWeight('bold').setHorizontalAlignment('center');
            sheetBCBH.getRange(currentRow + 1, 3, 3, 1).setFontWeight('bold').setHorizontalAlignment('right');
            
            const slFormat = "#,##0;(#,##0);";
            const tienFormat = "#,##0;(#,##0);";
            
            sheetBCBH.getRange(currentRow + 1, 7, 1, 1).setNumberFormat(slFormat);
            sheetBCBH.getRange(currentRow + 1, 12, 1, numSizes).setNumberFormat(slFormat);
            
            sheetBCBH.getRange(currentRow + 2, 7, 1, 1).setNumberFormat(slFormat);
            sheetBCBH.getRange(currentRow + 2, 12, 1, numSizes).setNumberFormat(slFormat);

            sheetBCBH.getRange(currentRow + 3, 7, 1, 1).setNumberFormat(slFormat);
            sheetBCBH.getRange(currentRow + 3, 8, 1, 4).setNumberFormat(tienFormat);
            sheetBCBH.getRange(currentRow + 3, 12, 1, numSizes).setNumberFormat(slFormat);
            
            currentRow += 5;
        }
    }
    
    if (maxCols > 8) {
      sheetBCBH.autoResizeColumns(1, maxCols);
    }

    ss.toast('Hoàn thành!', 'Thành công', 5);
    return { success: true };

  } catch (e) {
    console.error("LỖI TẠO BÁO CÁO BÁN HÀNG: " + e.toString() + e.stack);
    throw new Error('Lỗi khi tạo báo cáo: ' + e.toString());
  }
}

/**
 * ⭐ HÀM MỚI: Lấy danh sách đơn hàng cho sidebar
 */
function getDonHangForSidebar() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetDMDH = ss.getSheetByName('DMDONHANG');
    if (!sheetDMDH) return [];

    const data = sheetDMDH.getDataRange().getValues();
    const donHangList = [];
    const header = data[0].map(h => h.toString().trim().toUpperCase());
    const maKhoIndex = header.indexOf('MA_KHO');
    const maHangIndex = header.indexOf('MA_HANG');
    const tenHangIndex = header.indexOf('TEN_HANG');

    for (let i = 1; i < data.length; i++) {
      const maKho = data[i][maKhoIndex];
      const maHang = data[i][maHangIndex];
      if (maKho && maHang) {
        donHangList.push({ 
          id: `${maKho}|${maHang}`, 
          ten: data[i][tenHangIndex] || `${maKho} - ${maHang}`
        });
      }
    }
    return donHangList;
  } catch (e) {
    console.error("Lỗi khi lấy danh sách đơn hàng: " + e.toString());
    return [];
  }
}

