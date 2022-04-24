<template>
  <el-col id="home">
    <div class="notice">
      <h2>{{$t('home1')}}</h2>
      <p>{{$t('home2')}}</p>
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
  background: url("../assets/image/banner.jpg") center no-repeat;
  background-size: cover;
 position: relative;
}
.notice{
position: absolute;
left: 43vw;
top: 28vh;
}
</style>