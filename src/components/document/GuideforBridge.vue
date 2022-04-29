<template>
  <el-col>
    <h1>{{ $t("guide-bridge") }}</h1>
    <el-col>
      <h2>
        <a href="https://www.plotbridge.io/guidesub/towxcc/">
          {{ $t("guide-bridge1") }} ?
        </a>
      </h2>
      <h2>
        <a href="https://www.plotbridge.io/guidesub/toxcc/">
          {{ $t("guide-bridge3") }} ?
        </a>
      </h2>
      <h2>
        <a href="https://www.plotbridge.io/guidesub/upgradecoin/">
          {{ $t("guide-bridge5") }} ?
        </a>
      </h2>
    </el-col>
  </el-col>
</template>

<script>
export default {
  name: "GuideforBridge",
};
</script>
<style scoped>
.el-col {
  padding: 30px;
}
</style>