<template>
  <el-col id="Bridge">
    <el-container v-if="baddr">
      <Mynft :myList="myList" :pageSize="3" :curNFT="this.curNFT" />
      <el-main>
        <el-col :lg="{ span: 24, offset: 0 }">
          <BridgeMain :curNFT="curNFT" />
        </el-col>
      </el-main>
      <SelectCoin
        id="coin_select"
        style="float: right; background: #25272e"
        v-if="Object.keys(myList).length > 0"
      />
    </el-container>
    <el-col v-else class="info">
      <h2>{{ $t("look-info") }}</h2>
    </el-col>
  </el-col>
</template>

<script>
import Mynft from "../components/content/Mynft.vue";
import BridgeMain from "../components/BridgeMain.vue";
import SelectCoin from "../components/bridge/SelectCoin.vue";
import { mapState } from "vuex";

export default {
  name: "Bridge",
  components: {
    Mynft,
    BridgeMain,
    SelectCoin,
  },
  data() {
    return {};
  },
  computed: mapState({
    myList: "myList",
    baddr: "baddr",
    curNFT(state) {
      if (state.current.pbtId) {
        const pbtId = String(state.current.pbtId);
        if (pbtId in state.myList) {
          return Object.assign({}, state.myList[pbtId]);
        }
        if (pbtId in state.mySaleList) {
          return Object.assign({}, state.mySaleList[pbtId]);
        }
      }
      return false;
    },
  }),
};
</script>
<style>
.fold {
  height: 10px;
}
</style>
