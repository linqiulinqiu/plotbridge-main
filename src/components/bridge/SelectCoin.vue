<template>
  <el-col id="selectCoin">
    <p>{{ $t("select-coin") }}</p>
    <ul>
      <li
        v-for="item in this.coinMap"
        :key="item.symbol"
        @click="changeCoin(item)"
        class="coinTypes"
        :class="{ isselect: item.index == addclass }"
      >
        {{ item.name }}
      </li>
    </ul>
  </el-col>
</template>
<script>
import { mapState } from "vuex";
import market from "../../market";
export default {
  computed: mapState({
    current: "current",
    addclass: function (state) {
      if (state.current.coinType) return state.current.coinType;
    },
  }),
  mounted() {
    this.loadcoin();
  },
  data() {
    return {
      coinMap: {},
    };
  },
  methods: {
    changeCoin: function (item) {
      this.$store.commit("setCurrentCoinType", item.index);
    },
    loadcoin: function () {
      this.coinMap = market.loadCoinlist();
      console.log("this.coinMap", this.coinMap);
    },
  },
};
</script>
<style>
#selectCoin {
  padding: 20px 5px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}
#selectCoin > p {
  color: #fff;
}
.isselect {
  border: #38f2af 1px solid !important;
  color: #38f2af;
}
.coinTypes {
  width: 96%;
  height: 50px;
  text-align: center;
  line-height: 50px;
  border-radius: 5px;
  border: #668b66 1px solid;
  margin: 10px auto;
  cursor: pointer;
}
</style>