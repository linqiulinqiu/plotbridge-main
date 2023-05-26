<template>
  <el-collapse accordion id="stakeCol" v-if="this.stakeTokens.length">
    <el-collapse-item v-for="item in this.stakeTokens" :key="item.pid">
      <template slot="title">
        <StakeHeader
          :stakeInfo="item"
          :processInfo="loadStakeInfo"
          :bsc="bsc"
          :refresh="refresh"
        />
      </template>
      <el-col>
        <StakeOperation
          :stakeInfo="item"
          :processInfo="loadStakeInfo"
          :bsc="bsc"
          :refresh="refresh"
        />
      </el-col>
    </el-collapse-item>
  </el-collapse>
  <el-col v-else>
    <h1 class="info">{{ $t("data") }}</h1>
  </el-col>
</template>
<script>
import StakeHeader from "./StakeHeader.vue";
import StakeOperation from "./StakeOperation.vue";
import swap from "../../swap";
import tokens from "../../tokens";
import { ethers } from "ethers";
import times from "../../times";
import market from "../../market";
export default {
  props: ["bsc"],
  components: {
    StakeHeader,
    StakeOperation,
  },
  computed: {},
  data() {
    return {
      stakeTokens: [],
      total_alloc: 1,
    };
  },
  mounted() {
    this.refresh();
  },
  methods: {
    refresh: async function () {
      this.stakeTokens = await market.loadStakedPools();
      return this.stakeTokens;
    },
    loadStakeInfo: async function (stakeInfo) {
      let info = {};
      const pid = ethers.BigNumber.from(stakeInfo.pid);
      const stakeAddr = stakeInfo.stakeAddr;
      const rewardAddr = this.bsc.ctrs.pbp.address;
      info.symbol = await tokens.symbol(stakeAddr);
      info.balance_bn = await tokens.balance(stakeAddr);
      info.balance = await tokens.format(stakeAddr, info.balance_bn);
      info.lpamount = stakeInfo.lpamount;
      const stakeds = await this.bsc.ctrs.staking.staked(pid, this.bsc.addr);
      // const staked = stakeds[0];
      info.withdraw_wait = Number(stakeds[1]);
      info.withdraw_wait_str = times.formatD(info.withdraw_wait, false);
      info.farm_amount = await tokens.format(stakeAddr, stakeds[0]);
      const earnval = await this.bsc.ctrs.staking.earned(pid, this.bsc.addr);
      info.earned_amount = await tokens.format(rewardAddr, earnval);
      const ap = (stakeInfo.reward_speed * 365 * 86400 * 100) / info.lpamount;
      info.apy = ap.toFixed(4);
      // console.log("loadstakeInfo end", info);
      return info;
    },
  },
};
</script>
<style scoped>
.load {
  text-align: center;
}
</style>