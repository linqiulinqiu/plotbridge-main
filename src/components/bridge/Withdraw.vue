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
              <span class="font">
                {{ this.withdrawAddr }}
              </span>
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
                :loading="w_loading"
                :disabled="w_disabled"
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
            @click="bindWaddr"
            :loading="bind_loading"
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
            :loading="clear_loading"
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
          <el-button type="primary" @click="bindWaddr" :loading="bind_loading">
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

export default {
  components: {
    BridgeFee,
  },
  props: ["curNFT", "coinInfo"],
  computed: mapState({
    baddr: "baddr",
    WBalance: "WBalance",
    current: "current",
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
  }),
  data() {
    return {
      hasPbx: false,
      w_disabled: true,
      w_loading: false,
      clear_loading: false,
      bind_loading: false,
      wAmount: "",
      getwAmount: "",
      tips_amount: false,
      wAddr: "",
      bind_dialog: false,
    };
  },
  watch: {
    current: async function () {
      this.wAmount = "";
      this.getwAmount = "";
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
        this.w_disabled = true;
        this.getwAmount = "";
        this.tips_amount = this.$t("tips-amount1");
      } else if (after_fee == "fund") {
        this.w_disabled = true;
        this.getwAmount = 0;
        this.tips_amount = this.$t("tips-amount2");
      } else {
        this.getwAmount = after_fee;
        this.tips_amount = false;
        this.w_disabled = false;
      }
      return after_fee;
    }, 150),
  },
  methods: {
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
      this.w_loading = true;
      if (await this.amount_valid(this.wAmount)) {
        try {
          const obj = this;
          const res = await market.burnWcoin(this.wAmount, this.coinInfo);
          await market.waitEventDone(res, async function (evt) {
            obj.w_loading = false;
            obj.wAmount = "";
          });
        } catch (e) {
          console.log("withdraw errrr", e.message);
          this.w_loading = false;
        }
      }
    },
    clearAddr: async function () {
      this.clear_loading = true;
      const cointy = this.current.coinType;
      const id = this.current.pbtId;
      const obj = this;
      try {
        console.log("clearADdr params", id, cointy);
        const res = await market.clearAddr(id, cointy);
        await market.waitEventDone(res, async function (evt) {
          obj.clear_loading = false;
        });
      } catch (e) {
        this.clear_loading = false;
        console.log("clear Withdraw Addr err", e.message);
      }
    },
    bindWaddr: async function () {
      this.bind_loading = true;
      const cointy = this.current.coinType;
      const id = this.current.pbtId;
      const addr = this.wAddr.toString();
      try {
        // let rebind = false;
        // if (this.withdrawAddr != false) {
        //   rebind = true;
        // }
        const res = await market.bindAddr(addr, id, cointy);
        if (res == false) {
          this.bind_loading = false;
          this.$message(this.$t("correct-amount"));
        }
        const obj = this;
        await market.waitEventDone(res, async function (evt) {
          obj.bind_loading = false;
          obj.bind_dialog = false;
        });
      } catch (e) {
        this.bind_loading = false;
        console.log("bind withdraw addr err", e.message);
      }
    },
  },
};
</script>
<style>
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