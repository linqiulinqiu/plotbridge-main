<template>
  <el-col>
    <el-container v-if="baddr">
      <Mynft :myList="myList" :curNFT="this.curNFT" :pageSize="3" />
      <el-main>
        <el-col :span="23" class="mkMain">
          <MarketMain
            :marketList="marketList"
            :mySaleList="mySaleList"
            :pageSize="4"
          />
        </el-col>
      </el-main>
    </el-container>
    <el-col class="info" v-else>
      <h2>{{ $t("look-info") }}</h2>
    </el-col>
  </el-col>
</template>

<script>
import Mynft from "../components/content/Mynft.vue";
import { mapState } from "vuex";
import MarketMain from "../components/MarketMain.vue";
export default {
  name: "Market",
  components: {
    Mynft,
    MarketMain,
  },
  computed: mapState({
    baddr: "baddr",
    myList: "myList",
    marketList: "marketList",
    mySaleList: "mySaleList",
    curNFT(state) {
      if (state.current.pbtId) {
        const pbtId = String(state.current.pbtId);
        if (pbtId in state.myList) {
          return state.myList[pbtId];
        }
        if (pbtId in state.mySaleList) {
          return state.mySaleList[pbtId];
        }
        if (pbtId in state.marketList) {
          return state.marketList[pbtId];
        }
      }
      return false;
    },
  }),
  data() {
    return {};
  },
};
</script>

<style scoped>
.el-main {
  background-color: #2b2c33;
}
.mkMain {
  margin-left: 2%;
}
</style>