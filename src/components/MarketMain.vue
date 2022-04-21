<template>
  <el-col id="marketMain">
    <el-col v-if="!current.pbtId" class="mk-list">
      <h3>{{ $t("market") }}</h3>
      <el-col>
        <el-col class="mk-title">
          <h4>{{ $t("onSale") }}</h4>
        </el-col>
        <el-col class="cointy" :xs="{ span: 24 }" :span="20" :offset="1">
          <MarketList :marketList="this.marketList" :pageSize="this.pageSize" />
        </el-col>
      </el-col>
      <el-col>
        <el-col class="mk-title">
          <h4>{{ $t("my-sale") }}</h4>
        </el-col>
        <el-col class="cointy" :span="20" :offset="1">
          <MySale :mySaleList="this.mySaleList" :pageSize="this.pageSize" />
        </el-col>
      </el-col>
    </el-col>
    <el-col v-else>
      <el-col id="infoMain"><NFTinfo :curNFT="curNFT" /></el-col>
    </el-col>
  </el-col>
</template>
<script>
import MarketList from "./market/MarketList.vue";
import NFTinfo from "./content/nftpanel/NFTinfo.vue";
import MySale from "./market/MySale.vue";
import { mapState } from "vuex";
export default {
  name: "MarketMain",
  components: {
    MySale,
    MarketList,
    NFTinfo,
  },
  props: ["marketList", "mySaleList", "pageSize"],
  computed: mapState({
    baddr: "baddr",
    current: "current",
    curNFT(state) {
      if (state.current.pbtId) {
        const pbtId = String(state.current.pbtId);
        if (pbtId in state.myList) {
          return Object.assign({}, state.myList[pbtId]);
        }
        if (pbtId in state.mySaleList) {
          return Object.assign({}, state.mySaleList[pbtId]);
        }
        if (pbtId in state.marketList) {
          return Object.assign({}, state.marketList[pbtId]);
        }
      }
      return false;
    },
  }),
  methods: {
    clearCurrentId: function () {
      this.$store.commit("setCurrentPbtId", false);
    },
  },
};
</script>
<style scoped>
.mk-title {
  height: 80px;
  margin-bottom: 5px;
  line-height: 80px;
}
.mk-title h4 {
  padding-left: 2%;
}
.cointy {
  min-height: 300px;
  border-radius: 10px;
  background-color: #373943;
  position: relative;
  padding: 10px;
}
.content {
  display: flex;
}
.emptyImg {
  float: left;
}
#infoMain {
  margin-top: 50px;
}
</style>
