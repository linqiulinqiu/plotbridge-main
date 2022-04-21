<template>
  <el-col id="stake">
    <el-container v-if="bsc.addr">
      <el-main>
        <StakeMain />
      </el-main>
    </el-container>
    <el-col v-else class="info">
      <h2>{{ $t("look-info") }}</h2>
    </el-col>
  </el-col>
</template>
<script>
import { mapState } from "vuex";
import StakeMain from "../components/StakeMain";
export default {
  name: "Stake",
  components: {
    StakeMain,
  },
  computed: mapState({
    bsc: "bsc",
  }),
  data() {
    return {};
  },
};
</script>
<style scoped>
.stake-main {
  background-color: #373943;
  border-radius: 20px;
  padding: 50px;
  box-sizing: border-box;
  margin-top: 100px;
}
#stakeinput {
  position: relative;
  padding: 30px 30px;
  border-radius: 20px;
  margin-top: 25px;
  background-color: rgba(43, 44, 51, 0.8);
}
#stakeinput .el-col {
  margin: 10px;
}
#stakeinput .el-button {
  position: absolute;
  right: 10%;
}
#stake .el-main {
  min-height: 830px;
}
.info {
  margin-top: 300px;
}
h2 {
  text-align: center;
}
</style>
