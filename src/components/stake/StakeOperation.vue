<template>
  <el-col>
    <el-col>
      <el-button
        class="stake-btn"
        v-if="can_withdraw"
        :loading="claim_loading"
        @click="claim"
        >{{ $t("claim") }}
      </el-button>
      <el-button @click="dia_set_amount = true" class="stake-btn">
        {{ $t("deposit") }}
      </el-button>
      <el-button
        v-if="can_withdraw"
        @click="dia_withdraw = true"
        class="stake-btn"
      >
        {{ $t("withdraw") }}
      </el-button>
      <LinkButton
        class="addlp stake-btn"
        v-if="this.isLp"
        :token="this.lptoken[0]"
        :btoken="this.lptoken[1]"
        :onlyLp="true"
      />
      <el-button v-else class="stake-btn">
        <router-link :to="this.toswap">{{ $t("buy") }}</router-link>
      </el-button>
    </el-col>
    <el-dialog :visible.sync="dia_set_amount" width="40vw">
      <el-card class="amount-ipt">
        <h2>{{ $t("set-s-amount") }}</h2>
        <p>
          <span>
            {{ $t("balance") }}： {{ stk_info.balance }}{{ stk_info.symbol }}
          </span>
        </p>
        <el-input v-model="stake_amount" clearable maxlength="20"> </el-input>
        <el-button @click="stake_amount = stk_info.balance">
          {{ $t("all") }}
        </el-button>

        <ApproveButton
          v-if="this.stk_info.balance"
          :bsc="this.bsc"
          :token="this.stakeInfo.stakeAddr"
          :spender="this.bsc.ctrs.staking.address"
          :min-req="this.stk_info.balance_bn"
        >
          <el-button @click="deposit" :loading="dep_loading">{{
            $t("deposit")
          }}</el-button>
        </ApproveButton>
      </el-card>
    </el-dialog>
    <el-dialog :visible.sync="dia_withdraw">
      <el-card class="amount-ipt">
        <h2>{{ $t("withdraw") }}</h2>
        <p>
          <span
            >{{ $t("balance") }}：{{ stk_info.farm_amount }}
            {{ stk_info.symbol }}</span
          >
        </p>
        <el-input v-model="withdraw_amount" clearable></el-input>
        <el-button @click="withdraw_amount = stk_info.farm_amount">{{
          $t("all")
        }}</el-button>
        <el-button
          v-if="this.stk_info.withdraw_wait == 0"
          @click="withdraw"
          :loading="w_loading"
          type="primary"
          >{{ $t("withdraw") }}
        </el-button>
        <el-col v-else>
          <p>{{ $t("locked", { time: this.stk_info.withdraw_wait_str }) }}</p>
          <el-button @click="force_withdraw" :loading="force_w_loading">
            {{ $t("force-w") }}
          </el-button>
        </el-col>
      </el-card>
    </el-dialog>
  </el-col>
</template>
<script>
import tokens from "../../tokens";
import { ethers } from "ethers";
import ApproveButton from "../lib/ApproveButton.vue";
import market from "../../market";
import LinkButton from "../lib/LinkButton.vue";
import { mapState } from "vuex";
export default {
  components: {
    ApproveButton,
    LinkButton,
  },
  props: ["stakeInfo", "processInfo", "bsc", "refresh"],
  computed: mapState({
    can_withdraw: function () {
      if (this.stk_info.farm_amount) {
        if (!this.stk_info.farm_amount) return false;
        if (this.stk_info.farm_amount == "0.0") return false;
      }
      return true;
    },
  }),
  async mounted() {
    this.loadLp();
    this.stk_info = await this.processInfo(this.stakeInfo);
    // console.log("stk_info in created", this.stk_info);
  },
  data() {
    return {
      stk_info: {
        farm_amount: "",
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
      withdraw_amount: 0,
      stake_amount: 0,
    };
  },
  methods: {
    loadLp: async function () {
      this.isLp = await tokens.islp(this.stakeInfo.stakeAddr);
      if (this.isLp) {
        this.lptoken = await tokens.lptokens(this.stakeInfo.stakeAddr);
      }
    },
    withdraw: async function () {
      console.log("withdraw amount", this.stakeInfo);
      this.w_loading = true;
      const amount = await tokens.parse(
        this.stakeInfo.stakeAddr,
        this.withdraw_amount
      );
      if (amount.gt(0)) {
        const obj = this;
        try {
          const receipt = await this.bsc.ctrs.staking.withdraw(
            this.stakeInfo.pid,
            amount
          );
          await market.waitEventDone(receipt, async function (e) {
            obj.w_loading = false;
            obj.dia_withdraw = false;
            obj.stk_info = await obj.processInfo(obj.stakeInfo);
          });
        } catch (e) {
          this.w_loading = false;
        }
      } else {
        this.w_loading = false;
        this.$message(this.$t("amount"));
      }
    },
    force_withdraw: async function () {
      const amount = await tokens.parse(
        this.stakeInfo.stakeAddr,
        this.withdraw_amount
      );
      console.log("force", this.withdraw_amount);
      const obj = this;
      if (amount.gt(0)) {
        this.force_w_loading = true;
        try {
          const receipt = await this.bsc.ctrs.staking.forceWithdraw(
            this.stakeInfo.pid,
            amount
          );
          await market.waitEventDone(receipt, async function (e) {
            // await obj.refresh();
            obj.stk_info = await obj.processInfo(obj.stakeInfo);
            obj.force_w_loading = false;
            console.log("force_withdraw msg", e);
          });
        } catch (e) {
          this.force_w_loading = false;
          console.log("force withdraw err", e);
        }
      } else {
        this.$message(this.$t("correct-amount"));
      }
    },
    claim: async function () {
      this.claim_loading = true;
      const obj = this;
      const pid = this.stakeInfo.pid;
      let receipt = false;
      try {
        const amount = ethers.BigNumber.from(0);
        if (this.stk_info.withdraw_wait == 0) {
          receipt = await this.bsc.ctrs.staking.withdraw(pid, amount);
        } else {
          console.log("wait ", this.stk_info, this.stk_info.withdraw_wait_str);
          const waitTime = this.stk_info.withdraw_wait_str;
          const resp = await this.$confirm(
            this.$t("locked2"),
            this.$t("locked1", { time: waitTime }),
            {
              confirmButtonText: this.$t("force-claim"),
              cancelButtonText: this.$t("cancel"),
              type: "warning",
            }
          );
          console.log("resp", resp);
          receipt = await this.bsc.ctrs.staking.forceWithdraw(pid, amount);
        }
        await market.waitEventDone(receipt, async function (e) {
          obj.claim_loading = false;
          // await obj.refresh();
          obj.stk_info = await obj.processInfo(obj.stakeInfo);
        });
      } catch (e) {
        this.claim_loading = false;
        console.log("stake claim err", e);
        if (e == "cancel") {
          // nothing need to do here
        } else if ("data" in e) {
          if ("code" in e.data) {
            if (e.data.code == 3) {
              // should be "still in lock time"
            }
          }
        }
      }
    },
    deposit: async function () {
      this.dep_loading = true;
      const amount = await tokens.parse(
        this.stakeInfo.stakeAddr,
        this.stake_amount
      );
      if (amount.gt(0) && amount.lte(this.stk_info.balance_bn)) {
        try {
          const obj = this;
          const receipt = await this.bsc.ctrs.staking.deposit(
            this.stakeInfo.pid,
            amount
          );
          await market.waitEventDone(receipt, async function () {
            obj.dep_loading = false;
            obj.dia_set_amount = false;
            // await obj.refresh();
            obj.stk_info = await obj.processInfo(obj.stakeInfo);
          });
        } catch (e) {
          this.dep_loading = false;
          console.log("deposit in stake err", e);
        }
      } else {
        this.dep_loading = false;
        console.log("Invalid amount", amount);
      }
    },
  },
};
</script>
<style>
@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(1800deg);
  }
}
.fold-btn {
  padding: 5px;
  font-size: 24px;
  color: #38f2af;
  background: #373943;
  border: none;
}
.fold-btn:hover,
.fold-btn:focus {
  color: #68bb68;
  background: #373943;
}
.mini-font {
  font-size: 10px;
  color: #c0c2c0;
}
.stake-btn {
  width: 80px;
  margin: 10px 5px;
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
  border: 1px solid #505850;
  border-radius: 20px;
  padding: 20px;
  box-sizing: border-box;
  margin-top: 20px;
  position: relative;
}
.amount-ipt .el-input {
  width: 50%;
  min-width: 200px;
  margin: 10px;
}
</style>