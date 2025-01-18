<template>
  <el-col v-if="isError">
    <el-col class="notice" span="10" offset="6">
      <h2>Important Notice: Bridging Service Temporarily Paused</h2>
      <h2>&nbsp;</h2>
      <h3>Dear Plot Bridge Users,</h3>
      <h2>&nbsp;</h2>

      <h3>
        Due to technical difficulties, our cross-chain bridge is temporarily paused. 
        We are working hard to resolve the issue and restore service as soon as possible. 
        If you have any questions, please contact our team via Telegram or Discord. Thank you for your understanding and patience.
      </h3>
      <h2>&nbsp;</h2>
      <h3>Additionally, we are working on a new project. Stay tuned! Thank you for your understanding and patience.</h3>
      <h4>
        Best regards,<br />
        <h4>&nbsp;</h4>
        The Plot Bridge Team
      </h4>
    </el-col>
  </el-col>
  <el-col id="Bridge" v-else>
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
    return {
      isError: true,
    };
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
.notice {
  margin-top: 100px;
}
</style>
