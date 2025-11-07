const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

// 创建自解压exe的脚本
async function createSFX() {
  try {
    // 确保输出目录存在
    const outputDir = path.join(__dirname, 'dist-sfx');
    await fs.ensureDir(outputDir);
    
    // 创建临时目录
    const tempDir = path.join(__dirname, 'temp-sfx');
    await fs.ensureDir(tempDir);
    
    // 复制应用程序文件到临时目录
    const appDir = path.join(__dirname, 'dist-electron', 'win-unpacked');
    if (await fs.pathExists(appDir)) {
      await fs.copy(appDir, tempDir);
    } else {
      console.error('应用程序目录不存在:', appDir);
      return;
    }
    
    // 创建7z压缩文件
    const sevenZipPath = path.join(__dirname, 'node_modules', '7zip-bin', '7za.exe');
    const archivePath = path.join(outputDir, 'app.7z');
    
    // 使用7z创建压缩文件
    execSync(`"${sevenZipPath}" a -t7z "${archivePath}" "${tempDir}\\*"`, { stdio: 'inherit' });
    
    // 创建SFX配置文件
    const sfxConfig = `
;!@Install@!UTF-8!
Title="VMware++ 修改器"
BeginPrompt="是否要运行 VMware++ 修改器？"
RunProgram="VMware++ 修改器.exe"
;!@InstallEnd@!UTF-8!
`;
    
    const configPath = path.join(outputDir, 'config.txt');
    await fs.writeFile(configPath, sfxConfig);
    
    // 下载7z SFX模块（如果不存在）
    const sfxModulePath = path.join(outputDir, '7zS.sfx');
    if (!await fs.pathExists(sfxModulePath)) {
      console.log('请手动下载7z SFX模块到:', sfxModulePath);
      console.log('下载地址: https://www.7-zip.org/download.html');
      console.log('然后重新运行此脚本');
      return;
    }
    
    // 创建自解压exe
    const finalExePath = path.join(outputDir, 'VMware++ 修改器.exe');
    execSync(`copy /b "${sfxModulePath}" + "${configPath}" + "${archivePath}" "${finalExePath}"`, { 
      stdio: 'inherit',
      shell: 'cmd'
    });
    
    console.log('自解压exe创建成功:', finalExePath);
    
    // 清理临时文件
    await fs.remove(tempDir);
    await fs.remove(configPath);
    await fs.remove(archivePath);
    
  } catch (error) {
    console.error('创建自解压exe时出错:', error);
  }
}

createSFX();