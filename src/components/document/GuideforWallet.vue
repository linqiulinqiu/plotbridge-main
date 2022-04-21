<template>
  <el-col>
    <h1>{{$t('guide-wallet')}}</h1>
      <el-col>
        <h2>{{$t('guide-wallet1')}}</h2>
        <h3>{{$t('guide-wallet2')}}</h3>
        <p v-html="$t('guide-wallet3')"></p>
        <h3 v-html="$t('guide-wallet4')"></h3>
        <p v-html="$t('guide-wallet5')"></p>
        <h3 v-html="$t('guide-wallet6')"></h3>
        <p v-html="$t('guide-wallet7')"></p>
        <!-- <h2>
          操作指南：将 MetaMask 连接到币安智能链
        </h2>
        <h3>安装和设置 MetaMask </h3>
        <p>
        首先下载适用于 Chrome、Brave、iOS 和 Android 的MetaMask。<br>
        - 接下来，创建一个钱包 <br>
        - 在安全的地方写下助记词（最好不要在连接互联网的设备上） <br>
        - 没有助记词，如果您的设备损坏或丢失，您的资金将无法恢复 <br>
        - 最后，按照屏幕上的说明确认您的助记词 <br>
        - 到这一步,您的钱包已准备好发送、存储和接收代币。
        </p>
        <h3>
          自动配置钱包
        </h3>
       
        <p>
        - 您可能会注意到刚创建好的钱包仍在以太坊网络链。它并不适用于币安智能链 ，如果不转换到币安智能链，可能会造成将资金发送到您实际上无法使用的地址而导致资金损失。<br>
        - 您可以通过访问<a href="https://bscscan.com" target="_blank">币安链区块浏览器（bscscan.com）</a> 来快速配置币安智能链，进入<a href="https://bscscan.com" target="_blank">币安链区块浏览器（bscscan.com）</a>首页后来到页面最下方右侧，您会看到一个有MetaMask图标并且写着Add BSC Network的按钮。 <br>
        - 点击这个按钮之后，会跳出MetaMask的添加网络页面，点击Approve,允许添加。这时，你已经完成了币安智能链的配置，并且可以在币安智能链上进行交易了。
        </p>
        <h3>手动配置钱包</h3>
        <p>
        - 如果您暂时无法访问币安链区块浏览器（bscscan.com），您也可以手动来配置币安智能链。 <br>
        - 我们需要点击设置来将钱包转到币安智能链。<br>
        - 在设置页面上，点击网络。<br>
        - 点击右上角的添加网络，手动添加币安智能链主网。<br>
        - Network Name: Binance Smart Chain <br>
        - New RPC URL: `https://bsc-dataseed.binance.org/` <br>
        - ChainID: 56  <br>
        - Symbol: BNB  <br>
        - Block Explorer URL: `https://bscscan.com` <br>
        - 当你设置完，点击保存返回到主页，你会发现：网络已经自动设置为您刚才设置的币安智能链，计价单位不再是ETH，而是BNB。<br>
        - 想了解所有最近的公告和更新，请与我们联系。
        </p>  -->
      </el-col>
  </el-col>
</template>

<script>
export default {
  name: "GuideforWallet",
};
</script>
<style scoped>
.el-col {
  padding: 30px;
}

</style>