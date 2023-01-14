<template>
  <a :href="this.url"></a>
</template>
<script>
export default {
  name: "LinkIcon",
  props: ["url"],
};
</script>
<style scoped>
a {
  display: inline-block;
  background-image: url("../../assets/image/external_link.svg");
  width: 25px;
  height: 25px;
  margin-left: 15px;
}
</style>