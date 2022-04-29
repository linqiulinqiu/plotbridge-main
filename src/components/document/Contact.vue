<template>
  <el-col>
    <h1>{{ $t("contact") }}</h1>
    <el-col>
      <p v-html="$t('contact1')"></p>
    </el-col>
  </el-col>
</template>
<script>
export default {
  name: "Contact",
};
</script>
<style scoped>
.el-col {
  padding: 30px;
}
p {
  line-height: 35px;
}
a {
  text-decoration: none;
  color: aqua;
}
</style>