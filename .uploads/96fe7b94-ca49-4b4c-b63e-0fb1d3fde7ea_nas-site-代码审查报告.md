# nas-site-代码审查报告

# nas-site 代码审查报告

> 仓库：`arvinjiu/nas-site`（Gitee）
> 审查时间：2026-10-13　｜　审查范围：全仓库（排除 `.git`、`node_modules`）
> 代码规模：**633 行**（22 个 TS/TSX 文件 + Prisma schema + Docker 配置）
> 技术栈：Next.js 15.5.7 + React 19 + Auth.js v5 (beta.25) + Prisma 6.2.1 + PostgreSQL 16 + Tailwind

---

## 一、验证结论摘要

我用工具实际跑过，结论如下：

| 检查项 | 命令 | 结果 |
| --- | --- | --- |
| 类型检查 | `npx tsc --noEmit` | ✅ 通过（0 错误，`strict: true`） |
| 代码检查 | `npx eslint .` | ✅ 通过（0 错误 0 警告） |
| 生产构建 | `npx next build` | ✅ 成功（7 个路由，首屏 JS 102 kB） |
| 依赖审计 | `npm audit --omit=dev` | 🔴 **2 个 critical 漏洞组** |

**总体评价**：这是一份**质量明显高于平均水平**的骨架项目——有类型增强、有逻辑抽象、有安全响应头、有纵深防御、有完整文档与技术债记录。**主要风险不在业务代码，而在「依赖版本」与「运维配置的凭据管理」两处。**

---

## 二、问题清单

### 🔴 严重（建议立即处理）

#### S1. Git 历史残留真实凭据（最高优先级）

- **位置**：`部署SOP.md` 的历史版本（提交 `aec7745` \~ `442d7e3`）
- **证据**（`git log -p` 可直接看到）：

```
-DATABASE_URL: postgresql://app:TwpV50dmSjCEd0hF648e@db:5432/mysite
-ssh liufei@192.168.5.23          # NAS 账号 + 内网 IP
-**背景**：公司实测 cyberfei.com 已解析到公网 IP 180.154.42.223
```

- **泄露内容**：数据库密码 `TwpV50dmSjCEd0hF648e`、NAS 用户名 `liufei`、NAS 内网 IP `192.168.5.23`、公网 IP `180.154.42.223`、作者手机号邮箱
- **为什么是高危**：最新提交虽然已把明文删掉，但 **Git 历史不可逆**——任何人 `clone` 后执行 `git log -p` 就能拿到。而**仓库当前已设为公开**，等于数据库密码已经暴露在公网。
- **修复**：
  1. **立即更换 PostgreSQL 密码**（视为已泄露，改 `.env` 里的 `DB_PASSWORD` 并重建 db 容器卷）；
  2. **清理历史**：用 `git filter-repo --replace-text` 或 BFG 重写历史，再 force push；
  3. 今后凭据一律走 `.env`（已正确加入 `.gitignore`），文档里只用占位符。

#### S2. 依赖存在 critical 级已知漏洞

`npm audit --omit=dev` 输出两个高危依赖组：

| 依赖 | 严重度 | 关键漏洞 |
| --- | --- | --- |
| `next@15.5.7` | **critical** | **App Router 中间件绕过**（GHSA-267c-6grr-h53f、GHSA-26hh-7cqf-hhc6、GHSA-492v-c6pp-mqqv）、RSC 缓存投毒、多个 DoS、CSP nonce XSS |
| `@auth/core <=0.41.2`（经 `next-auth@5.0.0-beta.25`） | **critical** | **邮箱 Unicode 同形字绕过**（GHSA-7rqj-j65f-68wh）、`getToken()`** 遇畸形 Bearer 头抛未捕获异常**（GHSA-xmf8-cvqr-rfgj）、OAuth state/nonce 未绑定 provider |

- **对本项目的直接影响**：
  - **中间件绕过**：`middleware.ts` 正是用中间件做 `/admin` 权限控制 —— 存在被绕过的理论路径。
    > ✅ **所幸 **`app/admin/page.tsx:12`** 有服务端二次校验**（`session?.user?.role !== Role.ADMIN`），构成纵深防御，页面本身不会失守。这是本项目做得对的关键一点。
  - `getToken`** 异常**：`middleware.ts:7` 调用 `getToken` 且**未包 try/catch**，构造畸形 `Authorization: Bearer` 头即可触发未捕获异常 → 影响 `/admin`、`/login`、`/register` 三个路径（可被用作 DoS 点）。
- **修复**：升级 `next` 到已修补版本；`next-auth` 升到 `5.0.0-beta.32+`（`npm audit` 已给出修复路径）。升级后回归测试登录/登出/鉴权。

#### S3. 管理员密码在每次容器重启时被重置

- **位置**：`Dockerfile:37`（CMD）→ `scripts/init-admin.ts` → `lib/ensure-admin.ts:14-18`
- **问题**：容器 CMD 每次都执行 `node init-admin.cjs`，而 `ensureAdmin` 的 upsert 写的是：

```ts
update: { role: Role.ADMIN, passwordHash },   // ← 无条件覆盖密码
```

- **后果**：
  - 你在网站里改过的管理员密码，**重启容器后会被重置回 **`.env`** 里的 **`ADMIN_PASSWORD`；
  - 而 `部署SOP.md` 明确写着"管理员密码部署后立即改"——**改了会被覆盖，前后矛盾**；
  - 若 `.env` 里是弱密码，等于**永久弱口令**。
- **修复**：改为「仅当用户不存在时创建」，密码更新用显式开关控制：

```ts
const exists = await prisma.user.findUnique({ where: { email } });
if (exists) {
  if (process.env.FORCE_ADMIN_RESET === "true") {
    return prisma.user.update({ where: { email }, data: { role: Role.ADMIN, passwordHash } });
  }
  return exists;   // 已存在则不动密码
}
return prisma.user.create({ data: { email, passwordHash, name, role: Role.ADMIN } });
```

#### S4. 管理员初始化不做任何强度校验

- **位置**：`scripts/init-admin.ts:13`（仅 `if (!email || !password)`）→ `lib/ensure-admin.ts`
- **问题**：
  - **只校验非空**，不校验长度——`ADMIN_PASSWORD="1"` 也能建出管理员；
  - 而注册接口要求 `password.length >= 8`（`app/api/register/route.ts:24`），**两条路径策略不一致**；
  - 更糟的是 `.env.example:15` 的占位值是 `"请填写管理员密码（至少8位）"`——用户若忘记修改，**这个可猜的字符串就成了真实管理员密码**。
- **修复**：`init-admin` 增加最小长度校验，并显式拒绝占位值：

```ts
if (!password || password.length < 8 || password.includes("请填写")) {
  console.error("[init-admin] ADMIN_PASSWORD 未设置或强度不足（需 ≥8 位）");
  process.exit(1);
}
```

---

### 🟠 中等

#### M1. 注册接口存在竞态条件（TOCTOU）

- **位置**：`app/api/register/route.ts:28-36`
- **问题**：先 `findUnique` 查重、再 `create`，两步非原子。并发或重放请求时，第二个会触发 Prisma 唯一约束错误（`P2002`），被外层 `catch` 兜住后返回 **500**，而不是语义正确的 **409**。
- **修复**：捕获 Prisma 错误码并映射为 409：

```ts
} catch (err) {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
  }
  // ...原 500 分支
}
```

#### M2. 邮箱未做 Unicode 规范化，存在同形字绕过与冒充风险

- **位置**：`app/api/register/route.ts:14`、`lib/auth.ts:20`
- **问题**：仅做 `trim().toLowerCase()`，**未做 **`.normalize("NFKC")`；校验正则 `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` 过宽，放行了 Unicode 字符。
- **风险**：可用同形字构造"肉眼看起来一样"的邮箱（例如西里尔字母 `а` 与拉丁 `a`），从而绕过查重、并在管理员用户列表中造成**视觉冒充**。这与 S2 中 `@auth/core` 的 critical 漏洞属于同一类问题。
- **修复**：

```ts
const email = String(body?.email ?? "").normalize("NFKC").trim().toLowerCase();
// 并收紧正则，仅允许 ASCII：/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i
```

#### M3. `/register` 是静态页，不受 `ALLOW_REGISTER` 控制

- **位置**：`app/(auth)/register/page.tsx`、`app/page.tsx:42-47`
- **证据**：构建输出显示 `○ /register (Static)` —— 注册页在构建期固化，**读不到运行时环境变量**。
- **后果**：当 `ALLOW_REGISTER=false`（默认值）时：
  - 首页仍显示"注册"按钮 → 点进去表单照样能填 → 提交后才收到 403"注册已关闭"，体验割裂；
  - 对攻击者而言，注册入口的"存在性"也无法通过配置关闭。
- **修复**：注册页改为动态（读 `process.env.ALLOW_REGISTER` 决定是否渲染表单），并按同一开关隐藏首页注册入口。

#### M4. 登录/注册无速率限制（暴力破解 + 刷号）

- **位置**：`app/api/register/route.ts`、Auth.js 登录流程
- **问题**：`技术待办.md` 第 9 条已识别，但**尚未实现**。后果：
  - `/api/register` 可批量调用 → 刷号、探测邮箱是否存在；
  - 登录可无限次尝试 → **暴力破解密码**。
- **修复**：加基于 IP 的限流（中间件内的滑动窗口，或引入 Redis/Upstash 计数器），登录失败加指数退避。

#### M5. 用户枚举（信息泄露）

- **位置**：`app/api/register/route.ts:29-31`
- **问题**：返回 409 `"该邮箱已注册"` 明确告知邮箱存在性 → 可用于枚举已注册用户。
- **对比**：登录接口返回统一的 `"邮箱或密码错误"`（`components/LoginForm.tsx:25`）—— ✅ **这点做对了**。
- **修复**：注册接口改为模糊提示，或叠加图形验证码/限流以抑制枚举效率。

#### M6. 中间件缺少异常处理与环境校验

- **位置**：`middleware.ts:7`
- **问题**：`await getToken({ req, secret: process.env.AUTH_SECRET })` 未包 try/catch；且**没有任何地方校验 **`AUTH_SECRET`** 是否存在**。
- **后果**：若 `AUTH_SECRET` 缺失或密钥不匹配，`getToken` 返回 `null`/抛错 → **管理员也会被挡在 **`/admin`** 之外**，且无任何提示，极难排查。
- **修复**：

```ts
let token = null;
try {
  token = await getToken({ req, secret: process.env.AUTH_SECRET });
} catch {
  return NextResponse.next();   // 鉴权失败不应让整站 500
}
```

并在应用启动时校验必需环境变量。

#### M7. 缺少 CSP 与 HSTS 响应头

- **位置**：`next.config.ts:3-8`
- **现状**：已配置 `X-Content-Type-Options`、`X-Frame-Options`、`Referrer-Policy`、`Permissions-Policy` ✅ **（做得好）**
- **缺失**：`Content-Security-Policy`（XSS 纵深防御）、`Strict-Transport-Security`（上 HTTPS 后必需）。考虑到 `next@15.5.7` 本身存在 CSP nonce XSS 漏洞，补齐 CSP 价值更高。
- **修复**：补充 CSP（Next.js 官方推荐用 nonce 方案）；配置 TLS 后加 HSTS。

---

### 🟡 轻微 / 改进项

| 编号 | 位置 | 问题 | 建议 |
| --- | --- | --- | --- |
| L1 | `middleware.ts:11-13` | 已登录的非管理员访问 `/admin` → 重定向 `/login` → 又被重定向 `/`，**绕一圈回首页**，语义不当 | 已登录时直接回 `/` 或返回 403 页 |
| L2 | `app/admin/page.tsx:16-25` | 用户列表 `findMany` 无分页，全量查询 | 加分页（`take/skip`） |
| L3 | `app/admin/page.tsx:53` | `createdAt.toLocaleString()` 在服务端渲染，按\*\*容器时区（UTC）\*\*显示 | 显式指定时区或客户端格式化 |
| L4 | `app/api/register/route.ts:14-16` | `name`/`email` 无长度上限，可存超长字符串 | `name ≤ 50`、`email ≤ 254` |
| L5 | `app/api/register/route.ts:16` | `String(body.name)` 未校验类型，传对象会得到 `"[object Object]"` | 先 `typeof === "string"` 判断 |
| L6 | `lib/auth.ts:10` | JWT 会话未设 `maxAge`（默认 30 天），改密码后旧 token 仍有效 | 缩短有效期，或 token 内加密码版本号校验 |
| L7 | `Dockerfile:19-37` | 容器以 **root** 运行 | 加 `USER node` |
| L8 | `docker-compose.yml` | db 有 healthcheck，**web 没有** | 给 web 加健康检查 |
| L9 | 环境变量 | 未设 `AUTH_URL`；上 HTTPS 反代后需显式配置 | 结合 `trustHost` 正确设置 |
| L10 | `部署SOP.md:46` | `cd /volume1/docker` 是**群晖**路径，绿联 UGOS 结构不同 | 更正为绿联实际路径 |
| L11 | `Dockerfile:37` | `db push` 在启动时执行；若变更为破坏性会**报错退出 → 容器重启循环** | 迁移到部署流水线（技术待办已记） |
| L12 | 全局 | 无测试、无 CI、无 Prettier | 技术待办已记录，按计划推进 |

---

## 三、代码质量亮点（值得保留）

1. **纵深防御到位**：`middleware` + 页面双重权限校验 —— 这正是抵御 S2 中间件绕过漏洞的关键，是本项目安全设计的最大加分项。
2. **抽象合理**：`lib/password.ts`（统一哈希/校验）、`lib/ensure-admin.ts`（去重）职责清晰。
3. **类型完备**：`types/next-auth.d.ts` 扩展了 `Session`/`JWT`，`strict: true` 下零类型错误，避免了 `as` 断言。
4. **敏感字段处理正确**：管理员查询用 `select` 显式排除 `passwordHash`（`app/admin/page.tsx:18-24`）。
5. **错误处理不外泄**：注册接口 `catch` 后只返回通用文案，未把内部堆栈抛给前端（`app/api/register/route.ts:42-47`）。
6. **密码哈希规范**：bcrypt rounds=10，取值合理。
7. **输入归一一致**：注册与登录都对 email 做 `trim().toLowerCase()`，两处逻辑对齐。
8. **Docker 规范**：多阶段构建 + `output: standalone` + `npm ci` + 非必要端口不对外暴露，写得比多数个人项目讲究。
9. **文档意识强**：`README` / `技术待办` / `部署SOP` 三份齐备，技术债有分级记录——**这点非常难得**。
10. **SignOut 用法正确**：`signOut({ callbackUrl: "/" })` 在 Auth.js v5 中仍受支持（源码中 `redirectTo ?? callbackUrl` 兼容保留），✅ 非缺陷。

---

## 四、修复优先级建议

| 顺序 | 事项 | 类型 | 预计工作量 |
| --- | --- | --- | --- |
| **1** | **更换数据库密码** + 清理 Git 历史凭据（S1） | 安全·紧急 | 30 分钟 |
| **2** | 升级 `next` / `next-auth` 修补漏洞（S2） | 安全·紧急 | 30 分钟 + 回归 |
| **3** | 修正管理员密码重置逻辑（S3） | 安全 | 20 分钟 |
| **4** | 管理员初始化加强度校验（S4） | 安全 | 10 分钟 |
| **5** | 中间件加 try/catch + env 校验（M6） | 稳定性 | 15 分钟 |
| **6** | 注册接口：P2002 → 409 + NFKC 归一（M1、M2） | 正确性 | 20 分钟 |
| **7** | 注册页改为动态、受开关控制（M3） | 体验 | 20 分钟 |
| **8** | 加限流（M4） | 安全 | 1 小时 |
| 9 | 补齐 CSP/HSTS（M7） | 安全 | 30 分钟 |
| 10 | 轻微项 L1–L12 | 打磨 | 按需 |

---

## 五、一句话总结

**代码本身写得干净、规范、有防御意识，问题集中两点：一是为了省事把凭据写进文档又提交了 Git（且仓库刚转为公开），二是依赖版本选用了带 critical 漏洞的 beta 版本。先把数据库密码换掉、历史清干净，再升级依赖，这个项目的安全水位就能上一个台阶。**
