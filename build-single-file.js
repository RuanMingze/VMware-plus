const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

// 创建单文件版本的脚本
async function createSingleFile() {
  try {
    // 确保dist-single目录存在
    const distDir = path.join(__dirname, 'dist-single');
    await fs.ensureDir(distDir);
    
    // 复制必要的文件到临时目录
    const tempDir = path.join(__dirname, 'temp-build');
    await fs.ensureDir(tempDir);
    
    // 复制主要文件
    await fs.copy(path.join(__dirname, 'main.js'), path.join(tempDir, 'main.js'));
    await fs.copy(path.join(__dirname, 'preload.js'), path.join(tempDir, 'preload.js'));
    await fs.copy(path.join(__dirname, 'index.html'), path.join(tempDir, 'index.html'));
    await fs.copy(path.join(__dirname, 'style.css'), path.join(tempDir, 'style.css'));
    await fs.copy(path.join(__dirname, 'renderer.js'), path.join(tempDir, 'renderer.js'));
    await fs.copy(path.join(__dirname, 'VMware.ico'), path.join(tempDir, 'VMware.ico'));
    
    // 创建package.json
    const packageJson = {
      "name": "vmware-plus-plus",
      "version": "1.0.0",
      "main": "main.js",
      "dependencies": {
        "fs-extra": "^10.1.0"
      }
    };
    
    await fs.writeJson(path.join(tempDir, 'package.json'), packageJson);
    
    // 使用asar打包
    execSync(`npx asar pack "${tempDir}" "${path.join(distDir, 'app.asar')}"`, { stdio: 'inherit' });
    
    // 创建一个简单的加载器
    const loaderContent = `
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');

// 获取临时目录
const tempDir = path.join(os.tmpdir(), 'vmware-plus-plus-' + Date.now());
fs.mkdirSync(tempDir, { recursive: true });

// 解压asar文件到临时目录
execSync('node -e "require(\\'asar\\').extract(\\'' + process.argv[1] + '\\', \\'' + tempDir + '\\')"');

// 加载应用
const appPath = path.join(tempDir, 'main.js');

// 设置应用路径
app.setPath('userData', path.join(os.tmpdir(), 'vmware-plus-plus-data'));

app.whenReady().then(() => {
  const createWindow = () => {
    const mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        preload: path.join(tempDir, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true
      },
      icon: path.join(tempDir, 'VMware.ico'),
      frame: false
    });

    mainWindow.loadFile(path.join(tempDir, 'index.html'));
  };

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    // 清理临时文件
    try {
      require('rimraf').sync(tempDir);
    } catch (e) {
      // 忽略清理错误
    }
  }
});
`;
    
    await fs.writeFile(path.join(distDir, 'loader.js'), loaderContent);
    
    // 复制electron和asar到dist-single目录
    const nodeModulesPath = path.join(__dirname, 'node_modules');
    const distNodeModulesPath = path.join(distDir, 'node_modules');
    
    // 复制必要的依赖
    await fs.copy(path.join(nodeModulesPath, 'electron'), path.join(distNodeModulesPath, 'electron'));
    await fs.copy(path.join(nodeModulesPath, 'asar'), path.join(distNodeModulesPath, 'asar'));
    await fs.copy(path.join(nodeModulesPath, 'fs-extra'), path.join(distNodeModulesPath, 'fs-extra'));
    await fs.copy(path.join(nodeModulesPath, 'rimraf'), path.join(distNodeModulesPath, 'rimraf'));
    
    console.log('单文件版本创建成功！');
    console.log('文件位置:', path.join(distDir, 'app.asar'));
    
    // 清理临时目录
    await fs.remove(tempDir);
    
  } catch (error) {
    console.error('创建单文件版本时出错:', error);
  }
}

createSingleFile();