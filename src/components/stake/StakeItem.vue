<template>
  <el-col id="stake" :span="24">
    <el-col class="stake-main">
      <h3>
        {{ stk_symbol }} Pool
        <el-button
          @click="refresh"
          icon="el-icon-refresh"
          class="refresh-btn"
          circle
        ></el-button>
      </h3>
      <el-row type="flex" justify="space-between" :gutter="20">
        <el-col
          :lg="{ span: 17 }"
          :md="{ span: 17 }"
          :sm="{ span: 18 }"
          :xs="{ span: 18 }"
        >
          <p v-if="locktime > 0">{{ $t("lock-time") }}：{{ locktime_str }}</p>
          <p>
            {{ $t("total-staked") }}：
            <span class="font">{{ hformat(lpamount) }}</span>
          </p>
          <p>
            APR：<span class="font">{{ apy }}</span> %
          </p>
          <p>
            {{ $t("staking") }}：
            <span class="font">{{ hformat(farm_amount) }}</span>
            <span class="font">
              {{ hformat((farm_amount * 100) / lpamount) }} %
            </span>
          </p>
          <span>
            {{ $t("earned") }}：
            <span class="font">{{ hformat(earned_amount) }}</span>
            &nbsp;&nbsp; PBP
          </span>
        </el-col>
        <el-col
          :lg="{ span: 6 }"
          :md="{ span: 6 }"
          :sm="{ span: 6 }"
          :xs="{ span: 6 }"
        >
          <el-button @click="claim" class="stake-btn">{{
            $t("claim")
          }}</el-button>
          <el-button @click="dia_set_amount = true" class="stake-btn">
            {{ $t("deposit") }}
          </el-button>
          <el-button @click="dia_withdraw = true" class="stake-btn">
            {{ $t("withdraw") }}
          </el-button>
          <el-button @click="open_lplink" class="stake-btn" v-if="this.isLp">
            <a :href="this.lplink" target="_blank">add lp</a>
          </el-button>
        </el-col>
      </el-row>
    </el-col>
    <el-dialog :visible.sync="dia_set_amount" width="40vw">
      <el-card class="amount-ipt">
        <h2>{{ $t("set-s-amount") }}</h2>
        <p>
          <span>{{ $t("balance") }}：{{ stk_balance }}{{ stk_symbol }}</span>
        </p>
        <!-- 显示钱包中WXCC余额 -->
        <el-input v-model="stake_amount" clearable maxlength="20"> </el-input>
        <el-button @click="stake_amount = stk_balance">all</el-button>

        <ApproveButton
          v-if="stk_balance"
          :bsc="bsc"
          :token="stakeAddr"
          :spender="bsc.ctrs.staking.address"
          :min-req="stk_balance_bn"
        >
          <el-button @click="deposit">{{ $t("deposit") }}</el-button>
        </ApproveButton>
      </el-card>
    </el-dialog>
    <el-dialog :visible.sync="dia_withdraw">
      <el-card class="amount-ipt">
        <h2>{{ $t("withdraw") }}</h2>
        <p>
          <span>{{ $t("balance") }}：{{ farm_amount }} {{ stk_symbol }}</span>
        </p>
        <el-input v-model="withdraw_amount" clearable></el-input>
        <el-button @click="withdraw_amount = farm_amount">{{
          $t("all")
        }}</el-button>
        <el-button
          v-if="withdraw_wait == 0"
          @click="withdraw"
          :loading="w_loading"
          type="primary"
          >{{ $t("withdraw") }}
        </el-button>
        <el-col v-else>
          <p>锁定中，请等待{{ this.withdraw_wait }}秒，或强制提取</p>
          <el-button @click="force_withdraw" :loading="force_w_loading">
            force withdraw
          </el-button>
        </el-col>
      </el-card>
    </el-dialog>
  </el-col>
</template>
<script>
import tokens from "../../tokens";
import { ethers } from "ethers";
import hformat from "human-format";
import ApproveButton from "../lib/ApproveButton.vue";
import { mapState } from "vuex";
import times from "../../times";
import market from "../../market";
export default {
  name: "Stake",
  components: {
    ApproveButton,
  },
  props: ["pid", "stakeAddr", "locktime", "lpamount", "poolreward"],
  computed: mapState({
    bsc: "bsc",
    locktime_str: function () {
      return times.formatD(this.locktime, false);
    },
  }),
  mounted() {
    this.refresh();
    this.loadLp();
    setInterval(this.refresh, 12000);
  },
  data() {
    return {
      apy: "",
      farm_amount: "",
      earned_amount: "",
      stk_symbol: "-",
      stk_balance: "",
      stk_balance_bn: 0,
      stake_amount: 0,
      withdraw_amount: 0,
      withdraw_wait: 0,
      dia_set_amount: false,
      dia_withdraw: false,
      dep_loading: false,
      w_loading: false,
      force_w_loading: false,
      isLp: false,
      lp_prelink: "https://pancake.kiemtienonline360.com/#/add/",
      lplink: "",
    };
  },
  watch: {},
  methods: {
    hformat: function (val) {
      if (isNaN(val) || val == "") {
        return "";
      } else if (typeof val == "number") {
        return hformat(val);
      } else if (typeof val == "string") {
        return hformat(parseFloat(val));
      } else {
        return hformat(val.toNumber());
      }
    },
    loadLp: async function () {
      this.isLp = await tokens.islp(this.stakeAddr);
    },
    open_lplink: async function () {
      const stake_addr = this.stakeAddr;
      if (this.isLp) {
        const token = await tokens.lptokens(stake_addr);
        this.lplink = this.lp_prelink + token[0] + "/" + token[1];
      }
    },
    refresh: async function () {
      const pid = ethers.BigNumber.from(this.pid);
      const stakeAddr = this.stakeAddr;
      const rewardAddr = this.bsc.ctrs.pbp.address;
      this.stk_symbol = await tokens.symbol(stakeAddr);
      this.stk_balance_bn = await tokens.balance(stakeAddr);
      this.stk_balance = await tokens.format(stakeAddr, this.stk_balance_bn);
      const stakeds = await this.bsc.ctrs.staking.staked(pid, this.bsc.addr);
      const staked = stakeds[0];
      this.withdraw_wait = stakeds[1].toNumber();
      this.farm_amount = await tokens.format(stakeAddr, staked);
      const earnval = await this.bsc.ctrs.staking.earned(pid, this.bsc.addr);
      this.earned_amount = await tokens.format(rewardAddr, earnval);
      const ap = (this.poolreward * 365 * 86400 * 100) / this.lpamount;
      this.apy = ap.toFixed(4);
    },
    withdraw: async function () {
      this.w_loading = true;
      const amount = await tokens.parse(this.stakeAddr, this.withdraw_amount);
      if (amount.gt(0)) {
        const obj = this;
        try {
          const receipt = await this.bsc.ctrs.staking.withdraw(
            this.pid,
            amount
          );
          await market.waitEventDone(receipt, function (e) {
            obj.w_loading = false;
            obj.dia_withdraw = false;
          });
        } catch (e) {
          this.w_loading = false;
        }
      }
    },
    force_withdraw: async function () {
      this.force_w_loading = true;
      const amount = await tokens.parse(this.stakeAddr, this.withdraw_amount);
      if (amount.gt(0)) {
        try {
          const receipt = await this.bsc.ctrs.staking.forceWithdraw(
            this.pid,
            amount
          );
          await market.waitEventDone(receipt, function (e) {
            obj.force_w_loading = false;
          });
        } catch (e) {
          this.force_w_loading = false;
          console.log("force withdraw err", e);
        }
      }
    },
    claim: async function () {
      const receipt = await this.bsc.ctrs.staking.withdraw(
        this.pid,
        ethers.BigNumber.from(0)
      );
      console.log("claim receipt", receipt);
    },
    deposit: async function () {
      this.dep_loading = true;
      const amount = await tokens.parse(this.stakeAddr, this.stake_amount);
      if (amount.gt(0) && amount.lte(this.stk_balance_bn)) {
        try {
          const obj = this;
          const receipt = await this.bsc.ctrs.staking.deposit(this.pid, amount);
          await market.waitEventDone(receipt, function () {
            obj.dep_loading = false;
            obj.dia_set_amount = false;
          });
        } catch (e) {
          this.dep_loading = false;
          console.log("deposit in stake err", e);
        }
      } else {
        console.log("Invalid amount", amount);
      }
    },
  },
};
</script>
<style scoped>
@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(1800deg);
  }
}
.stake-btn {
  width: 60%;
  margin-left: 0px !important;
  margin-top: 10px;
  min-width: 80px;
  color: #373943;
}
.stake-btn a {
  color: #373943;
}
.stake-btn a:hover {
  color: #686b68;
}
#stake .refresh-btn {
  color: #38f2af;
  background: #373943;
  border: none;
  font-size: 24px;
}
#stake .refresh-btn.el-button:hover {
  color: #fff;
  animation: rotate ease-in-out 1s;
}
.stake-main {
  background-color: #373943;
  border-radius: 20px;
  padding: 20px;
  box-sizing: border-box;
  margin-top: 50px;
}
.amount-ipt .el-input {
  width: 50%;
  min-width: 200px;
  margin: 10px;
}
h2,
h3 {
  text-align: center;
}
</style>
