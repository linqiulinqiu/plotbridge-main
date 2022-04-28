<template>
  <span id="linkButton">
    <el-button v-if="addLp" class="btn-link">
      <a
        :href="addLp.url"
        target="_blank"
      >
        {{ $t("add-lp") }} {{ addLp.txt }}
      </a>
    </el-button>
    <el-button v-if="tokenInfo" class="btn-link">
      <a
        :href="tokenInfo.url"
        target="_blank"
        >{{ $t("token") }} {{ tokenInfo.txt }}
      </a>
    </el-button>
    <el-button v-if="poolInfo" class="btn-link">
      <a
        :href="poolInfo.url"
        target="_blank"
        >{{ $t("pool") }} {{ poolInfo.txt }}
      </a>
    </el-button>
  </span>
</template>
<script>
import { mapState } from "vuex";
export default {
  name: "LinkButton",
  props: ["coinInfo", "pbpaddr"],
  computed: mapState({
    bsc: "bsc",
  }),
  data() {
    return {
      tokenInfo: false,
      addLp: false,
      poolInfo: false
    };
  },
  mounted: function(){
        this.loadLinks()
  },
  watch: {
    coinInfo: function (nc, oldc) {
        this.loadLinks()
    }
  },
  methods: {
      loadLinks: async function (){
        const nc = this.coinInfo
        const explorer = this.bsc.chain.chainExplorerUrl
        const factory = this.bsc.ctrs.factory
        let pair = false
        console.log('chain', this.bsc.chain)
        const swap = this.bsc.chain.swapUrl
        let pa = nc.address
        let pb = this.bsc.ctrs.pbp.address
        let txt = false
        if(nc.bsymbol=='PBP'){  // PBP-BNB pair
            pair = await factory.getPair(nc.address, this.bsc.ctrs.wbnb.address)
            pb = 'BNB'
            txt = 'PBP-BNB'
        }else{
            pair = await factory.getPair(nc.address, this.bsc.ctrs.pbp.address)
            txt = `${nc.bsymbol}-PBP`
        }
        this.addLp = {
            url: `${swap}/add/${pb}/${pa}`,
            txt: `Add ${txt} LP`
        }
        this.tokenInfo = {
            url: `${explorer}/token/${pa}`,
            txt: nc.bsymbol
        }

        this.poolInfo = {
            url: `${swap}/info/pool/${pair}`,
            txt: `${txt} Pool Info`
        }
      }
  }
};
</script>
<style>
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
