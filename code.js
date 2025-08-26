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
    .setTitle('🚀 Kế Toán Pro - Bảng Điều Khiển');
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
function taoNhapXuatTonFromSidebar(startDate, endDate, selectedHangHoa) {
  try {
    console.log(`🚀 Bắt đầu tạo báo cáo NXT từ sidebar: ${startDate} → ${endDate}`);
    console.log(`📦 Số lượng hàng hóa được chọn: ${selectedHangHoa.length}`);
    
    if (!selectedHangHoa || selectedHangHoa.length === 0) {
      throw new Error('Không có hàng hóa nào được chọn');
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Lấy các sheet
    const sheetDMHH = ss.getSheetByName('DMHH');
    const sheetNXT = ss.getSheetByName('NXT');
    
    if (!sheetDMHH || !sheetNXT) {
      throw new Error('Không tìm thấy sheet DMHH hoặc NXT');
    }
    
    // Xử lý ngày báo cáo
    const ngayBatDau = new Date(startDate + 'T00:00:00');
    const ngayKetThuc = new Date(endDate + 'T23:59:59');
    
    console.log(`📅 Kỳ báo cáo: ${ngayBatDau.toLocaleDateString('vi-VN')} → ${ngayKetThuc.toLocaleDateString('vi-VN')}`);
    console.log(`🔍 Lọc theo ${selectedHangHoa.length} hàng hóa từ sidebar`);
    
    // Chuyển đổi danh sách hàng hóa thành key để dễ tìm kiếm
    const selectedHangHoaKeys = selectedHangHoa.map(item => `${item.maKho}|${item.maHang}`);
    
    // Gọi function xử lý dữ liệu
    const result = xuLyDuLieuNhapXuatTon(sheetDMHH, sheetNXT, ngayBatDau, ngayKetThuc, selectedHangHoaKeys);
    
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
 * HÀM PHỤ: Xử lý dữ liệu Nhập Xuất Tồn (tách riêng để tái sử dụng)
 */
function xuLyDuLieuNhapXuatTon(sheetDMHH, sheetNXT, ngayBatDau, ngayKetThuc, selectedHangHoaKeys) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Lấy dữ liệu từ sheet DMHH
  const dataDMHH = sheetDMHH.getDataRange().getValues();
  const headerRowDMHH = 1;
  
  // ĐỌC DỮ LIỆU TỪ NHIỀU SHEET DL_* BẰNG UNIVERSAL READER
  const filterCondition = (row) => {
    // Chỉ lấy dòng có thông tin hàng hóa
    return row.maKho && row.maHang && row.soLuong !== 0;
  };
  
  const dataResult = getAllDataFromDLSheets(ss, 'NXT', filterCondition);
  const combinedData = dataResult.data;
  
  // Tạo map để lưu trữ thông tin hàng hóa
  const hangHoaMap = new Map();

  // Hàm kiểm tra điều kiện lọc
  function kiemTraDieuKienLoc(maKho, maHang) {
    const key = `${maKho}|${maHang}`;
    return selectedHangHoaKeys.includes(key);
  }

  // Hàm phân loại loại giao dịch
  function phanLoaiGiaoDich(tkNo, tkCo) {
    // Ưu tiên xử lý các trường hợp đặc biệt trước
    
    // XUẤT_SX: Nợ 154 (ưu tiên cao nhất)
    if (tkNo.startsWith('154')) {
      return 'XUAT_SX';
    }
    
    // NHẬP: Có 154 (ưu tiên thứ hai)
    if (tkCo.startsWith('154')) {
      return 'NHAP';
    }
    
    // NHẬP: Nợ 15 (không phải 154)  
    if (tkNo.startsWith('15') && !tkNo.startsWith('154')) {
      return 'NHAP';
    }
    
    // XUẤT: Có 15 (không phải 154)
    if (tkCo.startsWith('15') && !tkCo.startsWith('154')) {
      return 'XUAT';
    }
    
    return null; // Không thuộc nghiệp vụ kho
  }
  
  // BƯỚC 1: Đọc dữ liệu từ DMHH
  for (let i = headerRowDMHH; i < dataDMHH.length; i++) {
    const row = dataDMHH[i];
    const maKho = row[0]?.toString().trim();
    const maHang = row[1]?.toString().trim();
    const tenHang = row[2]?.toString().trim();
    const quyCache = row[3]?.toString().trim();
    const dvt = row[4]?.toString().trim();
    const slDauKy = parseFloat(row[5]) || 0;
    const gtDauKy = parseFloat(row[6]) || 0;
    
    // Kiểm tra điều kiện lọc
    if (maKho && maHang && kiemTraDieuKienLoc(maKho, maHang)) {
      const key = `${maKho}|${maHang}`;
      
      hangHoaMap.set(key, {
        maKho: maKho,
        maHang: maHang,
        tenHang: tenHang,
        quyCache: quyCache,
        dvt: dvt,
        slDauKyGoc: slDauKy,
        gtDauKyGoc: gtDauKy,
        // Phát sinh trước kỳ
        slNhapTruocKy: 0,
        gtNhapTruocKy: 0,
        slXuatTruocKy: 0,
        gtXuatTruocKy: 0,
        slXuatSXTruocKy: 0,
        gtXuatSXTruocKy: 0,
        // Phát sinh trong kỳ
        slNhapTrongKy: 0,
        gtNhapTrongKy: 0,
        slXuatTrongKy: 0,
        gtXuatTrongKy: 0,
        slXuatSXTrongKy: 0,
        gtXuatSXTrongKy: 0
      });
    }
  }
  
  // BƯỚC 2: Xử lý dữ liệu giao dịch
  let tongGiaoDichTruocKy = 0;
  let tongGiaoDichTrongKy = 0;
  let giaoDichKhongLienQuan = 0;
  let giaoDichKhongKhopLoc = 0;
  
  for (let i = 0; i < combinedData.length; i++) {
    const row = combinedData[i];
    const ngayHachToan = new Date(row.ngay);
    const tkNo = row.tkNo?.toString().trim();
    const tkCo = row.tkCo?.toString().trim();
    const soTien = parseFloat(row.soTien) || 0;
    const maKho = row.maKho?.toString().trim();
    const maHang = row.maHang?.toString().trim();
    const soLuong = parseFloat(row.soLuong) || 0;
    const donGia = parseFloat(row.donGia) || 0;
    
    const key = `${maKho}|${maHang}`;
    const loaiGiaoDich = phanLoaiGiaoDich(tkNo, tkCo);
    
    // Bỏ qua giao dịch không liên quan đến kho
    if (loaiGiaoDich === null) {
      giaoDichKhongLienQuan++;
      continue;
    }
    
    // Kiểm tra điều kiện lọc
    if (!kiemTraDieuKienLoc(maKho, maHang)) {
      giaoDichKhongKhopLoc++;
      continue;
    }
    
    // Tạo bản ghi hàng hóa nếu chưa tồn tại
    if (!hangHoaMap.has(key)) {
      hangHoaMap.set(key, {
        maKho: maKho,
        maHang: maHang,
        tenHang: `Hàng ${maHang}`,
        quyCache: '',
        dvt: '',
        slDauKyGoc: 0,
        gtDauKyGoc: 0,
        slNhapTruocKy: 0,
        gtNhapTruocKy: 0,
        slXuatTruocKy: 0,
        gtXuatTruocKy: 0,
        slXuatSXTruocKy: 0,
        gtXuatSXTruocKy: 0,
        slNhapTrongKy: 0,
        gtNhapTrongKy: 0,
        slXuatTrongKy: 0,
        gtXuatTrongKy: 0,
        slXuatSXTrongKy: 0,
        gtXuatSXTrongKy: 0
      });
    }
    
    const hangHoa = hangHoaMap.get(key);
    
    const laGiaoDichTruocKy = ngayHachToan < ngayBatDau;
    const laGiaoDichTrongKy = ngayHachToan >= ngayBatDau && ngayHachToan <= ngayKetThuc;
    
    if (laGiaoDichTruocKy || laGiaoDichTrongKy) {
      
      if (laGiaoDichTruocKy) {
        // Phát sinh trước kỳ báo cáo
        switch (loaiGiaoDich) {
          case 'NHAP':
            hangHoa.slNhapTruocKy += soLuong;
            hangHoa.gtNhapTruocKy += soTien;
            break;
          case 'XUAT':
            hangHoa.slXuatTruocKy += soLuong;
            hangHoa.gtXuatTruocKy += soTien;
            break;
          case 'XUAT_SX':
            hangHoa.slXuatSXTruocKy += soLuong;
            hangHoa.gtXuatSXTruocKy += soTien;
            break;
        }
        tongGiaoDichTruocKy++;
      } else {
        // Phát sinh trong kỳ báo cáo
        switch (loaiGiaoDich) {
          case 'NHAP':
            hangHoa.slNhapTrongKy += soLuong;
            hangHoa.gtNhapTrongKy += soTien;
            break;
          case 'XUAT':
            hangHoa.slXuatTrongKy += soLuong;
            hangHoa.gtXuatTrongKy += soTien;
            break;
          case 'XUAT_SX':
            hangHoa.slXuatSXTrongKy += soLuong;
            hangHoa.gtXuatSXTrongKy += soTien;
            break;
        }
        tongGiaoDichTrongKy++;
      }
    }
  }
  
  // BƯỚC 3: Lọc bỏ hàng hóa không có dữ liệu
  function kiemTraHangHoaCoData(hangHoa) {
    // Tính tồn đầu kỳ báo cáo
    const slTonDauKyBaoCao = hangHoa.slDauKyGoc + hangHoa.slNhapTruocKy - hangHoa.slXuatTruocKy - hangHoa.slXuatSXTruocKy;
    const gtTonDauKyBaoCao = hangHoa.gtDauKyGoc + hangHoa.gtNhapTruocKy - hangHoa.gtXuatTruocKy - hangHoa.gtXuatSXTruocKy;
    
    return (slTonDauKyBaoCao !== 0 || 
            gtTonDauKyBaoCao !== 0 || 
            hangHoa.slNhapTrongKy !== 0 || 
            hangHoa.gtNhapTrongKy !== 0 ||
            hangHoa.slXuatTrongKy !== 0 || 
            hangHoa.gtXuatTrongKy !== 0 ||
            hangHoa.slXuatSXTrongKy !== 0 || 
            hangHoa.gtXuatSXTrongKy !== 0);
  }
  
  const hangHoaCoData = new Map();
  for (const [key, hangHoa] of hangHoaMap.entries()) {
    if (kiemTraHangHoaCoData(hangHoa)) {
      hangHoaCoData.set(key, hangHoa);
    }
  }
  
  // BƯỚC 4: Ghi dữ liệu vào sheet NXT
  ghiDuLieuVaoSheetNXT(sheetNXT, hangHoaCoData, ngayBatDau, ngayKetThuc);
  
  // BƯỚC 5: Trả về thống kê
  const tongHangHoa = Array.from(hangHoaMap.entries()).length;
  const hangHoaHienThi = hangHoaCoData.size;
  const hangHoaBoQua = tongHangHoa - hangHoaHienThi;
  
  // Thông tin về sheets đã xử lý
  const sheetInfo = createDataSummary(ss, 'NXT');
  
  // Hiển thị thông báo hoàn thành
  SpreadsheetApp.getUi().alert(`✅ Báo cáo Nhập Xuất Tồn đã hoàn thành!\n\n📊 Thống kê:\n- Hiển thị: ${hangHoaHienThi} mặt hàng\n- Bỏ qua: ${hangHoaBoQua} mặt hàng (không có dữ liệu)\n- Giao dịch trước kỳ: ${tongGiaoDichTruocKy}\n- Giao dịch trong kỳ: ${tongGiaoDichTrongKy}\n- Giao dịch không liên quan: ${giaoDichKhongLienQuan}\n- Giao dịch không khớp lọc: ${giaoDichKhongKhopLoc}\n\n📋 Nguồn dữ liệu:\n${sheetInfo}\n\n📅 Kỳ báo cáo: ${ngayBatDau.toLocaleDateString('vi-VN')} → ${ngayKetThuc.toLocaleDateString('vi-VN')}`);
  
  return {
    hangHoaHienThi,
    hangHoaBoQua,
    tongGiaoDichTruocKy,
    tongGiaoDichTrongKy,
    giaoDichKhongLienQuan,
    giaoDichKhongKhopLoc,
    sheetInfo
  };
}

/**
 * HÀM PHỤ: Ghi dữ liệu vào sheet NXT
 */
function ghiDuLieuVaoSheetNXT(sheetNXT, hangHoaCoData, ngayBatDau, ngayKetThuc) {
  // Tạo header cho bảng NXT (2 dòng)
  const headers1 = [
    'Mã kho', 'Mã hàng', 'Tên hàng', 'Quy cách', 'ĐVT', 
    'Tồn đầu kỳ', '', 'Nhập trong kỳ', '', 'Xuất trong kỳ', '', 
    'Xuất SX trong kỳ', '', 'Tồn cuối kỳ', '', 'Ghi chú'
  ];
  
  const headers2 = [
    '', '', '', '', '', 
    'SL', 'Tiền', 'SL', 'Tiền', 'SL', 'Tiền', 
    'SL', 'Tiền', 'SL', 'Tiền', ''
  ];
  
  // Xóa dữ liệu cũ từ dòng 4 trở đi
  const lastRow = sheetNXT.getLastRow();
  if (lastRow >= 6) {
    sheetNXT.getRange(6, 1, lastRow - 5, 16).clear();
  }
  
  // Ghi header (dòng 4 và 5)
  sheetNXT.getRange(4, 1, 1, headers1.length).setValues([headers1]);
  sheetNXT.getRange(5, 1, 1, headers2.length).setValues([headers2]);
  
  // Merge cells cho header
  const mergeCells = [
    [4, 1, 2, 1], // Mã kho
    [4, 2, 2, 1], // Mã hàng  
    [4, 3, 2, 1], // Tên hàng
    [4, 4, 2, 1], // Quy cách
    [4, 5, 2, 1], // ĐVT
    [4, 6, 1, 2], // Tồn đầu kỳ
    [4, 8, 1, 2], // Nhập trong kỳ
    [4, 10, 1, 2], // Xuất trong kỳ
    [4, 12, 1, 2], // Xuất SX trong kỳ
    [4, 14, 1, 2], // Tồn cuối kỳ
    [4, 16, 2, 1]  // Ghi chú
  ];
  
  for (const [row, col, numRows, numCols] of mergeCells) {
    sheetNXT.getRange(row, col, numRows, numCols).merge();
  }
  
  // Chuẩn bị dữ liệu để ghi
  const outputData = [];
  const finalSorted = Array.from(hangHoaCoData.entries()).sort((a, b) => {
    const [keyA] = a;
    const [keyB] = b;
    return keyA.localeCompare(keyB);
  });
  
  for (const [key, hangHoa] of finalSorted) {
    // Tính tồn đầu kỳ báo cáo (gốc + phát sinh trước kỳ)
    const slTonDauKyBaoCao = hangHoa.slDauKyGoc + hangHoa.slNhapTruocKy - hangHoa.slXuatTruocKy - hangHoa.slXuatSXTruocKy;
    const gtTonDauKyBaoCao = hangHoa.gtDauKyGoc + hangHoa.gtNhapTruocKy - hangHoa.gtXuatTruocKy - hangHoa.gtXuatSXTruocKy;
    
    // Tính tồn cuối kỳ
    const slTonCuoiKy = slTonDauKyBaoCao + hangHoa.slNhapTrongKy - hangHoa.slXuatTrongKy - hangHoa.slXuatSXTrongKy;
    const gtTonCuoiKy = gtTonDauKyBaoCao + hangHoa.gtNhapTrongKy - hangHoa.gtXuatTrongKy - hangHoa.gtXuatSXTrongKy;
    
    outputData.push([
      hangHoa.maKho,
      hangHoa.maHang,
      hangHoa.tenHang,
      hangHoa.quyCache,
      hangHoa.dvt,
      slTonDauKyBaoCao,           // Tồn đầu kỳ SL
      gtTonDauKyBaoCao,           // Tồn đầu kỳ Tiền  
      hangHoa.slNhapTrongKy,      // Nhập SL
      hangHoa.gtNhapTrongKy,      // Nhập Tiền
      hangHoa.slXuatTrongKy,      // Xuất SL
      hangHoa.gtXuatTrongKy,      // Xuất Tiền
      hangHoa.slXuatSXTrongKy,    // Xuất SX SL
      hangHoa.gtXuatSXTrongKy,    // Xuất SX Tiền
      slTonCuoiKy,                // Tồn cuối kỳ SL
      gtTonCuoiKy,                // Tồn cuối kỳ Tiền
      ''                          // Ghi chú
    ]);
  }
  
  // Ghi dữ liệu vào sheet NXT từ dòng 6
  if (outputData.length > 0) {
    sheetNXT.getRange(6, 1, outputData.length, 16).setValues(outputData);
    
    // Định dạng số
    // Số lượng: 2 chữ số thập phân
    const slColumns = [6, 8, 10, 12, 14]; // Cột số lượng
    for (const col of slColumns) {
      sheetNXT.getRange(6, col, outputData.length, 1).setNumberFormat('#,##0.00');
    }
    
    // Tiền: không thập phân
    const tienColumns = [7, 9, 11, 13, 15]; // Cột tiền
    for (const col of tienColumns) {
      sheetNXT.getRange(6, col, outputData.length, 1).setNumberFormat('#,##0');
    }
    
    // Định dạng header
    const headerRange = sheetNXT.getRange(4, 1, 2, 16);
    headerRange.setBackground('#4472C4');
    headerRange.setFontColor('white');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
    headerRange.setVerticalAlignment('middle');
    
    // Tạo border cho toàn bộ bảng
    const allDataRange = sheetNXT.getRange(4, 1, outputData.length + 2, 16);
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
