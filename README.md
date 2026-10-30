# plotbridge-next

PlotBridge 新栈（React），绞杀者模式迁移的**阶段①：Bridge 先行**。旧站（`plotbridge-main`，Vue 2）保持运行，本应用逐步接管。

## 范围（阶段①）

- **Bridge 页**：PBT（NFT）选择、币种侧栏、Deposit（仅 WXCH 自动桥）/ Withdraw（烧币提现，全币种）/ Redeem（已结束的静态提示）。
- **钱包连接**：EIP-6963 多钱包发现（MetaMask 优先，修复扩展抢占问题）+ WalletConnect v2（恢复移动端路径）；BSC 主网/测试网，自动切链。
- **性能（方案 P1 落地）**：PBT 列表有限并发加载（替代串行 + 硬编码 sleep）、IPFS 元数据会话级缓存、网关链式重试（图片加载失败自动换源）、连接后 keeper 后台加载不阻塞。

未迁移（后续阶段）：Home 完整版、Doc、Market、Swap、Stake、Token。

## 技术栈

Vite 7 · React 18 · TypeScript · Ant Design 5（暗色主题）· zustand 5 · react-i18next（复用旧站 zh/en JSON）· ethers v6 · @walletconnect/ethereum-provider v2

合约地址与币种策略收敛在 `src/config/chains.ts`（不再依赖 `pbwallet` 包）；ABI 在 `src/config/abis/`（取自 pbwallet，权威源码在 `pbcontracts/`）。币种两档策略（`WCOIN_POLICY`：wxch 完整桥；whdd/wxcc/wxfx 仅提现）与旧站 `market.js` 保持一致。

## 开发

```bash
npm install
cp .env.example .env       # 填入 VITE_WALLETCONNECT_PROJECT_ID
npm run dev                # http://localhost:5173
npm run build              # 产物在 dist/
```

`VITE_WALLETCONNECT_PROJECT_ID` 在 https://cloud.reown.com 免费注册；不填时连接弹窗只显示浏览器钱包（injected），WalletConnect / 移动端入口隐藏。

`chia-utils` 沿用旧站的本地打包文件（`public/js/chia-utils.js`，挂 `window.ChiaUtils`），负责 puzzle hash ↔ bech32m 地址换算。

## 部署

Render 静态站点，配置已代码化在 `render.yaml`（构建 `npm ci && npm run build`，发布 `dist/`）。路由用 hash 模式，静态托管无需重写规则。

## 金额与费用口径

兑付金额 = 烧币量 − max(费率×金额, 最小费)，费率（1/10000）与最小费从各 W 合约读取，与旧站 "You will get" 及链下兑付脚本一致；精度一律读 `decimals()`，不硬编码（WXCC 是 8 位）。
