# 2026-03-20 - 首页导航栏滚动交互优化

## 任务
实现导航栏滚动交互：
1. 初始状态：导航栏可滚动，HOME 高亮
2. 滚动后：导航栏固定在顶部
3. 滚动到 Projects 区域：PROJECTS 高亮
4. 滚动到 Life 区域：LIFE 高亮

## 实现方案

### CSS 修改
```css
.nav-menu {
    position: relative; /* 初始可滚动 */
    transition: all 0.3s ease;
}

.nav-menu.fixed {
    position: fixed; /* 滚动后固定 */
    top: 0;
    left: 0;
    right: 0;
}
```

### JavaScript 逻辑
```javascript
window.addEventListener('scroll', function() {
    const scrollY = window.scrollY;
    const navHeight = navMenu.offsetHeight;
    
    // 初始状态：可滚动，HOME 高亮
    if (scrollY < navHeight + 50) {
        navMenu.classList.remove('fixed');
        navLinks[0].classList.add('active'); // HOME
        return;
    }
    
    // 滚动后固定
    navMenu.classList.add('fixed');
    
    // 根据滚动位置切换高亮
    if (scrollY >= lifeSection.offsetTop - navHeight - 50) {
        navLinks[2].classList.add('active'); // LIFE
    } else if (scrollY >= projectsSection.offsetTop - navHeight - 50) {
        navLinks[1].classList.add('active'); // PROJECTS
    } else {
        navLinks[0].classList.add('active'); // HOME
    }
});
```

## 最终效果
- ✅ 导航栏初始可滚动，HOME 高亮
- ✅ 下滑 50px 后导航栏固定在顶部
- ✅ 滚动到 Projects 区域时 PROJECTS 自动高亮
- ✅ 滚动到 Life 区域时 LIFE 自动高亮
- ✅ 所有状态切换平滑过渡

## 相关文件
- `/home/user/.openclaw/workspace/projects/index.html`

## 备注
- 导航栏不再使用 `opacity` 渐变显示，而是直接固定/可滚动切换
- 高亮逻辑基于滚动位置与 section 的 `offsetTop` 比较
- 容器顶部留白已移除，导航栏固定时会自动覆盖内容
