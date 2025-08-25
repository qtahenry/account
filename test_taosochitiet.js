/**
 * FILE TEST: Kiểm tra hàm taosochitiet mới
 * Chạy hàm này để test chức năng mới
 */

function testTaosochitiet() {
  try {
    console.log('🧪 Bắt đầu test hàm taosochitiet...');
    
    // Test với dữ liệu mẫu
    const startDate = '2024-01-01';
    const endDate = '2024-12-31';
    const taiKhoanTest = ['111', '112']; // Test với 2 tài khoản
    
    console.log(`📅 Test với kỳ báo cáo: ${startDate} đến ${endDate}`);
    console.log(`📋 Test với tài khoản: ${taiKhoanTest.join(', ')}`);
    
    // Gọi hàm mới
    taosochitiet(startDate, endDate, taiKhoanTest);
    
    console.log('✅ Test hoàn thành!');
    
  } catch (error) {
    console.error('❌ Lỗi trong quá trình test:', error.toString());
    console.error('Stack trace:', error.stack);
  }
}

/**
 * Test đọc dữ liệu với TK_THUE
 */
function testReadDataWithThue() {
  try {
    console.log('🧪 Test đọc dữ liệu với TK_THUE...');
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const data = readDataFromPrefixedSheetsWithThue(ss, 'DL_', ['NGAY_HT', 'TK_NO', 'TK_CO', 'SO_TIEN', 'TK_THUE', 'THUE_VAT']);
    
    console.log(`📊 Đọc được ${data.length} giao dịch`);
    
    // Kiểm tra một vài giao dịch mẫu
    if (data.length > 0) {
      console.log('📋 Mẫu giao dịch đầu tiên:', data[0]);
    }
    
    // Test xử lý thuế
    const processedData = xuLyPhatSinhThueTuTK_THUE(data);
    console.log(`💰 Sau xử lý thuế: ${processedData.length} giao dịch`);
    
    console.log('✅ Test đọc dữ liệu hoàn thành!');
    
  } catch (error) {
    console.error('❌ Lỗi trong quá trình test đọc dữ liệu:', error.toString());
  }
}

/**
 * Test tạo bút toán thuế
 */
function testTaoPhatSinhThue() {
  try {
    console.log('🧪 Test tạo bút toán thuế...');
    
    // Test case 1: Thuế 1331 (phát sinh NỢ)
    const trans1 = {
      NGAY_HT: '2024-01-15',
      NGAY_CT: '2024-01-15',
      SO_CT: 'CT001',
      DIEN_GIAI: 'Mua hàng hóa',
      TK_NO: '156',
      TK_CO: '111',
      SO_TIEN: 1000000,
      TK_THUE: '1331',
      THUE_VAT: 100000
    };
    
    const phatSinh1 = taoPhatSinhThue('1331', '156', '111', 100000, trans1);
    console.log('📋 Bút toán thuế 1331:', phatSinh1);
    
    // Test case 2: Thuế 33311 (phát sinh CÓ)
    const trans2 = {
      NGAY_HT: '2024-01-16',
      NGAY_CT: '2024-01-16',
      SO_CT: 'CT002',
      DIEN_GIAI: 'Bán hàng hóa',
      TK_NO: '111',
      TK_CO: '511',
      SO_TIEN: 2000000,
      TK_THUE: '33311',
      THUE_VAT: 200000
    };
    
    const phatSinh2 = taoPhatSinhThue('33311', '111', '511', 200000, trans2);
    console.log('📋 Bút toán thuế 33311:', phatSinh2);
    
    console.log('✅ Test tạo bút toán thuế hoàn thành!');
    
  } catch (error) {
    console.error('❌ Lỗi trong quá trình test tạo bút toán thuế:', error.toString());
  }
}