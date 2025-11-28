document.addEventListener('DOMContentLoaded', function() {
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
});