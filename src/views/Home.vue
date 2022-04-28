<template>
  <el-col id="home">
    <el-col class="notice" :span="12" :offset="6">
      <h2>{{ $t("home-title") }}</h2>
      <ul :span="15">
        <li v-for="txt in $t('home-news')" :key="txt">
          <el-card class="card">{{ txt }}</el-card>
        </li>
      </ul>
      <p>{{ $t("home-note") }}</p>
    </el-col>
  </el-col>
</template>

<script>
export default {
  name: "Home",
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
.card {
  margin-top: 30px;
  color: #000;
  background-color: rgba(255, 255, 255, 0.3);
}
</style>
