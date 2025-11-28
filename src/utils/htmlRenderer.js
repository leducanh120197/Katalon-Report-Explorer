const { hasDisplayableFile, isInCollectionFolder } = require('./fileSystem');

/**
 * Render cây thư mục dạng bảng
 */
const renderTree = tree => {
    if (!tree?.children?.length) return '';
    
    return `
    <table class="file-table">
        <tbody>
            ${renderTreeRows(tree, 0)}
        </tbody>
    </table>
    `;
};

/**
 * Render các hàng của bảng từ cây thư mục
 */
const renderTreeRows = (node, level) => {
    if (!node?.children?.length) return '';
    
    let rows = '';
    
    for (const child of node.children) {
        if (!child) continue;
        
        const indent = '&nbsp;'.repeat(level * 4);
        
        if (child.isFile) {
            const isInCollection = isInCollectionFolder(child.path);
            const isJsonOrRp = child.fileType === 'json' || child.fileType === 'rp';
            const createHtmlButton = isInCollection && isJsonOrRp ? 
                `<button class="create-html-btn" data-path="${encodeURIComponent(child.path)}">Tạo HTML</button>` : '';
            
            rows += `
            <tr class="file-row">
                <td>${indent}
                    <a href="/view?file=${encodeURIComponent(child.path)}" target="_blank">${child.name}</a>
                    ${createHtmlButton}
                </td>
            </tr>`;
        } else {
            rows += `
            <tr class="folder-row open">
                <td>${indent}
                    <span class="toggle-folder" data-path="${encodeURIComponent(child.path)}" data-has-files="${hasDisplayableFile(child)}">${child.name}</span>
                </td>
            </tr>`;
            
            // Thêm các hàng con của thư mục (hiển thị sẵn)
            if (hasDisplayableFile(child)) {
                rows += `
                <tr class="folder-content" data-parent="${encodeURIComponent(child.path)}" style="display:table-row">
                    <td colspan="1">
                        <table class="nested-table">
                            <tbody>
                                ${renderTreeRows(child, level + 1)}
                            </tbody>
                        </table>
                    </td>
                </tr>`;
            }
        }
    }
    
    return rows;
};

module.exports = {
    renderTree,
    renderTreeRows
};