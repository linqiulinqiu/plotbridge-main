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
