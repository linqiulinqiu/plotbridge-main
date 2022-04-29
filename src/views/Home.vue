<template>
  <el-col id="home">
    <el-col class="notice" :span="12" :offset="6">
      <h2>{{ $t("home-title") }}</h2>
      <el-timeline id="news-timeline">
        <el-timeline-item v-for="item in $t('home-news')" :key="item.msg" :timestamp="item.ts">
          <el-card class="card">{{ item.msg }}</el-card>
        </el-timeline-item>
      </el-timeline>
      <p>{{ $t("home-note") }}</p>
      <ConnectUs />
    </el-col>
  </el-col>
</template>

<script>
import ConnectUs from "../components/lib/ConnectUs.vue";
export default {
  name: "Home",
  components: {
    ConnectUs,
  },
};
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
}
#home {
  color: #fff;
  height: 85vh;
  /* width: 100%; */
  background: url("../assets/image/banner.jpg") center no-repeat;
  background-size: cover;
  position: relative;
}

#news-timeline {
    margin-top: 50px;
}

.card {
  color: #000;
  background-color: rgba(255, 255, 255, 0.3)
}
</style>
