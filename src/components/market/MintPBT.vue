<template>
  <el-row type="flex" justify="center">
    <el-col :sapn="10">
      <el-empty :description="this.$t('img')"></el-empty>
    </el-col>
    <el-col :span="12">
      <p>
        {{ $t("price") }}
        <span>{{ this.mintFee.price }}</span>
        <span>{{ this.mintFee.token }}</span>
      </p>
      <p>
        <span>{{ $t("mintable") }}{{ mintAbles }}</span>
      </p>
      <p>
        <ApproveButton
          :bsc="bsc"
          :token="mintFee.tokenAddr"
          :spender="bsc.ctrs.pbp.address"
          :minReq="balance"
        >
          <el-button
            @click="mintNFT"
            type="primary"
            v-if="this.mintAbles > 0"
            :loading="mint_loading"
            >{{ $t("mintPBT") }}</el-button
          >
          <span v-else>{{ $t("none") }}</span>
        </ApproveButton>
      </p>
    </el-col>
  </el-row>
</template>
<script>
import market from "../../market";
import ApproveButton from "../lib/ApproveButton.vue";
import { mapState } from "vuex";
import tokens from "../../tokens";
export default {
  name: "MintPBT",
  props: ["mintAbles", "mintFee"],
  components: {
    ApproveButton,
  },
  computed: mapState({
    bsc: "bsc",
  }),
  data() {
    return {
      mint_loading: false,
      balance: "",
    };
  },
  mounted() {
    this.getBalance();
  },
  methods: {
    getBalance: async function () {
      this.balance = await tokens.balance(this.mintFee.tokenAddr);
      // console.log(bl);
      // this.balance = await tokens.format(this.mintFee.tokenAddr, bl);
    },
    mintNFT: async function () {
      this.mint_loading = true;
      try {
        const obj = this;
        const res = await market.mintPBT();
        await market.waitEventDone(res, async function (evt) {
          obj.mint_loading = false;
        });
      } catch (e) {
        this.mint_loading = false;
        this.$message(e.data.message);
        console.log("mint err", e.message);
      }
    },
  },
};
</script>