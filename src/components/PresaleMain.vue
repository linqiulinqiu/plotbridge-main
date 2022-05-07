<template>
  <el-col id="presaleMain">
    <el-col v-if="pstat == 's'">
      <el-col v-if="working">
        <p>{{ $t("ending") }} : {{ time_msg }}</p>
        <p>{{ $t("stage") }}：{{ stage }}</p>
        <p>
          {{ $t("remainder") }}：<span class="font">{{ remain }}</span>
          {{ coinName }}
        </p>
        <p>
          {{ $t("purchase") }}：<span class="font">{{ buyable }}</span>
          {{ coinName }}
        </p>
        <p>
          {{ $t("price") }}：<span class="font">{{ price_str }}</span> BNB
        </p>
        <p>
          {{ $t("prepay") }}：<span class="font">{{ payment }} </span>BNB
        </p>
        <p>
          {{ $t("balance") }}：
          <span class="font"> {{ balance }} {{ coinName }} </span>
        </p>
        <el-input
          v-model="amount"
          class="preinput"
          clearable
          suffix-icon="el-icon-edit"
        ></el-input>
        <el-button @click="max_amount" type="primary">{{
          $t("max")
        }}</el-button>
        <el-button @click="buy" :loading="buy_loading" type="primary">
          {{ $t("buy") }}
        </el-button>
      </el-col>
      <el-col v-else>
        <h2>&nbsp;&nbsp;{{ $t("not-start-pre") }}</h2>
      </el-col>
    </el-col>
    <el-col v-else-if="pstat == 'e'">
      <p>{{ $t("p-end") }}</p>
    </el-col>
    <el-col v-else>
      <p>{{ $t("data") }}</p>
    </el-col>
  </el-col>
</template>
<script>
import { mapState } from "vuex";
import times from "../times";
import tokens from "../tokens";
import market from "../market";
export default {
  name: "Presale",
  computed: mapState({
    bsc: "bsc",
  }),
  mounted() {
    this.refresh();
    this.loadtime_msg();
  },
  beforeUpdate() {
    this.loadtime_msg();
  },
  data() {
    return {
      pstat: "l",
      coinName: "PBP",
      stakeTokens: [],
      time_msg: "",
      stage: 0,
      amount: "",
      buyable: "",
      remain: "",
      price: "",
      price_str: "",
      payment: "--",
      buy_loading: false,
      balance: "",
      bnbBalance: false,
      working: true,
      toend: "",
    };
  },
  watch: {
    amount: async function (newv, oldv) {
      const token = this.bsc.ctrs.pbp.address;
      if (isNaN(newv)) {
        newv = "0";
      }
      const am = await tokens.parse(token, newv);
      const price = await tokens.parse("", this.price);
      const payment = am.mul(price).div(1e9).div(1e9);
      this.payment = await tokens.format("", payment);
    },
  },
  methods: {
    loadtime_msg: async function () {
      const toend = (await this.bsc.ctrs.presale.timeRemains()).toNumber();
      if (toend == 0) {
        this.pstat = "e";
      } else {
        this.time_msg = times.formatRelTS(
          Math.floor(Date.now() / 1000) + toend
        );
        this.pstat = "e";
        console.log("this.time_msg", this.time_msg);
      }
      return this.time_msg;
    },
    refresh: async function () {
      const token = this.bsc.ctrs.pbp.address;
      const pkgs = await this.bsc.ctrs.presale.pkgs();
      if (pkgs[0].length > 0) this.working = true;
      for (let i in pkgs[0]) {
        const remain = pkgs[0][i].sub(pkgs[1][i]);
        if (remain.gt(0)) {
          this.stage = parseInt(i) + 1;
          this.remain = await tokens.format(token, remain);
          this.price = await tokens.format("", pkgs[2][i]);
          this.price_str = await tokens.format("", pkgs[2][i].div(1e9));
          break;
        }
      }
      const buyable = await this.bsc.ctrs.presale.buyable();
      this.buyable = await tokens.format(token, buyable);
      const bl = await tokens.balance(token);
      this.balance = await tokens.format(token, bl);
      this.bnbBalance = await tokens.balance("");
    },
    max_amount: async function () {
      // TODO: can be more accurate
      const price = await tokens.parse("", this.price_str);
      const gasFee = await tokens.parse("", "0.001"); // TODO: use fixed estimation for gas-fee, can be more accurate
      if (this.bnbBalance.lte(gasFee)) {
        this.amount = 0;
      } else {
        const affordable = this.bnbBalance.sub(gasFee).div(price);
        this.amount = Math.min(this.remain, this.buyable, affordable);
      }
    },
    buy: async function () {
      this.buy_loading = true;
      if (this.amount == 0 && this.amount == "") {
        this.buy_loading = false;
        return false;
      }
      const token = this.bsc.ctrs.pbp.address;
      const amount = await tokens.parse(token, this.amount);
      const payment = await tokens.parse("", this.payment);

      try {
        const obj = this;
        const receipt = await this.bsc.ctrs.presale.buy(amount, {
          value: payment,
        });
        await market.waitEventDone(receipt, function () {
          obj.buy_loading = false;
          obj.refresh();
          obj.amount = "";
        });
      } catch (e) {
        this.buy_loading = false;
      }
    },
  },
};
</script>
<style>
#presaleMain .preinput {
  width: 200px;
  margin-right: 10px;
}
</style>
