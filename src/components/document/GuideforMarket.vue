<template>
  <el-col>
    <h1>
      <a href="https://www.plotbridge.io/guidesub/marketguide/" target="_blank">
        {{ $t("guide-market") }}
      </a>
    </h1>
    <el-col>
      <p>{{ $t("guide-market1") }}</p>
    </el-col>
  </el-col>
</template>

<script>
export default {
  name: "GuideforMarket",
};
</script>
<style scoped>
.el-col {
  padding: 30px;
}
</style>