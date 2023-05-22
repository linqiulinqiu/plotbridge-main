<template>
  <el-col id="connect">
    <el-button
      v-if="!baddr"
      @click="connect_wallet"
      class="connect"
      :loading="connect_loading"
    >
      {{ $t("connect") }}
    </el-button>
    <span v-else style="color: #fff" class="baddr font">
      <el-tooltip effect="light" placement="bottom">
        <span slot="content" class="font"> {{ $t("bsc") }}:{{ baddr }} </span>
        <el-button class="font">
          {{ addr }}
          <span v-if="testnet">{{ testnet }}</span>
        </el-button>
      </el-tooltip>
    </span>
    <el-dialog
      :visible.sync="connect_faild"
      :title="this.$t('con-failed')"
      :center="false"
      :span="10"
    >
      <el-card>
        <h4>{{ $t("con-f1") }}</h4>
        <p>{{ $t("con-f2") }}</p>
        <p>
          {{ $t("con-f3") }}
        </p>
        <span>
          <a
            href="https://chrome.google.com/webstore/search/metamask"
            target="_blank"
          >
            Chrome
          </a>
          <br />
          <a
            href="https://chrome.google.com/webstore/search/metamask"
            target="_blank"
            >Brave</a
          >
          <br />
          <a
            href="https://addons.mozilla.org/firefox/addon/ether-metamask"
            target="_blank"
          >
            Firefox
          </a>
        </span>
      </el-card>
    </el-dialog>
  </el-col>
</template>
<script>
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import market from "../../market";
import pbw from "pbwallet";
import keeper from "../../keeper";
import tokens from "../../tokens";
import { mapState } from "vuex";
export default {
  name: "ConnectWalletButton",
  computed: mapState({
    baddr: "baddr",
    bsc: "bsc",
    tvl: "tvl",
    addr: function (state) {
      if (state.baddr) {
        return state.baddr.substr(0, 6) + "..." + state.baddr.substr(-4, 4);
      }
      return false;
    },
    testnet: function (state) {
      if ("chain" in state.bsc) {
        if ("chainNetName" in state.bsc.chain) {
          switch (state.bsc.chain.chainNetName) {
            case "bnbt":
              return "(TESTNET)";
            case "bnb":
              return "";
            default:
              return `(${state.bsc.chain.chainNetName})`;
          }
        }
      }
      return "";
    },
  }),
  data() {
    return {
      connect_loading: false,
      connect_faild: false,
    };
  },
  methods: {
    loadTvl: async function () {
      const ctrs = this.bsc.ctrs;
      const pairAddr = {
        bnb_pbp: [ctrs.wbnb.address, ctrs.pbp.address],
        pbp_xcc: [ctrs.wxcc.address, ctrs.pbp.address],
        pbp_xch: [ctrs.wxch.address, ctrs.pbp.address],
        bnb_usdt: [ctrs.wbnb.address, ctrs.usdt.address],
      };
      const allPair = {
        bnb_pbp: { addr: "", bal: [] }, //bnb,pbp
        pbp_xcc: { addr: "", bal: [] }, //xcc,pbp
        pbp_xch: { addr: "", bal: [] }, // xch ,pbp
        bnb_usdt: { addr: "", bal: [] }, // BNB, USDT
      };
      var pbp_amount_all = 0;
      for (let key in pairAddr) {
        for (let ikey in allPair) {
          if (key == ikey) {
            const pair = await ctrs.factory.getPair(
              pairAddr[key][0], //another coin
              pairAddr[key][1] //pbp coin
            );
            allPair[ikey].addr = pair;
            allPair[ikey].bal[0] = await tokens.format(
              pairAddr[key][0],
              await tokens.balance(pairAddr[key][0], pair)
            );
            allPair[ikey].bal[1] = await tokens.format(
              pairAddr[key][1],
              await tokens.balance(pairAddr[key][1], pair)
            );
            if (pairAddr[ikey][1] == ctrs.pbp.address) {
              pbp_amount_all = pbp_amount_all + Number(allPair[ikey].bal[1]);
            }
          }
        }
      }
      const bnb_price = allPair.bnb_usdt.bal[1] / allPair.bnb_usdt.bal[0];
      const pbp_price =
        (allPair.bnb_pbp.bal[0] / allPair.bnb_pbp.bal[1]) * bnb_price;
      const total = parseInt(pbp_price * pbp_amount_all * 2);
      console.log("total:", total);
      this.$store.commit("setTvl", total);
    },

    connect_wallet: async function () {
      this.connect_loading = true;
      const commit = this.$store.commit;
      let bsc = {};
      console.log("window", window.ethereum);
      if (typeof window.ethereum !== "undefined") {
        try {
          bsc = await market.connect(commit, false);
          console.log("connect wallet with metaMask:", bsc);
        } catch (error) {
          console.log("connect wallet with metaMask err:", error);
        }
      } else {
        const providerOptions = {
          walletconnect: {
            package: WalletConnectProvider,
            options: {
              rpc: {
                0x38: "https://bsc-dataseed.binance.org",
                0x61: "https://data-seed-prebsc-1-s3.binance.org:8545/",
              },
            },
          },
        };
        try {
          const wmod = new Web3Modal({
            network: "binance-testnet",
            cacheProvider: false,
            providerOptions,
          });
          const wm_instance = await wmod.connect();
          bsc = await market.connect(commit, wm_instance);
          console.log("connect wallet", bsc);
        } catch (e) {
          this.connect_loading = false;
          console.log("connect wallet err", e);
        }
      }
      if (typeof bsc == "string" || !bsc) {
        if (bsc) {
          this.$message.error(this.$t("relink-wallet"));
        } else {
          this.connect_faild = true;
        }
        this.connect_loading = false;
      } else {
        commit("setBaddr", bsc.addr);
        await this.loadTvl();
        this.connect_loading = false;
        await keeper.startKeeper(bsc, commit);
      }
    },
  },
};
</script>
<style>
#connect .el-button {
  margin-top: 25px;
  background-color: #38f2af;
  color: #000000;
  width: 99%;
  height: 40px;
  text-align: center;
  font-size: 14px;
  cursor: pointer;
  padding: 0px;
  box-shadow: 0px 2px 2px 0px rgba(56, 242, 175, 0.08);
}
#connect .baddr {
  color: #38f2af;
  width: 99%;
  margin: 0 auto;
  font-size: 16px;
  display: inline-block;
  margin: 0 auto;
}
</style>