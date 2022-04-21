<template>
  <el-col class="copyRight">
    <p>
      <a href=""> © 2022 Plot Network Ltd,{{ $t("cpright1") }} </a>
    </p>
    <!-- <p>{{ $t("cpright2") }}</p>
    <p>
      {{ $t("cpright3") }}
    </p> -->
  </el-col>
</template>

<script>
export default {
  name: "Plotfooter",
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
.copyRight a {
  color: #fff;
  text-decoration: none;
}
</style>
