<template>
  <el-col>
    <p>
      <!-- {{ info.title }} -->
      <span class="clearfix"> {{ $t("balance") }}: {{ balance }} </span>
    </p>
    <el-input
      type="text"
      v-model="amount"
      @change="submit"
      clearable
      maxlength="20"
      class="amount-ipt"
    >
    </el-input>
    <el-select v-model="addr" @change="submit" :placeholder="this.$t('select')">
      <el-option
        v-for="w in this.coinList"
        :key="w.address"
        :label="w.bsymbol"
        :value="w.address"
      >
      </el-option>
    </el-select>
  </el-col>
</template>
<script>
import debounce from "lodash/debounce";
import tokens from "../../tokens";

export default {
  name: "TokenInput",
  props: ["coinList", "info"],
  model: {
    prop: "info",
    event: "change",
  },
  data() {
    return {
      balance: "",
      addr: this.info.addr,
      amount: "",
    };
  },
  mounted() {
    this.processData();
  },
  watch: {
    info: async function (newv, oldv) {
      if (this.info.addr) {
        this.addr = this.info.addr
        this.amount = await tokens.format(this.info.addr, this.info.amount);
      }else{
        this.addr = ''
      }
    },
    deep: true,
  },
  methods: {
    processData: async function () {
      if (this.info.amount == 0) {
        this.amount == parseInt(this.info.amount);
      } else if (this.info.amount.gt(0) && this.info.addr != "") {
        this.amount == (await tokens.format(this.info.addr, this.info.amount));
      }
    },
    submit: async function () {
      this.info.dirty = true;
      if (this.addr) {
        this.info.addr = this.addr;
      } else {
        this.info.addr = "";
      }
      console.log("this.info", this.addr, this.info, this.amount);
      this.info.amount = await tokens.parse(this.info.addr, this.amount);
      this.$emit("change", this.info);
      console.log("submit", this.info);
    },
    updateBalance: async function () {
      if (this.tokenAddr != "") {
        const coinBalance = await tokens.balance(this.tokenAddr);
        this.balance = await tokens.format(this.tokenAddr, coinBalance);
      }
    },
  },
};
</script>
<style>
.clearfix {
  margin-left: 10px;
}
.amount-ipt.el-input {
  width: 70%;
  margin-right: 5px;
  margin-bottom: 5px;
  min-width: 200px;
}
#swapmain .el-select {
  width: 160px;
}
.swap-input {
  padding: 30px 30px;
  border-radius: 20px;
  margin-top: 25px;
  background-color: rgba(43, 44, 51, 0.8);
}
</style>
