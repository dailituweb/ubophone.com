# Twilio Voice SDK 集成配置指南

## 📞 概述

本项目已成功集成Twilio Voice SDK，实现真实的国际通话功能。用户可以直接从浏览器拨打真实电话号码。

## 🔧 配置步骤

### 1. 获取Twilio账户

1. 注册Twilio账户：https://www.twilio.com/try-twilio
2. 获取以下凭据：
   - Account SID
   - Auth Token
   - API Key & Secret
   - 购买Twilio电话号码

### 2. 创建TwiML应用

1. 登录Twilio控制台
2. 创建新的TwiML应用
3. 配置语音URL：`http://your-domain.com/api/twilio/voice`
4. 记录应用SID

### 3. 环境变量配置

复制 `env.example` 为 `.env` 并填入真实值：

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_API_KEY=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_SECRET=your_api_secret
TWILIO_TWIML_APP_SID=APxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
APP_URL=http://localhost:5000
```

## 🌟 功能特性

### ✅ 已实现功能

- **真实通话**: 直接从浏览器拨打电话
- **通话控制**: 静音/取消静音、挂断
- **实时状态**: 连接状态监控
- **费用计算**: 实时费用跟踪
- **错误处理**: 完善的错误提示

### 🔄 通话流程

1. 用户登录后自动初始化Twilio设备
2. 输入电话号码点击拨号
3. Twilio建立真实通话连接
4. 通话界面显示实时状态和费用
5. 支持通话控制（静音、挂断）
6. 通话结束后显示总费用

## 🎯 API端点

### 后端路由 (`/api/twilio/`)

- `POST /token` - 获取访问令牌
- `GET /rates/:country` - 获取通话费率
- `POST /call` - 发起通话
- `POST /voice` - TwiML语音处理
- `POST /call-status` - 通话状态回调
- `GET /call-history` - 获取通话历史

### 前端服务

- `twilioService.js` - Twilio设备管理
- 自动设备初始化
- 通话状态监听
- 通话控制功能

## 🔐 安全考虑

- 使用JWT认证保护API
- 访问令牌定期刷新
- 费率验证和余额检查
- 通话记录加密存储

## 🚀 部署注意事项

### 生产环境

1. 使用HTTPS域名
2. 配置正确的回调URL
3. 设置Webhook安全验证
4. 监控通话质量和费用

### 测试环境

1. 使用Twilio测试凭据
2. ngrok暴露本地服务用于回调
3. 测试不同国家的通话费率

## 📊 监控和日志

- 通话状态实时监控
- 错误日志记录
- 费用统计和报告
- 用户通话历史

## 🎉 使用说明

1. 确保已配置所有环境变量
2. 启动后端服务：`npm start`
3. 启动前端服务：`npm start`
4. 登录用户账户
5. 在拨号器中输入电话号码
6. 点击绿色电话按钮开始通话

## 💡 故障排除

### 常见问题

1. **设备初始化失败**
   - 检查Twilio凭据
   - 确认网络连接
   - 查看浏览器控制台错误

2. **通话无法建立**
   - 验证电话号码格式
   - 检查余额是否足够
   - 确认TwiML应用配置

3. **音频问题**
   - 检查浏览器麦克风权限
   - 确认网络质量
   - 尝试刷新页面重新初始化

### 开发调试

- 启用Twilio调试日志
- 使用浏览器开发者工具
- 检查WebRTC连接状态
- 监控网络请求和响应 