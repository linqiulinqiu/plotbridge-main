<template>
  <el-row id="home" type="flex" justify="space-between">
    <el-col
      class="notice"
      :lg="{ span: 20, offset: 6 }"
      :md="{ span: 14, offset: 5 }"
      :sm="{ span: 18, offset: 3 }"
      :xs="{ span: 18, offset: 1 }"
    >
      <h2>{{ $t("home-title") }}</h2>
      <el-timeline id="news-timeline">
        <el-timeline-item
          v-for="item in $t('home-news')"
          :key="item.msg"
          :timestamp="item.ts"
        >
          <el-card class="card">{{ item.msg }}</el-card>
        </el-timeline-item>
      </el-timeline>
      <p>{{ $t("home-note") }}</p>
    </el-col>
    <el-col :span="5" :offset="1">
      <el-card :offset="5" :span="10" class="con-card"><ConnectUs /></el-card>
    </el-col>
  </el-row>
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
.con-card {
  padding-bottom: 20px;
  background-color: rgba(255, 255, 225, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  text-align: center;
}
#home {
  color: #fff;
  height: 85vh;
  /* background-attachment: fixed; */
  background-image: url("../../public/image/banner.jpg");
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  position: relative;
}

#news-timeline {
  margin-top: 50px;
}

.card {
  color: #000;
  background-color: rgba(255, 255, 255, 0.3);
}
</style>
