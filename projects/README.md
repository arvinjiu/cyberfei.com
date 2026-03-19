# 项目规范

## 目录结构
- `projects/` - 所有网页项目目录
  - `projects/love-game/` - 土味情话游戏
  - `projects/项目名/` - 其他项目

## 图片处理规则
**重要：** 当主人发送图片给网页项目时：
1. 从 `/home/user/.openclaw/media/inbound/` 复制图片到项目目录
2. 项目目录通常：`projects/项目名/photos/`
3. 代码中使用相对路径：`./photos/图片名.jpg`

## 原因
- `media/inbound/` 是临时目录，可能被清理
- 项目目录独立管理，方便部署和迁移
- 相对路径更灵活（本地/服务器都能用）

## 示例
```
收到图片 → 复制到 projects/love-game/photos/ → 更新 HTML 路径
```

---
创建时间：2026-03-17
最后更新：2026-03-17
