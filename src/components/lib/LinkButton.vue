<template>
  <span v-if="!onlyLp" id="linkButton">
    <el-button v-if="addLp && !readonly" class="btn-link">
      <a :href="addLp.url" target="_blank">
        {{ $t("add-lp", [addLp.txt]) }}
      </a>
    </el-button>
    <el-button v-if="addLp && !readonly" class="btn-link">
      <a :href="addLp.url" target="_blank">
        {{ $t("add-lp", [addLp.txt]) }}
      </a>
    </el-button>
    <el-button v-if="tokenInfo" class="btn-link">
      <a :href="tokenInfo.url" target="_blank"
        >{{ $t("token-info", [tokenInfo.txt]) }}
      </a>
    </el-button>
    <el-button v-if="poolInfo" class="btn-link">
      <a :href="poolInfo.url" target="_blank">
        {{ $t("pair-info", [poolInfo.txt]) }}
      </a>
    </el-button>
  </span>
  <span v-else id="addlp">
    <el-button v-if="addLp && !readonly">
      <a :href="addLp.url" target="_blank"> {{ $t("add") }} LP </a>
    </el-button>
  </span>
</template>
<script>
import { mapState } from "vuex";
import tokens from "../../tokens";
import { ethers } from "ethers";
export default {
  name: "LinkButton",
  props: ["token", "btoken", "readonly", "onlyLp"],
  computed: mapState({
    bsc: "bsc",
  }),
  data() {
    return {
      tokenInfo: false,
      addLp: false,
      poolInfo: false,
    };
  },
  mounted: function () {
    this.loadLinks();
  },
  watch: {
    token: function (nc, oldc) {
      this.loadLinks();
    },
  },
  methods: {
    loadLinks: async function () {
      const explorer = this.bsc.chain.chainExplorerUrl;
      const factory = this.bsc.ctrs.factory;
      const ta = {
        addr: this.token,
      };
      if (!this.token || this.token == ethers.constants.AddressZero) {
        this.addLp = false;
        this.tokenInfo = false;
        this.poolInfo = false;
        return; // Token A must set
      }
      ta.symbol = await tokens.symbol(this.token);
      let btoken = this.btoken;

      if (!this.btoken) {
        btoken = this.bsc.ctrs.pbp.address;
      }
      const tb = { addr: btoken };
      if (
        btoken == this.token ||
        btoken == ethers.constants.AddressZero ||
        btoken == this.bsc.ctrs.wbnb.address
      ) {
        tb.addr = this.bsc.ctrs.wbnb.address;
        tb.symbol = "BNB";
        tb.add = "BNB";
      } else {
        tb.addr = btoken;
        tb.symbol = await tokens.symbol(tb.addr);
        tb.add = tb.addr;
      }
      let pair = false;
      const swap = this.bsc.chain.swapUrl;
      pair = await factory.getPair(ta.addr, tb.addr);
      const txt = `${ta.symbol}-${tb.symbol}`;
      this.addLp = {
        url: `${swap}/add/${tb.add}/${ta.addr}`,
        txt: txt,
      };
      this.tokenInfo = {
        url: `${explorer}/token/${ta.addr}`,
        txt: ta.symbol,
      };
      if (pair) {
        this.poolInfo = {
          url: `${swap}/info/pool/${pair}`,
          txt: txt,
        };
      } else {
        this.poolInfo = false;
      }
    },
  },
};
</script>
<style>
#addlp .el-button {
  margin-top: 10px !important;
}
#addlp a {
  color: #373943;
}
#addlp a:hover {
  color: #668b66;
}
#linkButton {
  margin-left: 10px;
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
  border: #38f2af solid 1px;
}
</style>
