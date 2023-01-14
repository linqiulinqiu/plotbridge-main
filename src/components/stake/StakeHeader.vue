<template>
  <el-col>
    <el-col>
      <el-col :span="5">
        <span> {{ stk_info.symbol }}Pool </span>
        <el-button
          @click="refreshInfo"
          icon="el-icon-refresh"
          class="refresh-btn"
          circle
        ></el-button>
      </el-col>
      <el-col :span="3">
        <span class="mini-font">{{ $t("lock-time") }}</span>
        <br />
        <span class="num-font">{{ stk_info.locktime }}</span>
      </el-col>
      <el-col :span="4">
        <span class="mini-font">{{ $t("total-staked") }}</span>
        <br />
        <span class="num-font">{{ hformat(stk_info.lpamount) }}</span>
      </el-col>
      <el-col :span="4">
        <span class="mini-font">APR</span>
        <br />
        <span class="num-font">{{ stk_info.apy }}%</span>
      </el-col>
      <el-col :span="4">
        <span class="mini-font"> {{ $t("staking") }}</span>
        <br />
        <span class="num-font">{{ hformat(stk_info.farm_amount) }}</span>
        <span
          class="num-font"
          v-if="!isNaN(stk_info.farm_amount) && stk_info.farm_amount != 0"
        >
          ({{ hformat((stk_info.farm_amount * 100) / stk_info.lpamount) }}%)
        </span>
      </el-col>
      <el-col :span="4">
        <span class="mini-font">{{ $t("earned") }}</span>
        <br />
        <span class="num-font">{{ hformat(stk_info.earned_amount) }} PBP</span>
      </el-col>
    </el-col>
  </el-col>
</template>
<script>
import hformat from "human-format";
import ApproveButton from "../lib/ApproveButton.vue";
import times from "../../times";
import LinkButton from "../lib/LinkButton.vue";
export default {
  props: ["stakeInfo", "processInfo", "bsc", "refresh"],
  components: {
    LinkButton,
    ApproveButton,
  },
  data() {
    return {
      stk_info: {
        symbol: "",
        balance_bn: "",
        balance: "",
        withdraw_wait: 0,
        withdraw_wait_str: "",
        stake_amount: 0,
        locktime: "",
        lpamount: "",
        farm_amount: "",
        apy: "",
        earned_amount: "",
      },
      lptoken: "",
      toswap: "/Swap",
      isLp: false,
      dia_set_amount: false,
      dia_withdraw: false,
      claim_popover: false,
      dep_loading: false,
      w_loading: false,
      force_w_loading: false,
      claim_loading: false,
    };
  },
  async mounted() {
    this.stk_info = await this.processInfo(this.stakeInfo);
    this.loadLocktime();
    setInterval(async () => {
      this.stk_info = await this.processInfo(this.stakeInfo);
    }, 12000);
  },
  beforeUpdate() {
    this.loadLocktime();
  },
  methods: {
    hformat: function (val) {
      if (isNaN(val) || val == "") {
        return "";
      } else if (typeof val == "string") {
        val = parseFloat(val);
      } else {
        val = Number(val);
      }
      if (val >= 1) {
        const value = hformat(val, { separator: "" });
        return value;
      } else if (val > 0 && val < 1) {
        const amount = Math.round(val * Math.pow(10, 6)) / Math.pow(10, 6);
        return amount;
      } else {
        return val;
      }
    },
    refreshInfo: async function () {
      this.stk_info = await this.processInfo(this.stakeInfo);
    },

    loadLocktime: function () {
      this.stk_info.locktime = times.formatD(this.stakeInfo.locktime, false);
      this.stk_info.withdraw_wait_str = times.formatD(
        this.stakeInfo.withdraw_wait,
        false
      );
    },
  },
};
</script>
<style>
.refresh-btn {
  margin-left: 15px;
}
</style>