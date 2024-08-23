<template>
  <el-container>
    <el-main class="pbptoken">
      <el-col class="token-info" :span="20" :offset="2">
        <PbtInfo />
      </el-col>
      <el-col class="token-info" :span="20" :offset="2">
        <PbpInfo />
      </el-col>
      <el-col v-if="bsc.addr" :span="20" :offset="2">
        <PBPInfoMain />
      </el-col>
      <el-col class="text-center" v-else>
        <p></p>
        <h2>{{ $t("look-info") }}</h2>
      </el-col>
    </el-main>
  </el-container>
</template>
<script>
import PBPInfoMain from "../components/PBPInfoMain.vue";
import PbtInfo from "../components/content/PbtInfo.vue";
import PbpInfo from "../components/content/PbpInfo.vue";
import { mapState } from "vuex";
export default {
  name: "PBToken",
  components: {
    PBPInfoMain,
    PbpInfo,
    PbtInfo,
  },
  computed: mapState({
    bsc: "bsc",
  }),
};
</script>
<style scoped>
.el-main {
  font-size: 14px;
}
.token-info {
  margin-top: 20px;
  background-color: #373943d5;
  border-radius: 10px;
  padding: 20px 5px;
}
.line {
  margin: 15px auto;
}
.text-center {
  text-align: center;
}
.el-tabs__item {
  height: 50px;
  font-size: 18px !important;
}
</style>