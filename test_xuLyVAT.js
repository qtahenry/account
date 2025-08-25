/**
 * Test hàm xuLyVAT mới sử dụng TK_THUE
 */

function testXuLyVAT() {
  console.log('🧪 TEST HÀM XULYVAT MỚI');
  
  // Test case 1: Thuế đầu vào (1331)
  console.log('\n📋 Test 1: Thuế đầu vào 1331');
  const test1 = xuLyVAT('156', '331', 1000000, '1331');
  console.log('Input: tkNo=156, tkCo=331, tienVAT=1000000, tkThue=1331');
  console.log('Expected: Phát sinh NỢ 1331, CÓ 331');
  console.log('Result:', test1);
  
  // Test case 2: Thuế đầu vào (1332)
  console.log('\n📋 Test 2: Thuế đầu vào 1332');
  const test2 = xuLyVAT('211', '331', 500000, '1332');
  console.log('Input: tkNo=211, tkCo=331, tienVAT=500000, tkThue=1332');
  console.log('Expected: Phát sinh NỢ 1332, CÓ 331');
  console.log('Result:', test2);
  
  // Test case 3: Thuế đầu ra (33311)
  console.log('\n📋 Test 3: Thuế đầu ra 33311');
  const test3 = xuLyVAT('131', '511', 800000, '33311');
  console.log('Input: tkNo=131, tkCo=511, tienVAT=800000, tkThue=33311');
  console.log('Expected: Phát sinh NỢ 131, CÓ 33311');
  console.log('Result:', test3);
  
  // Test case 4: Thuế đầu ra (33312)
  console.log('\n📋 Test 4: Thuế đầu ra 33312');
  const test4 = xuLyVAT('131', '511', 300000, '33312');
  console.log('Input: tkNo=131, tkCo=511, tienVAT=300000, tkThue=33312');
  console.log('Expected: Phát sinh NỢ 131, CÓ 33312');
  console.log('Result:', test4);
  
  // Test case 5: Không có thuế
  console.log('\n📋 Test 5: Không có thuế');
  const test5 = xuLyVAT('156', '331', 0, '1331');
  console.log('Input: tkNo=156, tkCo=331, tienVAT=0, tkThue=1331');
  console.log('Expected: [] (không có giao dịch thuế)');
  console.log('Result:', test5);
  
  // Test case 6: Không có TK_THUE
  console.log('\n📋 Test 6: Không có TK_THUE');
  const test6 = xuLyVAT('156', '331', 1000000, '');
  console.log('Input: tkNo=156, tkCo=331, tienVAT=1000000, tkThue=""');
  console.log('Expected: [] (không có giao dịch thuế)');
  console.log('Result:', test6);
  
  // Test case 7: TK_THUE không hợp lệ
  console.log('\n📋 Test 7: TK_THUE không hợp lệ');
  const test7 = xuLyVAT('156', '331', 1000000, '9999');
  console.log('Input: tkNo=156, tkCo=331, tienVAT=1000000, tkThue=9999');
  console.log('Expected: [] (không có giao dịch thuế)');
  console.log('Result:', test7);
  
  console.log('\n✅ Test hoàn thành!');
}

/**
 * Test so sánh logic cũ và mới
 */
function testSoSanhLogicCuVaMoi() {
  console.log('🔄 SO SÁNH LOGIC CŨ VÀ MỚI');
  
  // Logic cũ (dựa trên LOAI_CT và ký tự đầu tài khoản)
  function xuLyVATCu(tkNo, tkCo, tienVAT, phanLoai) {
    if (!tienVAT || tienVAT <= 0) return [];
    
    const giaoDichVAT = [];
    const tkNoStr = tkNo?.toString().trim() || '';
    const tkCoStr = tkCo?.toString().trim() || '';
    const laTKHQ = (phanLoai?.toString().trim().toUpperCase() === 'TKHQ');
    
    if (tkNoStr && ['1', '2', '6', '8'].includes(tkNoStr.charAt(0))) {
      const tkVATDauVao = tkNoStr.startsWith('211') ? '1332' : '1331';
      giaoDichVAT.push({
        tkNo: tkVATDauVao,
        tkCo: tkCo,
        soTien: tienVAT,
        loai: 'VAT_DAU_VAO'
      });
    }
    
    if (tkCoStr && ['5', '7'].includes(tkCoStr.charAt(0))) {
      const tkVATDauRa = laTKHQ ? '33312' : '33311';
      giaoDichVAT.push({
        tkNo: tkNo,
        tkCo: tkVATDauRa,
        soTien: tienVAT,
        loai: 'VAT_DAU_RA'
      });
    }
    
    return giaoDichVAT;
  }
  
  console.log('\n📊 So sánh kết quả:');
  
  // Test case 1: Tài khoản 156 (đầu 1) - Logic cũ sẽ tạo 1331
  console.log('\n📋 Test case 1: TK 156 (đầu 1)');
  const cu1 = xuLyVATCu('156', '331', 1000000, '');
  const moi1 = xuLyVAT('156', '331', 1000000, '1331');
  console.log('Logic cũ:', cu1);
  console.log('Logic mới:', moi1);
  console.log('Kết quả giống nhau:', JSON.stringify(cu1) === JSON.stringify(moi1));
  
  // Test case 2: Tài khoản 211 (đầu 2) - Logic cũ sẽ tạo 1332
  console.log('\n📋 Test case 2: TK 211 (đầu 2)');
  const cu2 = xuLyVATCu('211', '331', 500000, '');
  const moi2 = xuLyVAT('211', '331', 500000, '1332');
  console.log('Logic cũ:', cu2);
  console.log('Logic mới:', moi2);
  console.log('Kết quả giống nhau:', JSON.stringify(cu2) === JSON.stringify(moi2));
  
  // Test case 3: Tài khoản 511 (đầu 5) - Logic cũ sẽ tạo 33311
  console.log('\n📋 Test case 3: TK 511 (đầu 5)');
  const cu3 = xuLyVATCu('131', '511', 800000, '');
  const moi3 = xuLyVAT('131', '511', 800000, '33311');
  console.log('Logic cũ:', cu3);
  console.log('Logic mới:', moi3);
  console.log('Kết quả giống nhau:', JSON.stringify(cu3) === JSON.stringify(moi3));
  
  // Test case 4: Tài khoản 511 với LOAI_CT=TKHQ - Logic cũ sẽ tạo 33312
  console.log('\n📋 Test case 4: TK 511 với LOAI_CT=TKHQ');
  const cu4 = xuLyVATCu('131', '511', 300000, 'TKHQ');
  const moi4 = xuLyVAT('131', '511', 300000, '33312');
  console.log('Logic cũ:', cu4);
  console.log('Logic mới:', moi4);
  console.log('Kết quả giống nhau:', JSON.stringify(cu4) === JSON.stringify(moi4));
  
  console.log('\n✅ So sánh hoàn thành!');
}