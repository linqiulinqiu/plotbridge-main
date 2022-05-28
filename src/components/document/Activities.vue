<template>
  <el-col>
    <h1>{{ $t("pb-events") }}</h1>
    <el-col>
      <h2>
        <a href="https://www.plotbridge.io/activities/crosspb/" target="_blank">
          {{ $t("dp-xcc") }}
        </a>
      </h2>
    </el-col>
  </el-col>
</template>

<script>
export default {
  name: "Activities",
};
</script>
<style scoped>
.el-col {
  padding: 30px;
}
</style>