<template>
  <el-col id="lplink">
    <el-button v-if="this.coinInfo" class="lp-style">
      <router-link to="/Swap">
        {{ $t("buy") }} {{ this.coinInfo.bsymbol }}
      </router-link>
    </el-button>
    <span v-if="this.coinInfo">
      <LinkButton :coinInfo="this.coinInfo" :pbpaddr="pbpAddr" />
    </span>
  </el-col>
</template>
<script>
import { mapState } from "vuex";
import LinkButton from "../lib/LinkButton.vue";

export default {
  name: "LPLink",
  props: ["coinInfo"],
  components: {
    LinkButton,
  },
  computed: mapState({
    pbpAddr(state) {
      return state.bsc.ctrs.pbp.address;
    },
  }),
  data() {
    return {};
  },
};
</script>
<style scoped>
#lplink .lp-style {
  background-color: #2b2c33;
  border: 1px solid #38f2af;
  border-radius: 5px;
  color: #38f2af;
}
.lp-style a {
  color: #38f2af;
  text-decoration: none;
}
#lplink .lp-style:hover {
  background-color: #373943;
}
</style>