# 植觉 · 家庭绿植养护 App（前端实现）

依据《植觉 产品需求文档（PRD）V1.0》搭建的移动端应用工程，实现 P0 养活闭环（F01–F04）与 P1 主要页面（F05–F07）的可交互原型。

## 运行

```bash
npm install
npm run dev      # http://127.0.0.1:5180
npm run build    # 类型检查 + 生产构建到 dist/
npm run preview  # 用 dist/ 起静态服务，同样在 http://127.0.0.1:5180
```

## 发布（静态站点）

`npm run build` 后的 `dist/` 就是可直接发布的成品（`base: './'` 用相对路径，放到任意子目录也能跑）：

- 本地发布/演示：`npm run preview` → http://127.0.0.1:5180 （端口在 `vite.config.ts` 的 `preview` 里固定，`strictPort: true`，被占用会直接报错而不是换端口）
- 公网托管：把 `dist/` 整个上传到任意静态托管（阿里云 ECS + Nginx / EdgeOne / Vercel / Netlify / 对象存储 + CDN）即可；路由用 HashRouter，无需服务端 rewrite 配置
- 不依赖 Node 服务端与数据库，数据存在浏览器 localStorage（键 `zhijue.state.v1`），换域名等于换一份新数据

### 已在阿里云 ECS 上线

- 线上地址：**http://8.134.143.41/zhijue/**
- 服务器：Ubuntu 22.04.5 / Nginx 1.18.0，静态目录 `/opt/zhijue`（owner `www-data`）
- Nginx：在既有 `default_server`（`/etc/nginx/sites-available/petpal`，`root /opt`）里新增 3 个 location：
  ```nginx
  location = /zhijue { return 301 /zhijue/; }
  location /zhijue/ { try_files $uri $uri/ /zhijue/index.html; }
  location /zhijue/assets/ { expires 30d; add_header Cache-Control "public, max-age=2592000, immutable"; }
  ```
  原配置备份在 `/etc/nginx/sites-available/petpal.bak-zhijue`；同机 `/petpal/`、`/zhujian/`、`/api/`、`/` 均已回归验证未受影响。
- **为什么素材路径要经过 `utils/asset.ts`**：部署在子路径 `/zhijue/` 下时，数据里写死的 `/images/x.jpg` 会解析到站点根目录而 404。`asset()` 用 `import.meta.env.BASE_URL` 拼出 `./images/x.jpg`，根路径部署与子路径部署都成立。
- 更新流程：本地 `npm run build` → 重新打包 `dist/` → 服务器 `/opt/zhijue` 覆盖解压 → `systemctl reload nginx`（静态文件不需要 reload，仅换目录内容时可跳过）。

首次启动会自动写入一份示例数据（4 盆植物、5 条养护记录、3 条成长日记），可在「我的 → 重置温室数据」恢复。

> 环境说明：本项目所在机器启用了应用控制策略，会拦截 rollup 原生模块（`*.node`）。因此 `package.json` 里把 `rollup` 指向了官方 `@rollup/wasm-node`，功能等价、速度略慢。若在不受限制的机器上开发，可移除该依赖与 `overrides` 字段以恢复原生版。

## 技术栈

- React 19 + TypeScript（strict）+ Vite 6
- Tailwind CSS v4（`@theme` 定义设计 token）
- React Router 7（HashRouter，免服务端重写）
- 无外部状态库：Context + 纯函数领域模型，便于迁移

## 目录结构

```
src/
├─ data/            领域模型与静态知识
│  ├─ types.ts          Plant / Species / DiaryEntry / DiseaseCondition 等
│  ├─ species.ts        9 个品种养护模板（光照/水分/周期/毒性/繁殖）
│  ├─ diseases.ts       5 类常见病害病因、处理步骤与预防
│  └─ community.ts      社区种子内容
├─ services/        可替换的业务逻辑层
│  ├─ care.ts           排期引擎：下次浇水/施肥、状态机、今日待办、统计
│  ├─ repository.ts     仓储接口 + 本地实现 + HTTP 实现（预留）
│  ├─ identify.ts       识图/病害服务（当前为本地演示实现）
│  └─ seed.ts           初始数据
├─ store/
│  └─ GardenProvider.tsx  状态容器与领域动作（打卡/日记/标记异常/设置）
├─ components/      通用组件（TabBar、进度环、卡片、底部面板、Toast、图标）
├─ pages/           七个页面
└─ styles/index.css 设计 token、手机容器、动画
```

## PRD 功能映射

| 编号 | 功能 | 实现位置 | 状态 |
|---|---|---|---|
| F01 | 拍照识植物 | `pages/Identify.tsx` + `components/CameraSheet.tsx` + `services/vision.ts` + `services/identify.ts` | 已实现（真实摄像头取景抓帧、相册多选、最多 3 张「全株/局部/背面」、Top-3 候选含学名与匹配度、判断依据、养护速览、一键入温室、识图历史含重识别与误识别反馈；识别为本地视觉特征引擎，见下节） |
| F02 | 养护提醒 | `services/care.ts` 排期引擎、温室「今日待办」聚合卡 | 部分实现（按品种模板自动排期浇水/施肥、今日待办聚合、打卡顺延、免打扰时段；转盆/清洁、季节与天气联动、真实推送待下一批） |
| F03 | 我的温室 | `pages/Greenhouse.tsx`、`pages/PlantDetail.tsx` | 已实现（扇形转盘 + 卡片墙双视图、三态状态模型、搜索、状态分组、批量打卡/移出、详情页进度环与要点表；归档与按摆放位置分组待补） |
| F04 | 病害识别 | `pages/Identify.tsx` 病害模式、`data/diseases.ts` | 已实现（基于画面黄化/褐斑/暗部/纹理碎化/高光算病因相对概率、紧急程度、处理步骤、预防、标记异常；多图补充与转人工入口待补） |
| F05 | 成长日记 | 详情页时间轴 + 「记一笔」 | 已实现（时间轴、里程碑、入库天数、图片记录、打卡自动生成记录节点；左右交替排图与导出长图待补） |
| F06 | 养护百科 | `pages/Discover.tsx`、`pages/SpeciesDetail.tsx` | 已实现（筛选、结构化养护卡、难度分级、宠物毒性提示、百科↔温室互跳；地区季节差异化待补） |
| F07 | 社区 | `pages/Community.tsx`、`pages/PostDetail.tsx`、`pages/Publish.tsx` | 双列瀑布流 + 推荐/关注/同城切换；发布动态（选图/文案 140 字/话题/城市）已可用；帖子详情含关注、点赞、收藏、评论发送与同话题推荐 |
| F08/F09 | 商城、硬件 | — | PRD 标 P2，本版未实现 |

## 设计实现要点

- 温室首屏的「扇形转盘」改为三格制：中间一格是当前植株（168px 圆形大图 + 状态色环），左右各一格为相邻植株，滑动或点侧格切换，点中间进详情；扇盘几何按 398×258 画布重排（R_FAN 202 / 弧带 204–224 / 主位 164 / 侧位 172 / 档位 52°），外弧在卡片宽度内刚好铺满。
- 卡片高度取 `calc(100svh - 356px)`：在手机上这一块正好占满剩余一屏，今日待办、养护提示需要下滑才出现；下滑时靠纵向位移判定，避免滚动被误判成切换植物。

- 主色 `#3E7C5A`、深绿 `#2F6047`、米白 `#FAF6EE`、陶土橙 `#C77B58`、预警黄 `#D9A441`；圆角 24/18/12，柔和阴影。
- 桌面端固定 430px 手机列并水平居中，隐藏原生滚动条但保留滚动；移动端铺满视口，底部五 Tab 贴底。
- 温室首页采用「扇形转盘」主视觉：所有植物沿半圆弧排布，外圈弧带颜色即养护状态（绿/黄/红），弧带厚度与扇区盘片共同构成转盘感；拖动或点击缩略图可旋转切换，当前植物在弧心上方以圆形大图呈现，左侧水位计显示距下次浇水的剩余水量，中心 ＋ 进入拍照识别。
- 转盘与卡片墙共享同一份筛选结果：搜索按昵称/品种名/学名命中，状态 chips 分组，切换视图不丢筛选；批量管理在卡片上叠勾选徽标，底部吸附操作条支持全选、批量打卡（仅对到期项生效）与移出。
- 打卡不只更新时间戳：`carePlant` 会向该植物的成长日记头部写入一条记录节点（浇水/施肥打卡 + 一句状态描述），实现 F05 的「轻量联动」。
- 社区二级页：帖子详情 hero 按原图比例铺满，话题/城市为毛玻璃胶囊，评论输入框吸在 TabBar 上方；发布页为 sticky 顶栏 + 4:5 预览 + 话题/城市胶囊，未填图文时发布按钮置灰。
- 设置页集中管理昵称、聚合提醒开关、提醒时间与免打扰区间，重置数据需「再点一次确认」，与「我的」页共用同一份 `settings`。
- 社区数据全部进 `AppState.community`（`posts / comments / follows / likedPosts / collectedPosts`），发布、评论、点赞、收藏、关注刷新后都不丢；植物详情「晒到社区」会带着照片与「入伙第 N 天」文案跳到发布页，形成 养护 → 记录 → 分享 的闭环；「我的」页展示我的动态/收藏数量并可跳转到筛选后的社区。
- 状态不只靠颜色区分：每个状态徽章同时带圆点与文字（健康/需注意/异常），满足无障碍要求。
- 朋友圈式的图片作为唯一视觉主角，文字信息层级收敛到 3 级（标题 15–27px、正文 11.5–13px、辅助 9.5–10.5px）。

## 识图到底怎么实现的

- **真采集**：`拍照` 走 `CameraSheet`（`getUserMedia` 实时取景 → canvas 抓帧 → JPEG）；权限被拒、无设备或 8 秒无响应都会给明确提示并回退到系统相机/相册。`相册` 走多选 `input[type=file]`，最多 3 张（全株 / 局部 / 背面）。
- **真分析**：`src/services/vision.ts` 把图片画到 96×96 canvas 采样，先找出「植株像素」的外接框再外扩 8%，**只在框内统计**颜色与纹理，白墙、桌面、花盆这类背景不会把数据带偏；得到色相/明度/饱和度、黄化与褐斑占比、填充率、高宽比、内部纹理密度、主体占比共 11 维特征，全程在浏览器本地完成，照片不上传。
- **真匹配**：`src/services/identify.ts` 用这 11 维特征与 9 个品种画像做高斯相似度加权打分。匹配度 = 绝对相似度 × softmax 相对份额，**相似度不够就明确说「没认准」**（顶分不足或与第二名差距过小都判为不确定），不再把库外品种硬塞给最接近的那个；多角度按主体占比加权融合并给有限加成。
- **画像来自实测**：`scripts/calibrate.py` 用同一套算法量 `public/images` 的参考图，`scripts/score_check.py` 验证 9 张参考图都能各自排第一，也能直接喂外部真实照片看排序；品种画像即取自这些实测值。换素材或加品类时重跑这两个脚本。
- **病害**：同一条特征管线，用黄化率、褐斑率、暗部、纹理碎化、高光灼伤算 5 种病因的相对概率与紧急度，画面看起来健康时给保守结论。
- **边界**：这是离线可运行的粗筛引擎，不是训练好的物种分类模型，解释不了叶裂、叶脉、刺等形态细节，同属相似品种容易混。实测边界：白底棚拍或叶片占满画面的照片命中率高（芦荟 92%、橡皮树 84%、吊兰 91%），远景/房间全景里植株很小时会判「没认准」。接真实视觉模型时替换 `identifyService` 的两个方法即可，返回结构（`IdentifyOutcome` / `DiseaseOutcome`）不变。

## 数据与后端接入

UI 只依赖 `GardenRepository` 接口，当前实现为 `LocalGardenRepository`（localStorage，键 `zhijue.state.v1`，结构 `version/plants/logs/settings/history/community`，`version` 现为 2）。读取时会做归一化与容错（缺字段补默认、`history` 仅保留最近 12 条、`community.follows` 首启时从种子内容派生），旧数据可直接升级。接入服务端时：

1. 配置 `VITE_API_BASE`，把 `gardenRepository` 换成 `HttpGardenRepository`；
2. 后端实现 `GET/PUT/DELETE /garden`，请求体与 `AppState` 同构；
3. 领域逻辑（排期、状态、打卡）保持在前端纯函数中，服务端只需存储与校验。

识图服务同理：`identifyService.identifyPlant / identifyDisease` 的返回结构即为接口契约（候选列表 + 匹配度 + 是否需要重拍 / 病因列表 + 紧急程度）。

## 已知限制

- 识图为本地视觉特征引擎（非训练模型）：对 9 个内置品种的参考图判断稳定，真实用户照片的准确率取决于画面里叶片的占比、光线与背景；病害只做粗筛。上传照片会在浏览器内压缩（≤720px）后写入本地存储，识图历史只保留最近 12 条以免撑爆 localStorage。
- 推送提醒仅体现业务规则（09:30 聚合、免打扰时段），未接入系统通知。
- 社区内容（动态/评论/关注/点赞/收藏）已本地持久化，但没有服务端审核与分页；分享使用 Web Share / 剪贴板，未接第三方 SDK。
- 转盆/清洁类任务、按季节与天气的周期微调、归档、按摆放位置分组仍待实现（`Plant` 目前没有 location/归档字段）。
- 图片素材为 AI 生成的自然光实拍风格图，已压缩至 1024px 存放于 `public/images`。
