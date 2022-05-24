<template>
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
</template>
<script>
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import market from "../../market";
import keeper from "../../keeper";
import { mapState } from "vuex";
export default {
  name: "ConnectWalletButton",
  computed: mapState({
    baddr: "baddr",
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
    };
  },
  methods: {
    connect_wallet: async function () {
      this.connect_loading = true;
      const commit = this.$store.commit;
      const providerOptions = {
        walletconnect: {
          package: WalletConnectProvider,
          options: {
            rpc: {
              0x38: "https://bsc-dataseed.binance.org",
              0x61: "https://data-seed-prebsc-1-s1.binance.org:8545/",
            },
          },
        },
      };
      const wmod = new Web3Modal({
        network: "bnb",
        cacheProvider: true,
        providerOptions,
      });
      const wm_instance = await wmod.connect();
      console.log("wm_instance", wm_instance);
      const bsc = await market.connect(commit);
      if (typeof bsc == "string" || !bsc) {
        if (bsc) {
          this.$message.error(`Connect failed: ${bsc}`);
        } else {
          this.connect_faild = true;
        }
        this.connect_loading = false;
      } else {
        commit("setBaddr", bsc.addr);
        keeper.startKeeper(bsc, commit);
        this.connect_loading = false;
      }
    },
  },
};
</script>
<style>
</style>