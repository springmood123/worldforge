# WorldForge 部署指南 🚀

## 📋 目录
1. [方案选择](#方案选择)
2. [方案一：Vercel 部署（推荐）](#方案一vercel-部署推荐)
3. [方案二：Netlify 部署](#方案二netlify-部署)
4. [方案三：局域网分享（免费快速）](#方案三局域网分享免费快速)
5. [环境变量配置](#环境变量配置)
6. [常见问题](#常见问题)

---

## 方案选择

| 方案 | 费用 | 难度 | 速度 | 推荐度 |
|------|------|------|------|--------|
| Vercel | 免费 | ⭐⭐ | 🚀极快 | ⭐⭐⭐⭐⭐ |
| Netlify | 免费 | ⭐⭐ | 🚀快 | ⭐⭐⭐⭐ |
| 局域网 | 免费 | ⭐ | 🚀快 | ⭐⭐⭐ |

---

## 方案一：Vercel 部署（推荐）⭐⭐⭐⭐⭐

Vercel 是 Next.js 官方推荐的部署平台，部署最简单快速！

### 前置准备

1. **安装 Git**
   - 下载地址：https://git-scm.com/download/win
   - 安装后重启终端

2. **注册 GitHub 账号**
   - 访问：https://github.com
   - 创建免费账号

3. **注册 Vercel 账号**
   - 访问：https://vercel.com
   - 使用 GitHub 账号登录

### 部署步骤

#### 第 1 步：初始化 Git 仓库

打开终端，在项目目录执行：

```bash
# 初始化 Git
git init

# 添加所有文件
git add .

# 第一次提交
git commit -m "Initial commit"
```

#### 第 2 步：创建 GitHub 仓库

1. 访问 https://github.com/new
2. 仓库名称：`worldforge`（或你喜欢的名字）
3. 选择 Public 或 Private
4. 点击 **Create repository**

#### 第 3 步：推送到 GitHub

按照 GitHub 页面上的说明，执行：

```bash
# 添加远程仓库（替换 YOUR_USERNAME 和 YOUR_REPO）
git remote add origin https://github.com/YOUR_USERNAME/worldforge.git

# 推送到 main 分支
git branch -M main
git push -u origin main
```

#### 第 4 步：在 Vercel 部署

1. 访问 https://vercel.com/new
2. 点击 **Import** 导入你的 GitHub 仓库
3. 在项目设置中配置环境变量：
   ```
   ZHIPU_API_KEY=你的智谱API密钥
   ```
4. 点击 **Deploy** 部署！

#### 第 5 步：获取网址

部署成功后，Vercel 会给你一个网址，类似：
- `https://worldforge.vercel.app`
- 或者你可以设置自定义域名

### 特点
✅ **免费** - 有免费额度，足够个人使用  
✅ **自动部署** - 每次推送到 GitHub 自动更新  
✅ **快速** - 全球 CDN，访问速度快  
✅ **简单** - 无需服务器管理  

---

## 方案二：Netlify 部署 ⭐⭐⭐⭐

Netlify 也是一个很棒的部署平台，同样免费！

### 部署步骤

1. **注册 Netlify**
   - 访问：https://www.netlify.com
   - 使用 GitHub 登录

2. **导入项目**
   - 点击 **New site from Git**
   - 选择 GitHub
   - 选择你的 worldforge 仓库

3. **配置部署**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - 添加环境变量：
     ```
     ZHIPU_API_KEY=你的智谱API密钥
     ```

4. **点击 Deploy site**

5. **获取网址**
   - 部署成功后会得到类似 `https://worldforge-xyz.netlify.app` 的网址

### 特点
✅ **免费** - 同样有免费额度  
✅ **简单** - 图形界面操作  
✅ **功能多** - 表单处理、A/B测试等  
✅ **自动 HTTPS** - 安全可靠  

---

## 方案三：局域网分享（免费快速）⭐⭐⭐

如果你只是想在同一个 Wi-Fi 下的设备间分享，可以用这个方案！

### Windows 上的操作

#### 方法 1：使用 Next.js dev 服务器（推荐）

```bash
# 1. 运行开发服务器（绑定到所有网络接口）
npm run dev -- -H 0.0.0.0 -p 3000
```

#### 方法 2：使用生产模式

```bash
# 1. 先构建
npm run build

# 2. 启动生产服务器
npm start -- -H 0.0.0.0 -p 3000
```

#### 方法 3：使用本地 IP 访问

1. **查看你的 IP 地址**
   ```bash
   ipconfig
   ```
   找到 `IPv4 Address`，类似：`192.168.1.100`

2. **同一 Wi-Fi 下的设备访问**
   在手机/平板/其他电脑浏览器输入：
   ```
   http://192.168.1.100:3000
   ```

3. **允许防火墙**
   Windows 防火墙可能会弹出提示，点击 **允许访问**

#### 方法 4：使用 ngrok（公网访问）

如果要从任何地方访问（不仅仅是局域网），使用 ngrok：

```bash
# 1. 下载 ngrok
# 访问：https://ngrok.com/download

# 2. 先运行 Next.js
npm run dev

# 3. 打开新终端，运行 ngrok
ngrok http 3000

# 4. ngrok 会给你一个公网网址，类似：
# https://abc123.ngrok-free.app
```

### 特点
✅ **完全免费** - 不需要任何云服务  
✅ **极快** - 本地网络，无延迟  
✅ **简单** - 不需要额外注册账号  
❌ **仅限局域网** - 或需要 ngrok 公网  

---

## 环境变量配置

### 重要：设置 API 密钥

无论使用哪种部署方案，都需要设置 `ZHIPU_API_KEY`。

#### 在 Vercel 设置
1. 进入项目设置
2. 找到 **Environment Variables**
3. 添加：
   ```
   Name: ZHIPU_API_KEY
   Value: 你的智谱API密钥（不带引号）
   ```
4. 重新部署

#### 在 Netlify 设置
1. 进入 Site settings
2. 找到 **Environment variables**
3. 添加环境变量

#### 在本地开发
创建 `.env.local` 文件（已在 .gitignore 中）：
```
ZHIPU_API_KEY=你的智谱API密钥
```

---

## 常见问题

### Q1: 部署后 API 调用失败？
**A**: 检查环境变量是否正确配置，确保没有拼写错误。

### Q2: 域名可以自定义吗？
**A**: 可以！Vercel 和 Netlify 都支持自定义域名，或者你可以购买域名绑定。

### Q3: 免费额度够用吗？
**A**: 对于个人学习/小项目完全够用，免费额度很充裕。

### Q4: 部署后如何更新？
**A**: 只需推送到 GitHub，Vercel/Netlify 会自动重新部署！

### Q5: 局域网访问不了？
**A**: 检查：
1. 是否在同一 Wi-Fi
2. 防火墙是否允许
3. IP 地址是否正确
4. 端口是否被占用

---

## 🎯 快速开始推荐

### 如果你想快速分享给朋友：
👉 **使用 Vercel** - 最快最简单！

### 如果你只是想在自己手机上测试：
👉 **使用局域网方式** - 免费又快速！

### 如果你想长期运营：
👉 **都可以！** Vercel 和 Netlify 都支持升级。

---

## 📞 需要帮助？

按照上面的步骤操作，如果遇到问题：

1. **查看控制台错误** - 按 F12 打开开发者工具
2. **检查环境变量** - 确认 API 密钥正确
3. **查看部署日志** - Vercel/Netlify 都有详细日志
4. **重新部署** - 有时候重新部署就能解决

---

## 🎉 恭喜！

选择适合你的方案，按照步骤操作，几分钟后你就有一个可以在互联网上访问的 WorldForge 网站了！

**祝你部署顺利！** 🚀
