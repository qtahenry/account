/**
 * Debug việc đọc số chứng từ và ngày chứng từ
 */

function debugSoChungTu() {
  console.log('🔍 DEBUG SỐ CHỨNG TỪ VÀ NGÀY CHỨNG TỪ');
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Bước 1: Kiểm tra các sheet DL_
    const allSheets = ss.getSheets();
    const dataSheets = allSheets.filter(sheet => sheet.getName().startsWith('DL_'));
    
    console.log(`📋 Tìm thấy ${dataSheets.length} sheet DL_:`);
    dataSheets.forEach(sheet => {
      console.log(`  - ${sheet.getName()}`);
    });
    
    if (dataSheets.length === 0) {
      console.log('❌ Không tìm thấy sheet DL_ nào');
      return;
    }
    
    // Bước 2: Kiểm tra header của sheet đầu tiên
    const firstSheet = dataSheets[0];
    console.log(`\n📋 Kiểm tra header của sheet "${firstSheet.getName()}":`);
    
    const data = firstSheet.getDataRange().getValues();
    if (data.length === 0) {
      console.log('❌ Sheet không có dữ liệu');
      return;
    }
    
    const headerRow = data[0];
    console.log('Header gốc:', headerRow);
    
    const headerRowUpper = headerRow.map(h => h.toString().trim().toUpperCase());
    console.log('Header chuyển đổi:', headerRowUpper);
    
    // Bước 3: Kiểm tra các cột cần thiết
    const requiredColumns = ['NGAY_HT', 'TK_NO', 'TK_CO', 'SO_TIEN', 'TK_THUE', 'THUE_VAT', 'SO_CT', 'NGAY_CT', 'DIEN_GIAI'];
    
    console.log('\n📋 Kiểm tra các cột cần thiết:');
    requiredColumns.forEach(col => {
      const index = headerRowUpper.indexOf(col);
      console.log(`  - ${col}: ${index !== -1 ? `Có (vị trí ${index})` : 'Không có'}`);
    });
    
    // Bước 4: Kiểm tra dữ liệu mẫu
    if (data.length > 1) {
      console.log('\n📋 Kiểm tra dữ liệu mẫu (dòng 2):');
      const sampleRow = data[1];
      console.log('Dữ liệu gốc:', sampleRow);
      
      // Tạo object theo header
      const sampleData = {};
      headerRowUpper.forEach((header, index) => {
        sampleData[header] = sampleRow[index];
      });
      
      console.log('Dữ liệu đã map:', sampleData);
      
      // Kiểm tra các cột quan trọng
      console.log('\n📋 Kiểm tra các cột quan trọng:');
      console.log(`  - NGAY_HT: ${sampleData.NGAY_HT} (${typeof sampleData.NGAY_HT})`);
      console.log(`  - SO_CT: ${sampleData.SO_CT} (${typeof sampleData.SO_CT})`);
      console.log(`  - NGAY_CT: ${sampleData.NGAY_CT} (${typeof sampleData.NGAY_CT})`);
      console.log(`  - DIEN_GIAI: ${sampleData.DIEN_GIAI} (${typeof sampleData.DIEN_GIAI})`);
      console.log(`  - TK_NO: ${sampleData.TK_NO} (${typeof sampleData.TK_NO})`);
      console.log(`  - TK_CO: ${sampleData.TK_CO} (${typeof sampleData.TK_CO})`);
      console.log(`  - SO_TIEN: ${sampleData.SO_TIEN} (${typeof sampleData.SO_TIEN})`);
    }
    
    // Bước 5: Test đọc dữ liệu với hàm hiện tại
    console.log('\n📋 Test đọc dữ liệu với hàm hiện tại:');
    const allTransactionsRaw = readDataFromPrefixedSheetsWithThue(
      ss, 
      'DL_', 
      ['NGAY_HT', 'TK_NO', 'TK_CO', 'SO_TIEN', 'TK_THUE', 'THUE_VAT', 'SO_CT', 'NGAY_CT', 'DIEN_GIAI']
    );
    
    console.log(`✅ Đã đọc ${allTransactionsRaw.length} giao dịch`);
    
    if (allTransactionsRaw.length > 0) {
      console.log('\n📋 Kiểm tra 3 giao dịch đầu tiên:');
      for (let i = 0; i < Math.min(3, allTransactionsRaw.length); i++) {
        const trans = allTransactionsRaw[i];
        console.log(`\nGiao dịch ${i + 1}:`);
        console.log(`  - Sheet: ${trans.sheet}, Dòng: ${trans.row}`);
        console.log(`  - NGAY_HT: ${trans.NGAY_HT}`);
        console.log(`  - SO_CT: ${trans.SO_CT || '(rỗng)'}`);
        console.log(`  - NGAY_CT: ${trans.NGAY_CT || '(rỗng)'}`);
        console.log(`  - DIEN_GIAI: ${trans.DIEN_GIAI || '(rỗng)'}`);
        console.log(`  - TK_NO: ${trans.TK_NO}`);
        console.log(`  - TK_CO: ${trans.TK_CO}`);
        console.log(`  - SO_TIEN: ${trans.SO_TIEN}`);
      }
    }
    
    console.log('\n✅ Debug hoàn thành!');
    
  } catch (error) {
    console.error('❌ Lỗi debug:', error.toString());
  }
}

/**
 * Test tạo báo cáo với dữ liệu debug
 */
function testTaoBaoCaoDebug() {
  console.log('🧪 TEST TẠO BÁO CÁO VỚI DỮ LIỆU DEBUG');
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Đọc dữ liệu
    const allTransactionsRaw = readDataFromPrefixedSheetsWithThue(
      ss, 
      'DL_', 
      ['NGAY_HT', 'TK_NO', 'TK_CO', 'SO_TIEN', 'TK_THUE', 'THUE_VAT', 'SO_CT', 'NGAY_CT', 'DIEN_GIAI']
    );
    
    console.log(`📊 Đã đọc ${allTransactionsRaw.length} giao dịch`);
    
    if (allTransactionsRaw.length === 0) {
      console.log('❌ Không có dữ liệu để test');
      return;
    }
    
    // Xử lý thuế
    const allTransactions = xuLyPhatSinhThueTuTK_THUE(allTransactionsRaw);
    console.log(`📊 Sau xử lý thuế: ${allTransactions.length} giao dịch`);
    
    // Tạo báo cáo mẫu
    const outputData = [];
    const headers = ['Ngày Ghi Sổ', 'Số Chứng Từ', 'Ngày Chứng Từ', 'Diễn Giải', 'TK Đối Ứng', 'Phát Sinh Nợ', 'Phát Sinh Có', 'Dư Nợ Cuối Kỳ', 'Dư Có Cuối Kỳ'];
    
    outputData.push(['SỔ CHI TIẾT TÀI KHOẢN - DEBUG', '', '', '', '', '', '', '', '']);
    outputData.push(headers);
    
    // Thêm 5 giao dịch đầu tiên
    for (let i = 0; i < Math.min(5, allTransactions.length); i++) {
      const trans = allTransactions[i];
      
      outputData.push([ 
        new Date(trans.NGAY_HT), 
        trans.SO_CT || '', 
        trans.NGAY_CT ? new Date(trans.NGAY_CT) : '', 
        trans.DIEN_GIAI || '', 
        trans.TK_NO === '156' ? trans.TK_CO : trans.TK_NO, 
        trans.TK_NO === '156' ? trans.SO_TIEN : 0, 
        trans.TK_CO === '156' ? trans.SO_TIEN : 0, 
        0, 
        0 
      ]);
    }
    
    // Ghi ra sheet debug
    const sheetDebug = ss.getSheetByName('DEBUG_SOCHUNGTU');
    if (!sheetDebug) {
      ss.insertSheet('DEBUG_SOCHUNGTU');
    }
    
    const finalSheet = ss.getSheetByName('DEBUG_SOCHUNGTU');
    finalSheet.clear();
    
    if (outputData.length > 0) {
      finalSheet.getRange(1, 1, outputData.length, 9).setValues(outputData);
    }
    
    console.log('✅ Đã tạo báo cáo debug trong sheet DEBUG_SOCHUNGTU');
    
  } catch (error) {
    console.error('❌ Lỗi test:', error.toString());
  }
}