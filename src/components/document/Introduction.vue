<template>
  <el-col>
    <h1>
      <a href="https://www.plotbridge.io/about/" target="_blank">{{
        $t("intoduction")
      }}</a>
    </h1>
    <el-col>
      <p v-html="$t('intoduction1')"></p>
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
import pbw from "pbwallet";
import { mapState } from "vuex";

export default {
  name: "Introduction",
  computed: mapState({
    bsc: "bsc",
  }),
  data() {
    const symbols = pbw.wcoin_list("symbol");
    const winfos = {};
    for (let i in symbols) {
      const s = symbols[i];
      winfos[s] = pbw.wcoin_info(s, "symbol");
      //TODO: URL should be different for "testnet" and "mainnet"
      if ("address" in winfos[s]) {
        winfos[s].url = "https://bscscan.com/token/" + winfos[s].address;
      }
    }
    return {
      winfos: winfos,
    };
  },
};
</script>
<style scoped>
.el-col {
  padding: 30px;
}
</style>
