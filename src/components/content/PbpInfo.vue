<template>
  <el-col>
    <el-col :span="3" :offset="1" :xs="{ span: 0, offset: 0 }">
      <h1>PBP</h1>
      <h3>PlotBridge Point</h3>
    </el-col>
    <el-col :span="18" :xs="{ span: 24, offset: 0 }">
      <el-tabs id="pbpInfo" tab-position="left" style="min-height: 200px">
        <el-tab-pane :label="this.$t('pbp-role')">
          <p>
            <span>
              <p v-for="line in this.$t('pbp-info-msgs')" :key="line">
                {{ line }}
              </p>
            </span>
          </p>
        </el-tab-pane>
        <el-tab-pane :label="this.$t('pbp-issue-rule')">
          <el-col class="pbp-rule">
            <p>
              <span>
                <p v-for="line in this.$t('pbp-issue-rule-msgs')" :key="line">
                  {{ line }}
                </p>
              </span>
            </p>
          </el-col>
        </el-tab-pane>
        <el-tab-pane :label="this.$t('pbp-price-support')">
          <p>
            <span>
              <p v-for="line in this.$t('pbp-price-support-msgs')" :key="line">
                {{ line }}
              </p>
            </span>
          </p>
        </el-tab-pane>
      </el-tabs>
    </el-col>
  </el-col>
</template>
<script>
</script>
<style scoped>
.pbp-rule {
  /* overflow-y: scroll; */
  /* height: 200px; */
}
</style>