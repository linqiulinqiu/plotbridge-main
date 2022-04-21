<template>
  <el-col id="deposit">
    <el-col v-if="this.hasPbxs">
      <el-col v-if="this.depositAddr">
        <p>
          <span>{{ $t("deposit") }}:</span>
          <el-input
            type="text"
            clearable
            maxlength="20"
            class="amount-input"
            suffix-icon="el-icon-edit"
            v-model.trim="depAmount"
          />
          <span>{{ this.coinInfo.symbol }}</span>
        </p>
        <span class="follow">{{ $t("addr") }} ：</span>
        <el-col>
          <el-col class="deposit-addr">
            <p class="font">{{ this.depositAddr }}</p>
          </el-col>
          <el-tooltip :content="this.$t('copy')" placement="right">
            <el-button
              size="mini"
              icon="el-icon-document-copy"
              v-clipboard:copy="this.depositAddr"
              v-clipboard:success="onCopy"
              v-clipboard:error="onError"
            ></el-button>
          </el-tooltip>
        </el-col>
        <el-col class="after-get" v-if="this.depAmount">
          <el-col>
            {{ $t("get") }}
            <span>
              <span v-if="this.depAmount" class="font after-amount">
                {{ getAmount }}
              </span>
              <span v-else> --- </span>
            </span>
            {{ this.coinInfo.bsymbol }}，{{ $t("inbsc") }}。
          </el-col>
          <el-col v-if="this.tips_amount">
            <i v-if="this.depAmount.length > 0">{{ this.tips_amount }}</i>
          </el-col>
        </el-col>
      </el-col>
      <el-col v-else>
        <el-col v-if="this.bables">
          <el-button
            type="primary"
            class="getdeposte"
            @click="getDepositAddr"
            :loading="getDep_loading"
            >{{ $t("dep-addr", { bcoin: this.coinInfo.symbol }) }}
          </el-button>
        </el-col>
        <el-col v-else>
          <p>{{ $t("getaddr") }}</p>
          <el-col>
            <el-link
              class="a-link"
              icon="el-icon-chat-line-square"
              type="primary"
              href="https://discord.gg/xHC9fBfeVW"
              target="_blank"
            >
              discord
            </el-link>
            <el-link
              class="a-link"
              icon="el-icon-chat-line-square"
              type="primary"
              href="https://t.me/PlotBridge"
              target="_blank"
            >
              telegram
            </el-link>
            <el-link
              class="a-link"
              icon="el-icon-chat-line-square"
              type="primary"
              href="https://twitter.com/plot_bridge"
              target="_blank"
            >
              twitter
            </el-link>
          </el-col>
        </el-col>
      </el-col>
    </el-col>
    <el-col v-else>
      {{ $t("loading") }}
      <el-skeleton :rows="5" animated></el-skeleton>
    </el-col>
  </el-col>
</template>
<script>
import { mapState } from "vuex";
import market from "../../market";
import BridgeFee from "./BridgeFee.vue";
export default {
  components: {
    BridgeFee,
  },
  props: ["curNFT", "coinInfo"],
  computed: mapState({
    baddr: "baddr",
    current: "current",
    depositAddr(state) {
      const pbxs = this.curNFT.pbxs;
      const cointy = this.current.coinType;
      if (pbxs == undefined) {
        return false;
      } else if (cointy in pbxs && pbxs[cointy]["depositAddr"]) {
        return pbxs[cointy]["depositAddr"];
      }
      return false;
    },
    hasPbxs() {
      const pbxs = this.curNFT && "pbxs" in this.curNFT;
      return pbxs;
    },
  }),
  data() {
    return {
      coinlist: {},
      depAmount: "",
      getAmount: "",
      tips_amount: false,
      getDep_loading: false,
      bables: true,
    };
  },
  mounted() {
    this.bindables();
  },
  watch: {
    current: function (newCoin, old) {
      this.depAmount = "";
      this.getAmount = "";
    },
    depAmount: async function () {
      var depamount = this.depAmount;
      if (!depamount || isNaN(depamount) || depamount == "") {
        depamount = "0";
        this.tips_amount = this.$t("correct-amount");
        return false;
      }
      const after_fee = await market.afterFee(
        this.coinInfo,
        "deposit",
        depamount
      );
      if (!after_fee) {
        this.getAmount = "0";
        this.tips_amount = this.$t("tips-amount1");
      } else if (after_fee == "fund") {
        this.getAmount = "0";
        this.tips_amount = this.$t("tips-amount1");
      } else {
        this.getAmount = after_fee;
        this.tips_amount = false;
      }
      return after_fee;
    },
  },
  methods: {
    bindables: async function () {
      this.bables = await market.getBindables(this.coinInfo.index);
      const count = parseInt(this.bables);
      console.log("count", count);
      if (count > 0) return true;
      return false;
    },
    onCopy: function (e) {
      this.$message.success(this.$t("copy-ok"));
    },
    onError: function (e) {
      this.$message.error(this.$t("copy-err"));
    },
    getDepositAddr: async function () {
      this.getDep_loading = true;
      const id = this.current.pbtId;
      const cointy = this.current.coinType;
      try {
        const res = await market.getDepAddr(id, cointy);
        if (res == "nothing") {
          console.log("存款地址没有了");
          this.$message(this.$t("getaddr"));
          this.bables = false;
        }
        const obj = this;
        await market.waitEventDone(res, async function (evt) {
          obj.getDep_loading = false;
        });
      } catch (e) {
        this.getDep_loading = false;
        console.log("deposit addr errr", e.message);
        if (e.data.code == 3) {
          this.$message(this.$t("dep-rebind"));
        }
      }
    },
  },
};
</script>
<style>
.el-skeleton__item {
  opacity: 0.5;
}
.a-link {
  margin: 25px;
}
.after-get {
  min-height: 100px;
  padding: 15px 0px;
}
.get-amount {
  width: 200px;
  background-color: #373943;
  display: inline-block;
  height: 42px;
  border-radius: 10px;
  line-height: 42px;
  padding-left: 10px;
}
.follow {
  margin: 20px 0px;
  display: inline-block;
}
#deposit {
  font-size: 20px;
}
.deposit-addr {
  height: auto;
  word-wrap: break-word;
}
#deposit .el-input__inner {
  background: #373943;
  border: none;
  box-sizing: border-box;
  color: #38f2af;
  border-radius: 10px;
}
#deposit .el-input {
  margin: 0px 10px;
  color: #fff;
}
</style>