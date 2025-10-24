
1) 岗位管理（Job） — 更细的任务拆分
- Job-API: jobs:创建接口（POST /api/jobs）
  - 描述：后端实现岗位创建接口，校验 title 唯一、权限检查（admin/hr）。
  - 验收：提交合法 payload 返回 201，重复 title 返回 400，记录创建人。
  - 标签：backend, api
  - 估时：1d

- Job-API: jobs:查询接口（GET /api/jobs）
  - 描述：支持分页、按 status/department/skill 搜索。
  - 验收：分页正确、过滤生效、响应包含 total/count。
  - 标签：backend, api
  - 估时：1d

- Job-API: jobs:更新与删除（PUT/DELETE）
  - 描述：实现编辑、软删除或关闭岗位逻辑，权限校验。
  - 验收：只有 admin/hr 可以修改，删除为软删除并写入审计日志。
  - 标签：backend, api
  - 估时：1d

- Job-DB迁移 & model
  - 描述：设计 jobs 表、索引（title 唯一索引、skills JSON 索引）。
  - 验收：迁移脚本可运行并能回滚。
  - 标签：db, migration
  - 估时：0.5d

- Job-前端：岗位列表页
  - 描述：实现岗位列表、搜索、筛选、分页、岗位状态显示。
  - 验收：能查看/搜索/打开岗位详情，列表响应 <1s（测试数据）。
  - 标签：frontend, ui
  - 估时：1.5d

- Job-前端：岗位创建/编辑表单
  - 描述：表单校验（title 必填、skills tag 选择/新增）。
  - 验收：表单校验生效，提交后跳转到岗位详情。
  - 标签：frontend, ui
  - 估时：1.5d

-----------------------
2) 简历管理（Resume） — 精细拆分（这是工作量较大的模块）
A. 上传与存储层
- Resume-API: 上传 endpoint（multipart）
  - 描述：后端实现文件接收、大小/类型校验（≤10MB）、存对象存储（S3或内部）。
  - 验收：上传成功返回 file_id 与任务 id，非法格式返回 415/400。
  - 标签：backend, storage
  - 估时：1d

- Resume-Storage: 对象存储接入与权限
  - 描述：S3/MinIO 配置、私有读写、URL 签名下载。
  - 验收：上传文件可签名下载，未授权不能访问。
  - 标签：infra, storage
  - 估时：1d

B. 异步解析流水线（建议用队列：Bull + Redis）
- Resume-Worker: 上传后入队（解析任务）
  - 描述：在上传成功后把解析任务入队，并返回任务 id 供查询。
  - 验收：入队成功、worker 能拉取任务。
  - 标签：backend, queue
  - 估时：0.5d

- Resume-Parser 基础实现（文本格式 PDF/DOC/TXT）
  - 描述：实现对 TXT/DOC/PDF 的文本提取与正则/规则字段抽取（name/phone/email）。
  - 验收：对样例文件能抽出姓名/电话/邮箱/主要工作经历/技能。
  - 标签：backend, parser
  - 估时：2d

- Resume-Parser：失败/重试/错误报告
  - 描述：解析异常时记录错误、支持重试机制与人工重解析入口。
  - 验收：解析失败记录日志、可在 UI 发起重试并成功或显示错误详情。
  - 标签：backend, ops
  - 估时：0.5d

C. 结构化存储与索引
- Resume-DB model & migration
  - 描述：resumes 表、parsed_json 字段、全文索引支持（MySQL FULLTEXT 或 ElasticSearch）。
  - 验收：parsed_json 存储成功；全文检索能返回相关结果。
  - 标签：db, migration
  - 估时：1d

- Resume-Search: 基本全文/字段检索接口
  - 描述：实现按 name/phone/skill/job 过滤与分页。
  - 验收：检索返回正确结果并支持分页与排序。
  - 标签：backend, search
  - 估时：1d

D. 前端：上传组件与导入 UI
- Resume-前端：上传/批量导入页面
  - 描述：支持拖拽、进度显示、导入模板选择（可选）。
  - 验收：能上传多个文件并看到每个文件解析状态。
  - 标签：frontend, ui
  - 估时：1.5d

- Resume-前端：解析状态面板与错误查看
  - 描述：展示每个任务的解析结果/失败原因、提供重试按钮。
  - 验收：错误原因可查看并能触发后台重试。
  - 标签：frontend, ui
  - 估时：1d

E. 列表/详情/编辑/导出
- Resume-API: 列表与详情接口
  - 描述：实现简历列表（mask phone 可选）、详情返回 parsed_json 与原始文件下载链接。
  - 验收：详情能看到 parsed 字段，下载链接有效（权限控制）。
  - 标签：backend, api
  - 估时：1d

- Resume-前端：列表页与详情页
  - 描述：实现列表（筛选/分页/关联岗位）和详情（结构化字段编辑、历史）。
  - 验收：能编辑并保存结构化字段，操作写审计日志。
  - 标签：frontend, ui
  - 估时：2d

- Resume-导出/批量操作
  - 描述：支持按筛选条件导出 CSV、批量标记状态（例如标记面试通过/淘汰）。
  - 验收：导出文件格式正确，批量操作返回结果。
  - 标签：backend, frontend
  - 估时：1d

F. 去重与重复检测（可选）
- Resume-Dedup: 基于 phone/email 的重复检测
  - 描述：上传时检测重复简历并提示或合并。
  - 验收：重复时提示并展示可能重复记录。
  - 标签：backend
  - 估时：1d

-----------------------
3) 题库管理（Question） — 细化任务
- Question-DB & model + migration
  - 描述：questions 表、tags 表、question_tag 多对多表。
  - 验收：迁移成功并能查询题与标签关系。
  - 标签：db
  - 估时：0.5d

- Question-API: 单题 CRUD（POST/GET/PUT/DELETE）
  - 描述：实现题目 CRUD 接口，删除需二次确认逻辑（前端弹窗）。
  - 验收：CRUD 完整、删除有软删除策略或记录删除者。
  - 标签：backend
  - 估时：1d

- Question-前端：题库管理页（增删改查）
  - 描述：题目列表、编辑器（支持富文本/markdown）、标签管理。
  - 验收：能创建/编辑题并在列表检索。
  - 标签：frontend
  - 估时：2d

- Question-Import: CSV/TXT 批量导入向导
  - 描述：文件上传、字段映射、逐行校验、导入报告（成功/失败行）。
  - 验收：导入报告准确、错误行可查看并重试。
  - 标签：backend, frontend, import
  - 估时：2d

- Question-Tag管理与筛选
  - 描述：标签 CRUD、按标签筛选题库、标签层级支持（领域->技能）。
  - 验收：标签管理生效、筛选准确。
  - 标签：backend, frontend
  - 估时：1d

-----------------------
4) 面试管理（Interview） — 细化任务
- Interview-DB model & migration
  - 描述：interviews 表、interviewer_relations 表、history 表（状态变更）。
  - 验收：数据模型支持多面试官和轮次、记录变更历史。
  - 标签：db
  - 估时：0.5d

- Interview-API: 创建面试（POST /api/interviews）
  - 描述：后端处理创建、分配、通知任务入队（可选）。
  - 验收：创建成功并返回面试 id，面试在列表可见，通知消息入队。
  - 标签：backend
  - 估时：1d

- Interview-通知服务（邮件/站内/钉钉/Slack）
  - 描述：实现通知发送（可抽象为通知服务，支持异步）。
  - 验收：创建面试后通知到指定面试官（或写入通知中心）。
  - 标签：backend, integration
  - 估时：1.5d

- Interview-前端：新建面试表单/流程
  - 描述：选择候选人、岗位、面试官、时间、会议室、题目选择/推荐。
  - 验收：表单校验、保存后能跳转到面试详情。
  - 标签：frontend
  - 估时：1.5d

- Interview-前端/后端：填表评分模块
  - 描述：评分维度定义、评分权重、面试官填写后提交写入 result JSON。
  - 验收：面试官只能编辑分配到的面试并提交评分，提交后 HR 可查看。
  - 标签：frontend, backend
  - 估时：2d

- Interview-状态与流转（初试/复试/终试） & HR 回退
  - 描述：实现状态机、权限校验与操作审计。
  - 验收：能按节点流转并记录操作人/时间，HR 能回退。
  - 标签：backend
  - 估时：1d

- Interview-导出/报表（基础）
  - 描述：按招聘周期/岗位/面试官 导出面试记录与结果统计。
  - 验收：能导出 CSV 并按字段统计。
  - 标签：backend, reporting
  - 估时：1d

-----------------------
5) 智能匹配/推荐（Match） — DeepSeek 集成（Issue #2 已存在）
- Match-接口与适配层（后端）
  - 描述：实现 DeepSeek client wrapper：调用、重试、超时、rate-limit。
  - 验收：对外接口封装完成并可配置 API key/endpoint，异常记录。
  - 标签：integration, backend
  - 估时：1.5d

- Match-批量计算任务（异步）
  - 描述：为大批量简历/岗位计算匹配度的队列任务。
  - 验收：支持分页计算并写入 match_results 表。
  - 标签：backend, queue
  - 估时：1d

- Match-前端展示（简历详情/岗位详情/列表）
  - 描述：在 UI 显示匹配分数、匹配关键词高亮、候选职位推荐列表。
  - 验收：显示分数、关键词高亮且能点击查看推荐岗位。
  - 标签：frontend
  - 估时：1d

- Match-权重配置页面（Admin/HR）
  - 描述：前端允许 HR 修改权重（技能/经验/学历）并触发重新计算（异步）。
  - 验收：修改后写入配置并触发任务，新的分数生效。
  - 标签：frontend, backend
  - 估时：1d

