# Mulan舞蹈工作室 - 设计系统

## 一、品牌色彩体系

### 1.1 主色调

| 颜色名称 | HSL值 | HEX值 | 用途 |
|---------|-------|-------|------|
| 主色-深紫 | `271° 55% 38%` | `#6B21A8` | 品牌主色、按钮、链接、标题强调 |
| 主色-浅紫 | `290° 45% 55%` | `#A855F7` | 渐变辅助、强调色 |

### 1.2 辅助色

| 颜色名称 | HSL值 | HEX值 | 用途 |
|---------|-------|-------|------|
| 金色 | `38° 72% 55%` | `#D4A843` | 装饰元素、徽章、星级评分 |
| 粉红 | `330° 65% 55%` | `#EC4899` | 强调、行动号召按钮 |

### 1.3 中性色

| 颜色名称 | HSL值 | HEX值 | 用途 |
|---------|-------|-------|------|
| 背景-暖白 | `30° 15% 98%` | `#FAFAF8` | 页面背景 |
| 前景-深灰紫 | `270° 12% 12%` | `#1F1A2D` | 正文文字 |
| 次要文字 | `260° 8% 48%` | `#7C7480` | 次要说明文字 |
| 边框 | `260° 10% 88%` | `#E5E1E8` | 分割线、边框 |
| 卡片白 | `0° 0% 100%` | `#FFFFFF` | 卡片背景 |

### 1.4 渐变方案

```css
/* 主色渐变 */
background: linear-gradient(135deg, #6B21A8, #A855F7);

/* 金色渐变 */
background: linear-gradient(135deg, #D4A843, #F59E0B);

/* Hero背景渐变 */
background: linear-gradient(135deg, 
  rgba(107, 33, 168, 0.95), 
  rgba(88, 28, 135, 0.9), 
  rgba(168, 85, 247, 0.85));
```

---

## 二、字体体系

### 2.1 字体栈

| 用途 | 字体 | 字重 | 行高 | 字间距 |
|-----|------|------|------|--------|
| 标题 | Playfair Display | 700 (Bold) | 1.25 | -0.02em |
| 正文 | Inter | 400 (Regular) | 1.75 | 0 |
| 装饰 | Cormorant Garamond | 400/500 | 1.6 | 0 |

### 2.2 标题层级

| 层级 | 字号 (移动端) | 字号 (桌面端) | 字重 | 适用场景 |
|-----|--------------|--------------|------|---------|
| H1 | 36px | 48-64px | 700 | 页面主标题 |
| H2 | 30px | 36-48px | 700 | 区块标题 |
| H3 | 24px | 30px | 700 | 子区块标题 |
| H4 | 20px | 24px | 600 | 卡片标题 |
| H5 | 18px | 20px | 600 | 小标题 |
| H6 | 16px | 18px | 600 | 标签 |

### 2.3 正文层级

| 层级 | 字号 | 行高 | 颜色 | 适用场景 |
|-----|------|------|------|---------|
| Lead | 18-20px | 1.75 | Muted | 引言、副标题 |
| Body | 16px | 1.75 | Foreground | 正文段落 |
| Small | 14px | 1.5 | Muted | 辅助说明 |
| Caption | 12px | 1.4 | Muted | 注释、时间戳 |

### 2.4 标签/徽章

```css
标签: uppercase, tracking-widest, font-semibold, 12px
金色标签: text-[#D4A843]
粉色标签: text-[#EC4899]
```

---

## 三、间距系统

### 3.1 基础间距

| 变量 | 值 | 用途 |
|-----|-----|------|
| xs | 4px | 图标与文字间距 |
| sm | 8px | 小元素间距 |
| md | 16px | 常规间距 |
| lg | 24px | 区块间距 |
| xl | 32px | 大区块间距 |
| 2xl | 48px |  section间距 |
| 3xl | 64px | 大section间距 |

### 3.2 Section间距

```
移动端: py-12 (48px)
平板端: py-16 (64px)
桌面端: py-24 (96px)
大屏端: py-32 (128px)
```

---

## 四、圆角系统

| 变量 | 值 | 用途 |
|-----|-----|------|
| 小 | 4px | 按钮、输入框 |
| 中 | 8px | 卡片、图片 |
| 大 | 12px | 大卡片、弹窗 |
| 全圆 | 9999px | 徽章、标签 |

---

## 五、阴影系统

| 级别 | CSS值 | 用途 |
|-----|-------|------|
| 无 | none | 扁平设计元素 |
| Soft | `0 2px 20px rgba(107, 33, 168, 0.08)` | 普通卡片 |
| Medium | `0 4px 30px rgba(107, 33, 168, 0.12)` | 悬浮卡片 |
| Strong | `0 8px 40px rgba(107, 33, 168, 0.18)` | 弹窗、模态框 |

---

## 六、交互规范

### 6.1 过渡动画

```css
/* 默认过渡 */
transition: all 300ms ease;

/* 悬浮效果 */
hover: scale-105, shadow-lg, -translate-y-1

/* 点击效果 */
active: scale-95, translate-y-0
```

### 6.2 按钮状态

| 状态 | 效果 |
|-----|------|
| Default | 主色背景，白色文字 |
| Hover | 背景变浅，阴影增强，轻微上移 |
| Active | 按下效果，还原位置 |
| Disabled | 50%透明度，无指针事件 |

---

## 七、响应式断点

| 断点 | 最小宽度 | 用途 |
|-----|---------|------|
| sm | 640px | 小屏手机 → 平板 |
| md | 768px | 平板 → 笔记本 |
| lg | 1024px | 笔记本 → 桌面 |
| xl | 1280px | 大屏桌面 |
| 2xl | 1536px | 超大屏幕 |

---

## 八、图片与媒体

### 8.1 图片圆角

```
常规图片: rounded-xl (12px)
头像: rounded-full
封面图: rounded-none (全屏)
```

### 8.2 视频/轮播

```
Hero轮播: h-[70vh] min-h-[500px] max-h-[800px]
内容轮播: h-[50vh] min-h-[400px]
```

---

## 九、组件样式参考

### 9.1 卡片

```
基础样式: rounded-xl, border, shadow-sm, bg-card
悬浮效果: shadow-xl, -translate-y-1
 featured: border-primary/30, shadow-md
```

### 9.2 按钮

```
主按钮: bg-primary, rounded-lg, px-6 py-3, font-semibold
次按钮: bg-secondary, rounded-lg, px-6 py-3, font-semibold
-outline: border-2 border-primary, bg-transparent
幽灵: bg-transparent, hover:bg-muted
```

### 9.3 输入框

```
基础: h-12, rounded-lg, border, px-4
聚焦: border-primary, ring-2 ring-primary/20
文本域: min-h-[120px], py-3
```

---

## 十、无障碍规范

| 项目 | 标准 |
|-----|------|
| 文字/背景对比度 | ≥ 4.5:1 (AA级) |
| 大文字对比度 | ≥ 3:1 (AA级) |
| 焦点指示器 | 2px outline, outline-offset: 2px |
| 触摸目标大小 | ≥ 44x44px |
| 跳过链接 | 提供"跳转到主要内容"链接 |

---

## 附录：Tailwind CSS配置

```js
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6B21A8',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#D4A843',
          foreground: '#1F1A2D',
        },
        accent: {
          DEFAULT: '#EC4899',
          foreground: '#FFFFFF',
        },
      },
      fontFamily: {
        heading: ['Playfair Display', 'serif'],
        body: ['Inter', 'sans-serif'],
        accent: ['Cormorant Garamond', 'serif'],
      },
      boxShadow: {
        soft: '0 2px 20px rgba(107, 33, 168, 0.08)',
        medium: '0 4px 30px rgba(107, 33, 168, 0.12)',
        strong: '0 8px 40px rgba(107, 33, 168, 0.18)',
      },
    },
  },
};