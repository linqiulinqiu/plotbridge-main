<template>
  <el-col>
    <el-col :span="3" :offset="1" :xs="{ span: 0, offset: 0 }">
      <h1>PBT</h1>
      <h3>PlotBridge Transporter</h3>
    </el-col>
    <el-col :span="18" :xs="{ span: 24, offset: 0 }">
      <el-tabs id="pbtInfo" tab-position="left" style="min-height: 120px">
        <el-tab-pane :label="this.$t('token-role')">
          <LineList :list="this.$t('pbt-info-msgs')" />
        </el-tab-pane>
        <el-tab-pane :label="this.$t('issue-rule')">
          <LineList :list="this.$t('pbt-issue-rule-msgs')" />
        </el-tab-pane>
        <el-tab-pane :label="this.$t('price-support')">
          <LineList :list="this.$t('pbt-price-support-msgs')" />
        </el-tab-pane>
      </el-tabs>
    </el-col>
  </el-col>
</template>
<script>
import LineList from "../lib/LineList.vue";
export default {
  components: {
    LineList,
  },
};
</script>