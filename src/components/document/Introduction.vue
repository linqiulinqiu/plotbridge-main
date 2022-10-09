<template>
  <el-col>
    <h1>
      <a href="https://www.plotbridge.io/about/" target="_blank">{{
        $t("intruction")
      }}</a>
    </h1>
    <el-col>
      <p v-html="$t('intruction1')"></p>
      <li v-for="winfo in winfos" :key="winfo.symbol">
        {{ winfo.name }} ({{ winfo.symbol }})
        <a v-if="winfo.url" :href="winfo.url" target="_blank">{{
          winfo.bsymbol
        }}</a>
      </li>
    </el-col>
    <h2><a href="https://www.plotbridge.io/faq/"> FAQ：</a></h2>
    <el-col>
      <h3 v-for="i in $t('into-all')" :key="i">{{ i }}</h3>
    </el-col>
  </el-col>
</template>

<script>
import { timingSafeEqual } from "crypto";
import pbw from "pbwallet";
import { mapState } from "vuex";
import market from "../../market";

export default {
  name: "Introduction",
  computed: mapState({
    bsc: "bsc",
    baddr: "baddr",
    winfos: function () {
      let winfos = {};
      if (this.baddr) {
        const list = market.loadCoinlist();
        for (let i in list) {
          const s = list[i].symbol;
          winfos[s] = list[i];
          winfos[s]["url"] = "https://bscscan.com/token/" + list[i].address;
        }
      } else {
        const symbols = pbw.wcoin_list("symbol");
        for (let i in symbols) {
          winfos[i] = pbw.wcoin_info(symbols[i], "symbol");
          if (!"address" in winfos[i]) winfos[i]["url"] = false;
        }
      }
      console.log("winfos", winfos);
      return winfos;
    },
  }),
  data() {
    return {};
  },
};
</script>
<style scoped>
.el-col {
  padding: 30px;
}
</style>
