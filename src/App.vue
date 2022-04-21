<template>
  <div id="app">
    <keep-alive>
      <el-container>
        <el-header style="height: 90px">
          <Plotheader />
        </el-header>
        <el-main style="padding: 0px;min-height: calc(100vh - 190px)">
          <router-view :key="$route.fullPath"></router-view>
        </el-main>
        <el-footer style="height: 100px">
          <Plotfooter />
        </el-footer>
      </el-container>
    </keep-alive>
  </div>
</template>

<script>
import Plotheader from "./components/content/Plotheader.vue";
import Plotfooter from "./components/content/Plotfooter.vue";

export default {
  name: "app",
  components: {
    Plotheader,
    Plotfooter,
  },
};
</script>


<style>
@import url("https://fonts.googleapis.com/css2?family=Oswald&display=swap");
@import  './assets/base.css';
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: "Oswald", sans-serif;
}
#app {
  min-height: 800px;
  color: #ffffff;
}
.el-header {
  background-color: #25272e;
  text-align: center;
  line-height: 70px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  user-select: none;
}
.el-footer {
  /* width: 100%; */
  background-color: #25272e;
  text-align: center;
  line-height: 35px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  user-select: none;
  padding: 30px 20px !important;
}

.el-main {
  background-color: #2b2c33;
  /* height: calc(100vh); */
  min-height: 820px;
}

body > .el-container {
  margin-bottom: 40px;
}
</style>
