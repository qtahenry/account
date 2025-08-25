/**
 * Test đơn giản cho hàm taosochitiet mới
 */

function testTaosochitietSimple() {
  console.log('🧪 TEST TAOSOCHITIET ĐƠN GIẢN');
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Test với dữ liệu mẫu
    const startDate = '2024-01-01';
    const endDate = '2024-12-31';
    const taiKhoanCanXem = ['156']; // Tài khoản hàng tồn kho
    
    console.log(`📅 Test với tài khoản: ${taiKhoanCanXem.join(', ')}`);
    console.log(`📅 Từ ngày: ${startDate} đến ${endDate}`);
    
    // Gọi hàm taosochitiet
    taosochitiet(startDate, endDate, taiKhoanCanXem);
    
    console.log('✅ Test hoàn thành!');
    
  } catch (error) {
    console.error('❌ Lỗi test:', error.toString());
  }
}

/**
 * Test với nhiều tài khoản
 */
function testTaosochitietMultiAccount() {
  console.log('🧪 TEST TAOSOCHITIET NHIỀU TÀI KHOẢN');
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Test với nhiều tài khoản
    const startDate = '2024-01-01';
    const endDate = '2024-12-31';
    const taiKhoanCanXem = ['156', '131', '331']; // Hàng tồn kho, Phải thu, Phải trả
    
    console.log(`📅 Test với tài khoản: ${taiKhoanCanXem.join(', ')}`);
    console.log(`📅 Từ ngày: ${startDate} đến ${endDate}`);
    
    // Gọi hàm taosochitiet
    taosochitiet(startDate, endDate, taiKhoanCanXem);
    
    console.log('✅ Test hoàn thành!');
    
  } catch (error) {
    console.error('❌ Lỗi test:', error.toString());
  }
}

/**
 * Test với dữ liệu thực tế
 */
function testTaosochitietRealData() {
  console.log('🧪 TEST TAOSOCHITIET DỮ LIỆU THỰC TẾ');
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Kiểm tra sheet DMTK
    const sheetDMTK = ss.getSheetByName('DMTK');
    if (!sheetDMTK) {
      console.log('❌ Không tìm thấy sheet DMTK');
      return;
    }
    
    // Lấy một số tài khoản từ DMTK
    const dataDMTK = sheetDMTK.getDataRange().getValues();
    const taiKhoanList = [];
    
    dataDMTK.slice(1).forEach(row => {
      const maTK = row[0]?.toString().trim();
      if (maTK && maTK.length <= 3) { // Chỉ lấy tài khoản cấp 1
        taiKhoanList.push(maTK);
      }
    });
    
    if (taiKhoanList.length === 0) {
      console.log('❌ Không tìm thấy tài khoản nào trong DMTK');
      return;
    }
    
    // Lấy 3 tài khoản đầu tiên
    const taiKhoanCanXem = taiKhoanList.slice(0, 3);
    
    console.log(`📅 Test với tài khoản: ${taiKhoanCanXem.join(', ')}`);
    
    // Test với tháng hiện tại
    const now = new Date();
    const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    console.log(`📅 Từ ngày: ${startDate} đến ${endDate}`);
    
    // Gọi hàm taosochitiet
    taosochitiet(startDate, endDate, taiKhoanCanXem);
    
    console.log('✅ Test hoàn thành!');
    
  } catch (error) {
    console.error('❌ Lỗi test:', error.toString());
  }
}

/**
 * Test debug dữ liệu
 */
function testDebugData() {
  console.log('🔍 DEBUG DỮ LIỆU');
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Kiểm tra sheet DMTK
    const sheetDMTK = ss.getSheetByName('DMTK');
    if (sheetDMTK) {
      const dataDMTK = sheetDMTK.getDataRange().getValues();
      console.log(`📊 DMTK có ${dataDMTK.length} dòng dữ liệu`);
      
      if (dataDMTK.length > 1) {
        console.log('📋 Header DMTK:', dataDMTK[0]);
        console.log('📋 Dữ liệu mẫu DMTK:', dataDMTK[1]);
      }
    }
    
    // Kiểm tra sheet DL_
    const allSheets = ss.getSheets();
    const dataSheets = allSheets.filter(sheet => sheet.getName().startsWith('DL_'));
    
    console.log(`📊 Tìm thấy ${dataSheets.length} sheet DL_:`);
    dataSheets.forEach(sheet => {
      const data = sheet.getDataRange().getValues();
      console.log(`  - ${sheet.getName()}: ${data.length} dòng`);
      
      if (data.length > 1) {
        console.log(`    Header: ${data[0].slice(0, 5).join(', ')}...`);
        console.log(`    Dữ liệu mẫu: ${data[1].slice(0, 5).join(', ')}...`);
      }
    });
    
    console.log('✅ Debug hoàn thành!');
    
  } catch (error) {
    console.error('❌ Lỗi debug:', error.toString());
  }
}