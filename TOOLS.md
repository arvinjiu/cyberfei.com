# 配置文件修改规则

## 必须遵守
1. **修改前必备份**：`cp ~/.openclaw/openclaw.json ~/.openclaw/backup/openclaw.json.backup-$(date +%Y%m%d-%H%M%S)`
2. **备份保留**：至少保留最近 3 次备份
3. **修改后验证**：用 `cat` 检查 JSON 格式是否正确
4. **必须征得主人同意**：任何修改前都要先请示主人
5. **systemd 服务文件同样适用**：修改 `/etc/systemd/user/openclaw.service` 等文件前也必须备份
6. **损坏恢复**：如果配置损坏或服务文件被改乱，立即用备份文件恢复，然后重启服务

## 教训
2026-03-13: 误操作破坏了 openclaw.json，导致配置丢失。已恢复但需警惕。
2026-03-13: 未经主人同意就修改了配置文件，以后必须请示。

## 安全操作模板
```bash
# 备份 OpenClaw 配置
cp ~/.openclaw/openclaw.json ~/.openclaw/backup/openclaw.json.backup-$(date +%Y%m%d-%H%M%S)

# 备份 systemd 服务文件
cp /etc/systemd/user/openclaw.service /etc/systemd/user/openclaw.service.backup-$(date +%Y%m%d-%H%M%S)

# 修改（推荐用 jq 或手动编辑备份文件）
# 验证后再覆盖原文件

# 恢复配置（如果损坏）
cp ~/.openclaw/backup/openclaw.json.backup-YYYYMMDD-HHMMSS ~/.openclaw/openclaw.json

# 恢复服务文件（如果损坏）
cp /etc/systemd/user/openclaw.service.backup-YYYYMMDD-HHMMSS /etc/systemd/user/openclaw.service

# 重启服务
systemctl --user restart openclaw
```
