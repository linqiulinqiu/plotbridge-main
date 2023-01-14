<template>
  <div id="app">
    <keep-alive>
      <el-container>
        <el-header style="height: 90px">
          <Plotheader />
        </el-header>
        <el-main id="main-container" class="scrollbar" style="padding: 0px">
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
@import "./assets/base.css";
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: "Oswald", sans-serif;
}

::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}
::-webkit-scrollbar-thumb {
  border-radius: 5px;
  background: rgba(147, 206, 150, 0.5);
  --webkit-box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
}
::-webkit-scrollbar-track {
  /*滚动条里面轨道 */
  border-radius: 10px;
  background: #ededed0a;
  --webkit-box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
}

#app {
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
  background-color: #25272e;
  text-align: center;
  line-height: 35px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  user-select: none;
  padding: 30px 20px !important;
}

.el-main {
  background-color: #2b2c33;
  /* height: calc(100vh - 180px); */
  /* min-height: 670px; */
  overflow: auto;
}
#main-container {
  height: calc(100vh-180px);
  min-height: 660px;
}

body > .el-container {
  margin-bottom: 40px;
}
</style>
