<template>
  <el-button
    :icon="btnIcon"
    id="btn-fold"
    size="mini"
    @click="foldAside"
  ></el-button>
</template>
<script>
export default {
  name: "foldButton",
  model: {
    prop: "astyle",
  },
  props: ["astyle", "openWidth"],
  data() {
    return {
      btnIcon: "el-icon-s-fold",
    };
  },
  mounted() {},

  methods: {
    foldAside: function () {
      //   const platform = window.navigator.userAgent;
      //   console.log("platform", platform, this.btnIcon);
      //   if (
      //     platform.match(/Mobi/i) ||
      //     platform.match(/Android/i) ||
      //     platform.match(/iPhone/i)
      //   ) {
      if (this.btnIcon == "el-icon-s-fold") {
        this.btnIcon = "el-icon-s-unfold";
        this.astyle.width = this.openWidth;
        this.astyle.isFold = false;
        this.$emit("fold", this.astyle);
      } else if (this.btnIcon == "el-icon-s-unfold") {
        this.btnIcon = "el-icon-s-fold";
        this.astyle.width = "30px";
        this.astyle.isFold = true;
        this.$emit("fold", this.astyle);
      }
      //   }
      console.log("icon", this.astyle);
    },
  },
};
</script>
<style>
#btn-fold.el-button {
  font-size: 20px;
  font-weight: 100;
  padding: 4px;
  color: #38f2af;
  background-color: #25272e;
  border: 1px solid #38f2af;
  position: absolute;
  top: 0px;
}
</style>