<template>
  <el-col id="redeem">
    <el-col v-if="this.oldBalance.gt(0)">
      <p>{{ $t("old-balance") }}:{{ this.obStr }}</p>
      <el-col>
        <el-input
          type="text"
          v-model="amount"
          clearable
          maxlength="20"
          suffix-icon="el-icon-edit"
        ></el-input>

        <ApproveButton
          :bsc="bsc"
          :token="this.oldToken"
          :spender="this.bsc.ctrs.tokenredeem.address"
          :min-req="this.oldBalance"
        >
          <el-button @click="all">{{ $t("all") }}</el-button>
          <el-button @click="redeem" type="primary" :loading="redeeming">{{
            $t("redeem")
          }}</el-button>
        </ApproveButton>
      </el-col>
      <p>
        {{ $t("rd-info") }}
      </p>
      <p v-if="this.amount">
        {{
          $t("rd-rate", {
            amount: parseFloat(this.amount),
            oldsymbol: this.oldSymbol,
            newsymbol: this.newSymbol,
          })
        }}
      </p>
    </el-col>
    <el-col v-else>
      <p>{{$t('redeem-notice')}}</p>
    </el-col>
  </el-col>
</template>
<script>
import { mapState } from "vuex";
import ApproveButton from "../lib/ApproveButton.vue";
import market from "../../market";
import pbwallet from "pbwallet";
import { ethers } from "ethers";
import tokens from "../../tokens";
import debounce from "lodash/debounce";
const redeemCache = []; // new redeem created very unusual, so we assume it won't happen in a single web session

export default {
  name: "Redeem",
  props: ["bsc", "newToken"],
  components: {
    ApproveButton,
  },
  computed: mapState({
    redeemBalance: "redeemBalance",
    current: "current",
  }),
  data() {
    return {
      oldBalance: ethers.BigNumber.from(0),
      obStr: "",
      oldToken: false,
      oldSymbol: false,
      newSymbol: false,
      oBalance: false,
      amount: "",
      checking: false,
      redeeming: false,
    };
  },
  mounted() {
    this.loadRedeems();
  },
  watch: {
    current: function (newcointy) {
      if (newcointy) {
        this.amount = "";
      }
    },
    newToken: debounce(function () {
      this.loadPair();
    }, 500),
    amount: debounce(async function (newv, oldv) {
      if (!newv || isNaN(newv) || newv == "") {
        this.amount = "";
      }
      const val = await tokens.parse(this.oldToken, newv);
      if (val.gt(this.oldBalance)) {
        this.amount = await tokens.format(this.oldToken, this.oldBalance);
      }
    }, 500),
    oldBalance: async function (newv, oldv) {
      this.obStr = await tokens.format(this.oldToken, this.oldBalance);
    },
  },
  methods: {
    loadRedeems: async function () {
      if (redeemCache.length == 0) {
        const rds = await this.bsc.ctrs.tokenredeem.getRedeemList();
        for (let i in rds[0]) {
          const key = rds[1][i];
          if (!(key in redeemCache)) {
            const ci = {};
            ci.old_token = rds[0][i];
            ci.new_token = rds[1][i];
            redeemCache[key] = ci;
          }
        }
      } else {
        console.log("redeemCache already load, skip loading:", redeemCache);
      }
      this.loadPair();
    },
    loadPair: async function () {
      if (this.newToken in redeemCache) {
        const pair = redeemCache[this.newToken];
        this.oldToken = pair.old_token;
        this.newSymbol = await tokens.symbol(this.newToken);
        this.oldSymbol = await tokens.symbol(this.oldToken);
        this.oldBalance = await tokens.balance(this.oldToken);
      }
    },
    all: async function () {
      const balance = await tokens.balance(this.oldToken);
      this.amount = await tokens.format(this.oldToken, balance);
    },
    redeem: async function () {
      this.redeeming = true;
      const obj = this;
      try {
        const am = tokens.parse(this.oldToken, this.amount);
        const res = await this.bsc.ctrs.tokenredeem.redeem(this.oldToken, am);
        market.waitEventDone(res, async function (evt) {
          obj.redeeming = false;
          obj.amount = 0;
          obj.loadPair();
        });
      } catch (e) {
        console.log("redeem err", e);
        this.redeeming = false;
      }
    },
  },
};
</script>
<style>
#redeem {
  font-size: 20px;
}
#redeem .el-input {
  width: 200px;
  float: left;
  margin: 20px 0px;
}
</style>
