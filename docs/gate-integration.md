# 门禁/道闸对接指南

本文档说明如何将访客管理系统与门禁/道闸硬件设备进行对接。

## 支持的设备品牌

### 1. 海康威视 (Hikvision)

#### 对接方式
海康威视门禁设备通常使用 ISAPI (Internet Surveillance API) 接口进行对接。

#### 接口调用示例
```javascript
// 开门接口
const axios = require('axios');

async function openHikvisionDoor(device) {
    const url = `http://${device.deviceIp}/ISAPI/AccessControl/RemoteControl/door/1`;
    
    try {
        const response = await axios.put(url, {
            cmd: 'open',
            door: 1
        }, {
            auth: {
                username: device.username || 'admin',
                password: device.password || '12345'
            },
            timeout: 5000
        });
        
        return response.data;
    } catch (err) {
        console.error('海康威视开门失败:', err);
        throw err;
    }
}
```

#### 配置参数
- `deviceIp`: 设备IP地址
- `username`: 设备用户名（默认admin）
- `password`: 设备密码

### 2. 大华 (Dahua)

#### 对接方式
大华门禁设备使用 HTTP API 接口。

#### 接口调用示例
```javascript
async function openDahuaDoor(device) {
    const url = `http://${device.deviceIp}/cgi-bin/accessControl.cgi?action=openDoor&channel=1`;
    
    try {
        const response = await axios.get(url, {
            auth: {
                username: device.username || 'admin',
                password: device.password || 'admin'
            },
            timeout: 5000
        });
        
        return response.data;
    } catch (err) {
        console.error('大华开门失败:', err);
        throw err;
    }
}
```

#### 配置参数
- `deviceIp`: 设备IP地址
- `username`: 设备用户名
- `password`: 设备密码

### 3. 通用HTTP接口

#### 对接方式
对于支持HTTP控制的通用门禁设备，使用RESTful API方式对接。

#### 接口规范
```javascript
async function openGenericDoor(device) {
    const url = device.apiUrl; // 例如: http://192.168.1.100/api/open
    
    try {
        const response = await axios.post(url, {
            action: 'open',
            deviceCode: device.deviceCode,
            timestamp: Date.now(),
            sign: generateSign(device) // 签名验证
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${device.apiKey}`
            },
            timeout: 5000
        });
        
        return response.data;
    } catch (err) {
        console.error('通用门禁开门失败:', err);
        throw err;
    }
}
```

#### 配置参数
- `apiUrl`: 设备API地址
- `apiKey`: API密钥（可选）
- `apiSecret`: 签名密钥（可选）

## 道闸对接

### 车牌识别道闸

对于车牌识别道闸，需要在访客预约时收集车牌号码，并在核验时进行比对。

#### 对接流程
1. 访客预约时填写车牌号码
2. 车辆到达时，摄像头识别车牌
3. 系统比对车牌与预约记录
4. 自动开闸放行

#### 接口示例
```javascript
async function triggerBarrier(device, licensePlate) {
    const url = `http://${device.deviceIp}/api/barrier/open`;
    
    try {
        const response = await axios.post(url, {
            licensePlate,
            deviceCode: device.deviceCode,
            timestamp: Date.now()
        });
        
        return response.data;
    } catch (err) {
        console.error('道闸开启失败:', err);
        throw err;
    }
}
```

## 数据库配置

### 门禁设备表 (gate_devices)

```json
{
    "deviceCode": "设备唯一编码",
    "deviceName": "设备名称",
    "location": "安装位置",
    "brand": "设备品牌(hikvision/dahua/generic)",
    "apiUrl": "API地址",
    "username": "设备用户名",
    "password": "设备密码",
    "apiKey": "API密钥",
    "apiSecret": "签名密钥",
    "status": "设备状态(0-离线,1-在线,2-维护)",
    "createTime": "创建时间",
    "updateTime": "更新时间"
}
```

### 通行记录表 (gate_records)

```json
{
    "deviceCode": "设备编码",
    "visitorId": "访客预约ID",
    "visitorName": "访客姓名",
    "visitorPhone": "访客手机",
    "hostName": "被访人",
    "hostFloor": "被访楼层",
    "result": "核验结果(success/fail)",
    "message": "结果说明",
    "visitDate": "来访日期",
    "operatorOpenId": "操作人OpenID",
    "createTime": "创建时间"
}
```

## 安全建议

1. **网络隔离**: 门禁设备应部署在独立的网络区域，通过网关与云服务通信
2. **身份验证**: 所有API调用必须进行身份验证（Basic Auth/API Key/OAuth）
3. **通信加密**: 建议使用HTTPS进行通信
4. **日志记录**: 记录所有开门操作的日志，便于审计
5. **超时设置**: API调用设置合理的超时时间（建议5秒）
6. **重试机制**: 网络异常时进行重试，但限制重试次数

## 常见问题

### Q: 设备连接失败怎么办？
A: 检查以下几点：
- 设备IP地址是否正确
- 设备是否在同一网络
- 用户名密码是否正确
- 设备防火墙是否放行

### Q: 开门指令没有响应？
A: 可能原因：
- 设备离线
- API接口不正确
- 权限不足
- 设备处于维护模式

### Q: 如何测试设备连接？
A: 在管理后台的门禁设备页面，点击"测试连接"按钮，系统会尝试与设备建立连接并返回结果。

## 技术支持

如有对接问题，请联系技术支持：
- 邮箱: support@example.com
- 电话: 400-xxx-xxxx
