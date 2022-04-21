<template>
  <el-col>
    <el-button
      @click="buyNFT"
      type="primary"
      :loading="buy_loading"
      class="btn-infomk"
      v-if="approve"
    >
      {{ $t("buy") }}
    </el-button>
    <el-button
      v-else
      @click="approveCoin"
      type="priamry"
      class="btn-infomk"
      :loading="approve_loading"
    >
      {{ $t("approve") }}
    </el-button>
    <el-button class="btn-cancel" @click="clearPbtId">{{
      $t("cancel")
    }}</el-button>
  </el-col>
</template>
<script>
import { mapState } from "vuex";
import market from "../../../market";
export default {
  name: "InfoMarket",
  props: ["curNFT", "approve", "clearPbtId"],
  computed: mapState({
    market() {
      if (this.curNFT && "market" in this.curNFT) return this.curNFT.market;
      return false;
    },
  }),
  data() {
    return {
      buy_loading: false,
      approve_loading: false,
    };
  },
  methods: {
    buyNFT: async function () {
      this.buy_loading = true;
      const curNFT = this.curNFT;
      const obj = this;
      try {
        const res = await market.buyNFT(curNFT);
        await market.waitEventDone(res, async function (evt) {
          obj.buy_loading = false;
          obj.$store.commit("setCurrentPbtId", false);
        });
      } catch (e) {
        obj.buy_loading = false;
        console.log("buyNFt err", e);
        if (e.data.code === -32000) {
          this.$message(e.data.message);
        }
      }
    },
    approveCoin: async function () {
      this.approve_loading = true;
      const curNFT = this.curNFT;
      const obj = this;
      try {
        const res = await market.approveAllow(curNFT);
        await market.waitEventDone(res, async function (evt) {
          obj.approve_loading = false;
        });
        console.log("res approve", res);
      } catch (e) {
        this.approve_loading = false;
        console.log("approve err", e.message);
        if (e.data.code === -32000) {
          this.$message(e.data.message);
        }
      }
    },
  },
};
</script>
<style>
</style>