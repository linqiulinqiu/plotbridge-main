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
        <p>
          From<span class="clearfix" v-if="from_balance"
            >{{ $t("balance") }}: {{ this.from_balance }}</span
          >
        </p>
        <el-input
          v-model="from_amount"
          class="amount-ipt"
          clearable
          maxlength="20"
        >
          <el-button
            slot="append"
            v-if="from_balance > 0"
            type="primary"
            @click="from_all('from')"
            >{{ $t("all") }}</el-button
          >
        </el-input>
        <el-select v-model="from_coin" :placeholder="this.$t('select')">
          <el-option
            v-for="w in allwlist"
            :key="w.address"
            :label="w.bsymbol"
            :value="w.address"
            :disabled="w.address == to_coin"
          >
          </el-option>
        </el-select>
      </el-col>
      <el-col id="swap-exc">
        <el-button
          circle
          :icon="'el-icon-' + up_down"
          size="large"
          @click="order_swap"
          :disabled="change_dis"
        ></el-button>
      </el-col>
      <el-col class="swap-input">
        <p>
          To<span class="clearfix" v-if="to_balance"
            >{{ $t("balance") }}: {{ this.to_balance }}</span
          >
        </p>
        <el-input
          v-model="to_amount"
          class="amount-ipt"
          clearable
          maxlength="20"
        >
          <el-button
            slot="append"
            v-if="to_balance > 0"
            type="primary"
            @click="from_all('to')"
            >{{ $t("all") }}
          </el-button>
        </el-input>
        <el-select v-model="to_coin" :placeholder="this.$t('select')">
          <el-option
            v-for="w in allwlist"
            :key="w.address"
            :label="w.bsymbol"
            :value="w.address"
            :disabled="w.address == from_coin"
          >
          </el-option>
        </el-select>
      </el-col>
      <el-col
        class="swap-btn"
        v-if="this.to_amount > 0 && this.from_amount > 0"
      >
        <ApproveButton
          :bsc="this.bsc"
          :token="this.from_coin"
          :spender="this.bsc.ctrs.router.address"
          :min-req="this.from_val"
        >
          <el-button
            v-if="from_coin != to_coin"
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
          <LinkButton :token="from_coin" :onlyLp="false" />
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
export default {
  name: "SwapMain",
  components: {
    ApproveButton,
    LinkButton,
  },
  computed: mapState({
    bsc: "bsc",
    wBlance: "wBlance",
    pbpAddr(state) {
      return state.bsc.ctrs.pbp.address;
    },
    watchCoin() {
      if (this.from_coin && this.from_coin != "") {
        for (let i in this.allwlist) {
          if (
            this.allwlist[i].address == this.pbpAddr &&
            this.from_coin == this.pbpAddr
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
      if (this.from_coin && this.from_coin != "") {
        for (let i in list) {
          if (this.from_coin == list[i].address) {
            return list[i];
          }
        }
      }
      return false;
    },
    change_dis() {
      if (this.from_coin != "" && this.to_coin != "") {
        return false;
      }
      return true;
    },
    transferOK() {
      if (this.slipAmount == 20) return true;
      return false;
    },
    computeAmount() {
      if (this.from_coin != "" && this.to_coin != "") {
        if (this.from_amount != "" || this.to_amount != "") {
          if (
            this.from_to == "from" &&
            ethers.BigNumber.from(this.from_val).gt(0)
          ) {
            return true;
          }
          if (
            this.from_to == "to" &&
            ethers.BigNumber.from(this.to_val).gt(0)
          ) {
            return true;
          }
        }
      }
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
      from_balance: false,
      from_amount: "",
      from_val: 0,
      from_coin: "",
      from_ctr: false,
      swapping: false,
      to_balance: false,
      to_amount: "",
      to_val: 0,
      to_coin: "",
      slipAmount: 100,
      dia_slip: false,
      slippage: [20, 50, 100, 200],
      from_to: false,
      up_down: "bottom",
    };
  },
  watch: {
    slipAmount: function (newnum, oldnum) {
      this.slipAmount = newnum;
    },
    to_amount: debounce(async function (newv, oldv) {
      console.log(
        "to_val",
        this.to_val,
        newv,
        await tokens.format(this.to_coin, this.to_val)
      );

      if (newv != (await tokens.format(this.to_coin, this.to_val))) {
        this.to_val = await tokens.parse(this.to_coin, newv);

        // user input
        this.from_to = "to";
        this.up_down = "top";
        this.from_amount = await this.update_amounts(
          this.from_to,
          this.to_coin,
          newv,
          this.from_coin
        );
      }
    }, 500),
    from_amount: debounce(async function (newa, olda) {
      console.log("from", newa);
      if (newa != (await tokens.format(this.from_coin, this.from_val))) {
        this.from_val = await tokens.parse(this.from_coin, newa);

        this.from_to = "from";
        this.up_down = "bottom";
        this.to_amount = await this.update_amounts(
          this.from_to,
          this.from_coin,
          newa,
          this.to_coin
        );
      }
    }, 500),
    from_coin: debounce(async function (newc, oldc) {
      await this.update_balance(true, false);
      this.from_amount = "";
    }, 500),
    to_coin: debounce(async function (newc, oldc) {
      await this.update_balance(false, true);
      this.to_amount = "";
    }, 500),
  },
  methods: {
    watchToken: async function () {
      for (let i in this.allwlist) {
        const item = this.allwlist[i];
        if (item.address == this.from_coin) {
          const coin = item.bsymbol.toLowerCase();
          await market.watchToken(coin);
        }
      }
    },
    order_swap: function () {
      const old_from_coin = this.from_coin;
      this.from_coin = this.to_coin;
      this.to_coin = old_from_coin;
      this.from_amount = "";
      this.to_amount = "";
    },
    update_amounts: async function (from_to, amountAddr, amount, addr) {
      if (this.computeAmount) {
        const amount_val = await tokens.parse(amountAddr, amount);
        if (from_to) {
          let val = {
            to: false,
            from: false,
          };
          val[from_to] = amount_val;
          try {
            const est = await swap.estimate(
              this.bsc,
              this.from_coin,
              this.to_coin,
              val["from"],
              val["to"]
            );
            const est_amount = await tokens.format(addr, est);
            console.log("est-amount", est_amount, this.from_to, val);
            return est_amount;
          } catch (e) {
            console.log("update amount err", e);
          }
        }
      }
    },
    update_balance: async function (from, to) {
      if (from) {
        const from_balance = await tokens.balance(this.from_coin);
        this.from_balance = await tokens.format(this.from_coin, from_balance);
      }
      if (to) {
        const to_balance = await tokens.balance(this.to_coin);
        this.to_balance = await tokens.format(this.to_coin, to_balance);
      }
    },
    from_all: function (mode) {
      if (mode == "from") this.from_amount = this.from_balance;
      if (mode == "to") this.to_amount = this.to_balance;
    },
    swap: async function () {
      this.swapping = true;
      const minreq = this.to_val.sub(this.to_val.mul(this.slipAmount).div(100));
      const obj = this;
      try {
        // for fixed output
        const receipt_fo = await swap.swapfo(
          this.bsc,
          this.from_coin,
          this.to_coin,
          this.to_val,
          this.from_val.add(this.from_val.mul(this.slipAmount).div(100))
        );
        const receipt = await swap.swap(
          this.bsc,
          this.from_coin,
          this.to_coin,
          this.from_val,
          minreq,
          120
        );
        const commit = this.$store.commit;
        await market.waitEventDone(receipt, async function (evt) {
          obj.swapping = false;
          obj.from_amount = "";
          obj.to_amount = "";
          await obj.update_balance(true, true);
          for (let i in obj.wBlance) {
            for (let k in obj.allwlist) {
              const swapinfo = obj.allwlist[k];
              if ("index" in swapinfo) {
                if (
                  obj.from_coin == swapinfo.address ||
                  obj.to_coin == swapinfo.address
                ) {
                  if (i == swapinfo.index) {
                    await market.ListenToWCoin(commit);
                  }
                }
              }
            }
          }
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

.clearfix {
  margin-left: 10px;
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
.swap-btn {
  text-align: center;
  margin: 20px auto;
}
.swap-btn .el-button {
  margin-right: 20px;
  width: 100px;
}
</style>
