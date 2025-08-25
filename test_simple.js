/**
 * Test đơn giản để kiểm tra dữ liệu
 */

function testSimple() {
  console.log('🧪 TEST ĐƠN GIẢN');
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Lấy sheet đầu tiên có prefix DL_
    const allSheets = ss.getSheets();
    const dataSheets = allSheets.filter(sheet => sheet.getName().startsWith('DL_'));
    
    if (dataSheets.length === 0) {
      console.log('❌ Không tìm thấy sheet DL_ nào');
      return;
    }
    
    const sheet = dataSheets[0];
    console.log(`📋 Kiểm tra sheet: ${sheet.getName()}`);
    
    // Đọc dữ liệu
    const data = sheet.getDataRange().getValues();
    console.log(`📊 Sheet có ${data.length} dòng dữ liệu`);
    
    if (data.length === 0) {
      console.log('❌ Sheet không có dữ liệu');
      return;
    }
    
    // Kiểm tra header
    const headerRow = data[0];
    console.log('📋 Header gốc:', headerRow);
    
    const headerRowUpper = headerRow.map(h => h.toString().trim().toUpperCase());
    console.log('📋 Header chuyển đổi:', headerRowUpper);
    
    // Kiểm tra dữ liệu mẫu
    if (data.length > 1) {
      const sampleRow = data[1];
      console.log('📋 Dữ liệu mẫu (dòng 2):', sampleRow);
      
      // Tạo object theo header
      const sampleData = {};
      headerRowUpper.forEach((header, index) => {
        sampleData[header] = sampleRow[index];
      });
      
      console.log('📋 Dữ liệu đã map:', sampleData);
      
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
    
    console.log('\n✅ Test đơn giản hoàn thành!');
    
  } catch (error) {
    console.error('❌ Lỗi test:', error.toString());
  }
}

/**
 * Test tạo báo cáo đơn giản
 */
function testTaoBaoCaoSimple() {
  console.log('🧪 TEST TẠO BÁO CÁO ĐƠN GIẢN');
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Đọc dữ liệu với hàm hiện tại
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
    
    // Tạo báo cáo đơn giản
    const outputData = [];
    const headers = ['Ngày Ghi Sổ', 'Số Chứng Từ', 'Ngày Chứng Từ', 'Diễn Giải', 'TK Đối Ứng', 'Phát Sinh Nợ', 'Phát Sinh Có', 'Dư Nợ Cuối Kỳ', 'Dư Có Cuối Kỳ'];
    
    outputData.push(['SỔ CHI TIẾT TÀI KHOẢN - TEST', '', '', '', '', '', '', '', '']);
    outputData.push(headers);
    
    // Thêm 10 giao dịch đầu tiên
    for (let i = 0; i < Math.min(10, allTransactions.length); i++) {
      const trans = allTransactions[i];
      
      console.log(`\n📋 Giao dịch ${i + 1}:`);
      console.log(`  - NGAY_HT: ${trans.NGAY_HT}`);
      console.log(`  - SO_CT: ${trans.SO_CT || '(rỗng)'}`);
      console.log(`  - NGAY_CT: ${trans.NGAY_CT || '(rỗng)'}`);
      console.log(`  - DIEN_GIAI: ${trans.DIEN_GIAI || '(rỗng)'}`);
      console.log(`  - TK_NO: ${trans.TK_NO}`);
      console.log(`  - TK_CO: ${trans.TK_CO}`);
      console.log(`  - SO_TIEN: ${trans.SO_TIEN}`);
      
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
    
    // Ghi ra sheet test
    const sheetTest = ss.getSheetByName('TEST_SIMPLE');
    if (!sheetTest) {
      ss.insertSheet('TEST_SIMPLE');
    }
    
    const finalSheet = ss.getSheetByName('TEST_SIMPLE');
    finalSheet.clear();
    
    if (outputData.length > 0) {
      finalSheet.getRange(1, 1, outputData.length, 9).setValues(outputData);
    }
    
    console.log('✅ Đã tạo báo cáo test trong sheet TEST_SIMPLE');
    
  } catch (error) {
    console.error('❌ Lỗi test:', error.toString());
  }
}