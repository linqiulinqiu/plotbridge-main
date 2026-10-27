<template>
  <el-col id="bridgeMain">
    <el-col v-if="Object.keys(this.$store.state.myList).length == 0">
      <el-col>
        <h1>{{ $t("bridge-guide") }}</h1>
        <el-col>
          <h4>1.{{ $t("b-guide1") }}</h4>
          <h4>2.{{ $t("b-guide2") }}</h4>
          <h4>3.{{ $t("b-guide3") }}</h4>
        </el-col>
      </el-col>
    </el-col>
    <el-col v-else>
      <el-col v-if="!current.pbtId">
        <h3 class="info">{{ $t("openNFT") }}</h3>
      </el-col>
      <el-col v-else>
        <el-col v-if="!current.coinType">
          <h3 class="info">{{ $t("select-coin") }}</h3>
        </el-col>
        <el-col v-else>
          <el-col id="balance" :lg="12">
            {{ this.$t("balance") }}：

            <span v-if="!curBalance" class="el-icon-loading"> </span>
            <span class="font" v-else>
              {{ curBalance }}
            </span>
            <span class="minifont"> {{ coinInfo.bsymbol }}</span>
            <el-tooltip
              placement="bottom"
              effect="light"
              :content="this.$t('add-token-tip')"
            >
              <el-button size="mini" type="primary" @click.prevent="addToken">
                {{ $t("add-token") }}
              </el-button>
            </el-tooltip>
            <el-col id="bridge-fee">
              <BridgeFee :coinInfo="coinInfo" />
            </el-col>
          </el-col>

          <el-col :lg="{ span: 17 }" :span="24">
            <el-alert
              v-if="woCoin"
              class="wo-notice"
              type="warning"
              :closable="false"
              show-icon
            >
              <template slot="title">{{ $t("wo-notice-title") }}</template>
              <p v-for="line in $t('wo-notice')" :key="line">{{ line }}</p>
            </el-alert>
            <el-tabs id="tabs" class="min-height">
              <el-tab-pane v-if="!woCoin" :label="$t('deposit')"
                ><Deposit :curNFT="this.curNFT" :coinInfo="coinInfo"
              /></el-tab-pane>
              <el-tab-pane :label="$t('withdraw')">
                <Withdraw
                  :curNFT="this.curNFT"
                  :coinInfo="coinInfo"
                  :coinMap="coinMap"
                />
              </el-tab-pane>
              <el-tab-pane :label="$t('redeem')">
                <el-col v-if="done">
                  <h3>
                    {{ $t("redeem-done") }}
                    <router-link
                      to="/Doc/Contact"
                      class="el-icon-right"
                    ></router-link>
                  </h3>
                </el-col>
                <Redeem v-else :bsc="this.bsc" :coinInfo="coinInfo" />
              </el-tab-pane>
            </el-tabs>
          </el-col>
          <el-col>
            <LPLink :coinInfo="coinInfo" />
          </el-col>
        </el-col>
      </el-col>
    </el-col>
  </el-col>
</template>
<script>
import Deposit from "./bridge/Deposit.vue";
import LPLink from "./bridge/LpLink.vue";
import Withdraw from "./bridge/Withdraw.vue";
import Redeem from "./bridge/Redeem.vue";
import BridgeFee from "./bridge/BridgeFee.vue";
import { mapState } from "vuex";
import market from "../market";
import pbwallet from "pbwallet";

export default {
  name: "BridgeMain",
  components: {
    Deposit,
    Withdraw,
    Redeem,
    BridgeFee,
    LPLink,
  },
  props: ["curNFT"],
  computed: mapState({
    bsc: "bsc",
    WBalance: "WBalance",
    current: "current",
    coinInfo: (state) => {
      const info = pbwallet.wcoin_info(state.current.coinType);
      if (info) return info;
      return "-";
    },
    woCoin: function () {
      const info = this.coinInfo;
      if (!info || !info.ctrname) return false;
      return market.isWithdrawOnly(info.ctrname);
    },
    coinMap: function () {
      return market.loadCoinlist();
    },
    curBalance: function (state) {
      const index = this.coinInfo.index;
      if (index in this.WBalance) {
        const balance = this.WBalance[index];
        return balance;
      }
      return false;
    },
  }),
  data() {
    return {
      done: true,
    };
  },
  methods: {
    addToken: async function () {
      try {
        await market.watchToken(this.coinInfo.ctrname);
      } catch (e) {
        console.log("addtoen err", e);
      }
    },
  },
};
</script>
<style scoped>
#bridgeMain {
  color: #fff;
}
#balance {
  padding: 10px;
  position: relative;
}
#balance .el-button {
  margin-left: 15px;
}
#balance #bridge-fee {
  position: absolute;
  top: 5.25px;
  left: 380px;
}
.wo-notice {
  margin-bottom: 10px;
}
.wo-notice p {
  margin: 2px 0;
}
</style>
