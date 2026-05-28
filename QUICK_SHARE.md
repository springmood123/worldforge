# WorldForge 局域网/公网快速分享指南 🌐

## 📱 快速开始 - 5分钟搞定！

### 方案 A：局域网分享（同一 Wi-Fi 下）

#### 第 1 步：启动服务器

打开终端，在项目目录执行：

```bash
# 启动开发服务器，绑定到所有网络接口
npm run dev -- -H 0.0.0.0 -p 3000
```

#### 第 2 步：查看你的 IP 地址

**Windows**:
```bash
ipconfig
```

找到类似这样的内容：
```
IPv4 Address: 192.168.1.100
```

**Mac/Linux**:
```bash
ifconfig
```

#### 第 3 步：其他设备访问

在同一 Wi-Fi 下的手机/电脑/平板浏览器中输入：

```
http://你的IP地址:3000
```

例如：
```
http://192.168.1.100:3000
```

#### 第 4 步：允许防火墙（Windows）

Windows 可能会弹出防火墙提示，**点击"允许访问"**！

---

### 方案 B：公网访问（全球任何地方！）

使用 **ngrok** 可以让你的本地项目在全世界访问！

#### 第 1 步：下载 ngrok

访问：https://ngrok.com/download

下载 Windows 版本，解压到任意文件夹。

#### 第 2 步：启动 Next.js

在项目目录运行：
```bash
npm run dev
```

#### 第 3 步：启动 ngrok

打开新终端，进入 ngrok 解压的文件夹，运行：

```bash
ngrok http 3000
```

#### 第 4 步：获取公网网址

ngrok 会显示类似这样的信息：
```
Forwarding  https://abc123def456.ngrok-free.app -> http://localhost:3000
```

把那个 `https://...` 的网址分享给任何人，他们都能访问！

---

## 📋 详细步骤

### Windows 完整指南

#### 1. 打开 PowerShell 或 CMD

按 `Win + X`，选择 "Windows PowerShell" 或 "终端"。

#### 2. 进入项目目录

```bash
cd "d:\大学学习\作业\微专业作业\the world"
```

#### 3. 启动服务器

```bash
npm run dev -- -H 0.0.0.0 -p 3000
```

#### 4. 新终端查看 IP

打开新的终端窗口（不要关闭服务器！）：

```bash
ipconfig
```

找到你的 IPv4 地址，例如：`192.168.1.50`

#### 5. 测试访问

在同一 Wi-Fi 下的其他设备浏览器输入：
```
http://192.168.1.50:3000
```

---

## 🔧 常见问题解决

### 问题 1：连接超时/无法访问

**解决方案**：
1. 确认所有设备在**同一 Wi-Fi**
2. 检查**Windows 防火墙**是否允许 Node.js
   - 打开"Windows 安全中心"
   - 防火墙和网络保护
   - 允许应用通过防火墙
   - 找到 Node.js，勾选"专用"和"公用"

### 问题 2：端口被占用

**解决方案**：
```bash
# 使用其他端口，例如 3001
npm run dev -- -H 0.0.0.0 -p 3001
```

访问时用：`http://你的IP:3001`

### 问题 3：只看到空白页面

**解决方案**：
1. 确认开发服务器正在运行
2. 检查终端是否有错误
3. 尝试在本地浏览器先访问 `http://localhost:3000`

---

## 🌍 使用 ngrok 的完整教程

### 注册 ngrok（可选但推荐）

1. 访问：https://ngrok.com
2. 注册免费账号
3. 在主页找到你的 AuthToken
4. 运行（替换 YOUR_AUTH_TOKEN）：
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

### ngrok 高级功能

#### 自定义子域名（付费）
```bash
ngrok http --domain=yourname.ngrok-free.app 3000
```

#### 检查 ngrok 控制台
打开浏览器访问：`http://localhost:4040`
可以看到请求日志、重新发送请求等！

---

## 📱 多设备测试清单

### 测试设备
- [ ] 你的手机（同一 Wi-Fi）
- [ ] 家里的平板
- [ ] 另一台电脑
- [ ] 朋友的手机（使用 ngrok）

### 测试功能
- [ ] 世界观生成
- [ ] 地图生成
- [ ] 灵感推荐
- [ ] 追问功能
- [ ] 缩放、导航

---

## 🎯 推荐方案选择

### 如果你想：
| 目的 | 推荐方案 |
|------|----------|
| 自己手机测试 | 局域网方式 |
| 给朋友演示 | ngrok 公网 |
| 长期使用 | Vercel 部署 |
| 多人协作 | Vercel/Netlify |

---

## ⚡ 快速命令速查

### 局域网模式
```bash
# 启动
npm run dev -- -H 0.0.0.0 -p 3000

# 查看 IP
ipconfig

# 访问地址
http://你的IP:3000
```

### ngrok 公网模式
```bash
# 终端 1 - 启动 Next.js
npm run dev

# 终端 2 - 启动 ngrok
ngrok http 3000

# 访问地址
https://随机字母.ngrok-free.app
```

---

## 🎉 成功标志

当你看到以下情况，说明成功了！

✅ 开发服务器运行中（终端显示 "ready on"）  
✅ 同一 Wi-Fi 下设备能访问  
✅ 页面加载正常  
✅ 功能可以使用  
✅ 如果用 ngrok，全球都能访问！

---

## 💡 提示

- **局域网方式**：免费、快速，但只能同一 Wi-Fi 用
- **ngrok 方式**：免费、公网，但网址会变
- **Vercel/Netlify**：免费、永久网址，但需要 GitHub

选择最适合你的方式！
