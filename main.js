const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

// 添加日志功能
const log = (...args) => {
  console.log('[VMware++]', ...args);
};

// 添加一些配置来减少缓存错误
app.commandLine.appendSwitch('disable-http-cache');
app.commandLine.appendSwitch('disable-gpu-cache');
app.commandLine.appendSwitch('disk-cache-size', '1');

// 设置字体家族，确保在所有平台上使用一致的字体
app.commandLine.appendSwitch('font-family', 'Segoe UI, sans-serif');

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 600,
    minHeight: 500,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, 'VMware.ico'),
    frame: false,  // 禁用原生窗口框架（适用于所有平台）
    titleBarStyle: 'hidden',  // 隐藏标题栏（macOS）
    trafficLightPosition: { x: 10, y: 10 }, // 设置交通灯位置（macOS）
  });

  // and load the index.html of the app.
  mainWindow.loadFile('index.html');

  // 移除了DevTools自动弹出的代码
  
  // 添加窗口事件监听
  mainWindow.webContents.on('did-finish-load', () => {
    log('主窗口加载完成');
  });
  
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    log(`主窗口加载失败: ${errorCode} - ${errorDescription}`);
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  log('Electron 应用准备就绪');
  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for communication between main and renderer processes
ipcMain.handle('browse-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  
  if (result.canceled) {
    return null;
  }
  
  return result.filePaths[0];
});

// 处理选择背景图片的请求
ipcMain.handle('select-background-image', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp'] }
    ]
  });
  
  if (result.canceled) {
    return null;
  }
  
  return result.filePaths[0];
});

// 窗口控制 IPC 处理
ipcMain.handle('minimize-window', async (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window) {
    window.minimize();
  }
});

ipcMain.handle('maximize-window', async (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window) {
    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
    }
  }
});

ipcMain.handle('close-window', async (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window) {
    window.close();
  }
});

// 查找.vm文件的函数
function findVmxFiles(directory) {
  const vmxFiles = [];
  
  function walkDir(dir) {
    try {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          walkDir(filePath);
        } else if (file.endsWith('.vmx')) {
          vmxFiles.push(filePath);
        }
      });
    } catch (error) {
      console.error('Error reading directory:', error);
    }
  }
  
  walkDir(directory);
  return vmxFiles;
}

// 修改.vm文件的函数
function modifyVmxFile(filepath, enable_smc, enable_amd, disable_suspend) {
  try {
    // 检查文件是否存在
    if (!fs.existsSync(filepath)) {
      return { success: false, message: `错误: 文件不存在 - ${filepath}` };
    }

    // 先将 .vmx 文件重命名为 .txt 文件
    const txt_filepath = filepath + ".txt";
    try {
      fs.renameSync(filepath, txt_filepath);
    } catch (error) {
      return { success: false, message: `错误: 重命名文件时出错 - ${error.message}` };
    }

    // 读取现有内容
    let lines;
    try {
      lines = fs.readFileSync(txt_filepath, 'utf-8').split('\n');
    } catch (error) {
      // 如果读取失败，尝试恢复原文件名
      try {
        fs.renameSync(txt_filepath, filepath);
      } catch (e) {
        // 忽略恢复错误
      }
      return { success: false, message: `错误: 读取文件时出错 - ${error.message}` };
    }

    // 处理 SMC 设置
    let new_lines = [];
    const smc_exists = lines.some(line => line.toLowerCase().includes('smc.version'));

    if (enable_smc && !smc_exists) {
      // 添加 SMC 设置
      new_lines.push('smc.version = "0"');
    } else if (!enable_smc && smc_exists) {
      // 删除已存在的 SMC 设置
      lines = lines.filter(line => !line.toLowerCase().includes('smc.version'));
    }

    // 处理 AMD 兼容层设置
    const amd_settings = [
      'smc.version = "0"',
      'cpuid.0.eax = "0000:0000:0000:0001:0000:0110:0111:0001"',
      'cpuid.0.ebx = "0000:0010:0000:0001:0000:1000:0000:0000"',
      'cpuid.0.ecx = "1000:0010:1001:1000:0010:0010:0000:0011"',
      'cpuid.0.edx = "0000:0111:1000:1011:1111:1011:1111:1111"',
      'cpuid.1.eax = "0000:0000:0000:0001:0000:0110:0111:0001"',
      'cpuid.1.ebx = "0000:0010:0000:0001:0000:1000:0000:0000"',
      'cpuid.1.ecx = "1000:0010:1001:1000:0010:0010:0000:0011"',
      'cpuid.1.edx = "0000:0111:1000:1011:1111:1011:1111:1111"',
      'smbios.reflectHost = "TRUE"',
      'hw.model = "MacBookPro14,3"',
      'board-id = "Mac-551B86E5744E2388"',
      'keyboard.vusb.enable = "TRUE"',
      'mouse.vusb.enable = "TRUE"'
    ];

    // 检查是否已存在 AMD 设置
    const amd_exists = lines.some(line => line.toLowerCase().includes('cpuid.0.eax'));

    if (enable_amd && !amd_exists) {
      // 添加 AMD 兼容层设置
      new_lines.push(...amd_settings);
    } else if (!enable_amd && amd_exists) {
      // 删除已存在的 AMD 兼容层设置
      lines = lines.filter(line => {
        const lineKey = line.split(' = ')[0];
        return !amd_settings.some(setting => setting.startsWith(lineKey));
      });
    }

    // 处理自动挂起设置
    const suspend_exists = lines.some(line => line.toLowerCase().includes('suspend.disabled'));

    if (disable_suspend && !suspend_exists) {
      // 添加禁用自动挂起设置
      new_lines.push('suspend.disabled = "TRUE"');
    } else if (!disable_suspend && suspend_exists) {
      // 删除已存在的禁用自动挂起设置
      lines = lines.filter(line => !line.toLowerCase().includes('suspend.disabled'));
    }

    // 将所有内容写入新的 .vmx 文件
    try {
      const content = [...lines, ...new_lines].join('\n');
      fs.writeFileSync(filepath, content, 'utf-8');
    } catch (error) {
      // 如果写入失败，尝试恢复原文件
      try {
        fs.renameSync(txt_filepath, filepath);
      } catch (e) {
        // 忽略恢复错误
      }
      return { success: false, message: `错误: 写入文件时出错 - ${error.message}` };
    }

    // 删除临时的 .txt 文件
    try {
      fs.removeSync(txt_filepath);
    } catch (error) {
      console.warn(`警告: 无法删除临时文件 ${txt_filepath} - ${error.message}`);
    }

    return { 
      success: new_lines.length > 0 || 
               (enable_smc !== smc_exists) || 
               (enable_amd !== amd_exists) || 
               (disable_suspend !== suspend_exists),
      changes: new_lines
    };
  } catch (error) {
    return { success: false, message: `错误: ${error.message}` };
  }
}

ipcMain.handle('find-vmx-files', async (event, directory) => {
  if (!directory || !fs.existsSync(directory)) {
    return { success: false, message: '目录不存在' };
  }
  
  try {
    const files = findVmxFiles(directory);
    return { success: true, files };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('modify-vmx-files', async (event, { directory, enable_smc, enable_amd, disable_suspend }) => {
  if (!directory || !fs.existsSync(directory)) {
    return { success: false, message: '目录不存在' };
  }
  
  try {
    const vmxFiles = findVmxFiles(directory);
    
    if (vmxFiles.length === 0) {
      return { success: false, message: '未找到任何 .vmx 文件' };
    }
    
    const results = [];
    let modifiedCount = 0;
    let errorCount = 0;
    
    for (const filepath of vmxFiles) {
      const result = modifyVmxFile(filepath, enable_smc, enable_amd, disable_suspend);
      results.push({
        filepath,
        filename: path.basename(filepath),
        ...result
      });
      
      if (result.success) {
        modifiedCount++;
      } else {
        errorCount++;
      }
    }
    
    return {
      success: true,
      results,
      modifiedCount,
      errorCount,
      totalCount: vmxFiles.length
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
});