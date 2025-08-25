/**
 * Test việc đọc số chứng từ và ngày chứng từ trong hàm taosochitiet
 */

function testSoChungTu() {
  console.log('🧪 TEST ĐỌC SỐ CHỨNG TỪ VÀ NGÀY CHỨNG TỪ');
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Test đọc dữ liệu với các cột mới
    console.log('\n📋 Test đọc dữ liệu với SO_CT, NGAY_CT, DIEN_GIAI');
    const allTransactionsRaw = readDataFromPrefixedSheetsWithThue(
      ss, 
      'DL_', 
      ['NGAY_HT', 'TK_NO', 'TK_CO', 'SO_TIEN', 'TK_THUE', 'THUE_VAT', 'SO_CT', 'NGAY_CT', 'DIEN_GIAI']
    );
    
    console.log(`✅ Đã đọc ${allTransactionsRaw.length} giao dịch`);
    
    // Kiểm tra 5 giao dịch đầu tiên
    console.log('\n📊 Kiểm tra 5 giao dịch đầu tiên:');
    for (let i = 0; i < Math.min(5, allTransactionsRaw.length); i++) {
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
      console.log(`  - TK_THUE: ${trans.TK_THUE || '(rỗng)'}`);
      console.log(`  - THUE_VAT: ${trans.THUE_VAT || '(rỗng)'}`);
    }
    
    // Test xử lý thuế
    console.log('\n📋 Test xử lý thuế:');
    const allTransactions = xuLyPhatSinhThueTuTK_THUE(allTransactionsRaw);
    console.log(`✅ Sau xử lý thuế: ${allTransactions.length} giao dịch`);
    
    // Kiểm tra giao dịch thuế được tạo
    const giaoDichThue = allTransactions.filter(t => 
      t.TK_NO === '1331' || t.TK_NO === '1332' || 
      t.TK_CO === '33311' || t.TK_CO === '33312'
    );
    
    console.log(`📊 Tìm thấy ${giaoDichThue.length} giao dịch thuế`);
    
    if (giaoDichThue.length > 0) {
      console.log('\n📋 Kiểm tra giao dịch thuế:');
      giaoDichThue.slice(0, 3).forEach((trans, index) => {
        console.log(`\nGiao dịch thuế ${index + 1}:`);
        console.log(`  - SO_CT: ${trans.SO_CT || '(rỗng)'}`);
        console.log(`  - NGAY_CT: ${trans.NGAY_CT || '(rỗng)'}`);
        console.log(`  - DIEN_GIAI: ${trans.DIEN_GIAI || '(rỗng)'}`);
        console.log(`  - TK_NO: ${trans.TK_NO}`);
        console.log(`  - TK_CO: ${trans.TK_CO}`);
        console.log(`  - SO_TIEN: ${trans.SO_TIEN}`);
      });
    }
    
    console.log('\n✅ Test hoàn thành!');
    
  } catch (error) {
    console.error('❌ Lỗi test:', error.toString());
  }
}

/**
 * Test tạo báo cáo với dữ liệu mẫu
 */
function testTaoBaoCaoMau() {
  console.log('🧪 TEST TẠO BÁO CÁO MẪU');
  
  try {
    // Tạo dữ liệu mẫu
    const testData = [
      {
        NGAY_HT: new Date('2024-01-15'),
        SO_CT: 'CT001',
        NGAY_CT: new Date('2024-01-15'),
        DIEN_GIAI: 'Mua hàng hóa',
        TK_NO: '156',
        TK_CO: '331',
        SO_TIEN: 1000000,
        TK_THUE: '1331',
        THUE_VAT: 100000
      },
      {
        NGAY_HT: new Date('2024-01-16'),
        SO_CT: 'CT002',
        NGAY_CT: new Date('2024-01-16'),
        DIEN_GIAI: 'Bán hàng',
        TK_NO: '131',
        TK_CO: '511',
        SO_TIEN: 2000000,
        TK_THUE: '33311',
        THUE_VAT: 200000
      }
    ];
    
    console.log('\n📋 Dữ liệu mẫu:');
    testData.forEach((trans, index) => {
      console.log(`\nGiao dịch ${index + 1}:`);
      console.log(`  - SO_CT: ${trans.SO_CT}`);
      console.log(`  - NGAY_CT: ${trans.NGAY_CT}`);
      console.log(`  - DIEN_GIAI: ${trans.DIEN_GIAI}`);
      console.log(`  - TK_NO: ${trans.TK_NO}`);
      console.log(`  - TK_CO: ${trans.TK_CO}`);
      console.log(`  - SO_TIEN: ${trans.SO_TIEN}`);
      console.log(`  - TK_THUE: ${trans.TK_THUE}`);
      console.log(`  - THUE_VAT: ${trans.THUE_VAT}`);
    });
    
    // Test xử lý thuế
    console.log('\n📋 Test xử lý thuế với dữ liệu mẫu:');
    const processedData = xuLyPhatSinhThueTuTK_THUE(testData);
    
    console.log(`✅ Sau xử lý: ${processedData.length} giao dịch`);
    
    processedData.forEach((trans, index) => {
      console.log(`\nGiao dịch ${index + 1}:`);
      console.log(`  - SO_CT: ${trans.SO_CT || '(rỗng)'}`);
      console.log(`  - NGAY_CT: ${trans.NGAY_CT || '(rỗng)'}`);
      console.log(`  - DIEN_GIAI: ${trans.DIEN_GIAI || '(rỗng)'}`);
      console.log(`  - TK_NO: ${trans.TK_NO}`);
      console.log(`  - TK_CO: ${trans.TK_CO}`);
      console.log(`  - SO_TIEN: ${trans.SO_TIEN}`);
    });
    
    console.log('\n✅ Test tạo báo cáo mẫu hoàn thành!');
    
  } catch (error) {
    console.error('❌ Lỗi test:', error.toString());
  }
}