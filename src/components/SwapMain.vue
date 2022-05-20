<template>
  <el-col id="swapmain">
    <el-col v-if="'addr' in this.bsc">
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
          :coinList="this.allwlist"
          :banCoin="this.banCoin"
          v-model="from"
          @change="change($event)"
        />
      </el-col>
      <el-col id="swap-exc">
        <el-button
          circle
          :icon="'el-icon-' + up_down"
          size="large"
          :disabled="change_dis"
        ></el-button>
      </el-col>
      <el-col class="swap-input">
        <TokenInput
          :coinList="this.allwlist"
          :banCoin="this.banCoin"
          v-model="to"
          @change="change($event)"
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
            @click="swap"
            :loading="swapping"
            type="primary"
            >{{ $t("swap") }}
          </el-button>
        </ApproveButton>
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
import debounce from "lodash/debounce";
import { mapState } from "vuex";
import ApproveButton from "./lib/ApproveButton.vue";
import pbwallet from "pbwallet";
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
      return state.bsc.ctrs.pbp.address;
    },
    watchCoin() {
      if (this.from.addr && this.to.addr != "") {
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
  }),
  mounted: function () {
    this.load_wlist();
  },
  data() {
    return {
      allwlist: [],
      BNBaddr: ethers.constants.AddressZero,
      from: {
        amount: ethers.BigNumber.from(0),
        dirty: false,
        addr: "",
        title: "from",
      },
      to: {
        amount: ethers.BigNumber.from(0),
        dirty: false,
        addr: "",
        title: "to",
      },
      banCoin: false,
      swapping: false,
      slipAmount: 100,
      dia_slip: false,
      slippage: [20, 50, 100, 200],
      from_to: false,
      up_down: "bottom",
      f_oldaddr: { newa: "", olda: "" },
      t_oldaddr: { newa: "", olda: "" },
    };
  },
  watch: {
    slipAmount: function (newnum, oldnum) {
      this.slipAmount = newnum;
    },
    from: async function (newa, olda) {
      if (this.gt()) {
        if (newa.dirty) {
          // this.getDecimal(this.f_oldaddr);
          this.to.amount = await this.update_amounts(newa, this.to, newa.title);
          this.from.dirty = false;
          this.from_to = "from";
          this.to = Object.assign({}, this.to);
          console.log("est_amount in from", this.to);
        }
      }
    },
    deep: true,
    to: async function (newa, olda) {
      if (this.gt()) {
        if (newa.dirty) {
          // this.getDecimal(this.t_oldaddr);
          this.from.amount = await this.update_amounts(
            this.from,
            newa,
            newa.title
          );
          this.from_to = "to";
          this.to.dirty = false;
          this.from = Object.assign({}, this.from);
          console.log("est_amount in to", this.from.amount);
        }
      }
    },
    deep: true,
  },
  methods: {
    getDecimal: function (oldaddr) {
      let oldaa = "";
      let newaa = "";
      for (let i in this.allwlist) {
        const addr = this.allwlist[i].address;
        if (addr == oldaddr.newa) {
          newaa = this.allwlist[i].decimals;
        }
        if (addr == oldaddr.olda) {
          oldaa = this.allwlist[i].decimals;
        }
      }
      console.log("this.decimals", oldaa, newaa);
      if (newaa < oldaa) {
        this.$message("数据处理失败");
      }
    },
    gt: function () {
      if (this.from.addr && this.to.addr) {
        if (this.from.amount && this.from.dirty && this.from.amount.gt(0)) {
          return true;
        } else if (this.to.amount && this.to.dirty && this.to.amount.gt(0)) {
          return true;
        }
      }
      return false;
    },
    change: function (e) {
      this.banCoin = e.addr;
      if (e.title == "from") {
        this.from = Object.assign({}, e);
        if (this.f_oldaddr.newa != this.f_oldaddr.ola) {
          this.f_oldaddr.olda = this.f_oldaddr.newa;
        }
        this.f_oldaddr.newa = e.addr;
      }
      if (e.title == "to") {
        this.to = Object.assign({}, e);
        if (this.t_oldaddr.newa != this.t_oldaddr.ola) {
          this.t_oldaddr.olda = this.t_oldaddr.newa;
        }
        this.t_oldaddr.newa = e.addr;
      }
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
    update_amounts: async function (from, to, title) {
      let val = {
        from: false,
        to: false,
      };
      if (title == "from") val[title] = from.amount;
      if (title == "to") val[title] = to.amount;
      try {
        const est = await swap.estimate(
          this.bsc,
          from.addr,
          to.addr,
          val["from"],
          val["to"]
        );
        return est;
      } catch (e) {
        console.log("update amount err", e);
      }
    },
    swap: async function () {
      this.swapping = true;
      const minreq = this.to_val.sub(this.to_val.mul(this.slipAmount).div(100));
      const obj = this;
      try {
        // for fixed output
        let res = "";
        if (this.from_to == "from") {
          res = await swap.swap(
            this.bsc,
            this.from.addr,
            this.to.addr,
            this.from.val,
            minreq,
            120
          );
        } else if (this.from_to == "to") {
          res = await swap.swapfo(
            this.bsc,
            this.from.addr,
            this.to.addr,
            this.to.val,
            this.from.val.add(this.from.val.mul(this.slipAmount).div(100)),
            120
          );
        }
        await market.waitEventDone(res, async function (evt) {
          obj.swapping = false;
          obj.from.amount = ethers.BigNumber.from(0);
          obj.to.amount = ethers.BigNumber.from(0);
        });
      } catch (e) {
        console.log("err", e);
        this.swapping = false;
      }
    },
    load_wlist: async function () {
      const wsymbols = pbwallet.wcoin_list("bsymbol");
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
      for (let i in wsymbols) {
        this.allwlist.push(pbwallet.wcoin_info(wsymbols[i], "bsymbol"));
      }
      for (let k in this.allwlist) {
        this.allwlist[k]["disabled"] = false;
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
  },
};
</script>
<style scoped>
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
  top: 20px;
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
  /* font-size: 30px; */
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
