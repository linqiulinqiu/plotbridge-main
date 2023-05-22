<template>
  <el-col>
    <el-row id="home" type="flex" justify="space-between">
      <el-col
        class="notice"
        :lg="{ span: 20, offset: 6 }"
        :md="{ span: 14, offset: 5 }"
        :sm="{ span: 18, offset: 3 }"
        :xs="{ span: 18, offset: 1 }"
      >
        <h3 class="center">
          <p v-if="baddr">
            {{ $t("total-lock") }}:
            <span v-if="tvl != 0" class="color-m">
              $ <RichNumber :data="String(tvl)"></RichNumber>
              <!-- $ {{ tvl  }} -->
            </span>
            <span v-else class="el-icon-loading"></span>
          </p>
        </h3>
        <h2>{{ $t("home-title") }}</h2>
        <el-col class="message">
          <el-timeline id="news-timeline" class="scrollbar">
            <el-timeline-item
              v-for="item in $t('home-news')"
              :key="item.msg"
              :timestamp="item.ts"
            >
              <el-card class="card">{{ item.msg }}</el-card>
            </el-timeline-item>
          </el-timeline>
        </el-col>
        <p>{{ $t("home-note") }}</p>
      </el-col>
      <el-col :span="5" :offset="1">
        <el-card :offset="5" :span="10" class="con-card"><ConnectUs /></el-card>
      </el-col>
    </el-row>
  </el-col>
</template>

<script>
import { mapState } from "vuex";
import ConnectUs from "../components/lib/ConnectUs.vue";
import RichNumber from "../components/lib/RichNumber.vue";
export default {
  name: "Home",
  components: {
    ConnectUs,
    RichNumber,
  },
  computed: mapState({
    bsc: "bsc",
    baddr: "baddr",
    tvl: "tvl",
  }),
};
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
}
.message {
  /* height: calc(100vh - 300px); */
  height: 500px;
  overflow: auto;
  margin: 20px 0px;
  padding: 10px;
}
.message::-webkit-scrollbar {
  width: 10px;
  height: 10px;
  height: calc(100vh - 310px);
}
.message::-webkit-scrollbar-thumb {
  border-radius: 5px;
  background: rgba(147, 206, 150, 0.5);
  /* --webkit-box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2); */
}
.message::-webkit-scrollbar-track {
  /*滚动条里面轨道 */
  border-radius: 10px;
  background: #ededed50;
  /* --webkit-box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2); */
}
.con-card {
  padding-bottom: 20px;
  background-color: rgba(255, 255, 225, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  text-align: center;
}
#home {
  color: #fff;
  height: calc(100vh - 160px);
  background-image: url("../../public/image/banner.jpg");
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  background-attachment: fixed;
  position: relative;
  padding: 30px;
  box-sizing: border-box;
}

.card {
  color: #000;
  background-color: rgba(255, 255, 255, 0.3);
}
</style>
