#!/bin/bash
# compact-memory.sh - 压缩旧记忆文件，释放上下文空间

MEMORY_DIR="/home/user/.openclaw/workspace/memory"
MEMORY_MD="/home/user/.openclaw/workspace/MEMORY.md"
ARCHIVE_DIR="/home/user/.openclaw/workspace/memory/archive"

# 创建归档目录
mkdir -p "$ARCHIVE_DIR"

echo "🧹 开始压缩记忆文件..."

# 查找 3 天前的记忆文件
OLD_FILES=$(find "$MEMORY_DIR" -name "2026-*.md" -type f -mtime +3 2>/dev/null)

if [ -z "$OLD_FILES" ]; then
    echo "✅ 没有需要压缩的旧文件（3 天内）"
    exit 0
fi

# 处理每个旧文件
for file in $OLD_FILES; do
    filename=$(basename "$file")
    echo "📄 处理：$filename"
    
    # 读取文件内容
    content=$(cat "$file")
    
    # 简单提炼：提取标题和关键段落（实际可以用 AI 提炼）
    # 这里先做简单处理：保留文件名和日期
    summary="# $(head -1 "$file" | sed 's/# //')\n来源：$filename\n\n$(echo "$content" | head -20)\n"
    
    # 追加到 MEMORY.md
    echo "" >> "$MEMORY_MD"
    echo "$summary" >> "$MEMORY_MD"
    echo "---" >> "$MEMORY_MD"
    
    # 移动到归档
    mv "$file" "$ARCHIVE_DIR/"
    echo "  → 已归档到 $ARCHIVE_DIR/$filename"
done

echo "✅ 压缩完成！"
echo "📁 归档目录：$ARCHIVE_DIR"
ls -la "$ARCHIVE_DIR"
