<template>
  <el-col id="swapmain">
    <el-col v-if="bsc.addr">
      <el-col id="swapTitle">
        <h3>{{ $t("s-swap") }}</h3>
        <p>{{ $t("s-swap1") }}</p>
        <el-tooltip effect="light" :content="this.$t('setting')">
          <el-button
            icon="el-icon-setting"
            circle
            size="medium"
            @click="dia_slip = true"
          ></el-button>
        </el-tooltip>
      </el-col>
      <el-col class="swap-input">
        <TokenInput
          title="From"
          :coinList="allwlist"
          :banCoin="to.addr"
          v-model="from"
        />
      </el-col>
      <el-col id="swap-exc">
        <el-button
          circle
          :icon="'el-icon-' + up_down"
          size="large"
          @click="orderSwap"
          :disabled="change_dis"
        ></el-button>
      </el-col>
      <el-col class="swap-input">
        <TokenInput
          title="To"
          :coinList="allwlist"
          :banCoin="from.addr"
          v-model="to"
        />
      </el-col>
      <el-col class="swap-btn">
        <ApproveButton
          :bsc="this.bsc"
          :token="this.from.addr"
          :spender="this.bsc.ctrs.router.address"
          :min-req="this.from.amount"
        >
          <el-button
            v-if="from.addr != to.addr"
            @click.prevent="swap"
            :loading="swapping"
            type="primary"
            >{{ $t("swap") }}
          </el-button>
        </ApproveButton>
      </el-col>
      <el-col class="swap-price" v-if="price">
        <h4>
          <span v-if="slipNum.max">
            {{ $t("slip-max") }}：
            <span>{{ slipNum.max }}</span>
            <span class="tokenpair">{{ price.symbol[0] }}</span>
          </span>
          <span v-if="slipNum.min">
            {{ $t("slip-min") }}：
            <span>{{ slipNum.min }}</span>
            <span class="tokenpair">{{ price.symbol[1] }}</span>
            <span></span>
          </span>
        </h4>
        <h4>
          {{ $t("price") }} : <span class="font">{{ price.price }}</span>
          <span class="tokenpair">
            {{ price.symbol[0] }} per {{ price.symbol[1] }}
          </span>
        </h4>
      </el-col>
      <el-col class="swap-add">
        <el-button @click="watchToken" v-if="this.watchCoin" class="btn-link">{{
          $t("add-to-wallet", { coin: this.watchCoin.bsymbol })
        }}</el-button>
        <span v-if="watchBcoin">
          <LinkButton :token="from.addr" :onlyLp="false" />
        </span>
      </el-col>
    </el-col>
    <el-dialog :title="this.$t('setting')" :visible.sync="dia_slip">
      <el-card id="slipcard">
        <el-col class="cardheader">
          <h3>{{ $t("slippage") }}</h3>
          <el-tooltip effect="light" placement="right-start">
            <span slot="content" class="tooltip">
              {{ $t("slip-tip") }}
            </span>
            <el-button icon="el-icon-question" circle></el-button>
          </el-tooltip>
        </el-col>
        <el-col v-for="i in this.slippage" :key="i" id="slip-group">
          <el-button
            class="slipbtn"
            @click="slipAmount = i"
            :class="{ isActived: i == slipAmount }"
            >{{ i / 100 }}%
          </el-button>
        </el-col>
        <el-col v-if="transferOK">
          <p>{{ $t("slip-fail") }}</p>
        </el-col>
      </el-card>
    </el-dialog>
  </el-col>
</template>
<script>
import { ethers } from "ethers";
import { mapState } from "vuex";
import ApproveButton from "./lib/ApproveButton.vue";
import tokens from "../tokens";
import swap from "../swap";
import market from "../market";
import LinkButton from "./lib/LinkButton.vue";
import TokenInput from "./lib/TokenInput.vue";
export default {
  name: "SwapMain",
  components: {
    ApproveButton,
    LinkButton,
    TokenInput,
  },
  computed: mapState({
    bsc: "bsc",
    wBlance: "wBlance",
    pbpAddr(state) {
      if (state.bsc) {
        return state.bsc.ctrs.pbp.address;
      }
      return "";
    },
    watchCoin() {
      if (this.from.addr) {
        for (let i in this.allwlist) {
          if (
            this.allwlist[i].address == this.pbpAddr &&
            this.from.addr == this.pbpAddr
          ) {
            return this.allwlist[i];
          }
        }
        return false;
      }
      return false;
    },
    watchBcoin() {
      const list = this.watchlist();
      if (this.from.addr && this.from.addr != "") {
        for (let i in list) {
          if (this.from.addr == list[i].address) {
            return list[i];
          }
        }
      }
      return false;
    },
    change_dis() {
      if (this.from.addr != "" && this.to.addr != "") {
        return false;
      }
      return true;
    },
    transferOK() {
      if (this.slipAmount == 20) return true;
      return false;
    },
    price() {
      if (
        this.from.addr &&
        this.to.addr &&
        !this.from.amount.eq(0) &&
        !this.to.amount.eq(0)
      ) {
        return this.pricePair();
      }
      return false;
    },
  }),
  mounted: function () {
    this.load_wlist();
    this.from.addr = this.pbpAddr;
  },
  data() {
    return {
      allwlist: [],
      from: {
        amount: ethers.BigNumber.from(0),
        lastSet: Date.now(),
        lastEdit: 0,
        addr: "",
        number: 0,
        isSwap: false,
      },
      to: {
        amount: ethers.BigNumber.from(0),
        lastSet: Date.now(),
        lastEdit: 0,
        addr: "",
        number: 0,
        isSwap: false,
      },
      swapping: false,
      slipAmount: 100,
      dia_slip: false,
      slippage: [20, 50, 100, 200],
      from_to: false,
      up_down: "bottom",
      slipNum: {
        max: false,
        min: false,
      },
    };
  },
  watch: {
    slipAmount: async function (newnum, oldnum) {
      this.slipAmount = newnum;
      await this.slipNumber();
    },
    from: async function (newa, olda) {
      await this.estimate();
      this.from.number = await tokens.format(newa.addr, newa.amount);
      this.to.number = await tokens.format(this.to.addr, this.to.amount);
      await this.slipNumber();
    },
    to: async function (newa, olda) {
      await this.estimate();
      this.to.number = await tokens.format(newa.addr, newa.amount);
      this.from.number = await tokens.format(this.from.addr, this.from.amount);
      await this.slipNumber();
    },
  },
  methods: {
    slipNumber: async function () {
      this.slipNum.max = false;
      this.slipNum.min = false;
      if (this.from.amount && this.to.amount) {
        if (this.from_to == "to") {
          const minNum = this.to.amount.sub(
            this.to.amount.mul(this.slipAmount).div(10000)
          );
          if (minNum.lte(0)) {
            this.slipNum.min = 0;
          } else {
            this.slipNum.min = await tokens.format(this.to.addr, minNum);
          }
        } else if (this.from_to == "from") {
          const maxNum = this.from.amount.add(
            this.from.amount.mul(this.slipAmount).div(10000)
          );
          this.slipNum.max = await tokens.format(this.from.addr, maxNum);
        }
      }
    },
    orderSwap: function () {
      const from = this.from;
      const to = this.to;
      to.lastSet = Date.now();
      from.lastSet = Date.now();
      this.from = to;
      this.to = from;
    },
    watchToken: async function () {
      for (let i in this.allwlist) {
        const item = this.allwlist[i];
        if (item.address == this.from.addr) {
          const coin = item.bsymbol.toLowerCase();
          await market.watchToken(coin);
        }
      }
    },
    estimate: async function () {
      const from = this.from;
      const to = this.to;
      let from_amount = false;
      let to_amount = false;
      let shouldEstimate = true;
      if (from.addr && to.addr) {
        if (from.lastEdit > to.lastEdit && from.lastEdit > to.lastSet) {
          if (!from.amount || from.amount.eq(0)) {
            shouldEstimate = false;
          }
          from_amount = from.amount;
          this.from_to = "from";
        } else if (to.lastEdit > from.lastEdit && to.lastEdit > from.lastSet) {
          if (!to.amount || to.amount.eq(0)) {
            shouldEstimate = false;
          }
          to_amount = to.amount;
          this.from_to = "to";
        } else {
          shouldEstimate = false;
        }
        if (shouldEstimate) {
          console.log("estimate:", from_amount, to_amount);
          try {
            const est = await swap.estimate(
              this.bsc,
              from.addr,
              to.addr,
              from_amount,
              to_amount
            );
            if (from_amount) {
              const to = Object.assign({}, this.to);
              to.amount = est;
              to.lastSet = Date.now();
              this.to = to;
            } else {
              const from = Object.assign({}, this.from);
              from.amount = est;
              from.lastSet = Date.now();
              this.from = from;
            }
          } catch (e) {
            console.log("update amount err", e);
          }
        }
      }
    },
    swap: async function () {
      this.swapping = true;
      const obj = this;
      try {
        // for fixed output
        let res = "";
        if (this.from_to == "from") {
          const minreq = this.slipNum.min;
          // this.to.amount.sub(
          //   this.to.amount.mul(this.slipAmount).div(100)
          // );
          console.log("minreq", minreq, this.slipAmount);
          res = await swap.swap(
            this.bsc,
            this.from.addr,
            this.to.addr,
            this.from.amount,
            minreq,
            120
          );
        } else if (this.from_to == "to") {
          const maxpay = this.slipNum.max;
          // this.from.amount.add(
          //   this.from.amount.mul(this.slipAmount).div(100)
          // );
          console.log("maxpay", maxpay, this.slipAmount);
          res = await swap.swapfo(
            this.bsc,
            this.from.addr,
            this.to.addr,
            this.to.amount,
            maxpay,
            120
          );
        }
        await market.waitEventDone(res, async function (evt) {
          obj.swapping = false;
          obj.from.amount = ethers.BigNumber.from(0);
          obj.to.amount = ethers.BigNumber.from(0);
          obj.from.isSwap = true;
          obj.to.isSwap = true;
          obj.from = Object.assign({}, obj.from);
          obj.to = Object.assign({}, obj.to);
        });
      } catch (e) {
        console.log("err", e);
        this.swapping = false;
      }
    },
    load_wlist: async function () {
      this.allwlist.push({
        bsymbol: "BNB",
        address: ethers.constants.AddressZero,
        decimals: 18,
      });
      this.allwlist.push({
        bsymbol: "PBP",
        address: this.bsc.ctrs.pbp.address,
        decimals: await this.bsc.ctrs.pbp.decimals(),
      });
      this.from.addr = this.bsc.ctrs.pbp.address;
      this.from = Object.assign({}, this.from);
      this.allwlist.push({
        bsymbol: "USDT",
        address: this.bsc.ctrs.usdt.address,
        decimals: await this.bsc.ctrs.usdt.decimals(),
      });
      this.allwlist.push({
        bsymbol: "BUSD",
        address: this.bsc.ctrs.busd.address,
        decimals: await this.bsc.ctrs.usdt.decimals(),
      });
      const list = market.loadCoinlist();
      for (let i in list) {
        this.allwlist.push(list[i]);
      }
    },
    watchlist: function () {
      const coinlist = this.allwlist;
      const busdaddr = this.bsc.ctrs.busd.address;
      const usdtaddr = this.bsc.ctrs.usdt.address;
      const list = {};
      for (let i in coinlist) {
        const addr = coinlist[i].address;
        if (
          addr != ethers.constants.AddressZero &&
          addr != busdaddr &&
          addr != usdtaddr
        ) {
          list[coinlist[i].address] = coinlist[i];
        }
      }
      return list;
    },
    pricePair: function () {
      const list = this.allwlist;
      let pair = {
        price: "",
        symbol: [], //[from.symbol,to.symbol]
      };
      if (this.from.addr && this.to.addr) {
        for (let i in list) {
          if (this.from.addr == list[i].address)
            pair.symbol[0] = list[i].bsymbol;
          if (this.to.addr == list[i].address) pair.symbol[1] = list[i].bsymbol;
        }
        if (this.to.amount && this.from.amount) {
          pair.price = this.from.number / this.to.number;
        }
      }
      return pair;
    },
  },
};
</script>
<style scoped>
.tokenpair {
  margin-left: 15px;
}
.btn-link.el-button {
  background: rgba(43, 44, 51, 0.8);
  color: #38f2af;
  border: 1px solid #38f2af;
  opacity: 0.9;
  margin-top: 15px;
}
.btn-link.el-button:hover {
  background: #373943;
  color: #38f2af;
}
#swap-add {
  margin-top: 10px;
}
.tooltip {
  font-size: 14px;
}
#slip-group {
  float: left;
  margin-left: 20px;
  width: 80px;
}
#slipcard .el-button {
  color: #fff;
  background: #373943;
  float: left;
  margin-left: 20px;
}
#slipcard {
  padding: 20px 10px;
}
.cardheader .el-button {
  border: none;
  position: relative;
  top: -25px;
  right: -110px;
}
.isActived {
  color: #38f2af !important;
  background: #373943 !important;
}
#swapTitle {
  position: relative;
}
#swapTitle .el-button {
  background: #373943;
  border: none;
  position: absolute;
  top: 0px;
  right: 20px;
  color: #38f2af;
  font-size: 22px;
}
#swapTitle .el-button:hover {
  color: #fff;
}

#swap-exc {
  height: 50px;
  text-align: center;
}
#swap-exc .el-button {
  width: 40px;
  height: 40px;
  margin-top: 17px;
  background-color: #2b2c33;
  border: none;
  color: #38f2af;
  font-size: 30px;
  font-weight: 400;
}
#swap-exc .el-button .el-icon-bottom::before {
  display: inline-block;
}
#swapmain .el-input-group__append {
  color: #fff;
  background: #373943;
}
#swapmain .el-input-group__append:hover {
  color: #38f2af;
}

.swap-btn {
  text-align: center;
  margin: 20px auto;
}
.swap-btn .el-button {
  margin-right: 20px;
  width: 100px;
}
</style>
