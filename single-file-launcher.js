const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const zlib = require('zlib');

// 启动器程序 - 真正的单文件exe版本
(function() {
  // 获取当前exe文件路径
  const exePath = process.execPath;
  const tempDir = path.join(os.tmpdir(), 'vmware-plus-plus-' + Date.now());
  
  try {
    // 创建临时目录
    fs.mkdirSync(tempDir, { recursive: true });
    
    // 从exe文件中提取嵌入的应用程序数据
    // 注意：在实际的构建过程中，我们会将应用程序数据附加到exe文件的末尾
    extractAppData(exePath, tempDir);
    
    // 启动应用程序
    launchApp(tempDir);
    
  } catch (error) {
    console.error('启动应用程序时出错:', error);
    cleanup(tempDir);
  }
})();

// 提取应用程序数据
function extractAppData(exePath, tempDir) {
  // 这是一个简化的实现
  // 在实际构建过程中，我们会将应用程序数据压缩后附加到exe文件末尾
  // 并在这里解压到临时目录
  
  // 创建必要的目录结构
  const dirs = ['dist', 'dist/locales'];
  dirs.forEach(dir => {
    fs.mkdirSync(path.join(tempDir, dir), { recursive: true });
  });
  
  // 复制必要的文件（在实际构建中，这些文件会被嵌入到exe中）
  // 这里我们只是创建一些占位符文件来演示结构
  const files = [
    'dist/electron.exe',
    'dist/resources/default_app.asar',
    'dist/chrome_100_percent.pak',
    'dist/chrome_200_percent.pak',
    'dist/resources.pak',
    'dist/icudtl.dat',
    'dist/vk_swiftshader_icd.json',
    'main.js',
    'preload.js',
    'index.html',
    'style.css',
    'renderer.js'
  ];
  
  files.forEach(file => {
    const filePath = path.join(tempDir, file);
    fs.writeFileSync(filePath, `// Placeholder for ${file}`);
  });
}

// 启动应用程序
function launchApp(tempDir) {
  const electronPath = path.join(tempDir, 'dist', 'electron.exe');
  const mainJsPath = path.join(tempDir, 'main.js');
  
  // 设置环境变量
  process.env.ELECTRON_RUN_AS_NODE = '';
  
  // 启动Electron应用程序
  const child = spawn(electronPath, [mainJsPath], {
    cwd: tempDir,
    stdio: 'inherit',
    env: process.env
  });
  
  // 监听子进程退出
  child.on('close', (code) => {
    console.log(`Electron应用退出，退出码: ${code}`);
    cleanup(tempDir);
  });
  
  // 监听主进程退出，确保清理临时文件
  process.on('exit', () => {
    cleanup(tempDir);
  });
  
  // 监听中断信号
  process.on('SIGINT', () => {
    cleanup(tempDir);
    process.exit(0);
  });
  
  // 监听未捕获的异常
  process.on('uncaughtException', (error) => {
    console.error('未捕获的异常:', error);
    cleanup(tempDir);
    process.exit(1);
  });
}

// 清理临时文件
function cleanup(tempDir) {
  try {
    if (fs.existsSync(tempDir)) {
      // 使用rimraf递归删除目录
      execSync(`rd /s /q "${tempDir}"`, { 
        stdio: 'ignore',
        shell: 'cmd'
      });
    }
  } catch (e) {
    // 忽略清理错误
    console.warn('清理临时文件时出错:', e.message);
  }
}