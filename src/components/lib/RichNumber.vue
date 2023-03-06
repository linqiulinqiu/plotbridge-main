<template>
  <label>
    <span id="whole-part">{{ wholePart }}</span
    >.<span id="decimal-part">{{ decimalPart }}</span>
  </label>
</template>
<script>
export default {
  name: "RichNumber",
  props: ["data"],
  computed: {
    parts: function () {
      if (typeof this.data == "string") {
        return this.data.split(".");
      }
      return ["-", "-"];
    },
    wholePart: function () {
      return parseInt(this.parts[0]).toLocaleString();
    },
    decimalPart: function () {
      return this.parts[1];
    },
  },
};
</script>

<style>
#whole-part {
  font-family: "Courier New", Courier, monospace;
  font-weight: bolder;
}
#decimal-part {
  font-family: "Courier New", Courier, monospace;
  font-weight: lighter;
  opacity: 0.65;
}
</style>