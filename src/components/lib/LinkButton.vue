<template>
  <span id="linkButton">
    <el-button v-if="this.coinInfo.address == this.pbpaddr" class="btn-link">
      <a
        :href="this.pre_link + 'add/BNB/' + this.coinInfo.address"
        target="_blank"
      >
        {{ $t("add-lp", { coin: this.coinInfo.bsymbol, coin1: "BNB" }) }}
      </a>
    </el-button>
    <el-button v-else class="btn-link">
      <a
        :href="
          this.pre_link + 'add/' + this.pbpaddr + '/' + this.coinInfo.address
        "
        target="_blank"
      >
        {{ $t("add-lp", { coin: this.coinInfo.bsymbol, coin1: "PBP" }) }}
      </a>
    </el-button>
    <el-button class="btn-link">
      <a
        :href="
          this.pre_link + 'info/pool/' + this.token_pool[this.coinInfo.bsymbol]
        "
        target="_blank"
        >{{ $t("pool", { coin: this.coinInfo.bsymbol }) }}
      </a>
    </el-button>
    <el-button class="btn-link">
      <a :href="this.bscscan + this.coinInfo.address" target="_blank">
        {{ $t("token-info", { coin: this.coinInfo.bsymbol }) }}
      </a>
    </el-button>
  </span>
</template>
<script>
export default {
  name: "LinkButton",
  props: ["coinInfo", "pbpaddr"],
  data() {
    return {
      bscscan: "https://bscscan.com/token/",
      pre_link: "https://pancakeswap.finance/",
      token_pool: {
        PBP: "0xb8d7e1982d01a613708b3235a5781a734f63d082",
        WXCC: "0xa9d19fe91bbb3d9f91ca313f71aa58101015014b",
        WXCH: "0x10d2a3f0f7485fcee84407bbd4272918fe864a55",
      },
    };
  },
};
</script>
<style>
#linkButton {
  margin-left: 10px;
}
.btn-link.el-button {
  background: rgba(43, 44, 51, 0.8);
  color: #38f2af;
  border: 1px solid #38f2af;
  opacity: 0.9;
  margin-top: 15px;
}
.btn-link.el-button:hover {
  background: #373943;
  border: #38f2af solid 1px;
}
</style>