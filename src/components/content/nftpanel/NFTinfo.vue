<template>
  <el-col type="flex">
    <el-col
      :lg="{ span: 9, offset: 1 }"
      :md="{ span: 15, offset: 0 }"
      :sm="14"
      :xs="18"
    >
      <el-col v-loading="meta.loading">
        <img :src="meta.image" alt="Img" class="info-img" />
      </el-col>
      <p>{{ $t("id") }}:#{{ this.nftId }}</p>
      <el-col v-if="market">
        <p v-if="market.price">
          {{ $t("price") }}:
          <span>{{ market.price }}&nbsp;&nbsp;&nbsp;</span>
          <span>{{ market.ptName }}</span>
        </p>
        <p v-if="market.desc != ''">{{ $t("desc") }}:{{ market.desc }}</p>
        <p v-else>{{ $t("no-desc") }}</p>
      </el-col>
    </el-col>
    <el-col :lg="{ span: 5, offset: 5 }" :md="{ span: 7, offset: 0 }">
      <el-col v-if="market">
        <el-col v-if="market.seller == '-self'">
          <InfoMySale :curNFT="this.curNFT" :clearPbtId="this.clearPbtId" />
        </el-col>
        <el-col v-if="market.seller == ''">
          <InfoMarket
            :curNFT="this.curNFT"
            :approve="this.approve"
            :clearPbtId="this.clearPbtId"
          />
        </el-col>
      </el-col>
      <el-col v-else>
        <InfoMy :curNFT="this.curNFT" :clearPbtId="this.clearPbtId" />
      </el-col>
    </el-col>
  </el-col>
</template>
<script>
import { mapState } from "vuex";
import InfoMy from "./InfoMy.vue";
import InfoMarket from "./InfoMarket.vue";
import InfoMySale from "./InfoMySale.vue";
import market from "../../../market";
export default {
  name: "NFTinfo",
  components: {
    InfoMy,
    InfoMarket,
    InfoMySale,
  },
  props: ["curNFT"],

  computed: mapState({
    nftId() {
      if (this.curNFT && "id" in this.curNFT) return this.curNFT.id;
      return 0;
    },
    market() {
      if (this.curNFT && "market" in this.curNFT) return this.curNFT.market;
      return false;
    },
    meta() {
      if (this.curNFT && "meta" in this.curNFT) return this.curNFT.meta;
      return {};
    },
    pbxs() {
      if (this.curNFT && "pbxs" in this.curNFT) return this.curNFT.pbxs;
      return {};
    },
  }),
  data() {
    return {
      approve: true,
    };
  },
  methods: {
    getApprove: async function () {
      if (this.market.seller == "") {
        if (this.market.ptName == "BUSD") {
          this.approve = await market.checkAllowance(nft);
        }
      }
    },
    clearPbtId: function () {
      this.$store.commit("setCurrentPbtId", false);
    },
  },
};
</script>
<style scoped>
.info-img {
  border-radius: 15px;
  max-width: 380px;
}
</style>
