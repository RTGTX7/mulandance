# 木兰舞蹈工作室 - 第一阶段交付成果 Prompt

---

## 角色定义

你是一个精通 Next.js 14+ (App Router)、React、TypeScript、Tailwind CSS 和 next-intl 国际化的全栈开发工程师。请按照以下完整需求开发木兰舞蹈工作室宣传网站，达到第一阶段交付标准。

---

## 项目基本信息

| 项目 | 内容 |
|-----|------|
| 机构名称 | Mulan舞蹈工作室 (Mulan Dance Studio) |
| 创始人 | 鲍俊伟老师 |
| 成立时间 | 2021年 |
| 地址 | 2527 Baseline Rd, Ottawa, ON K2C 0E3 |
| 电话 | 343-777-1766 |
| 邮箱 | info@mulandance.com |
| YouTube | https://www.youtube.com/@mulandancestudio21 |
| 小红书 | https://www.rednote.com/user/profile/5b8ab7c50ddda30001575476 |
| 教务系统 | 小麻雀教务 (https://xiaomai5.com/) |

---

## 设计系统（必须严格遵守）

### 品牌色彩

```css
主色-深紫: #6B21A8 (HSL: 271° 55% 38%)
主色-浅紫: #A855F7 (HSL: 290° 45% 55%)
金色: #D4A843 (HSL: 38° 72% 55%)
粉红: #EC4899 (HSL: 330° 65% 55%)
背景-暖白: #FAFAF8 (HSL: 30° 15% 98%)
前景-深灰紫: #1F1A2D (HSL: 270° 12% 12%)
次要文字: #7C7480 (HSL: 260° 8% 48%)
边框: #E5E1E8 (HSL: 260° 10% 88%)
卡片白: #FFFFFF
```

### 渐变方案

```css
主色渐变: linear-gradient(135deg, #6B21A8, #A855F7)
金色渐变: linear-gradient(135deg, #D4A843, #F59E0B)
Hero背景: linear-gradient(135deg, rgba(107,33,168,0.95), rgba(88,28,135,0.9), rgba(168,85,247,0.85))
```

### 字体体系

| 用途 | 字体 | Google Fonts | 字重 |
|-----|------|-------------|------|
| 标题 | Playfair Display | `next/font/google` | 700 (Bold) |
| 正文 | Inter | `next/font/google` | 400 (Regular) |
| 装饰 | Cormorant Garamond | `next/font/google` | 400/500 |

### 间距与样式

- Section间距：移动端py-12，平板py-16，桌面py-24，大屏py-32
- 卡片圆角：rounded-xl (12px)
- 按钮圆角：rounded-lg
- 阴影系统：soft/medium/strong三级
- 过渡动画：300ms ease
- 悬浮效果：scale-105, shadow-lg, -translate-y-1

### Tailwind CSS配置代码

```js
// tailwind.config.ts
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
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
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'Playfair Display', 'serif'],
        body: ['var(--font-body)', 'Inter', 'sans-serif'],
        accent: ['var(--font-accent)', 'Cormorant Garamond', 'serif'],
      },
      boxShadow: {
        soft: '0 2px 20px rgba(107, 33, 168, 0.08)',
        medium: '0 4px 30px rgba(107, 33, 168, 0.12)',
        strong: '0 8px 40px rgba(107, 33, 168, 0.18)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'scale-in': 'scaleIn 0.4s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

---

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Next.js (App Router) | 14.2.15+ |
| UI 库 | React + TypeScript | 18.2+ |
| 样式 | Tailwind CSS | 3.4.12+ |
| 组件 | shadcn/ui (Radix UI) | latest |
| 国际化 | next-intl | 3.20.x+ |
| 图标 | Lucide React | latest |
| 字体 | Google Fonts | - |

---

## 第一阶段交付页面清单

### 必须完成的页面（含内容要求）

| 序号 | 页面 | 路由 | 内容要求 |
|-----|------|------|---------|
| 1 | 首页 | `/` `/en` `/zh` | 完整六区块首页 |
| 2 | 关于我们 | `/about` `/en/about` `/zh/about` | 机构介绍+教学理念 |
| 3 | 课程总览 | `/programs` `/en/programs` `/zh/programs` | 7大课程卡片 |
| 4 | 课程详情×5 | 各舞种子页面 | 详细介绍+适合年龄 |
| 5 | 演出与赛事 | `/performances/current-season` | 专场秀+小荷风采 |
| 6 | 联系我们 | `/about/contact` | 表单+地址+电话+地图 |
| 7 | 隐私政策 | `/privacy` | 标准隐私页面 |

### 可选页面（有模板即可）

| 序号 | 页面 | 路由 | 状态 |
|-----|------|------|------|
| 8 | 暑期营 | `/programs/summer-camps` | 有内容 |
| 9 | 报名 | `/classes/register` | 有表单 |
| 10 | 收费标准 | `/classes/pricing` | 有表格 |
| 11 | FAQ | `/classes/faqs` | 有问答 |

---

## 首页完整内容规范

### 区块 1: Hero轮播

**3张幻灯片：**

```
幻灯片 1 - 品牌形象:
  标题: "让舞动成为艺术" / "Where Movement Becomes Art"
  副标题: "学中乐、学中思、学中悟 — 渥太华语舞蹈学校"
  按钮1: "探索课程" → /programs
  按钮2: "联系我们" → /about/contact

幻灯片 2 - 演出季:
  标题: "2025/2026 演出季" / "2025/2026 Season"
  副标题: "年度学员专场秀 + 小荷风采少儿舞蹈大赛"
  按钮1: "了解演出" → /performances/current-season
  按钮2: "观看视频" → https://www.youtube.com/@mulandancestudio21

幻灯片 3 - 暑期营:
  标题: "2026 暑期舞蹈营" / "Summer Camps 2026"
  副标题: "适合5-17岁学员的舞蹈夏令营，一周沉浸式舞蹈体验"
  按钮1: "立即报名" → /classes/register
  按钮2: "了解更多" → /programs/summer-camps
```

**按钮样式：**
- 主按钮：白色背景，深紫文字，悬浮时背景变淡
- 次按钮：白色背景，深紫文字，带Play图标，悬浮动画

### 区块 2: 数据统计

```
500+    学员
20+     年教学经验
100+    演出场次
20+     专业师资
```

**样式：** 深紫渐变背景，白色文字，金色图标，装饰圆形背景

### 区块 3: 课程介绍

**7大课程卡片：**

| 课程 | 图标 | 中文介绍 | 英文介绍 |
|-----|------|---------|---------|
| 中国古典舞 | BookOpen | 富含华夏文化遗产的经典舞蹈，传承中华传统文化 | Classical Chinese Dance - Heritage of Chinese culture and tradition |
| 中国少数民族民间舞 | Music | 地方风情浓郁的多民族舞蹈风格 | Chinese Folk Dance - Rich ethnic dance styles from across China |
| 芭蕾舞 | Footprints | 扎实的芭蕾舞基本功训练，系统化合一教学 | Ballet - Solid foundation with systematic training |
| 现代舞 | Sparkles | 善于思考的中国风现代创作舞蹈 | Contemporary - Creative Chinese-style modern dance |
| 爵士舞 | Music | 时尚的爵士舞表演，商业与表演方向 | Jazz - Fashionable commercial and performance jazz |
| 街舞 | Zap | 潮流街舞训练，叶子老师授课 | Hip-Hop - Trendy street dance with teacher Yezi |
| 时装表演 | Sparkles | 专业舞台表演训练，叶子老师授课 | Fashion Show - Professional stage performance |

**卡片样式：** 白色背景，圆角，悬浮阴影+上移，彩色图标渐变

### 区块 4: 演出与赛事

```
活动卡片 1: 年度学员专场秀
  描述: 每年年中/年底举办，每位学员都有机会在专属舞台上展示自己
  评选: "小舞王"评选

活动卡片 2: 小荷风采少儿舞蹈大赛
  描述: 全国最高级别舞蹈赛事，Mulan学员屡获优异成绩

活动卡片 3: 暑期营汇报演出
  描述: 暑期营结业展示，一周学习成果汇报
```

### 区块 5: 学员风采

**糖糖：**
> "我喜欢音乐，舞蹈能让我更好地感受音乐、表现音乐，也让我更加自信。在鲍老师的课堂上，老师会一直激励我克服困难，掌握舞蹈的基本功。"

**格格：**
> "爱舞蹈、爱Mulan、更爱鲍老师。跟着鲍老师学舞多年，非常喜欢这样以芭蕾为基础，教授各个舞种的舞蹈。"

### 区块 6: 底部CTA

```
标题: "加入Mulan舞蹈大家庭"
副标题: "2527 Baseline Rd, Ottawa, ON K2C 0E3 | 343-777-1766"
按钮: "立即报名" + "联系我们"
社交媒体图标: YouTube, 小红书
```

---

## 关于我们页面内容

### 机构介绍

Mulan舞蹈工作室由鲍俊伟老师于2021年在加拿大渥太华创办，是一所专门针对幼儿启蒙和青少年专业培训舞蹈的学校。

### 教学理念

**"学中乐、学中思、学中悟"**

通过舞蹈这一艺术形式，让学员了解和感受中国五千年文化的魅力，在舞蹈艺术的世界里自由翱翔。

### 课程体系

以芭蕾为基础，教授各个舞种的舞蹈。特别强调中国风风格的现代舞、爵士舞，让学员深入了解舞蹈这一门类的艺术，亲身体验感悟到艺术与身体的完美融合。

### 师资力量

- **鲍俊伟老师** - 创始人兼主讲教师，多年少儿舞蹈教育经验，"学中乐、学中思、学中悟"教学理念创始人
- **叶子老师** - 街舞/时装表演特邀教师，渥太华最受欢迎的舞蹈老师之一

### 联系我们

- 地址：2527 Baseline Rd, Ottawa, ON K2C 0E3
- 电话：343-777-1766
- YouTube：https://www.youtube.com/@mulandancestudio21
- 小红书：https://www.rednote.com/user/profile/5b8ab7c50ddda30001575476

---

## 翻译文件规范

### 目录结构

```
frontend/src/lib/locales/
  en.json    ← 英文翻译
  zh.json    ← 中文翻译
```

### 翻译key结构

```json
{
  "common": {
    "appName": "Mulan Dance Studio",
    "appNameZh": "Mulan舞蹈工作室"
  },
  "home": {
    "hero": { "title": "...", "subtitle": "..." },
    "stats": { "students": "...", "years": "..." },
    "programs": { "title": "...", "subtitle": "...", "chinese": "...", "chineseDesc": "..." },
    "events": { "title": "...", "subtitle": "..." },
    "testimonials": { "title": "...", "subtitle": "..." },
    "cta": { "title": "...", "subtitle": "..." }
  },
  "about": { "title": "...", "intro": "...", "philosophy": "..." }
}
```

---

## Header组件要求

- Logo + 名称 "Mulan舞蹈工作室 / Mulan Dance Studio"
- 导航菜单：首页、关于我们、课程、演出、活动、联系我们
- 语言切换：ZH / EN
- 响应式：移动端汉堡菜单
- 悬浮时半透明背景 + backdrop-blur

## Footer组件要求

- 机构名称 + Slogan
- 快速链接
- 课程链接
- 联系方式（地址、电话、邮箱）
- 社交媒体图标（YouTube, 小红书）
- 版权信息

---

## 代码质量要求

1. 所有用户可见文本必须使用 `useTranslations()` hook
2. 所有组件必须有TypeScript类型定义
3. 所有页面必须有SEO meta标签
4. 遵循无障碍规范 (ARIA labels)
5. 响应式设计通过所有断点测试

---

## 交付检查清单

- [ ] 首页完整6区块且内容充实
- [ ] 关于我们页面有完整介绍
- [ ] 课程总览+子页面有内容
- [ ] 演出与赛事页面有内容
- [ ] 联系我们页面有表单+地址+电话
- [ ] 中英文双语正常切换
- [ ] 响应式设计正常
- [ ] 按钮清晰可读（白色背景+深色文字）
- [ ] 悬浮动画正常
- [ ] Header/Footer完整
- [ ] 翻译文件完整覆盖所有页面

---

*文档版本: v1.0*
*创建时间: 2026年5月24日*
*目标: 第一阶段交付成果*