<template>
  <el-col>
    <p>
      {{ info.title }}
      <span class="clearfix"> {{ $t("balance") }}: {{ balance }} </span>
    </p>
    <el-input
      type="text"
      v-model="amount"
      @change="submit"
      maxlength="20"
      class="amount-ipt"
    >
    </el-input>
    <el-select v-model="addr" @change="submit" :placeholder="this.$t('select')">
      <el-option
        v-for="w in this.list"
        :key="w.address"
        :label="w.bsymbol"
        :value="w.address"
        :disabled="w.disabled"
      >
      </el-option>
    </el-select>
  </el-col>
</template>
<script>
import debounce from "lodash/debounce";
import tokens from "../../tokens";
import { ethers } from "ethers";

export default {
  name: "TokenInput",
  props: ["coinList", "banCoin", "info"],
  model: {
    prop: "info",
    event: "change",
  },
  computed: {
    list: function () {
      if (this.banCoin) {
        for (let i in this.coinList) {
          this.coinList[i].disabled = false;
          if (this.coinList[i].address == this.banCoin) {
            this.coinList[i].disabled = true;
          }
        }
      }
      return this.coinList;
    },
  },
  data() {
    return {
      balance: "",
      addr: this.info.addr,
      amount: "",
    };
  },
  watch: {
    addr: async function (newa, olda) {
      if (newa) {
        this.amount = "";
        await this.updateBalance(newa);
      }
    },
    info: async function (newv, oldv) {
      this.addr = newv.addr;
      if (newv.amount) {
          this.amount = await tokens.format(newv.addr, newv.amount);
        
      }
    },
    deep: true,
  },
  methods: {
    submit: async function () {
      this.info.addr = this.addr;
      if (this.amount == 0) {
        this.info.amount = ethers.BigNumber.from(0);
      } else {
        this.info.amount = await tokens.parse(this.info.addr, this.amount);
        this.info.dirty = true;
      }
      this.$emit("change", this.info);
    },
    updateBalance: async function (addr) {
      const coinBalance = await tokens.balance(addr);
      this.balance = await tokens.format(addr, coinBalance);
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
