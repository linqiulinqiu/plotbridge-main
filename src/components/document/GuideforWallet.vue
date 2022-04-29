<template>
  <el-col>
    <h1>{{$t('guide-wallet')}}</h1>
      <el-col>
        <h2>{{$t('guide-wallet1')}}</h2>
        <h3>{{$t('guide-wallet2')}}</h3>
        <p v-html="$t('guide-wallet3')"></p>
        <h3 v-html="$t('guide-wallet4')"></h3>
        <p v-html="$t('guide-wallet5')"></p>
        <h3 v-html="$t('guide-wallet6')"></h3>
        <p v-html="$t('guide-wallet7')"></p>
      </el-col>
  </el-col>
</template>

<script>
export default {
  name: "GuideforWallet",
};
</script>
<style scoped>
.el-col {
  padding: 30px;
}

</style>