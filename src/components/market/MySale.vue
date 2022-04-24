<template>
  <el-col>
    <el-col v-if="loadDown">
      <el-col v-if="Object.keys(this.mySaleList).length > 0">
        <ul>
          <li v-for="nft in this.mslist" :key="nft.uri" class="marketlist">
            <SellingItem :info="nft" @click.native="openNFT(nft)" />
          </li>
        </ul>
        <el-col :lg="{ sapn: 4, offset: 15 }" :span="8">
          <el-pagination
            background
            :total="Object.keys(this.mySaleList).length"
            @current-change="handleCurPageChange()"
            :current-page="this.mypageNum"
            :page-size="10"
            layout="prev,pager,next"
          ></el-pagination>
        </el-col>
      </el-col>
      <el-col v-else>
        <h4>{{ $t("no-mysale") }}</h4>
      </el-col>
    </el-col>
    <el-col v-else>
      {{ $t("data") }}
    </el-col>
  </el-col>
</template>
<script>
import { mapState } from "vuex";
export default {
  name: "MySale",
  props: ["mySaleList", "pageSize"],
  computed: mapState({
    loadDown: "loadDown",
    mslist() {
      const start = this.mypageNum * this.pageSize - this.pageSize;
      const down = this.mypageNum * this.pageSize;
      if (start > 0) {
        const mylist = Object.fromEntries(
          Object.entries(this.mySaleList).slice(start, down)
        );
        return mylist;
      }
      return this.mySaleList;
    },
  }),
  data() {
    return {
      mypageNum: 1,
    };
  },
  methods: {
    handleCurPageChange(page) {
      this.mypageNum = page;
    },
    openNFT: function (nft) {
      this.$store.commit("setCurrentPbtId", nft.id);
    },
  },
};
</script>
<style scoped>
.marketlist {
  float: left;
  position: relative;
}

.marketlist .el-button {
  height: 108px;
  width: 136px;
  box-sizing: border-box;
  margin: 10px;
  background-color: #272a34;
  border: hidden;
}
i {
  padding-right: 10px;
  color: #38f2af;
}

.marketlist img {
  width: 80px;
  margin: 0;
}
</style>