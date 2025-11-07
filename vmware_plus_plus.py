import os
import sys
import tkinter as tk
from tkinter import filedialog, messagebox, ttk
import threading

# 此应用是VMware++的py版本，已经废弃

class VMwarePlusPlus:
    def __init__(self, root):
        self.root = root
        self.root.title("VMware++ 修改器")
        self.root.geometry("600x500")
        self.root.resizable(True, True)
        self.root.minsize(500, 400)
        
        # 设置紫色主题
        self.bg_color = "#8e44ad"  # 主背景色
        self.frame_color = "#9b59b6"  # 框架背景色
        self.text_color = "#ffffff"  # 文字颜色
        self.button_color = "#a569bd"  # 按钮背景色
        self.highlight_color = "#c39bd3"  # 高亮颜色
        
        # 尝试设置窗口图标
        try:
            icon_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "VMware.ico")
            if os.path.exists(icon_path):
                self.root.iconbitmap(icon_path)
        except:
            pass  # 如果图标设置失败，继续运行
        
        # 设置界面风格
        self.setup_ui()
        
    def setup_ui(self):
        # 创建主框架
        main_frame = tk.Frame(self.root, bg=self.bg_color, padx=20, pady=20)
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # 尝试添加背景图片
        try:
            from PIL import Image, ImageTk
            icon_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "VMware.ico")
            if os.path.exists(icon_path):
                # 加载图标作为背景
                image = Image.open(icon_path)
                # 调整图像大小以适应窗口
                image = image.resize((128, 128))
                self.bg_image = ImageTk.PhotoImage(image)
                
                # 创建一个标签来显示背景图像
                bg_label = tk.Label(main_frame, image=self.bg_image, bg=self.bg_color)
                bg_label.place(relx=0.5, rely=0.5, anchor=tk.CENTER)
        except Exception as e:
            # 如果PIL不可用或图像加载失败，则使用纯色背景
            print(f"无法加载背景图像: {e}")
        
        # 标题
        title_label = tk.Label(main_frame, text="VMware++ 修改器", 
                              font=("微软雅黑", 16, "bold"), 
                              bg=self.bg_color, fg=self.text_color)
        title_label.pack(pady=(0, 20))
        
        # 虚拟机目录选择框架
        dir_frame = tk.Frame(main_frame, bg=self.bg_color)
        dir_frame.pack(fill=tk.X, pady=(0, 10))
        
        vm_dir_label = tk.Label(dir_frame, text="虚拟机目录:", 
                               font=("微软雅黑", 10, "bold"), 
                               bg=self.bg_color, fg=self.text_color)
        vm_dir_label.pack(anchor=tk.W)
        
        # 目录选择控件
        dir_control_frame = tk.Frame(dir_frame, bg=self.bg_color)
        dir_control_frame.pack(fill=tk.X, pady=5)
        
        self.vm_dir_var = tk.StringVar()
        vm_dir_entry = tk.Entry(dir_control_frame, textvariable=self.vm_dir_var, 
                               width=50, font=("微软雅黑", 9),
                               bg=self.frame_color, fg=self.text_color,
                               insertbackground=self.text_color)
        vm_dir_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 10))
        
        browse_btn = tk.Button(dir_control_frame, text="浏览...", 
                              command=self.browse_directory,
                              font=("微软雅黑", 9), 
                              bg=self.button_color, fg=self.text_color,
                              activebackground=self.highlight_color,
                              activeforeground=self.text_color)
        browse_btn.pack(side=tk.RIGHT)
        
        # 功能选项框架
        option_frame = tk.LabelFrame(main_frame, text="修改选项", 
                                    font=("微软雅黑", 10, "bold"), 
                                    bg=self.bg_color, fg=self.text_color,
                                    padx=15, pady=15)
        option_frame.pack(fill=tk.X, pady=10)
        
        # SMC 仿真选项
        self.smc_var = tk.BooleanVar()
        smc_check = tk.Checkbutton(
            option_frame, 
            text="为 macOS 虚拟机启用 SMC 仿真 (添加: smc.version = \"0\")",
            variable=self.smc_var,
            font=("微软雅黑", 9),
            bg=self.bg_color,
            fg=self.text_color,
            selectcolor=self.frame_color,
            activebackground=self.bg_color,
            activeforeground=self.text_color,
            anchor=tk.W
        )
        smc_check.pack(fill=tk.X, pady=5)
        
        # AMD 兼容层选项
        self.amd_var = tk.BooleanVar()
        amd_check = tk.Checkbutton(
            option_frame, 
            text="为 macOS 的 AMD CPU 用户添加兼容层",
            variable=self.amd_var,
            font=("微软雅黑", 9),
            bg=self.bg_color,
            fg=self.text_color,
            selectcolor=self.frame_color,
            activebackground=self.bg_color,
            activeforeground=self.text_color,
            anchor=tk.W
        )
        amd_check.pack(fill=tk.X, pady=5)
        
        # 禁用自动挂起选项
        self.suspend_var = tk.BooleanVar()
        suspend_check = tk.Checkbutton(
            option_frame, 
            text="禁用自动挂起 (添加: suspend.disabled = \"TRUE\")",
            variable=self.suspend_var,
            font=("微软雅黑", 9),
            bg=self.bg_color,
            fg=self.text_color,
            selectcolor=self.frame_color,
            activebackground=self.bg_color,
            activeforeground=self.text_color,
            anchor=tk.W
        )
        suspend_check.pack(fill=tk.X, pady=5)
        
        # 操作按钮框架
        button_frame = tk.Frame(main_frame, bg=self.bg_color)
        button_frame.pack(pady=20)
        
        self.apply_btn = tk.Button(button_frame, text="应用修改", 
                                  command=self.apply_modifications,
                                  font=("微软雅黑", 9), 
                                  bg=self.button_color, fg=self.text_color,
                                  activebackground=self.highlight_color,
                                  activeforeground=self.text_color)
        self.apply_btn.pack(side=tk.LEFT, padx=(0, 15))
        
        exit_btn = tk.Button(button_frame, text="退出", 
                            command=self.root.quit,
                            font=("微软雅黑", 9), 
                            bg=self.button_color, fg=self.text_color,
                            activebackground=self.highlight_color,
                            activeforeground=self.text_color)
        exit_btn.pack(side=tk.LEFT)
        
        # 进度条
        self.progress = ttk.Progressbar(main_frame, mode='indeterminate', length=300)
        self.progress.pack(fill=tk.X, pady=10)
        
        # 状态标签
        self.status_var = tk.StringVar()
        self.status_var.set("请选择虚拟机目录并选择修改选项")
        status_label = tk.Label(main_frame, textvariable=self.status_var, 
                               bg=self.bg_color, fg=self.highlight_color, 
                               font=("微软雅黑", 9))
        status_label.pack(pady=5)
        
        # 日志文本框框架
        log_frame = tk.LabelFrame(main_frame, text="操作日志", 
                                 font=("微软雅黑", 10, "bold"), 
                                 bg=self.bg_color, fg=self.text_color,
                                 padx=10, pady=10)
        log_frame.pack(fill=tk.BOTH, expand=True, pady=10)
        
        # 日志文本框和滚动条
        log_inner_frame = tk.Frame(log_frame, bg=self.bg_color)
        log_inner_frame.pack(fill=tk.BOTH, expand=True)
        
        self.log_text = tk.Text(log_inner_frame, height=8, width=60, 
                               font=("微软雅黑", 8), 
                               bg=self.frame_color, fg=self.text_color,
                               wrap=tk.WORD)
        scrollbar = tk.Scrollbar(log_inner_frame, orient=tk.VERTICAL, command=self.log_text.yview)
        self.log_text.configure(yscrollcommand=scrollbar.set)
        
        self.log_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
    def browse_directory(self):
        """浏览并选择虚拟机目录"""
        directory = filedialog.askdirectory(title="选择虚拟机目录")
        if directory:
            self.vm_dir_var.set(directory)
            self.log_message(f"已选择目录: {directory}")
            
    def log_message(self, message):
        """在日志框中添加消息"""
        self.log_text.insert(tk.END, f"{message}\n")
        self.log_text.see(tk.END)
        self.root.update_idletasks()
        
    def find_vmx_files(self, directory):
        """查找指定目录下的所有 .vmx 文件"""
        vmx_files = []
        try:
            if not os.path.exists(directory):
                self.log_message(f"错误: 目录不存在 - {directory}")
                return vmx_files
                
            if not os.access(directory, os.R_OK):
                self.log_message(f"错误: 没有权限访问目录 - {directory}")
                return vmx_files
                
            for root, dirs, files in os.walk(directory):
                for file in files:
                    if file.endswith('.vmx'):
                        vmx_files.append(os.path.join(root, file))
        except PermissionError:
            self.log_message(f"错误: 拒绝访问目录 - {directory}")
        except Exception as e:
            self.log_message(f"查找 .vmx 文件时出错: {str(e)}")
        return vmx_files
        
    def modify_vmx_file(self, filepath, enable_smc, enable_amd, disable_suspend):
        """修改单个 .vmx 文件"""
        try:
            # 检查文件是否存在
            if not os.path.exists(filepath):
                return False, [f"错误: 文件不存在 - {filepath}"]
                
            # 检查文件访问权限
            if not os.access(filepath, os.R_OK):
                return False, [f"错误: 没有读取权限 - {filepath}"]
                
            if not os.access(filepath, os.W_OK):
                return False, [f"错误: 没有写入权限 - {filepath}"]
            
            # 先将 .vmx 文件重命名为 .txt 文件
            txt_filepath = filepath + ".txt"
            try:
                os.rename(filepath, txt_filepath)
            except PermissionError:
                return False, [f"错误: 拒绝访问，无法重命名文件 - {filepath}"]
            except FileNotFoundError:
                return False, [f"错误: 文件未找到，无法重命名 - {filepath}"]
            except Exception as e:
                return False, [f"错误: 重命名文件时出错 - {str(e)}"]
            
            # 读取现有内容
            try:
                with open(txt_filepath, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
            except PermissionError:
                # 如果读取失败，尝试恢复原文件名
                try:
                    os.rename(txt_filepath, filepath)
                except:
                    pass
                return False, [f"错误: 拒绝访问，无法读取文件 - {txt_filepath}"]
            except Exception as e:
                # 如果读取失败，尝试恢复原文件名
                try:
                    os.rename(txt_filepath, filepath)
                except:
                    pass
                return False, [f"错误: 读取文件时出错 - {str(e)}"]
                
            # 处理 SMC 设置
            new_lines = []
            smc_exists = any('smc.version' in line.lower() for line in lines)
            
            if enable_smc and not smc_exists:
                # 添加 SMC 设置
                new_lines.append('smc.version = "0"\n')
            elif not enable_smc and smc_exists:
                # 删除已存在的 SMC 设置
                lines = [line for line in lines if 'smc.version' not in line.lower()]
            
            # 处理 AMD 兼容层设置
            amd_settings = [
                'smc.version = "0"\n',
                'cpuid.0.eax = "0000:0000:0000:0001:0000:0110:0111:0001"\n',
                'cpuid.0.ebx = "0000:0010:0000:0001:0000:1000:0000:0000"\n',
                'cpuid.0.ecx = "1000:0010:1001:1000:0010:0010:0000:0011"\n',
                'cpuid.0.edx = "0000:0111:1000:1011:1111:1011:1111:1111"\n',
                'cpuid.1.eax = "0000:0000:0000:0001:0000:0110:0111:0001"\n',
                'cpuid.1.ebx = "0000:0010:0000:0001:0000:1000:0000:0000"\n',
                'cpuid.1.ecx = "1000:0010:1001:1000:0010:0010:0000:0011"\n',
                'cpuid.1.edx = "0000:0111:1000:1011:1111:1011:1111:1111"\n',
                'smbios.reflectHost = "TRUE"\n',
                'hw.model = "MacBookPro14,3"\n',
                'board-id = "Mac-551B86E5744E2388"\n',
                'keyboard.vusb.enable = "TRUE"\n',
                'mouse.vusb.enable = "TRUE"\n'
            ]
            
            # 检查是否已存在 AMD 设置
            amd_exists = any('cpuid.0.eax' in line.lower() for line in lines)
            
            if enable_amd and not amd_exists:
                # 添加 AMD 兼容层设置
                new_lines.extend(amd_settings)
            elif not enable_amd and amd_exists:
                # 删除已存在的 AMD 兼容层设置
                lines = [line for line in lines if not any(setting.strip().split(' = ')[0] in line for setting in amd_settings)]
            
            # 处理自动挂起设置
            suspend_exists = any('suspend.disabled' in line.lower() for line in lines)
            
            if disable_suspend and not suspend_exists:
                # 添加禁用自动挂起设置
                new_lines.append('suspend.disabled = "TRUE"\n')
            elif not disable_suspend and suspend_exists:
                # 删除已存在的禁用自动挂起设置
                lines = [line for line in lines if 'suspend.disabled' not in line.lower()]
                
            # 将所有内容写入新的 .vmx 文件
            try:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.writelines(lines)  # 写入原始内容（可能已过滤掉要删除的行）
                    if new_lines:  # 如果有新增内容，则添加
                        f.writelines(new_lines)
            except PermissionError:
                # 如果写入失败，尝试恢复原文件
                try:
                    os.rename(txt_filepath, filepath)
                except:
                    pass
                return False, [f"错误: 拒绝访问，无法写入文件 - {filepath}"]
            except Exception as e:
                # 如果写入失败，尝试恢复原文件
                try:
                    os.rename(txt_filepath, filepath)
                except:
                    pass
                return False, [f"错误: 写入文件时出错 - {str(e)}"]
            
            # 删除临时的 .txt 文件
            try:
                os.remove(txt_filepath)
            except Exception as e:
                self.log_message(f"警告: 无法删除临时文件 {txt_filepath} - {str(e)}")
            
            return len(new_lines) > 0 or (enable_smc != smc_exists) or (enable_amd != amd_exists) or (disable_suspend != suspend_exists), new_lines
        except Exception as e:
            return False, [f"错误: {str(e)}"]
            
    def apply_modifications(self):
        """应用所选修改"""
        # 检查是否选择了目录
        vm_dir = self.vm_dir_var.get().strip()
        if not vm_dir:
            messagebox.showwarning("警告", "请先选择虚拟机目录!")
            return
            
        # 检查是否选择了至少一个选项
        if not self.smc_var.get() and not self.amd_var.get() and not self.suspend_var.get():
            messagebox.showwarning("警告", "请至少选择一个修改选项!")
            return
            
        # 在后台线程中执行修改
        thread = threading.Thread(target=self._apply_modifications_thread)
        thread.daemon = True
        thread.start()
        
    def _apply_modifications_thread(self):
        """在后台线程中执行修改操作"""
        # 更新界面
        self.root.after(0, lambda: self.apply_btn.config(state='disabled'))
        self.root.after(0, lambda: self.progress.start())
        self.root.after(0, lambda: self.status_var.set("正在处理..."))
        
        try:
            # 获取选项
            enable_smc = self.smc_var.get()
            enable_amd = self.amd_var.get()
            disable_suspend = self.suspend_var.get()
            
            # 检查目录是否为空
            vm_dir = self.vm_dir_var.get().strip()
            if not vm_dir:
                self.root.after(0, lambda: self.log_message("错误: 未选择虚拟机目录!"))
                return
                
            # 查找 .vmx 文件
            self.root.after(0, lambda: self.log_message("正在查找 .vmx 文件..."))
            vmx_files = self.find_vmx_files(vm_dir)
            
            if not vmx_files:
                self.root.after(0, lambda: self.log_message("未找到任何 .vmx 文件! 请检查目录路径是否正确。"))
                return
                
            self.root.after(0, lambda: self.log_message(f"找到 {len(vmx_files)} 个 .vmx 文件"))
            
            # 处理每个 .vmx 文件
            modified_count = 0
            error_count = 0
            for i, filepath in enumerate(vmx_files):
                self.root.after(0, lambda p=i+1, t=len(vmx_files): 
                               self.status_var.set(f"正在处理 ({p}/{t}): {os.path.basename(filepath)}"))
                
                success, changes = self.modify_vmx_file(filepath, enable_smc, enable_amd, disable_suspend)
                filename = os.path.basename(filepath)
                
                if success:
                    modified_count += 1
                    self.root.after(0, lambda f=filename, c=changes: 
                                   self.log_message(f"已修改: {f}"))
                    for change in changes:
                        self.root.after(0, lambda ch=change.strip(), f=filename: 
                                       self.log_message(f"  -> 添加: {ch}"))
                else:
                    error_count += 1
                    if changes:  # 有错误信息
                        self.root.after(0, lambda f=filename, e=changes[0]: 
                                       self.log_message(f"错误 ({f}): {e}"))
                    else:  # 已存在配置
                        self.root.after(0, lambda f=filename: 
                                       self.log_message(f"跳过 (已存在配置): {f}"))
                        
            # 完成
            self.root.after(0, lambda: self.log_message(f"\n处理完成!"))
            self.root.after(0, lambda: self.log_message(f"成功修改: {modified_count} 个文件"))
            if error_count > 0:
                self.root.after(0, lambda: self.log_message(f"处理失败: {error_count} 个文件"))
            
        except Exception as e:
            self.root.after(0, lambda: self.log_message(f"发生未预期的错误: {str(e)}"))
        finally:
            # 恢复界面
            self.root.after(0, lambda: self.apply_btn.config(state='normal'))
            self.root.after(0, lambda: self.progress.stop())
            self.root.after(0, lambda: self.status_var.set("处理完成"))

def main():
    root = tk.Tk()
    app = VMwarePlusPlus(root)
    root.mainloop()

if __name__ == "__main__":
    main()