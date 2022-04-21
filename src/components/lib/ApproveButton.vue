<template>
  <el-col>
    <el-col v-if="checking">
      <p>Checking...</p>
    </el-col>
    <el-col v-else>
      <el-button
        v-if="needApprove"
        @click="approve"
        :loading="approving"
        type="primary"
      >
        {{ this.$t("approve") }}
      </el-button>
      <slot v-else></slot>
    </el-col>
  </el-col>
</template>
<script>
import { ethers } from "ethers";
import tokens from "../../tokens";

export default {
  name: "ApproveButton",
  props: ["bsc", "token", "spender", "minReq"],
  data() {
    return {
      checking: true,
      needApprove: true,
      approving: false,
    };
  },
  mounted: function () {
    this.checkAllowance();
  },
  watch: {
    token(newt, oldt) {
      this.checkAllowance();
    },
    minReq(newm, oldm) {
      this.checkAllowance();
    },
  },
  methods: {
    checkAllowance: async function () {
      if(this.token==ethers.constants.AddressZero){
          this.needApprove = false
          this.checking = false
      }else{
          this.checking = true;
          let minReq = this.minReq;
          if (isNaN(minReq)) minReq = 0;
          const allow = await tokens.allowance(this.token, this.spender);
          if (allow && allow.gte(this.minReq)) {
            this.needApprove = false;
          } else {
            this.needApprove = true;
          }
          this.checking = false;
      }
    },
    approve: async function () {
      try {
        this.approving = true;
        const done = await tokens.approve(this.token, this.spender);
        if (done) {
          await this.checkAllowance();
        }
      } catch (e) {
        console.log("maybe rejected?", e);
      }
      this.approving = false;
    },
  },
};
</script>
<style>
</style>
