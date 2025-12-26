document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra trạng thái auto-start khi load trang
    checkAutoStartStatus();
    
    // Xử lý sự kiện toggle auto-start
    const toggleBtn = document.getElementById('toggle-auto-start');
    if (toggleBtn) {
        toggleBtn.onclick = toggleAutoStart;
    }
    // Xử lý sự kiện toggle folder
    document.querySelectorAll('.toggle-folder').forEach(f => {
        // Chỉ thêm sự kiện click cho các thư mục có file hiển thị
        if (f.getAttribute('data-has-files') === 'true') {
            f.onclick = () => {
                const path = f.getAttribute('data-path');
                const rows = document.querySelectorAll('.folder-content[data-parent="' + path + '"]');
                
                rows.forEach(row => {
                    row.style.display = row.style.display === 'none' ? 'table-row' : 'none';
                });
                
                // Thêm/xóa class open cho hàng chứa toggle
                const parentRow = f.closest('tr');
                parentRow.classList.toggle('open');
            };
        }
    });
    
    // Xử lý sự kiện cho nút "Tạo HTML"
    document.querySelectorAll('.create-html-btn').forEach(btn => {
        btn.onclick = async (e) => {
            e.preventDefault();
            const filePath = decodeURIComponent(btn.getAttribute('data-path'));
            try {
                const response = await fetch('/create-html', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ filePath })
                });
                
                const result = await response.json();
                alert(result.message);
                
                // Nếu tạo thành công, làm mới trang để hiển thị file HTML mới
                if (result.success) {
                    location.reload();
                }
            } catch (error) {
                alert('Có lỗi xảy ra: ' + error.message);
            }
        };
    });
    
    // Xử lý sự kiện cho nút "Xóa HTML"
    document.querySelectorAll('.delete-html-btn').forEach(btn => {
        btn.onclick = async (e) => {
            e.preventDefault();
            const filePath = decodeURIComponent(btn.getAttribute('data-path'));
            
            // Xác nhận trước khi xóa
            if (!confirm('Bạn có chắc chắn muốn xóa file HTML này không?')) {
                return;
            }
            
            try {
                const response = await fetch('/delete-html', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ filePath })
                });
                
                const result = await response.json();
                alert(result.message);
                
                // Nếu xóa thành công, làm mới trang
                if (result.success) {
                    location.reload();
                }
            } catch (error) {
                alert('Có lỗi xảy ra: ' + error.message);
            }
        };
    });
});

/**
 * Kiểm tra trạng thái auto-start
 */
async function checkAutoStartStatus() {
    try {
        const response = await fetch('/auto-start/status');
        const result = await response.json();
        
        const statusElement = document.getElementById('auto-start-value');
        if (statusElement) {
            if (result.success) {
                statusElement.textContent = result.enabled ? 'Đã bật' : 'Đã tắt';
                statusElement.className = result.enabled ? 'auto-start-enabled' : 'auto-start-disabled';
            } else {
                statusElement.textContent = 'Lỗi kiểm tra';
                statusElement.className = 'auto-start-disabled';
            }
        }
    } catch (error) {
        console.error('Error checking auto-start status:', error);
        const statusElement = document.getElementById('auto-start-value');
        if (statusElement) {
            statusElement.textContent = 'Không thể kiểm tra';
            statusElement.className = 'auto-start-disabled';
        }
    }
}

/**
 * Toggle auto-start (bật/tắt)
 */
async function toggleAutoStart() {
    const toggleBtn = document.getElementById('toggle-auto-start');
    
    if (toggleBtn) {
        toggleBtn.disabled = true;
        toggleBtn.textContent = 'Đang xử lý...';
    }
    
    try {
        const response = await fetch('/auto-start/toggle', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(result.message);
            // Cập nhật trạng thái hiển thị
            await checkAutoStartStatus();
        } else {
            alert('Có lỗi xảy ra: ' + result.message);
        }
    } catch (error) {
        console.error('Error toggling auto-start:', error);
        alert('Có lỗi xảy ra: ' + error.message);
    } finally {
        if (toggleBtn) {
            toggleBtn.disabled = false;
            toggleBtn.textContent = 'Bật/Tắt Auto-start';
        }
    }
}