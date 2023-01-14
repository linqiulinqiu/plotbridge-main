<template>
  <el-col id="withdraw">
    <el-col v-if="this.hasPbxs">
      <el-col v-if="this.withdrawAddr">
        <el-col>
          <p v-if="withdrawBinded > 1">
            {{
              $t("bind-waddr-tips", {
                wbind: this.withdrawBinded,
                ubind: this.withdrawBinded - 1,
              })
            }}
          </p>
          <p>
            <span>{{ $t("w-addr", { bcoin: this.coinInfo.symbol }) }} :</span>
            <br />
            <span class="tips">
              {{ $t("correct-addr") }}
            </span>
          </p>
          <el-col class="follow">
            <el-col class="withdraw-addr">
              <span class="font"> {{ this.withdrawAddr }} </span>
              <LinkIcon :url="addrLink"></LinkIcon>
              <el-button
                style="float: right"
                icon="el-icon-edit"
                type="primary"
                size="mini"
                @click="bind_dialog = true"
              ></el-button>
            </el-col>
          </el-col>
          <el-col>
            <el-col id="burn-amount">
              {{ $t("burn") }} :
              <el-input
                v-model="wAmount"
                class="amount-input"
                clearable
                maxlength="20"
                suffix-icon="el-icon-edit"
              ></el-input>
              <el-button
                type="primary"
                size="small"
                @click="wAmount = WBalance[coinInfo.index]"
                >{{ $t("all") }}
              </el-button>
              {{ this.coinInfo.bsymbol }}，
              <el-button
                type="primary"
                :loading="coinBtn_state.wloading"
                :disabled="coinBtn_state.wdisabled"
                @click="withdraw"
                >{{ $t("withdraw") }}
              </el-button>
            </el-col>
            <el-col class="after-get" v-if="this.wAmount">
              <p>
                {{ $t("get") }}
                <span>
                  <span v-if="this.wAmount != ''" class="after-amount font">
                    {{ getwAmount }}
                  </span>
                  <span v-else> --- </span>
                </span>
                {{ this.coinInfo.symbol }}
              </p>
              <el-col v-if="this.tips_amount" class="minifont">
                <i v-if="this.wAmount.length > 0">{{ this.tips_amount }}</i>
              </el-col>
            </el-col>
          </el-col>
        </el-col>
      </el-col>
      <el-col v-else>
        <el-col v-if="this.withdrawBinded > 0">
          <el-col style="margin-top: 20px">
            <p>
              <span class="minifont">
                {{ $t("tips-waddr") }}
              </span>
            </p>
          </el-col>
        </el-col>
        <el-col v-else class="bind-waddr">
          <p>
            {{ $t("input-addr") }}
            <span class="tips"> ({{ $t("correct-addr") }}) </span>
          </p>
          <el-input
            type="text"
            v-model.trim="wAddr"
            clearable
            suffix-icon="el-icon-edit"
            :placeholder="this.$t('bind-waddr')"
          ></el-input>
          <el-button
            type="primary"
            @click="bindWaddr('bloading1')"
            :loading="coinBtn_state.bloading1"
            >{{ $t("bind") }}</el-button
          >
        </el-col>
      </el-col>
    </el-col>
    <el-col v-else>
      {{ $t("loading") }}
      <el-skeleton :rows="5" animated></el-skeleton>
    </el-col>

    <el-dialog :title="this.$t('bind-waddr')" :visible.sync="bind_dialog">
      <el-card>
        <p>
          {{ $t("input-addr") }}
          <span style="font-size: 14px"> ({{ $t("correct-addr") }}) </span>
          <el-button
            style="float: right"
            icon="el-icon-delete"
            @click="clearAddr"
            size="small"
            :loading="coinBtn_state['cloading']"
          >
            {{ $t("clear-waddr") }}
          </el-button>
        </p>
        <el-col class="bindWaddr">
          <el-input
            type="text"
            v-model.trim="wAddr"
            clearable
            suffix-icon="el-icon-edit"
          ></el-input>
          <el-button
            type="primary"
            @click="bindWaddr('bloading2')"
            :loading="coinBtn_state.bloading2"
          >
            {{ $t("bind-waddr") }}
          </el-button>
          <el-button @click="bind_dialog = false">{{ $t("cancel") }}</el-button>
        </el-col>
      </el-card>
    </el-dialog>
  </el-col>
</template>
<script>
import { mapState } from "vuex";
import market from "../../market";
import BridgeFee from "./BridgeFee.vue";
import debounce from "lodash/debounce";
import LinkIcon from "../lib/LinIcon.vue";

export default {
  components: {
    BridgeFee,
    LinkIcon,
  },
  props: ["curNFT", "coinInfo", "coinMap"],
  computed: mapState({
    baddr: "baddr",
    WBalance: "WBalance",
    current: "current",
    addrLink() {
      const url =
        "https://alltheblocks.net/" +
        this.coinInfo.name.toLowerCase() +
        "/address/" +
        this.withdrawAddr;
      return url;
    },
    withdrawAddr(state) {
      const pbxs = this.curNFT.pbxs;
      const cointy = this.current.coinType;
      if (pbxs == undefined) {
        return false;
      } else if (cointy in pbxs && pbxs[cointy]["withdrawAddr"]) {
        return pbxs[cointy]["withdrawAddr"];
      }
      return false;
    },
    withdrawBinded(state) {
      let pbts = state.myList;
      const coinType = state.current.coinType;
      let binded = 0;
      for (let i in pbts) {
        const item = pbts[i];
        if ("pbxs" in item) {
          if (item.pbxs && coinType in item.pbxs) {
            if ("withdrawAddr" in item.pbxs[coinType]) {
              if (item.pbxs[coinType].withdrawAddr) binded++;
            }
          }
        }
      }
      return binded;
    },
    hasPbxs() {
      const pbxs = this.curNFT && "pbxs" in this.curNFT;
      return pbxs;
    },
    coinBtn_state(state) {
      return this.btn_state[state.current.coinType];
    },
  }),
  data() {
    return {
      hasPbx: false,
      wAmount: "",
      getwAmount: "",
      tips_amount: false,
      wAddr: "",
      bind_dialog: false,
      btn_state: this.btn_states(),
    };
  },
  watch: {
    current: async function (newt) {
      this.wAmount = "";
      this.getwAmount = "";
      this.wAddr = "";
    },
    deep: true,
    withdrawAddr: function (newV) {
      return newV;
    },
    wAmount: debounce(async function (amount) {
      if (!amount || isNaN(amount) || amount == "") {
        amount = "0";
        this.tips_amount = this.$t("correct-amount");
        return false;
      }
      if (amount == 0) {
        this.getwAmount = 0;
        return false;
      }
      const after_fee = await market.afterFee(
        this.coinInfo,
        "withdraw",
        amount
      );
      if (!after_fee) {
        this.coinBtn_state.wdisabled = true;
        this.getwAmount = "";
        this.tips_amount = this.$t("tips-amount1");
      } else if (after_fee == "fund") {
        this.coinBtn_state.wdisabled = true;
        this.getwAmount = 0;
        this.tips_amount = this.$t("tips-amount2");
      } else {
        this.getwAmount = after_fee;
        this.tips_amount = false;
        this.coinBtn_state.wdisabled = false;
      }
      return after_fee;
    }, 150),
  },
  methods: {
    btn_states: function () {
      let btn_state = {};
      for (let i in this.coinMap) {
        btn_state[i] = {
          wdisabled: true,
          wloading: false,
          cloading: false,
          bloading1: false,
          bloading2: false,
        };
      }
      return btn_state;
    },
    amount_valid: async function (wAmount) {
      if (!wAmount || isNaN(wAmount)) {
        return false;
      }
      const after_fee = await market.afterFee(
        this.coinInfo,
        "withdraw",
        wAmount
      );
      if (!after_fee || isNaN(after_fee) || parseFloat(after_fee) <= 0) {
        return false;
      }
      return true;
    },
    withdraw: async function () {
      this.coinBtn_state.wloading = true;
      const cointy = this.current.coinType;
      console.log("btn_state.wloading", this.coinBtn_state.wloading);
      if (await this.amount_valid(this.wAmount)) {
        try {
          const obj = this;
          const res = await market.burnWcoin(this.wAmount, this.coinInfo);
          await market.waitEventDone(res, async function (evt) {
            console.log("evt in withdraw", evt);
            const balance = await market.loadBalance(cointy);
            const wBalance = obj.$store.state.WBalance;
            wBalance[cointy] = balance;
            obj.$store.commit("setWBalance", wBalance);
            obj.coinBtn_state.wloading = false;
            obj.wAmount = "";
          });
        } catch (e) {
          console.log("withdraw errrr", e.message);
          this.coinBtn_state.wloading = false;
        }
      }
    },
    clearAddr: async function () {
      this.coinBtn_state.cloading = true;
      const cointy = this.current.coinType;
      const id = this.current.pbtId;
      const obj = this;
      try {
        console.log("clearADdr params", id, cointy, this.coinBtn_state);
        const res = await market.clearAddr(id, cointy);
        await market.waitEventDone(res, async function (evt) {
          obj.coinBtn_state.cloading = false;
          obj.bind_dialog = false;
        });
      } catch (e) {
        this.coinBtn_state.cloading = false;
        console.log("clear Withdraw Addr err", e.message);
      }
    },
    bindWaddr: async function (key) {
      this.coinBtn_state[key] = true;
      const cointy = this.current.coinType;
      const id = this.current.pbtId;
      const addr = this.wAddr.toString();
      try {
        const res = await market.bindAddr(addr, id, cointy);
        console.log("res in bindAddr", res, res == false);
        if (res == false) {
          this.coinBtn_state[key] = false;
          this.$message(this.$t("correct-waddr"));
        } else {
          const obj = this;
          await market.waitEventDone(res, async function (evt) {
            // obj.coinBtn_state[key] = false;
          });
        }
      } catch (e) {
        this.coinBtn_state[key] = false;
        console.log("bind withdraw addr err", e.message);
      }
    },
  },
};
</script>
<style>
.block-link {
  color: #38f2af;
  display: inline-block;
  margin-left: 15px;
  margin-top: 5px;
  width: 25px;
  height: 25px;
  background-image: url("../../assets/image/external_link.svg");
}
.block-link:hover {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 5px;
}
.after-amount {
  color: #38f2af;
  margin: 0px 10px;
}
#withdraw {
  font-size: 20px;
}
#withdraw .get-amount {
  line-height: 10px;
}
#burn-amount .el-input__inner {
  background: #373943;
  border: none;
  box-sizing: border-box;
  color: #38f2af;
  border-radius: 10px;
}
.withdraw-addr {
  height: auto;
  word-wrap: break-word;
}
#burn-amount .el-input {
  margin: 0px 10px;
  color: #fff;
}
.tips {
  font-size: 16px;
}
.bind-waddr > .el-input {
  margin: 20px;
}
.bind-waddr > .el-button {
  margin-left: 20px;
}
.bindWaddr {
  margin: 20px 0px;
  text-align: center;
}
.bindWaddr button {
  margin: 20px 0px 0px 0px;
}
</style>