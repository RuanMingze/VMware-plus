const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// 获取应用程序路径
const appPath = path.dirname(process.execPath);
const tempDir = path.join(os.tmpdir(), 'vmware-plus-plus-' + Date.now());

// 创建临时目录
fs.mkdirSync(tempDir, { recursive: true });

// 复制应用程序文件到临时目录
function copyFileSync(source, target) {
  let targetFile = target;
  
  // 如果目标是目录，则在目录中创建同名文件
  if (fs.existsSync(target) && fs.lstatSync(target).isDirectory()) {
    targetFile = path.join(target, path.basename(source));
  }
  
  fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function copyFolderRecursiveSync(source, target) {
  let files = [];
  
  // 检查源目录是否存在
  if (!fs.existsSync(source)) {
    return;
  }
  
  // 创建目标目录
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
  
  // 复制所有文件和子目录
  if (fs.lstatSync(source).isDirectory()) {
    files = fs.readdirSync(source);
    files.forEach(function (file) {
      const curSource = path.join(source, file);
      if (fs.lstatSync(curSource).isDirectory()) {
        copyFolderRecursiveSync(curSource, path.join(target, file));
      } else {
        copyFileSync(curSource, target);
      }
    });
  }
}

// 复制应用程序文件
try {
  copyFolderRecursiveSync(path.join(appPath, 'app'), tempDir);
  
  // 启动Electron应用程序
  const electronPath = path.join(appPath, 'electron', 'electron.exe');
  const mainJsPath = path.join(tempDir, 'main.js');
  
  const child = spawn(electronPath, [mainJsPath], {
    cwd: tempDir,
    stdio: 'inherit'
  });
  
  // 监听子进程退出
  child.on('close', (code) => {
    console.log(`Electron应用退出，退出码: ${code}`);
    
    // 清理临时文件
    try {
      require('rimraf').sync(tempDir);
    } catch (e) {
      // 忽略清理错误
    }
  });
  
  // 监听主进程退出，确保清理临时文件
  process.on('exit', () => {
    try {
      require('rimraf').sync(tempDir);
    } catch (e) {
      // 忽略清理错误
    }
  });
  
  // 监听中断信号
  process.on('SIGINT', () => {
    try {
      require('rimraf').sync(tempDir);
    } catch (e) {
      // 忽略清理错误
    }
    process.exit(0);
  });
  
} catch (error) {
  console.error('启动应用程序时出错:', error);
  
  // 清理临时文件
  try {
    require('rimraf').sync(tempDir);
  } catch (e) {
    // 忽略清理错误
  }
}