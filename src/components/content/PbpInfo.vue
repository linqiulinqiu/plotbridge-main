<template>
  <el-col>
    <el-col :span="3" :offset="1" :xs="{ span: 0, offset: 0 }">
      <h1>PBP</h1>
      <h3>PlotBridge Point</h3>
    </el-col>
    <el-col :span="18" :xs="{ span: 24, offset: 0 }">
      <el-tabs id="pbpInfo" tab-position="left" style="min-height: 20px">
        <el-tab-pane :label="this.$t('token-role')">
          <LineList :list="this.$t('pbp-info-msgs')" />
        </el-tab-pane>
        <el-tab-pane :label="this.$t('issue-rule')">
          <el-col class="pbp-rule">
            <LineList :list="this.$t('pbp-issue-rule-msgs')" />
            <el-table :data="this.data">
              <el-table-column
                prop="date"
                :label="$t('issue-date')"
              ></el-table-column>
              <el-table-column
                width="65"
                prop="time"
                :label="$t('issue-time')"
              ></el-table-column>
              <el-table-column :label="$t('issue-amount')">
                <template slot-scope="scope">
                  <RichNumber :data="String(scope.row.stake)"> </RichNumber>
                </template>
              </el-table-column>
              <el-table-column :label="$t('issue-stage')">
                <template slot-scope="scope">
                  <RichNumber :data="String(scope.row.stage)"> </RichNumber>
                </template>
              </el-table-column>
              <el-table-column :label="$t('issue-sum')">
                <template slot-scope="scope">
                  <RichNumber :data="String(scope.row.sum)"> </RichNumber>
                </template>
              </el-table-column>
            </el-table>
          </el-col>
        </el-tab-pane>
        <el-tab-pane :label="this.$t('price-support')">
          <LineList :list="this.$t('pbp-price-support-msgs')" />
        </el-tab-pane>
      </el-tabs>
    </el-col>
  </el-col>
</template>
<script>
</script>
<script>
import info from "../../pbp-amount.json";
import LineList from "../lib/LineList.vue";
import RichNumber from "../lib/RichNumber.vue";

export default {
  components: {
    LineList,
    RichNumber,
  },
  data() {
    console.log("info", info.stageInfo);
    return {
      stake_stage: info.stake_stage,
      data: info.stageInfo,
    };
  },
};
</script>