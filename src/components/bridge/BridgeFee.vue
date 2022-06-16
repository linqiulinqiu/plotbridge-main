<template>
  <el-col id="fee">
    <el-popover placement="right" trigger="click" title="fees">
      <p>
        {{ $t("dep-limit") }} : {{ this.depAmount }}<br />
        {{ $t("w-limit") }}：{{ this.wAmount }}<br />
        {{ $t("beyond-limit") }}<br />
        {{ $t("dep-rate") }}: {{ this.dFeeRate / 100 }}%，{{
          $t("dep-minFee")
        }}：{{ this.dFee }}{{ this.coinInfo.symbol }}
        <br />
        {{ $t("w-rate") }}：{{ this.wFeeRate / 100 }}%，{{ $t("w-minFee") }}：{{
          this.wFee
        }}{{ this.coinInfo.symbol }}
        <br />
        <!-- rebindFee:{{ this.reBindfee.amount }} {{ this.reBindfee.symbol }} -->
      </p>
      <el-button
        circle
        type="primary"
        slot="reference"
        class="el-icon-info btn-fee"
        @click="getAmountLimit"
      ></el-button>
    </el-popover>
  </el-col>
</template>
<script>
import { mapState } from "vuex";
import market from "../../market";
export default {
  props: ["coinInfo"],
  computed: mapState({
    baddr: "baddr",
  }),
  data() {
    return {
      depAmount: 0,
      wAmount: 0,
      wFeeRate: 0,
      wFee: 0,
      dFee: 0,
      dFeeRate: 0,
      reBindfee: 0,
    };
  },
  methods: {
    getAmountLimit: async function () {
      const coin = this.coinInfo.ctrname;
      const amount = await market.getLimit(coin);
      this.depAmount = (amount[1] - amount[0]) / 2;
      this.wAmount = amount[0];
      const fees = await market.getfees(coin);
      this.wFeeRate = fees.withdrawFeeRate;
      this.wFee = fees.withdrawFee;
      this.dFee = fees.depositFee;
      this.dFeeRate = fees.depositFeeRate;
      this.reBindfee = await market.reBindFee();
    },
  },
};
</script>