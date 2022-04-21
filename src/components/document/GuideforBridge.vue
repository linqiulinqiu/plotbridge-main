<template>
  <el-col>
    <h1>{{$t('guide-bridge')}}</h1>
    <el-col>
      <h2>{{$t('guide-bridge1')}}</h2>
      <p v-html="$t('guide-bridge2')"></p>
      <h2>{{$t('guide-bridge3')}}</h2>
      <p v-html="$t('guide-bridge4')"></p>
      <h2>{{$t('guide-bridge5')}}</h2>
      <p>{{$t('guide-bridge6')}}</p>
      <!-- <h2>如何将 XCC 转换成币安智能链上的 WXCC</h2>
        
      <p>
        1. 推荐在 Chrome 浏览器上访问 PlotBridge。<br>
        2. 运访问 PlotBridge 前，需要安装 MetaMask 钱包的 Chrome 插件，并在钱包注册一个账号。<br>
        3. 登录 MetaMask 钱包，连接到币安智能链主网。<br>
        4. 通过 <a href='https://bridgemarket.onrender.com/#/Bridge' target='_blank'>https://bridgemarket.onrender.com/#/Bridge</a>  运行 PlotBridge 。<br>
        5. 点击“连接钱包”，会弹出一个确认连接的窗口。<br>
        6. 如果连接成功，会在右上角显示钱包的地址同时在页面左侧的“我的 NFT ”侧框中会显示您所拥有的NFT。<br>
        7. 您需要至少一个 NFT 来运用桥的功能，一个 NFT 可以绑定多个不同币种的存款地址， NFT 可以通过“铸造 NFT ”按钮自行铸造，也可以在市场上购买，您也可以在市场上出售自己的 NFT。<br>
        8. 选择您拥有的一个 NFT，并选择要进行转换的币种（这里我们选择 XCC 进行演示），然后点击获取“获取 XCC 存款地址”按钮。<br>
        9. 页面中间会显示可以接收 XCC 的桥地址。每个NFT都会在该页面生成一个对应的桥地址。您可以从您的钱包或您的交易账户往这个桥地址发送代币。<br>
        10. 点击桥地址，可以复制该地址，保存在系统剪贴板中，作为您代币的接收地址。<br>
        11. PlotBridge 会将收到的 XCC 币转换成 BEP20 代币 WXCC 并将它们保存在您的 MetaMask 钱包中。您可以在交易页面或者在 PancakeSwap 网站上将 WXCC 代币兑换成其他代币（例如 BNB）。<br>
        12. PlotBridge 将收取少量的 XCC 作为交易费用。<br>
        13. 您可以在输入框中输入 XCC 的数量，页面会显示最终将交换并发送到您 MetaMask 钱包的代币 WXCC 数量。<br>
      </p>
      <h2>如何将 WXCC 转换回 XCC</h2>
      <p>
        1. 在取款页面，首先需要绑定你要提现 XCC 的韭菜钱包地址。<br>
        2. 输入 WXCC 的数量后，点击“取款”按钮，一定数量的 XCC 会进入您的 Chives 钱包。<br>
        3. PlotBridge 将收取少量的交易费用。<br>
      </p>
      <h2>旧版的代币不能用怎么办 </h2>
      <p>
        您可以在兑换页面将旧版的 PXCC 按照 1：1 的比例兑换成新版本的代币 WXCC。
      </p> -->
    </el-col>
  </el-col>
</template>

<script>
export default {
  name: "GuideforBridge",
};
</script>
<style scoped>
.el-col {
  padding: 30px;
}
</style>