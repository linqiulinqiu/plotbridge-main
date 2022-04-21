<template>
  <el-col id="swap">
    <el-container v-if="'addr' in bsc">
      <el-main>
        <el-col
          class="swap-main"
          :lg="{ span: 10, offset: 7 }"
          :md="{ span: 12, offset: 6 }"
          :sm="{ span: 16, offset: 4 }"
          :xs="{ span: 22, offset: 1 }"
        >
          <SwapMain v-if="working" />
          <h2 v-else style="text-align: center">{{ $t("not-start") }}</h2>
        </el-col>
      </el-main>
    </el-container>
    <el-col class="info" v-else>
      <h2>{{ $t("look-info") }}</h2>
    </el-col>
  </el-col>
</template>
<script>
import SwapMain from "../components/SwapMain.vue";
import { mapState } from "vuex";
export default {
  name: "Swap",
  components: {
    SwapMain,
  },
  computed: mapState({
    bsc: "bsc",
  }),
  data() {
    return {
      working: false,
    };
  },
};
</script>
<style scoped>
.swap-main {
  background-color: #373943;
  border-radius: 20px;
  padding: 50px;
  box-sizing: border-box;
  margin-top: 100px;
}
#swap .el-main {
  min-height: 830px;
}
</style>