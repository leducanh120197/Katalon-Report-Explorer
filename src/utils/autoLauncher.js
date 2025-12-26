/**
 * Auto Launcher Utility
 * Quản lý chức năng tự khởi động với Windows
 */

const AutoLaunch = require('auto-launch');
const path = require('path');
const fs = require('fs');

class AutoLauncher {
    constructor(config) {
        this.config = config;
        this.autoLauncher = null;
        this.init();
    }

    init() {
        let execPath;
        let appName;
        let args = [];

        if (process.pkg) {
            // Running as PKG executable
            execPath = process.execPath;
            appName = this.config.appName || 'Katalon Reports Viewer';
        } else {
            // Running from source - sử dụng node executable trực tiếp
            execPath = process.execPath; // node.exe path tuyệt đối
            appName = this.config.appName || 'Katalon Reports Viewer (Dev)';
            // Thêm script path vào args
            args = [path.resolve(__dirname, '..', '..', 'app.js')];
        }

        this.autoLauncher = new AutoLaunch({
            name: appName,
            path: execPath,
            args: args,
            isHidden: this.config.autoStart?.startHidden || false
        });
    }

    /**
     * Kiểm tra trạng thái auto-start
     */
    async isEnabled() {
        try {
            return await this.autoLauncher.isEnabled();
        } catch (error) {
            console.error('Error checking auto-start status:', error);
            return false;
        }
    }

    /**
     * Bật auto-start
     */
    async enable() {
        try {
            await this.autoLauncher.enable();
            console.log('Auto-start enabled successfully');
            return true;
        } catch (error) {
            console.error('Error enabling auto-start:', error);
            return false;
        }
    }

    /**
     * Tắt auto-start
     */
    async disable() {
        try {
            await this.autoLauncher.disable();
            console.log('Auto-start disabled successfully');
            return true;
        } catch (error) {
            console.error('Error disabling auto-start:', error);
            return false;
        }
    }

    /**
     * Cập nhật cấu hình auto-start trong config file
     */
    async updateConfigFile(enabled) {
        try {
            let configPath;
            if (process.pkg) {
                configPath = path.join(path.dirname(process.execPath), 'config.json');
            } else {
                configPath = path.join(__dirname, '..', '..', 'config.json');
            }

            // Đọc config hiện tại
            let config = {};
            if (fs.existsSync(configPath)) {
                const configData = fs.readFileSync(configPath, 'utf8');
                config = JSON.parse(configData);
            }

            // Cập nhật autoStart config
            if (!config.autoStart) {
                config.autoStart = {};
            }
            config.autoStart.enabled = enabled;

            // Ghi lại file
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            return true;
        } catch (error) {
            console.error('Error updating config file:', error);
            return false;
        }
    }

    /**
     * Toggle auto-start (bật/tắt)
     */
    async toggle() {
        try {
            const isCurrentlyEnabled = await this.isEnabled();
            if (isCurrentlyEnabled) {
                const disabled = await this.disable();
                if (disabled) {
                    await this.updateConfigFile(false);
                }
                return { enabled: false, success: disabled };
            } else {
                const enabled = await this.enable();
                if (enabled) {
                    await this.updateConfigFile(true);
                }
                return { enabled: true, success: enabled };
            }
        } catch (error) {
            console.error('Error toggling auto-start:', error);
            return { enabled: false, success: false, error: error.message };
        }
    }

    /**
     * Khởi tạo auto-start theo cấu hình
     */
    async initializeFromConfig() {
        if (this.config.autoStart?.enabled) {
            const isCurrentlyEnabled = await this.isEnabled();
            if (!isCurrentlyEnabled) {
                await this.enable();
            }
        }
    }
}

module.exports = AutoLauncher;