<template>
  <el-col id="home">
    <div class="notice">
      <h2>{{$t('home1')}}</h2>
      <p>{{$t('home2')}}</p>
     <!-- <h2> PlotBridge新版本测试中~</h2>
     <p>欢迎在本站测试功能，如需反馈请联系我们。</p> -->
    </div>
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
  width: 100%;
  background: url("../assets/image/banner.jpg") center ;
 position: relative;
}
.notice{
position: absolute;
left: 43vw;
top: 28vh;
}
</style>