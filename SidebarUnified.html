<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <style>
    body {
      font-family: 'Google Sans', Arial, sans-serif;
      margin: 0;
      padding: 15px;
      background-color: #f8f9fa;
    }
    
    .tab-container {
      display: flex;
      margin-bottom: 15px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    
    .tab {
      flex: 1;
      padding: 12px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      background: transparent;
      font-size: 13px;
      font-weight: 500;
    }
    
    .tab.active {
      background-color: #4285f4;
      color: white;
    }
    
    .tab:hover:not(.active) {
      background-color: #f1f3f4;
    }
    
    .tab-content {
      display: none;
    }
    
    .tab-content.active {
      display: block;
    }
    
    .section {
      margin-bottom: 12px;
    }
    
    .section-title {
      font-size: 13px;
      font-weight: 500;
      color: #5f6368;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .date-inputs {
      display: flex;
      gap: 10px;
    }
    
    .date-inputs div {
      flex: 1;
    }
    
    input[type="date"], input[type="text"] {
      width: 100%;
      padding: 8px;
      border: 1px solid #dadce0;
      border-radius: 4px;
      font-size: 13px;
      box-sizing: border-box;
    }
    
    .search-box {
      position: relative;
      margin-bottom: 15px;
    }
    
    .search-input {
      width: 100%;
      padding: 10px 40px 10px 15px;
      border: 2px solid #dadce0;
      border-radius: 25px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }
    
    .search-input:focus {
      border-color: #4285f4;
    }
    
    .search-icon {
      position: absolute;
      right: 15px;
      top: 50%;
      transform: translateY(-50%);
      color: #5f6368;
    }
    
    .clear-search {
      position: absolute;
      right: 40px;
      top: 50%;
      transform: translateY(-50%);
      cursor: pointer;
      color: #5f6368;
      display: none;
    }
    
    .select-all-controls {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
    }
    
    .btn-small {
      padding: 6px 12px;
      border: 1px solid #dadce0;
      border-radius: 4px;
      background: white;
      color: #5f6368;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s;
    }
    
    .btn-small:hover {
      background-color: #f1f3f4;
      border-color: #4285f4;
    }
    
    .account-list {
      max-height: 245px;
      overflow-y: auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      border: 1px solid #dadce0;
    }
    
    .account-item {
      display: flex;
      align-items: flex-start;
      padding: 10px 12px;
      border-bottom: 1px solid #f0f0f0;
      transition: background-color 0.15s;
    }
    
    .account-item:last-child {
      border-bottom: none;
    }
    
    .account-item:hover {
      background-color: #f1f3f4;
    }
    
    input[type="checkbox"] {
      margin-right: 12px;
      margin-top: 4px;
      transform: scale(1.1);
      accent-color: #4285f4;
    }
    
    .account-info {
      flex: 1;
    }
    
    .account-code {
      font-weight: 500;
      color: #202124;
      margin-bottom: 2px;
    }
    
    .account-name {
      font-size: 11px;
      color: #5f6368;
    }
    
    .status {
      text-align: center;
      font-size: 11px;
      color: #5f6368;
      margin: 15px 0;
      padding: 10px;
      background: white;
      border-radius: 6px;
      border: 1px solid #e8eaed;
    }
    
    .actions {
      margin-top: 15px;
      display: flex;
      gap: 10px;
    }
    
    .btn {
      flex: 1;
      padding: 12px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 10px;
      font-weight: 500;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 8px;
      min-width: 0;
    }
    
    .btn-primary {
      background-color: #4285f4;
      color: white;
    }
    
    .btn-primary:hover:not(:disabled) {
      background-color: #3367d6;
    }
    
    .btn-secondary {
      background-color: #34a853;
      color: white;
    }
    
    .btn-secondary:hover:not(:disabled) {
      background-color: #2d8e47;
    }
    
    .btn:disabled {
      background-color: #e0e0e0;
      cursor: not-allowed;
    }
    
    .skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
    }
    
    @keyframes loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    
    .skeleton-item {
      height: 60px;
      margin-bottom: 5px;
      border-radius: 6px;
    }
    
    .info-box {
      background: #e8f0fe;
      border: 1px solid #4285f4;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 15px;
      font-size: 12px;
      color: #1a73e8;
    }

    /* CSS cho tab hàng hóa */
    .hanghoa-list {
      max-height: 300px;
      overflow-y: auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      border: 1px solid #dadce0;
    }

    .hanghoa-item {
      display: flex;
      align-items: flex-start;
      padding: 10px 12px;
      border-bottom: 1px solid #f0f0f0;
      transition: background-color 0.15s;
    }

    .hanghoa-item:last-child {
      border-bottom: none;
    }

    .hanghoa-item:hover {
      background-color: #e6f4ea;
    }

    .hanghoa-item input[type="checkbox"] {
      margin-right: 12px;
      margin-top: 4px;
      transform: scale(1.1);
      accent-color: #34a853;
    }

    .hanghoa-info {
      flex: 1;
    }

    .hanghoa-name {
      font-weight: 500;
      color: #202124;
      margin-bottom: 2px;
    }

    .hanghoa-code {
      font-size: 11px;
      color: #5f6368;
      margin-bottom: 2px;
    }

    .hanghoa-code .ma-kho {
      background: #e8f0fe;
      color: #1a73e8;
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 10px;
      margin-right: 5px;
    }

    .hanghoa-details {
      font-size: 10px;
      color: #80868b;
    }

    /* CSS cho bộ lọc đơn giản */
    .filter-simple {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 15px;
    }

    .filter-row {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      gap: 10px;
    }

    .filter-row:last-child {
      margin-bottom: 0;
    }

    .filter-checkbox {
      display: flex;
      align-items: center;
      font-size: 12px;
      font-weight: 500;
      color: #5f6368;
      cursor: pointer;
      min-width: 10px;
    }

    .filter-checkbox input[type="checkbox"] {
      margin-right: 8px;
      transform: scale(1.1);
      accent-color: #4285f4;
    }

    .filter-row select {
      font-size: 12px;
      background: white;
      border: 1px solid #dadce0;
      border-radius: 4px;
      padding: 6px 8px;
      min-width: 150px;
      flex: 1;
    }

    .filter-row select:disabled {
      background: #f1f3f4;
      color: #80868b;
      cursor: not-allowed;
    }

    .filter-actions {
      margin-top: 10px;
      text-align: center;
    }

    /* CSS cho toggle switch nhỏ gọn */
    .mode-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 15px;
      gap: 10px;
    }

    .mode-label {
      font-size: 12px;
      font-weight: 500;
      color: #5f6368;
    }

    .toggle-switch {
      position: relative;
      width: 50px;
      height: 24px;
      background: #dadce0;
      border-radius: 12px;
      cursor: pointer;
      transition: background 0.3s;
    }

    .toggle-switch.active {
      background: #4285f4;
    }

    .toggle-switch::after {
      content: '';
      position: absolute;
      top: 2px;
      left: 2px;
      width: 20px;
      height: 20px;
      background: white;
      border-radius: 50%;
      transition: transform 0.3s;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    .toggle-switch.active::after {
      transform: translateX(26px);
    }

    /* CSS cho chế độ ghi dữ liệu */
    .write-mode .account-item {
      cursor: pointer;
    }

    .write-mode .account-item:hover {
      background-color: #e6f4ea;
    }

    .write-mode .account-item input[type="checkbox"] {
      accent-color: #34a853;
    }
  </style>
</head>
<body>


  <div class="tab-container">
    <button class="tab active" onclick="switchTab('main')">📊 Báo Cáo Kế Toán</button>
    <button class="tab" onclick="switchTab('hanghoa')">📦 Báo Cáo Kho</button>
  </div>

  <!-- TAB BÁO CÁO KẾ TOÁN -->
  <div id="main" class="tab-content active">
    <!-- Toggle switch cho 2 chế độ -->
    <div class="mode-toggle">
      <span class="mode-label">📊 Báo Cáo</span>
      <div class="toggle-switch" onclick="toggleMode()" id="modeToggle"></div>
      <span class="mode-label">✏️ Ghi định khoản</span>
    </div>

    <!-- CHẾ ĐỘ BÁO CÁO -->
    <div id="reportMode" class="mode-content">
      <div class="section">
        <div class="search-box">
          <input type="text" id="searchInput" class="search-input" placeholder="🔍 Tìm theo mã hoặc tên tài khoản..." oninput="filterAccounts()">
          <span class="search-icon">🔍</span>
          <span class="clear-search" onclick="clearSearch()" title="Xóa tìm kiếm">✕</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">📋 Danh Sách Tài Khoản</div>
        <div class="select-all-controls">
          <button class="btn-small" onclick="selectAllAccounts()">✅ Chọn Tất Cả</button>
          <button class="btn-small" onclick="deselectAllAccounts()">❌ Bỏ Chọn Tất Cả</button>
        </div>
        <div class="account-list" id="accountList">
          <div id="loading" style="padding: 20px; text-align: center; color: #5f6368;">Đang tải danh sách...</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">📅 Kỳ Báo Cáo</div>
        <div class="date-inputs">
          <div>
            <label for="startDate">Từ ngày</label>
            <input type="date" id="startDate">
          </div>
          <div>
            <label for="endDate">Đến ngày</label>
            <input type="date" id="endDate">
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">📊 Loại Báo Cáo</div>
        <div class="actions">
          <button class="btn btn-primary" onclick="createCDPS()">📊 Cân Đối Phát Sinh</button>
          <button class="btn btn-secondary" onclick="createSoChiTiet()">📖 Sổ Chi Tiết</button>
        </div>
      </div>

      <div class="status" id="status">Đã chọn: 0 tài khoản</div>
    </div>

    <!-- CHẾ ĐỘ GHI DỮ LIỆU -->
    <div id="writeMode" class="mode-content" style="display: none;">
      <div class="info-box">
        💡 <strong>Hướng dẫn:</strong> Chọn tài khoản từ danh sách bên dưới để ghi vào ô đang được chọn trong sheet
      </div>

      <div class="section">
        <div class="search-box">
          <input type="text" id="writeSearchInput" class="search-input" placeholder="🔍 Tìm nhanh tài khoản..." oninput="filterWriteAccounts()">
          <span class="search-icon">🔍</span>
          <span class="clear-search" onclick="clearWriteSearch()" title="Xóa tìm kiếm">✕</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">💼 Tất Cả Tài Khoản</div>
        <div class="select-all-controls">
          <button class="btn-small" onclick="selectAllWriteAccounts()">✅ Chọn Tất Cả</button>
          <button class="btn-small" onclick="deselectAllWriteAccounts()">❌ Bỏ Chọn Tất Cả</button>
        </div>
        <div class="account-list write-mode" id="writeAccountList">
          <div id="loadingWrite" style="padding: 20px; text-align: center; color: #5f6368;">Đang tải danh sách...</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">🎯 Thao Tác</div>
        <div class="actions">
          <button class="btn btn-primary" onclick="writeSelectedAccounts()">✅ Ghi dữ liệu</button>
        </div>
      </div>

      <div class="status" id="writeStatus" style="display:none;">Đã chọn: 0 tài khoản</div>
    </div>
  </div>



  <!-- TAB BÁO CÁO KHO -->
  <div id="hanghoa" class="tab-content">

    <div class="section">
      <div class="search-box">
        <input type="text" id="hanghoaSearchInput" class="search-input" placeholder="🔍 Tìm theo mã kho, mã hàng, tên hàng..." oninput="filterHangHoa();">
        <span class="clear-search" id="clearHangHoaSearch" onclick="clearHangHoaSearch()" title="Xóa tìm kiếm">✕</span>
      </div>     
    </div>

    <div class="section">
      <div class="section-title">📦 Danh Sách Hàng Hóa</div>
      <div class="select-all-controls">
        <button class="btn-small" onclick="selectAllHangHoa()">✅ Chọn Tất Cả</button>
        <button class="btn-small" onclick="deselectAllHangHoa()">❌ Bỏ Chọn Tất Cả</button>
      </div>
      <div class="hanghoa-list" id="hanghoaList">
        <div id="loadingHangHoa" style="padding: 20px; text-align: center; color: #5f6368;">Đang tải danh sách hàng hóa...</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">📅 Kỳ Báo Cáo</div>
      <div class="date-inputs">
        <div>
          <label for="hanghoaStartDate">Từ ngày</label>
          <input type="date" id="hanghoaStartDate">
        </div>
        <div>
          <label for="hanghoaEndDate">Đến ngày</label>
          <input type="date" id="hanghoaEndDate">
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">🎯 Ghi Dữ Liệu</div>
       <div class="actions">
        <button class="btn btn-primary" id="applyHangHoaBtn" onclick="applyHangHoaSelection()">✅ Ghi dữ liệu vào sheet</button>
      </div>
    </div>

    <div class="section">
      <div class="section-title">📊 Báo Cáo Nhập Xuất Tồn</div>
      <div class="actions" style="flex-direction: column;">
        <button class="btn btn-secondary" onclick="createNhapXuatTon('ALL')">📊 NXT (Số lượng & Giá trị)</button>
        <button class="btn btn-secondary" style="background-color: #fbbc05;" onclick="createNhapXuatTon('SL')">#️⃣ NXT (Chỉ Số Lượng)</button>
        <button class="btn btn-secondary" style="background-color: #ea4335;" onclick="createNhapXuatTon('GT')">💲 NXT (Chỉ Giá Trị)</button>
      </div>
    </div>


    <div class="status" id="hanghoaStatus" style="display:none;">Đã chọn: 0 hàng hóa</div>
  </div>

  <script>
    let allAccounts = [];
    let selectedAccounts = [];
    let currentTab = 'main';
    let currentMode = 'report'; // 'report' hoặc 'write'
    
    let allHangHoa = [];
    let selectedHangHoaIds = new Set();
    
    let selectedWriteAccounts = [];

    function switchTab(tabName) {
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.getElementById(tabName).classList.add('active');
      event.target.classList.add('active');
      currentTab = tabName;
      if (tabName === 'main') updateStatus();
    }

    function toggleMode() {
      const toggleSwitch = document.getElementById('modeToggle');
      const reportMode = document.getElementById('reportMode');
      const writeMode = document.getElementById('writeMode');
      if (currentMode === 'report') {
        toggleSwitch.classList.add('active');
        reportMode.style.display = 'none';
        writeMode.style.display = 'block';
        currentMode = 'write';
        updateWriteStatus();
      } else {
        toggleSwitch.classList.remove('active');
        reportMode.style.display = 'block';
        writeMode.style.display = 'none';
        currentMode = 'report';
        updateStatus();
      }
    }

    function loadAccounts() {
      google.script.run.withSuccessHandler(accounts => {
        allAccounts = accounts;
        renderAccountList(allAccounts);
        updateStatus();
      }).withFailureHandler(err => {
        document.getElementById('loading').textContent = 'Lỗi tải dữ liệu.';
      }).getAccountsForSidebar();
    }

    function loadAllAccounts() {
      google.script.run.withSuccessHandler(accounts => {
        renderWriteAccountsList(accounts);
      }).withFailureHandler(err => {
        document.getElementById('loadingWrite').textContent = 'Lỗi tải dữ liệu.';
      }).getAccountsForSidebar();
    }

    function loadReportDates() {
      google.script.run.withSuccessHandler(dates => {
        if (dates && dates.startDate && dates.endDate) {
          document.getElementById('startDate').value = dates.startDate;
          document.getElementById('endDate').value = dates.endDate;
          document.getElementById('hanghoaStartDate').value = dates.startDate;
          document.getElementById('hanghoaEndDate').value = dates.endDate;
        } else {
          const today = new Date();
          const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
          const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          document.getElementById('startDate').valueAsDate = firstDay;
          document.getElementById('endDate').valueAsDate = lastDay;
          document.getElementById('hanghoaStartDate').valueAsDate = firstDay;
          document.getElementById('hanghoaEndDate').valueAsDate = lastDay;
        }
      }).withFailureHandler(err => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        document.getElementById('startDate').valueAsDate = firstDay;
        document.getElementById('endDate').valueAsDate = lastDay;
        document.getElementById('hanghoaStartDate').valueAsDate = firstDay;
        document.getElementById('hanghoaEndDate').valueAsDate = lastDay;
      }).getReportDates();
    }

    function loadHangHoa() {
      const loadingElement = document.getElementById('loadingHangHoa');
      if (loadingElement) loadingElement.style.display = 'block';
      google.script.run.withSuccessHandler(hangHoa => {
        if (Array.isArray(hangHoa)) {
          allHangHoa = hangHoa;
          renderHangHoaList(allHangHoa);
        } else {
          document.getElementById('hanghoaList').innerHTML = '<div style="padding: 20px; text-align: center; color: #5f6368;">Không có dữ liệu hàng hóa.</div>';
        }
      }).withFailureHandler(err => {
        document.getElementById('hanghoaList').innerHTML = `<div style="padding: 20px; text-align: center; color: #dc3545;">Lỗi tải dữ liệu: ${err}</div>`;
      }).getHangHoaForSidebar();
    }

    function renderAccountList(accounts) {
      const listElement = document.getElementById('accountList');
      if (accounts.length === 0) {
        listElement.innerHTML = '<div style="padding: 20px; text-align: center; color: #5f6368;">Không tìm thấy tài khoản.</div>';
        return;
      }
      let html = '';
      accounts.forEach(acc => {
        const isChecked = selectedAccounts.includes(acc.ma);
        html += `
          <label class="account-item" for="acc-${acc.ma}">
            <input type="checkbox" id="acc-${acc.ma}" value="${acc.ma}" ${isChecked ? 'checked' : ''} onchange="updateSelection()">
            <div class="account-info">
              <div class="account-code">${acc.ma}</div>
              <div class="account-name">${acc.ten}</div>
            </div>
          </label>`;
      });
      listElement.innerHTML = html;
    }

    function renderWriteAccountsList(accounts) {
      const listElement = document.getElementById('writeAccountList');
      if (accounts.length === 0) {
        listElement.innerHTML = '<div style="padding: 20px; text-align: center; color: #5f6368;">Không tìm thấy tài khoản.</div>';
        return;
      }
      let html = '';
      accounts.forEach(acc => {
        const isChecked = selectedWriteAccounts.includes(acc.ma);
        html += `
          <label class="account-item" for="write-acc-${acc.ma}">
            <input type="checkbox" id="write-acc-${acc.ma}" value="${acc.ma}" ${isChecked ? 'checked' : ''} onchange="updateWriteSelection()">
            <div class="account-info">
              <div class="account-code">${acc.ma}</div>
              <div class="account-name">${acc.ten}</div>
            </div>
          </label>`;
      });
      listElement.innerHTML = html;
    }

    function filterAccounts() {
      const searchTerm = document.getElementById('searchInput').value.toLowerCase();
      document.querySelector('.clear-search').style.display = searchTerm ? 'block' : 'none';
      const filtered = allAccounts.filter(acc => acc.ma.toLowerCase().includes(searchTerm) || acc.ten.toLowerCase().includes(searchTerm));
      renderAccountList(filtered);
    }

    function filterWriteAccounts() {
      const searchTerm = document.getElementById('writeSearchInput').value.toLowerCase();
      document.querySelectorAll('.clear-search')[1].style.display = searchTerm ? 'block' : 'none';
      const filtered = allAccounts.filter(acc => acc.ma.toLowerCase().includes(searchTerm) || acc.ten.toLowerCase().includes(searchTerm));
      renderWriteAccountsList(filtered);
    }

    function clearSearch() {
      document.getElementById('searchInput').value = '';
      filterAccounts();
    }

    function clearWriteSearch() {
      document.getElementById('writeSearchInput').value = '';
      filterWriteAccounts();
    }

    function selectAllAccounts() {
      document.querySelectorAll('#accountList input[type="checkbox"]').forEach(cb => cb.checked = true);
      updateSelection();
    }

    function deselectAllAccounts() {
      document.querySelectorAll('#accountList input[type="checkbox"]').forEach(cb => cb.checked = false);
      updateSelection();
    }

    function selectAllWriteAccounts() {
      document.querySelectorAll('#writeAccountList input[type="checkbox"]').forEach(cb => cb.checked = true);
      updateWriteSelection();
    }

    function deselectAllWriteAccounts() {
      document.querySelectorAll('#writeAccountList input[type="checkbox"]').forEach(cb => cb.checked = false);
      updateWriteSelection();
    }

    function updateSelection() {
      selectedAccounts = Array.from(document.querySelectorAll('#accountList input:checked')).map(cb => cb.value);
      updateStatus();
    }

    function updateStatus() {
      const statusElement = document.getElementById('status');
      statusElement.style.display = selectedAccounts.length > 0 ? 'block' : 'none';
      statusElement.textContent = `Đã chọn: ${selectedAccounts.length} tài khoản`;
      google.script.run.saveSelectedAccounts(selectedAccounts);
    }

    function updateWriteSelection() {
      selectedWriteAccounts = Array.from(document.querySelectorAll('#writeAccountList input:checked')).map(cb => cb.value);
      updateWriteStatus();
    }

    function updateWriteStatus() {
      const statusElement = document.getElementById('writeStatus');
      statusElement.style.display = selectedWriteAccounts.length > 0 ? 'block' : 'none';
      statusElement.textContent = `Đã chọn: ${selectedWriteAccounts.length} tài khoản`;
    }

    function writeSelectedAccounts() {
      if (selectedWriteAccounts.length === 0) return alert('Vui lòng chọn ít nhất một tài khoản');
      google.script.run.withSuccessHandler(result => {
        if (result.success) {
          showTempStatus('writeStatus', `✅ Đã ghi ${result.count} tài khoản`, 'success');
          deselectAllWriteAccounts();
        } else alert('Lỗi: ' + result.error);
      }).withFailureHandler(err => alert('Lỗi hệ thống: ' + err)).ghiNhieuTaiKhoanVaoSheet(selectedWriteAccounts);
    }

    function createCDPS() {
      const startDate = document.getElementById('startDate').value;
      const endDate = document.getElementById('endDate').value;
      if (!startDate || !endDate) return alert('Vui lòng chọn kỳ báo cáo');
      saveReportDates(startDate, endDate);
      showTempStatus('status', `🔄 Đang tạo CĐPS...`, 'loading');
      google.script.run.withSuccessHandler(() => showTempStatus('status', '✅ Đã tạo CĐPS', 'success')).withFailureHandler(err => showTempStatus('status', `❌ Lỗi: ${err}`, 'error')).taoCanDoiPhatSinh(startDate, endDate);
    }

    function createSoChiTiet() {
      if (selectedAccounts.length === 0) return alert('Vui lòng chọn ít nhất một tài khoản');
      const startDate = document.getElementById('startDate').value;
      const endDate = document.getElementById('endDate').value;
      if (!startDate || !endDate) return alert('Vui lòng chọn kỳ báo cáo');
      saveReportDates(startDate, endDate);
      showTempStatus('status', `🔄 Đang tạo Sổ Chi Tiết...`, 'loading');
      google.script.run.withSuccessHandler(() => showTempStatus('status', '✅ Đã tạo Sổ Chi Tiết', 'success')).withFailureHandler(err => showTempStatus('status', `❌ Lỗi: ${err}`, 'error')).taosochitiet(startDate, endDate, selectedAccounts);
    }
    
    function saveReportDates(startDate, endDate) {
      google.script.run.saveReportDates(startDate, endDate);
    }

    function renderHangHoaList(hangHoaToRender) {
      const listElement = document.getElementById('hanghoaList');
      const loadingElement = document.getElementById('loadingHangHoa');
      if (loadingElement) loadingElement.style.display = 'none';
      if (!hangHoaToRender || hangHoaToRender.length === 0) {
        listElement.innerHTML = '<div style="padding: 20px; text-align: center; color: #5f6368;">Không tìm thấy hàng hóa.</div>';
        return;
      }
      let html = '';
      hangHoaToRender.forEach(item => {
        const isChecked = selectedHangHoaIds.has(item.uniqueId) ? 'checked' : '';
        html += `
          <label class="hanghoa-item" for="hanghoa-${item.uniqueId}">
            <input type="checkbox" id="hanghoa-${item.uniqueId}" class="hanghoa-checkbox" onchange="toggleHangHoaSelection('${item.uniqueId}')" ${isChecked}>
            <div class="hanghoa-info">
              <div class="hanghoa-name">${item.tenHang}</div>
              <div class="hanghoa-code"><span class="ma-kho">${item.maKho}</span>${item.maHang}</div>
              <div class="hanghoa-details">Quy cách: ${item.quyCach} | ĐVT: ${item.dvt}</div>
            </div>
          </label>`;
      });
      listElement.innerHTML = html;
    }

    function toggleHangHoaSelection(uniqueId) {
      if (selectedHangHoaIds.has(uniqueId)) selectedHangHoaIds.delete(uniqueId);
      else selectedHangHoaIds.add(uniqueId);
      updateHangHoaStatus();
    }

    function updateHangHoaStatus() {
      const statusElement = document.getElementById('hanghoaStatus');
      statusElement.style.display = selectedHangHoaIds.size > 0 ? 'block' : 'none';
      statusElement.textContent = `Đã chọn: ${selectedHangHoaIds.size} hàng hóa`;
    }

    function filterHangHoa() {
      const term = document.getElementById('hanghoaSearchInput').value.toLowerCase();
      document.getElementById('clearHangHoaSearch').style.display = term ? 'block' : 'none';
      const filtered = allHangHoa.filter(item => 
        (item.maKho && item.maKho.toLowerCase().includes(term)) ||
        (item.maHang && item.maHang.toLowerCase().includes(term)) ||
        (item.tenHang && item.tenHang.toLowerCase().includes(term))
      );
      renderHangHoaList(filtered);
    }

    function clearHangHoaSearch() {
      document.getElementById('hanghoaSearchInput').value = '';
      filterHangHoa();
    }
    
    function applyHangHoaSelection() {
      if (selectedHangHoaIds.size === 0) return alert('Vui lòng chọn ít nhất một hàng hóa');
      const selectedItems = Array.from(selectedHangHoaIds).map(id => allHangHoa.find(item => item.uniqueId === id)).filter(Boolean);
      google.script.run.withSuccessHandler(result => {
        if (result.success) {
          showTempStatus('hanghoaStatus', `✅ Đã ghi ${result.count} hàng hóa`, 'success');
          deselectAllHangHoa();
        } else alert('Lỗi: ' + result.error);
      }).withFailureHandler(err => alert('Lỗi hệ thống: ' + err)).ghiHangHoaVaoSheet(selectedItems);
    }

    function selectAllHangHoa() {
      allHangHoa.forEach(item => selectedHangHoaIds.add(item.uniqueId));
      renderHangHoaList(allHangHoa); // Re-render to check all boxes
      updateHangHoaStatus();
    }

    function deselectAllHangHoa() {
      selectedHangHoaIds.clear();
      renderHangHoaList(allHangHoa); // Re-render to uncheck all boxes
      updateHangHoaStatus();
    }

    function createNhapXuatTon(reportType = 'ALL') {
      const startDate = document.getElementById('hanghoaStartDate').value;
      const endDate = document.getElementById('hanghoaEndDate').value;
      if (!startDate || !endDate) return alert('Vui lòng chọn kỳ báo cáo');
      
      saveReportDates(startDate, endDate);
      
      let selectedItems = (selectedHangHoaIds.size > 0) 
        ? Array.from(selectedHangHoaIds).map(id => allHangHoa.find(item => item.uniqueId === id)).filter(Boolean)
        : allHangHoa;
      
      if (selectedItems.length === 0) return alert('Không có hàng hóa nào để tạo báo cáo. Vui lòng chọn hoặc đảm bảo có dữ liệu trong DMHH.');
      
      showTempStatus('hanghoaStatus', `🔄 Đang tạo NXT cho ${selectedItems.length} hàng hóa...`, 'loading');
      
      google.script.run.withSuccessHandler(() => {
        showTempStatus('hanghoaStatus', `✅ Đã tạo báo cáo NXT`, 'success');
      }).withFailureHandler(error => {
        showTempStatus('hanghoaStatus', `❌ Lỗi: ${error}`, 'error');
      }).taoNhapXuatTonFromSidebar(startDate, endDate, selectedItems, reportType);
    }

    // ⭐⭐⭐ FIX: Updated showTempStatus function ⭐⭐⭐
    function showTempStatus(elementId, message, type) {
      const statusElement = document.getElementById(elementId);
      
      statusElement.textContent = message;
      statusElement.style.display = 'block';

      if (type === 'success') {
        statusElement.style.background = '#e6f4ea'; 
        statusElement.style.borderColor = '#34a853'; 
        statusElement.style.color = '#137333';
      } else if (type === 'error') {
        statusElement.style.background = '#f8d7da'; 
        statusElement.style.borderColor = '#dc3545'; 
        statusElement.style.color = '#721c24';
      } else { // loading
        statusElement.style.background = '#fff3cd'; 
        statusElement.style.borderColor = '#ffc107'; 
        statusElement.style.color = '#856404';
      }

      if (type !== 'loading') {
        setTimeout(() => {
          // Reset styles to default
          statusElement.style.background = 'white';
          statusElement.style.borderColor = '#e8eaed';
          statusElement.style.color = '#5f6368';
          
          // Update status with the correct selection count
          if (elementId === 'hanghoaStatus') {
            updateHangHoaStatus();
          } else if (elementId === 'status') {
            updateStatus();
          } else if (elementId === 'writeStatus') {
            updateWriteStatus();
          }
        }, 4000);
      }
    }

    window.onload = function() {
      loadReportDates();
      loadAccounts();
      loadAllAccounts();
      loadHangHoa();
    };
  </script>
</body>
</html>
