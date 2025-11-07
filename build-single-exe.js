const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 构建真正的单文件exe版本
async function buildSingleExe() {
  try {
    console.log('开始构建单文件exe版本...');
    
    // 确保输出目录存在
    const outputDir = path.join(__dirname, 'dist-single-final');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 1. 使用pkg将启动器打包为exe
    console.log('1. 打包启动器...');
    execSync('npx pkg single-file-launcher.js --targets node16-win-x64 --output temp-launcher.exe', { 
      stdio: 'inherit' 
    });
    
    // 2. 创建应用程序数据包
    console.log('2. 创建应用程序数据包...');
    const appDir = path.join(__dirname, 'dist-electron', 'win-unpacked');
    if (!fs.existsSync(appDir)) {
      throw new Error('应用程序目录不存在，请先运行electron-builder构建应用');
    }
    
    // 使用7z创建压缩包
    execSync(`7z a -tzip temp-app.zip "${appDir}\\*"`, { 
      stdio: 'inherit' 
    });
    
    // 3. 将应用程序数据附加到启动器exe
    console.log('3. 创建最终的单文件exe...');
    const launcherExe = fs.readFileSync('temp-launcher.exe');
    const appData = fs.readFileSync('temp-app.zip');
    
    // 创建最终的exe文件
    const finalExePath = path.join(outputDir, 'VMware++ 修改器.exe');
    const finalExe = Buffer.concat([launcherExe, appData]);
    fs.writeFileSync(finalExePath, finalExe);
    
    // 4. 清理临时文件
    console.log('4. 清理临时文件...');
    if (fs.existsSync('temp-launcher.exe')) {
      fs.unlinkSync('temp-launcher.exe');
    }
    if (fs.existsSync('temp-app.zip')) {
      fs.unlinkSync('temp-app.zip');
    }
    
    console.log('构建完成！');
    console.log('单文件exe位置:', finalExePath);
    console.log('文件大小:', fs.statSync(finalExePath).size / (1024 * 1024), 'MB');
    
  } catch (error) {
    console.error('构建单文件exe时出错:', error);
  }
}

buildSingleExe();