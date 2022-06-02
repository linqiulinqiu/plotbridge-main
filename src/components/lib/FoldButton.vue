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
      btnIcon: "el-icon-caret-left",
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
      if (this.btnIcon == "el-icon-caret-left") {
        this.btnIcon = "el-icon-caret-right";
        this.astyle.width = this.openWidth;
        this.astyle.isFold = false;
        this.$emit("fold", this.astyle);
      } else if (this.btnIcon == "el-icon-caret-right") {
        this.btnIcon = "el-icon-caret-left";
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
  opacity: 0.8;
  position: absolute;
  top: 0px;
}
</style>