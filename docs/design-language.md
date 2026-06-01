# 网站设计语言

本文档定义 Mulan Dance Studio 网站和后台的统一 UI 语言。后续页面、组件和模板应优先遵守这里的参数，除非现有组件已经有更明确的局部规范。

## 设计方向

整体风格：

- 现代、轻盈、清楚。
- 使用苹果式毛玻璃质感，但不能为了装饰牺牲可读性。
- 前台可以更有品牌感和视觉张力。
- 后台要更像工作工具：密度合理、分组清楚、控件稳定，不做营销页式大卡片堆叠。

核心关键词：

- Glass
- Soft depth
- Clear hierarchy
- Fast admin workflow
- Multilingual consistency

## 色彩

品牌主色：

```css
--brand-purple: #6b2aa8;
--brand-purple-strong: #4c1d95;
--brand-purple-soft: #a855f7;
--brand-pink: #ec4899;
--brand-gold: #d4a843;
```

中性色：

```css
--ink: #171321;
--muted: #716a7a;
--line: #e7e1ec;
--surface: #ffffff;
--surface-soft: #faf8fc;
--danger: #ef4444;
--success: #10b981;
--warning: #f59e0b;
```

页面背景：

```css
--page-bg: #fbf9fd;
--page-bg-alt: #f7f2fb;
```

使用规则：

- 主按钮使用紫色。
- 危险操作使用红色，只用于删除、停用、清空等不可逆动作。
- 成功/启用状态使用绿色。
- 金色只用于少量强调，不作为大面积背景。
- 不要让页面变成单一紫色调；紫色只做主导动作和品牌识别。

## 毛玻璃参数

通用玻璃面板：

```css
background: rgba(255, 255, 255, 0.72);
backdrop-filter: blur(22px) saturate(160%);
border: 1px solid rgba(255, 255, 255, 0.62);
box-shadow: 0 18px 50px rgba(47, 24, 83, 0.10);
```

深色叠加玻璃：

```css
background: rgba(23, 19, 33, 0.48);
backdrop-filter: blur(20px) saturate(140%);
border: 1px solid rgba(255, 255, 255, 0.18);
```

后台工具栏玻璃：

```css
background: rgba(255, 255, 255, 0.84);
backdrop-filter: blur(18px) saturate(150%);
border: 1px solid rgba(231, 225, 236, 0.90);
box-shadow: 0 10px 28px rgba(30, 20, 45, 0.07);
```

注意：

- 毛玻璃后面必须有足够明暗差，否则文字会糊。
- 后台表单区域不要叠太多层玻璃卡片。
- 弹窗、导航、顶部栏、浮动工具条适合使用毛玻璃。

## 圆角

统一参数：

```css
--radius-control: 12px;
--radius-card: 18px;
--radius-panel: 24px;
--radius-pill: 999px;
```

使用规则：

- 后台按钮、输入框：`12px`。
- 后台表格、编辑区面板：`16px` 到 `20px`。
- 前台展示卡片：`18px` 到 `24px`。
- 标签、状态胶囊：`999px`。
- 不要把所有元素都做成巨大圆角，后台尤其要克制。

## 阴影

```css
--shadow-soft: 0 8px 26px rgba(30, 20, 45, 0.08);
--shadow-panel: 0 18px 50px rgba(47, 24, 83, 0.10);
--shadow-floating: 0 24px 70px rgba(30, 20, 45, 0.18);
```

使用规则：

- 普通卡片用 `soft`。
- 主要浮层、下拉菜单、弹窗用 `floating`。
- 不要给每个小控件都加重阴影。

## 字体与排版

推荐字体：

- 标题：`Playfair Display` 或现有 heading font。
- 正文和后台：`Inter` 或系统 sans-serif。
- 中文显示优先保证清晰，不强求所有中文标题使用衬线。

字号：

```css
--text-xs: 12px;
--text-sm: 14px;
--text-base: 16px;
--text-lg: 18px;
--text-xl: 20px;
--title-sm: 24px;
--title-md: 32px;
--title-lg: 48px;
--title-hero: clamp(44px, 7vw, 88px);
```

后台规则：

- 页面标题：`28px` 到 `36px`。
- 表单 section 标题：`18px` 到 `22px`。
- 输入标签：`13px` 到 `14px`。
- 表格文字：`14px` 到 `16px`。

前台规则：

- 首页 Hero 可以使用大标题。
- 内容页不要滥用 Hero 大字。
- 卡片内标题不要超过 `24px`，避免拥挤。

## 间距

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-24: 96px;
```

页面容器：

```css
max-width: 1280px;
padding-inline: clamp(16px, 4vw, 48px);
```

后台：

- 工具栏和筛选区使用 `16px` 到 `24px` 间距。
- 表单字段之间使用 `12px` 到 `20px`。
- 大模块之间使用 `32px` 到 `48px`。

## 按钮

主按钮：

```css
height: 44px;
padding: 0 18px;
border-radius: 12px;
background: #6b2aa8;
color: white;
box-shadow: 0 10px 24px rgba(107, 42, 168, 0.22);
transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;
```

悬停：

```css
transform: translateY(-1px);
box-shadow: 0 14px 30px rgba(107, 42, 168, 0.28);
```

点击：

```css
transform: translateY(0) scale(0.98);
```

使用规则：

- 明确动作使用文字按钮，例如保存、创建、提交。
- 工具动作优先使用图标按钮，例如删除、预览、上传、复制。
- 图标优先使用 `lucide-react`。
- 不熟悉的图标需要 tooltip 或可见标签。

## 输入框

```css
height: 46px;
border-radius: 12px;
border: 1px solid #ded7e8;
background: rgba(255, 255, 255, 0.82);
box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
```

聚焦：

```css
border-color: #8b5cf6;
box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.16);
outline: none;
```

规则：

- 表单标签必须清楚。
- 占位符不能代替标签。
- 多语言编辑时，语言切换控件固定放在页面上方或编辑区顶部。
- 长文本使用 textarea 或 Markdown 编辑器，不要塞进单行 input。

## 标签与状态

状态颜色：

- 启用、已发布、已通过：绿色。
- 草稿、待审核：黄色/琥珀色。
- 停用、拒绝、删除：红色。
- 当前账号、当前语言：紫色。

状态胶囊参数：

```css
border-radius: 999px;
padding: 4px 10px;
font-size: 12px;
font-weight: 700;
```

## 动画

基础参数：

```css
--ease-standard: cubic-bezier(0.2, 0.8, 0.2, 1);
--duration-fast: 140ms;
--duration-normal: 220ms;
--duration-slow: 360ms;
```

常用动画：

- 页面进入：轻微上移加透明度，`220ms` 到 `360ms`。
- 弹窗：scale `0.98 -> 1` 加透明度，`180ms`。
- 下拉菜单：`translateY(4px -> 0)` 加透明度，`160ms`。
- 按钮点击：`scale(0.98)`，`120ms`。

规则：

- 动画必须服务于反馈，不做大幅度晃动。
- 后台表格、表单不能因为 hover 导致布局跳动。
- 尊重 `prefers-reduced-motion`。

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 前台页面模板

首页：

- 第一屏突出品牌、图片/视频或真实内容。
- H1 是品牌或明确主张。
- 主 CTA 只有一个，次 CTA 最多一个。
- 下一段内容需要在首屏底部露出一点，避免像单独海报。

列表页：

- 顶部说明简短。
- 筛选/分类放在内容前。
- 卡片使用稳定比例图片。

详情页：

- 标题、日期、地点、封面图清楚。
- 正文宽度控制在舒适阅读范围。
- CTA 放在内容结束或侧栏，不要打断阅读。

## 后台页面模板

通用结构：

1. 顶部后台导航。
2. 页面标题和说明。
3. 主要操作按钮靠右。
4. 语言编辑切换区。
5. 表单、表格或列表主体。

后台分组：

- 网站内容：首页、新闻文章、活动演出。
- 教学管理：开设课程、排课表、教师。
- 教室与报名：教室、报名链接。
- 系统管理：价格设置、系统设置、账号管理。

规则：

- 后台不要做营销 Hero。
- 重要保存按钮固定在页面头部或编辑器尾部。
- 删除按钮要离保存按钮有明显距离。
- 批量列表以后要考虑搜索、筛选和分页。

## 响应式

断点：

```css
sm: 640px;
md: 768px;
lg: 1024px;
xl: 1280px;
2xl: 1536px;
```

移动端规则：

- 后台表格需要转换成卡片或横向滚动。
- 工具栏允许换行，但按钮文字不能溢出。
- 固定格式控件要设置稳定宽高，避免内容加载后跳动。

## 图片与媒体

规则：

- 前台关键页面必须使用真实图片、视频或后台上传图片。
- 不使用纯渐变或抽象 SVG 代替实际内容。
- 图片容器必须设置 `aspect-ratio`。
- 上传图片保存在 `UPLOADS_DIR`，公开 URL 由 `PUBLIC_BASE_URL` 生成。

推荐比例：

- Hero：`16 / 9` 或全屏 cover。
- 新闻卡片：`4 / 3` 或 `16 / 10`。
- 教师头像：`1 / 1`。
- 课程卡片：`4 / 3`。
- 教室图片：`16 / 10`。

## 多语言一致性

所有前台可见内容映射到后台时，应支持：

- 中文
- English
- Francais

后台编辑原则：

- 页面顶部提供“正在编辑语言”切换。
- 保存时只保存当前语言或明确保存语言包。
- 系统设置、首页、活动演出、课程、排课表、教师、教室使用、价格都应保持中英法一致。

## 可访问性

- 正文和背景对比度至少满足 WCAG AA。
- 按钮和可点击区域最小 `44px`。
- 所有图标按钮需要 `aria-label` 或可见文字。
- 表单错误要靠近对应字段。
- 不能只用颜色表达状态，必须有文字。

## 开发检查清单

新页面完成前检查：

- 是否符合当前页面类型：前台展示页或后台工具页。
- 是否使用统一颜色、圆角、阴影和按钮样式。
- 是否支持中文、英文、法语。
- 移动端是否不溢出、不重叠。
- 关键按钮是否有 loading/disabled/error 状态。
- 上传图片是否走 `UPLOADS_DIR`。
- 后台权限是否有前端隐藏和后端校验两层。
