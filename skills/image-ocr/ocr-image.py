#!/usr/bin/env python3
"""
Simple OCR using Tesseract (if available) or fallback to description
"""

import subprocess
import sys
import os

def ocr_image(image_path, lang='chi_sim+eng'):
    """Extract text from image using tesseract"""
    
    # Check if tesseract is available
    try:
        result = subprocess.run(
            ['tesseract', '--version'],
            capture_output=True,
            text=True,
            timeout=10
        )
        tesseract_available = result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        tesseract_available = False
    
    if not tesseract_available:
        print("❌ Tesseract OCR 未安装")
        print("\n安装方法：")
        print("  sudo apt update")
        print("  sudo apt install -y tesseract-ocr tesseract-ocr-chi-sim")
        print("\n或者使用在线 OCR 工具：")
        print("  - https://ocr.space")
        print("  - https://www.newrank.cn/ocr/")
        return None
    
    # Extract text
    try:
        result = subprocess.run(
            ['tesseract', image_path, 'stdout', '-l', lang],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            return result.stdout.strip()
        else:
            print(f"❌ OCR 失败：{result.stderr}")
            return None
            
    except subprocess.TimeoutExpired:
        print("❌ OCR 超时")
        return None
    except Exception as e:
        print(f"❌ 错误：{e}")
        return None

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("用法：ocr-image.py <图片路径> [语言]")
        print("语言选项：chi_sim (中文), eng (英文), chi_sim+eng (中英文)")
        sys.exit(1)
    
    image_path = sys.argv[1]
    lang = sys.argv[2] if len(sys.argv) > 2 else 'chi_sim+eng'
    
    if not os.path.exists(image_path):
        print(f"❌ 文件不存在：{image_path}")
        sys.exit(1)
    
    print(f"🔍 正在识别图片：{image_path}")
    print(f"📝 语言：{lang}")
    print("-" * 60)
    
    text = ocr_image(image_path, lang)
    
    if text:
        print("\n📄 识别结果：")
        print("=" * 60)
        print(text)
        print("=" * 60)
    else:
        sys.exit(1)
