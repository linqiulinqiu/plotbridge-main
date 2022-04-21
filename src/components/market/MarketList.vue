<template>
  <el-col>
    <div v-if="selling_count > 0">
      <ul>
        <li class="marketlist" v-for="nft in this.mklist" :key="nft.id">
          <SellingItem :info="nft" @click.native="openNFT(nft)" />
        </li>
      </ul>
      <el-col :lg="{ sapn: 4, offset: 15 }" :span="8">
        <el-pagination
          background
          :total="Object.keys(this.marketList).length"
          @current-change="handleXccPaegChange"
          :current-page="this.xccpageNum"
          :page-size="4"
          layout="prev,pager,next"
        ></el-pagination>
      </el-col>
    </div>
    <p v-else>{{ $t("no-selling") }}</p>
  </el-col>
</template>
<script>
import { mapState } from "vuex";
export default {
  name: "MarketList",
  props: ["marketList", "pageSize"],
  computed: mapState({
    baddr: "baddr",
    mklist() {
      const start = this.xccpageNum * this.pageSize - this.pageSize;
      const down = this.xccpageNum * this.pageSize;
      const list = Object.fromEntries(
        Object.entries(this.marketList).slice(start, down)
      );
      console.log("mklist", list, this.marketList);
      return list;
    },
    selling_count() {
      const cnt = Object.keys(this.marketList).length;
      console.log("selling count", cnt);
      return cnt;
    },
  }),
  data() {
    return {
      xccpageNum: 1,
      nftinfo_show: false,
    };
  },
  methods: {
    handleXccPaegChange: function (page_xcc) {
      this.xccpageNum = page_xcc;
    },
    openNFT: async function (nft) {
      this.$store.commit("setCurrentPbtId", nft.id);
    },
  },
};
</script>
<style>
.el-pagination {
  background-color: #373943;
}
.el-pager li {
  background-color: #373943 !important;
  color: #fff !important;
}
.el-pager li.active {
  color: #38f2af !important;
}
.el-pagination button,
.el-pagination span:not([class*="suffix"]) {
  color: #d1fcd1;
  background-color: #373943 !important;
}
.el-pagination .btn-next,
.el-pagination .btn-prev {
  color: #38f2af !important;
  background-color: #373943;
}
.el-pagination button:disabled {
  color: rgb(18, 24, 22) !important;
  background-color: #373943;
}
</style>