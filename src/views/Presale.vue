<template>
  <el-container>
    <el-main v-if="bsc.addr">
      <el-col
        id="presale"
        :lg="{ span: 12, offset: 6 }"
        :md="{ span: 14, offset: 5 }"
        :sm="{ span: 18, offset: 3 }"
        :xs="{ span: 22, offset: 1 }"
      >
        <PresaleMain />
      </el-col>
    </el-main>
    <el-col class="info" v-else>
      <h2>{{ $t("look-info") }}</h2>
      
    </el-col>
  </el-container>
</template>
<script>
import PresaleMain from "../components/PresaleMain.vue";
import { mapState } from "vuex";
export default {
  components: {
    PresaleMain,
  },
  computed: mapState({
    bsc: "bsc",
  }),
};
</script>
<style>
#presale {
  background: #373943;
  padding: 70px;
  margin-top: 50px;
  border-radius: 20px;
}
</style>