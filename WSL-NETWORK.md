# WSL2 网络配置记录

## 配置文件位置
`C:\Users\Fei Liu\.wsconfig`

## 当前配置

```ini
[wsl2]
networkingMode=mirrored
dnsTunneling=true
firewall=true
autoProxy=true

[experimental]
hostAddressLoopback=true
```

## 配置说明

| 选项 | 值 | 作用 |
|------|-----|------|
| **networkingMode** | `mirrored` | 使用镜像网络模式（WSL2 与 Windows 共享 IP） |
| **dnsTunneling** | `true` | 启用 DNS 隧道（通过 Windows DNS 解析） |
| **firewall** | `true` | 启用 Windows 防火墙集成 |
| **autoProxy** | `true` | 自动代理配置 |
| **hostAddressLoopback** | `true` | 实验性功能：允许 `localhost` 在 WSL2 和 Windows 间互通 |

## 影响

### ✅ 优势
- **localhost 互通**：Windows 和 WSL2 可直接通过 `127.0.0.1` 访问彼此服务
- **防火墙集成**：Windows 防火墙可管理 WSL2 流量
- **DNS 统一**：使用 Windows DNS 配置

### ⚠️ 注意事项
- **需重启 WSL2**：`wsl --shutdown` 后生效
- **实验性功能**：`hostAddressLoopback` 可能不稳定
- **网络拓扑变化**：IP 地址可能从 `192.168.x.x` 变为 Windows 主机 IP

## 相关命令

```bash
# 重启 WSL2 使配置生效
wsl --shutdown

# 检查当前网络模式
ip addr show eth0

# 测试 localhost 互通
curl http://127.0.0.1:8080  # 从 Windows 访问 WSL2 服务
```

---
**记录时间**: 2026-03-15 18:15  
**记录者**: 小飞飞 🐉
