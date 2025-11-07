// DOM 元素
const vmDirInput = document.getElementById('vm-dir');
const browseBtn = document.getElementById('browse-btn');
const smcOption = document.getElementById('smc-option');
const amdOption = document.getElementById('amd-option');
const suspendOption = document.getElementById('suspend-option');
const applyBtn = document.getElementById('apply-btn');
const exitBtn = document.getElementById('exit-btn');
const logContent = document.getElementById('log-content');
const progressSection = document.querySelector('.progress-section');
const progressFill = document.querySelector('.progress-fill');
const statusText = document.getElementById('status-text');

// 标题栏控制按钮
const minimizeButton = document.getElementById('minimize-button');
const maximizeButton = document.getElementById('maximize-button');
const closeButton = document.getElementById('close-button');

// 菜单元素
const fileMenu = document.getElementById('file-menu');
const settingsMenu = document.getElementById('settings-menu');
const helpMenu = document.getElementById('help-menu');
const fileSubmenu = document.getElementById('file-submenu');
const settingsSubmenu = document.getElementById('settings-submenu');
const helpSubmenu = document.getElementById('help-submenu');
const exitItem = document.getElementById('exit-item');
const customizeThemeItem = document.getElementById('customize-theme-item');
const aboutItem = document.getElementById('about-item');

// 设置对话框元素
const settingsModal = document.getElementById('settings-modal');
const closeModal = document.querySelector('.close');
const themeColorInput = document.getElementById('theme-color');
const backgroundColorInput = document.getElementById('background-color');
const backgroundImageInput = document.getElementById('background-image-path');
const selectImageBtn = document.getElementById('select-image-btn');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const cancelSettingsBtn = document.getElementById('cancel-settings-btn');
const resetSettingsBtn = document.getElementById('reset-settings-btn');

// 事件监听器
if (browseBtn) {
    browseBtn.addEventListener('click', handleBrowseDirectory);
}

if (applyBtn) {
    applyBtn.addEventListener('click', handleApplyModifications);
}

if (exitBtn) {
    exitBtn.addEventListener('click', handleCloseWindow);
}

// 标题栏控制按钮事件监听器
if (minimizeButton) {
    minimizeButton.addEventListener('click', handleMinimizeWindow);
}

if (maximizeButton) {
    maximizeButton.addEventListener('click', handleMaximizeWindow);
}

if (closeButton) {
    closeButton.addEventListener('click', handleCloseWindow);
}

// 菜单事件监听器
if (fileMenu) {
    fileMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        hideAllSubmenus();
        if (fileSubmenu) {
            fileSubmenu.style.display = 'block';
        }
    });
}

if (settingsMenu) {
    settingsMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        hideAllSubmenus();
        if (settingsSubmenu) {
            settingsSubmenu.style.display = 'block';
        }
    });
}

if (helpMenu) {
    helpMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        hideAllSubmenus();
        if (helpSubmenu) {
            helpSubmenu.style.display = 'block';
        }
    });
}

// 菜单项事件监听器
if (exitItem) {
    exitItem.addEventListener('click', handleCloseWindow);
}

if (customizeThemeItem) {
    customizeThemeItem.addEventListener('click', openSettings);
}

if (aboutItem) {
    aboutItem.addEventListener('click', showAboutDialog);
}

// 设置对话框事件监听器
if (closeModal) {
    closeModal.addEventListener('click', closeSettings);
}

if (selectImageBtn) {
    selectImageBtn.addEventListener('click', handleSelectImage);
}

if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', saveSettings);
}

if (cancelSettingsBtn) {
    cancelSettingsBtn.addEventListener('click', closeSettings);
}

if (resetSettingsBtn) {
    resetSettingsBtn.addEventListener('click', resetSettings);
}

// 点击其他地方隐藏菜单
document.addEventListener('click', (e) => {
    if (!fileMenu.contains(e.target) && 
        !settingsMenu.contains(e.target) && 
        !helpMenu.contains(e.target)) {
        hideAllSubmenus();
    }
});

// 监听从主进程发送的打开设置事件
window.electronEvents.onOpenSettings(() => {
    openSettings();
});

// 窗口控制函数
function handleMinimizeWindow() {
    if (window.electronAPI && window.electronAPI.minimizeWindow) {
        window.electronAPI.minimizeWindow();
    }
}

function handleMaximizeWindow() {
    if (window.electronAPI && window.electronAPI.maximizeWindow) {
        window.electronAPI.maximizeWindow();
    }
}

function handleCloseWindow() {
    if (window.electronAPI && window.electronAPI.closeWindow) {
        window.electronAPI.closeWindow();
    }
}

// 菜单函数
function hideAllSubmenus() {
    if (fileSubmenu) fileSubmenu.style.display = 'none';
    if (settingsSubmenu) settingsSubmenu.style.display = 'none';
    if (helpSubmenu) helpSubmenu.style.display = 'none';
}

function showAboutDialog() {
    alert('VMware++ 修改器 v1.0.0\n\n一个用于改善 VMware 虚拟机性能和兼容性的工具。');
}

// 浏览目录
async function handleBrowseDirectory() {
    try {
        if (window.electronAPI && window.electronAPI.browseDirectory) {
            const directory = await window.electronAPI.browseDirectory();
            if (directory) {
                if (vmDirInput) {
                    vmDirInput.value = directory;
                }
                logMessage(`已选择目录: ${directory}`);
            }
        } else {
            console.error('electronAPI 不可用');
            logMessage('错误: electronAPI 不可用');
        }
    } catch (error) {
        console.error('浏览目录时出错:', error);
        logMessage(`错误: ${error.message}`);
    }
}

// 应用修改
async function handleApplyModifications() {
    // 检查是否选择了目录
    const vmDir = vmDirInput ? vmDirInput.value.trim() : '';
    if (!vmDir) {
        alert('请先选择虚拟机目录!');
        return;
    }
    
    // 检查是否选择了至少一个选项
    const isSmcChecked = smcOption ? smcOption.checked : false;
    const isAmdChecked = amdOption ? amdOption.checked : false;
    const isSuspendChecked = suspendOption ? suspendOption.checked : false;
    
    if (!isSmcChecked && !isAmdChecked && !isSuspendChecked) {
        alert('请至少选择一个修改选项!');
        return;
    }
    
    // 显示进度条
    if (progressSection) {
        progressSection.classList.remove('hidden');
    }
    if (applyBtn) {
        applyBtn.disabled = true;
    }
    if (statusText) {
        statusText.textContent = '正在处理...';
    }
    if (progressFill) {
        progressFill.style.width = '0%';
    }
    
    try {
        if (!window.electronAPI || !window.electronAPI.findVmxFiles) {
            throw new Error('electronAPI 不可用');
        }
        
        // 查找 .vmx 文件
        logMessage('正在查找 .vmx 文件...');
        const result = await window.electronAPI.findVmxFiles(vmDir);
        
        if (!result.success) {
            logMessage(result.message);
            return;
        }
        
        const vmxFiles = result.files;
        if (vmxFiles.length === 0) {
            logMessage('未找到任何 .vmx 文件! 请检查目录路径是否正确。');
            return;
        }
        
        logMessage(`找到 ${vmxFiles.length} 个 .vmx 文件`);
        
        // 更新进度条
        if (progressFill) {
            progressFill.style.width = '30%';
        }
        
        // 应用修改
        const options = {
            directory: vmDir,
            enable_smc: isSmcChecked,
            enable_amd: isAmdChecked,
            disable_suspend: isSuspendChecked
        };
        
        const modifyResult = await window.electronAPI.modifyVmxFiles(options);
        
        if (!modifyResult.success) {
            logMessage(modifyResult.message);
            return;
        }
        
        // 更新进度条
        if (progressFill) {
            progressFill.style.width = '100%';
        }
        if (statusText) {
            statusText.textContent = '处理完成';
        }
        
        // 显示结果
        logMessage('\n处理完成!');
        logMessage(`成功修改: ${modifyResult.modifiedCount} 个文件`);
        if (modifyResult.errorCount > 0) {
            logMessage(`处理失败: ${modifyResult.errorCount} 个文件`);
        }
        
        // 显示详细结果
        if (modifyResult.results) {
            modifyResult.results.forEach(result => {
                if (result.success) {
                    logMessage(`已修改: ${result.filename}`);
                    if (result.changes && result.changes.length > 0) {
                        result.changes.forEach(change => {
                            logMessage(`  -> 添加: ${change}`);
                        });
                    }
                } else {
                    logMessage(`错误 (${result.filename}): ${result.message}`);
                }
            });
        }
        
    } catch (error) {
        console.error('应用修改时出错:', error);
        logMessage(`发生未预期的错误: ${error.message}`);
    } finally {
        // 隐藏进度条并启用按钮
        setTimeout(() => {
            if (progressSection) {
                progressSection.classList.add('hidden');
            }
            if (applyBtn) {
                applyBtn.disabled = false;
            }
        }, 1000);
    }
}

// 在日志框中添加消息
function logMessage(message) {
    if (logContent) {
        logContent.textContent += `\n${message}`;
        // 滚动到底部
        if (logContent.parentElement) {
            logContent.parentElement.scrollTop = logContent.parentElement.scrollHeight;
        }
    }
}

// 打开设置对话框
function openSettings() {
    // 加载当前设置
    loadCurrentSettings();
    
    if (settingsModal) {
        settingsModal.classList.remove('hidden');
    }
    
    // 隐藏菜单
    hideAllSubmenus();
}

// 关闭设置对话框
function closeSettings() {
    if (settingsModal) {
        settingsModal.classList.add('hidden');
    }
}

// 加载当前设置
function loadCurrentSettings() {
    // 从本地存储加载设置（如果存在）
    const savedThemeColor = localStorage.getItem('themeColor');
    const savedBackgroundColor = localStorage.getItem('backgroundColor');
    const savedBackgroundImage = localStorage.getItem('backgroundImage');
    
    if (themeColorInput && savedThemeColor) {
        themeColorInput.value = savedThemeColor;
    }
    
    if (backgroundColorInput && savedBackgroundColor) {
        backgroundColorInput.value = savedBackgroundColor;
    }
    
    if (backgroundImageInput && savedBackgroundImage) {
        backgroundImageInput.value = savedBackgroundImage;
    }
}

// 选择背景图片
async function handleSelectImage() {
    try {
        if (window.electronAPI && window.electronAPI.selectBackgroundImage) {
            const imagePath = await window.electronAPI.selectBackgroundImage();
            if (imagePath && backgroundImageInput) {
                backgroundImageInput.value = imagePath;
            }
        } else {
            console.error('electronAPI 不可用');
            logMessage('错误: electronAPI 不可用');
        }
    } catch (error) {
        console.error('选择背景图片时出错:', error);
        logMessage(`错误: ${error.message}`);
    }
}

// 保存设置
function saveSettings() {
    const themeColor = themeColorInput ? themeColorInput.value : '#8e44ad';
    const backgroundColor = backgroundColorInput ? backgroundColorInput.value : '#8e44ad';
    const backgroundImage = backgroundImageInput ? backgroundImageInput.value : '';
    
    // 保存到本地存储
    localStorage.setItem('themeColor', themeColor);
    localStorage.setItem('backgroundColor', backgroundColor);
    if (backgroundImage) {
        localStorage.setItem('backgroundImage', backgroundImage);
    } else {
        localStorage.removeItem('backgroundImage');
    }
    
    // 应用设置
    applySettings(themeColor, backgroundColor, backgroundImage);
    
    // 关闭对话框
    closeSettings();
}

// 重置设置
function resetSettings() {
    if (themeColorInput) {
        themeColorInput.value = '#8e44ad';
    }
    
    if (backgroundColorInput) {
        backgroundColorInput.value = '#8e44ad';
    }
    
    if (backgroundImageInput) {
        backgroundImageInput.value = '';
    }
    
    // 从本地存储中移除设置
    localStorage.removeItem('themeColor');
    localStorage.removeItem('backgroundColor');
    localStorage.removeItem('backgroundImage');
    
    // 应用默认设置
    applySettings('#8e44ad', '#8e44ad', '');
}

// 应用设置
function applySettings(themeColor, backgroundColor, backgroundImage) {
    // 应用主题颜色（更新CSS变量）
    document.documentElement.style.setProperty('--theme-color', themeColor);
    document.documentElement.style.setProperty('--theme-color-light', lightenColor(themeColor, 20));
    document.documentElement.style.setProperty('--theme-color-dark', darkenColor(themeColor, 20));
    
    // 应用背景颜色
    document.body.style.background = backgroundColor;
    
    // 处理背景图片
    let customBg = document.getElementById('custom-bg');
    
    // 如果之前没有自定义背景元素，则创建一个
    if (!customBg) {
        customBg = document.createElement('img');
        customBg.id = 'custom-bg';
        document.body.appendChild(customBg);
    }
    
    // 如果有背景图片，则显示它
    if (backgroundImage) {
        customBg.src = backgroundImage;
        customBg.style.display = 'block';
        document.body.classList.add('custom-background');
    } else {
        // 否则隐藏自定义背景并恢复默认背景
        customBg.style.display = 'none';
        document.body.classList.remove('custom-background');
        document.body.style.background = `linear-gradient(135deg, ${backgroundColor}, ${lightenColor(backgroundColor, 10)})`;
    }
}

// 颜色处理函数
function lightenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

function darkenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
        (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
        (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    logMessage('VMware++ 修改器已启动');
    
    // 应用保存的设置（如果存在）
    const savedThemeColor = localStorage.getItem('themeColor') || '#8e44ad';
    const savedBackgroundColor = localStorage.getItem('backgroundColor') || '#8e44ad';
    const savedBackgroundImage = localStorage.getItem('backgroundImage') || '';
    applySettings(savedThemeColor, savedBackgroundColor, savedBackgroundImage);
});