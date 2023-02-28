<template>
  <el-col>
    <el-col class="token-info">
      <el-col :span="5" :offset="1" :xs="{ offset: 0 }">
        <h2>{{ $t("pbp-issue-status") }}</h2>
      </el-col>
      <el-col :span="18">
        <ul>
          <li>
            合约地址：<a class="font" target="_blank" :href="tokenUrl()">{{
              pbpAddress
            }}</a>
          </li>
          <li>当前发行总量：<RichNumber :data="totalSupply"></RichNumber></li>
          <li>官方销毁总量：<RichNumber :data="totalBurnt"></RichNumber></li>
          <li>回购消耗BNB：<RichNumber :data="bnbUsed"></RichNumber></li>
        </ul>
      </el-col>
    </el-col>
    <el-col>
      <p v-if="burns.length == 0" icon="">Loading</p>
      <el-col class="token-info" v-else>
        <h2 class="center">Buy back and Burned</h2>
        <el-table id="history" :data="burns" style="width: 100%">
          <el-table-column
            width="120"
            prop="time"
            :label="$t('burn-date')"
          ></el-table-column>
          <el-table-column width="120" :label="$t('amount') + '(BNB)'">
            <template slot-scope="scope">
              <RichNumber :data="scope.row.bnb"></RichNumber>
            </template>
          </el-table-column>
          <el-table-column width="160" :label="$t('amount') + '(PBP)'">
            <template slot-scope="scope">
              <RichNumber :data="scope.row.amount"></RichNumber>
            </template>
          </el-table-column>
          <el-table-column label="TX">
            <template slot-scope="scope">
              <p class="font">
                {{ scope.row.txid }} <LinkIcon :url="scope.row.url" />
              </p>
            </template>
          </el-table-column>
        </el-table>
      </el-col>
    </el-col>
  </el-col>
</template>
<script>
import { mapState } from "vuex";
import { ethers } from "ethers";
import tokens from "../tokens";
import recBurns from "../rec-burns.json";
import RichNumber from "./lib/RichNumber.vue";
import LinkIcon from "./lib/LinIcon.vue";
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default {
  name: "PBPInfoMain",
  components: {
    RichNumber,
    LinkIcon,
  },
  computed: mapState({
    bsc: "bsc",
    burns: function () {
      const res = [];
      for (var i in recBurns.burns) {
        const burn = recBurns.burns[i];
        const item = {
          amount: ethers.utils.formatUnits(burn.args[2], "gwei"), // TODO: gwei 刚好对应PBP的decimals，不可用于其它Token
          time: new Date(burn.timestamp * 1000).toLocaleDateString("zh-CN"), // TODO: 应从系统locale读取
          txid: burn.transactionHash,
          url: `https://bscscan.com/tx/${burn.transactionHash}`,
        };
        if (recBurns.buys.length > i) {
          item.bnb = ethers.utils.formatEther(recBurns.buys[i].value);
        }
        res.push(item);
      }
      return res;
    },
    bnbUsed: function () {
      var bnb = ethers.BigNumber.from(0);
      for (var i in recBurns.buys) {
        const buy = recBurns.buys[i];
        bnb = bnb.add(buy.value);
      }
      return ethers.utils.formatEther(bnb);
    },
  }),
  mounted() {
    this.loadInfo();
  },
  data() {
    return {
      pbpAddress: "-",
      totalSupply: "-",
      totalBurnt: "-",
    };
  },
  methods: {
    tokenUrl: function () {
      if (this.pbpAddress.length > 1) {
        return "https://bscscan.com/token/" + this.pbpAddress;
      }
      return "#";
    },
    loadInfo: async function () {
      const ctr = this.bsc.ctrs["pbp"];
      this.pbpAddress = ctr.address;
      this.totalSupply = await tokens.format(
        this.pbpAddress,
        await tokens.supply(this.pbpAddress)
      );
      var totalBurnt = ethers.BigNumber.from(0);
      for (var i in recBurns.burns) {
        const burn = recBurns.burns[i];
        totalBurnt = totalBurnt.add(burn.args[2]);
      }
      this.totalBurnt = ethers.utils.formatUnits(totalBurnt, "gwei");
    },
  },
};
</script>
<style scoped>
.token-info {
  margin-top: 20px;
  background-color: #373943d5;
  border-radius: 10px;
  padding: 20px 5px;
}
</style>
