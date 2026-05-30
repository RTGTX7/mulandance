# 用户页面与权限规划

## 目标

为网站和后台明确四种用户身份：游客、普通用户、普通管理员、主管理员。不同用户看到不同页面入口，拥有不同操作权限。权限控制需要同时在前端菜单和后端接口中实现，不能只依赖前端隐藏按钮。

## 用户类型

### 游客

游客是不登录网站的公开访问用户。

可以：

- 浏览公开网站页面
- 查看公开课程、活动、文章或公告
- 查看公开 schedule 的基础信息，但不显示具体地址
- 查看公开的 classroom rental 页面
- 提交公开 classroom rental 申请表
- 使用公开联系表单或报名入口

不可以：

- 查看 schedule 中的具体地址、房间号或详细地点说明
- 进入个人账号页面
- 查看个人报名记录
- 发文章
- 进入后台
- 查看后台 rental 申请列表
- 修改任何系统设置

### 普通用户

普通用户是已经注册或已经登录的学生、家长、会员等用户。

可以：

- 登录个人账号页面
- 查看和修改自己的基础资料
- 查看自己的课程、报名、付款或活动记录
- 提交需要登录的报名或表单
- 查看自己的消息或通知
- 根据需要提交自己的 classroom rental 申请

不可以：

- 进入后台管理页面
- 发文章
- 审核 rental 申请
- 查看其他用户资料
- 修改课程、价格、报名规则或系统设置
- 管理用户角色

### 普通管理员

普通管理员是内部工作人员账号，主要负责内容管理和内部申请，不负责系统级配置。

可以：

- 登录后台管理页面
- 查看后台 Dashboard
- 创建、编辑、发布、下架文章
- 查看文章列表
- 在后台提交内部 classroom rental 申请
- 查看自己提交的 rental 申请状态
- 根据权限查看基础 classroom 使用日历
- 修改自己的账号资料和密码

不可以：

- 进入 System Settings
- 修改 Registration Settings
- 管理用户角色和权限
- 修改全局价格、报名规则、邮件配置等系统配置
- 审批自己的 rental 申请
- 删除系统级数据
- 创建或修改主管理员账号

建议普通管理员权限点：

- `article:create`
- `article:update`
- `article:publish`
- `rental:create`
- `rental:read_own`
- `dashboard:read_basic`

不包含：

- `system:update`
- `registration:update`
- `user:manage`
- `role:manage`
- `rental:approve`
- `rental:settings_update`

### 主管理员

主管理员是系统最高权限账号，负责网站、后台、用户、报名和系统配置。

可以：

- 拥有普通管理员的全部权限
- 进入 System Settings
- 修改 Registration Settings
- 管理用户账号
- 设置用户角色和权限
- 查看和处理所有 classroom rental 申请
- 审批、拒绝、编辑 rental 申请
- 修改 classroom rental 相关系统规则
- 管理网站全局配置
- 管理邮件、限制规则、报名规则等后台设置

需要谨慎操作：

- 删除用户
- 删除文章
- 删除 rental 记录
- 修改角色权限
- 修改系统设置

这些操作建议保留日志，方便之后追踪是谁在什么时候改了什么。

## 页面入口规划

### 公开网站

面向游客和普通用户。

- Home
- About
- Classes
- Events
- Articles
- Classroom Rental
- Contact
- Login / Register

游客可以访问公开内容，但 schedule 中不应该显示具体地址、房间号或详细地点说明；普通用户登录后可以进入自己的账号页面。

## Classroom Rental 页面流程

Classroom Rental 页面分成两步。第一页是公开 schedule / calendar 表格，第二页才是 rental request form。这样游客先看可用时间，再决定是否提交申请。

### 第一步：Schedule 表格页

面向游客、普通用户、普通管理员和主管理员，但显示的信息根据用户身份不同。

游客可以看到：

- 已确认的教室使用时间
- 大教室 / 小教室筛选
- 星期、开始时间、结束时间
- 公开用途或简化标题
- `Submit Request` 按钮

游客不可以看到：

- 具体地址
- 房间号
- 详细地点说明
- 申请人联系方式
- 内部备注
- 后台审核状态

普通用户可以看到：

- 游客可见的 schedule 信息
- 登录后允许查看和自己报名、课程或申请有关的更多信息
- 自己提交过的 rental request 状态

普通管理员可以看到：

- 基础 classroom 使用日历
- 自己提交的内部 rental request 状态
- 必要的内部排期信息

主管理员可以看到：

- 全部 classroom 使用记录
- 全部 rental request 状态
- 申请人、联系方式、备注和后台审核信息

### 第二步：Submit Request 表单页

用户在第一页点击 `Submit Request` 后进入第二页填写申请表。不同用户需要填写的内容不同，这也是 rental 权限区分的一部分。

### 游客 Rental 表单

游客没有账号信息，风险未知，所以需要填写最多内容。提交后默认进入 `pending` 待审核状态。

必填：

- 租借教室：大教室 / 小教室
- 使用日期 / 星期
- 开始时间
- 结束时间
- 用途 / 活动名称
- 申请人姓名
- 联系方式
- 邮箱
- 预计参与人数
- 活动描述
- 人机验证
- 同意遵守学校教室使用规则

建议填写或按情况必填：

- 组织 / 团体 / 公司名称
- 申请人在活动中的角色
- 第二联系人姓名
- 第二联系人电话 / 邮箱
- 设备需求
- 是否有未成年人参加
- 是否有负责人全程在场
- 是否有急救 / CPR 负责人
- 是否使用道具、大型设备或音响
- 是否涉及明火、烟雾、粉尘、喷雾或类似物品
- 是否会拍照或录像
- 是否有售票或收费
- 是否提供食物、饮品或酒精
- 是否需要安保或额外工作人员
- 是否需要提前布置场地
- 是否需要隔夜存放物品或设备
- 是否有责任保险
- 是否会自行清理并恢复场地
- 其他备注

游客提交后：

- `booking_type` 记为外部申请
- `status` 默认为 `pending`
- 进入后台 Classroom Rental 页面等待管理员审核
- 如果联系方式中包含邮箱，系统尝试发送邮件回执
- 即使邮件发送失败，申请也应该正常保存

### 普通用户 Rental 表单

普通用户已经登录，系统已有基础身份信息，所以表单可以比游客少。普通用户仍然不能直接确认预约，提交后也需要审核。

自动带入：

- 申请人姓名
- 联系方式
- 邮箱

需要填写：

- 租借教室：大教室 / 小教室
- 使用日期 / 星期
- 开始时间
- 结束时间
- 用途 / 活动名称
- 预计参与人数
- 活动描述或备注
- 设备需求
- 是否有未成年人参加
- 是否需要额外清洁或特殊支持
- 同意遵守学校教室使用规则

普通用户提交后：

- `booking_type` 记为用户申请
- `status` 默认为 `pending`
- 可以在个人账号页面查看自己的申请状态
- 不能审核、修改或删除其他人的申请

### 普通管理员 Rental 表单

普通管理员提交的是内部后台申请，原则上不需要填写公开表单里的大量外部风险信息。普通管理员可以从后台 `Rental Request` 入口选择时间并提交内部申请。

自动带入：

- 申请人姓名
- 联系方式
- 邮箱
- 内部用户身份

需要填写或选择：

- 租借教室：大教室 / 小教室
- 使用日期 / 星期
- 开始时间
- 结束时间
- 用途 / 活动名称

可选：

- 备注
- 设备需求

普通管理员提交后：

- `booking_type` 记为内部申请
- `status` 默认为 `pending` 或按内部规则进入待确认状态
- 可以查看自己的申请状态
- 不能审批自己的 rental 申请
- 不能修改 classroom rental 的系统规则

### 主管理员 Rental 表单与审核

主管理员主要负责审核和管理，不一定需要走普通提交表单。

可以：

- 直接新增内部教室使用记录
- 查看全部游客、普通用户、普通管理员提交的申请
- 通过待审核申请
- 拒绝申请
- 编辑错误的教室使用记录
- 删除错误或垃圾申请
- 查看申请人、联系方式、备注和风险信息
- 设置 rental 申请限制和邮件相关配置

主管理员操作后：

- 通过的申请显示在公开 schedule / calendar 中
- 拒绝的申请不显示在公开 schedule / calendar 中
- 可选发送邮件通知申请人

## Classroom Rental 字段对齐

Rental 申请和 `classsroomrent.md` 保持同一套核心字段，只是不同用户填写方式不同。

核心后端字段：

- `room`
- `booking_type`
- `status`
- `title`
- `teacher_name`
- `applicant_name`
- `applicant_contact`
- `day_of_week`
- `start_time`
- `end_time`
- `notes`

表单字段按用户分层：

- 游客：填写完整公开申请表，包含联系信息、活动信息、安全风险、清洁责任和人机验证。
- 普通用户：系统自动带入个人信息，只填写活动和必要风险信息。
- 普通管理员：系统自动带入内部账号信息，只填写时间、教室和用途，必要时补充备注。
- 主管理员：重点是审核、确认、编辑和系统设置，不以提交外部申请表为主。

### 普通用户账号页面

面向普通用户。

- My Profile
- My Classes / Registrations
- My Payments
- My Messages
- My Rental Requests
- Account Settings

这里是个人中心，不是后台管理页面。

### 普通管理员后台页面

面向普通管理员。

- Dashboard
- Articles
- Rental Request
- My Account

后台菜单中不显示：

- System Settings
- Registration Settings
- User Management
- Role Management

### 主管理员后台页面

面向主管理员。

- Dashboard
- Articles
- Classroom Rental
- Users
- Roles / Permissions
- Registration Settings
- System Settings
- Audit Logs
- My Account

## 权限实现原则

1. 前端按角色显示菜单，但后端接口必须再次校验权限。
2. 普通管理员即使手动访问 System Settings 或 Registration Settings 的 URL，也应该返回无权限。
3. 普通管理员可以提交 rental，但不能绕过审批流程。
4. 公开 rental 申请和后台内部 rental 申请可以使用同一套数据表，但需要区分来源。
5. 用户角色建议至少分为：
   - `guest`
   - `user`
   - `admin`
   - `super_admin`

## 开发清单

- [ ] 确认当前用户表是否已有 role 字段
- [ ] 定义四种用户角色
- [ ] 定义后台菜单和权限点
- [ ] 普通用户账号页面只显示个人相关内容
- [ ] 普通管理员后台隐藏系统设置和报名设置
- [ ] 后端为 System Settings API 增加主管理员权限校验
- [ ] 后端为 Registration Settings API 增加主管理员权限校验
- [ ] 后端为 rental 审批接口增加权限校验
- [ ] 测试普通管理员无法访问主管理员接口
- [ ] 测试主管理员可以正常管理全部设置
