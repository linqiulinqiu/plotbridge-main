<template>
  <el-col :span="20" :offset="2">
    <el-col v-if="time_msg">
      <h1>{{ $t("stake-pool") }}</h1>
      <h3>{{ $t("stake-for") }}</h3>
      <p class="time-msg">{{ $t("stake-start") }}：{{ time_msg }}</p>
      <StakeCollapse :bsc="bsc" />
    </el-col>
    <p v-else>{{ $t("data") }}</p>
  </el-col>
</template>
<script>
import StakeCollapse from "./stake/StakeCollapse.vue";
import { mapState } from "vuex";
import times from "../times";
export default {
  name: "StakeMain",
  components: {
    StakeCollapse,
  },
  computed: mapState({
    bsc: "bsc",
  }),
  mounted() {
    this.startTime();
  },
  beforeUpdate() {
    this.startTime();
  },
  data() {
    return {
      time_msg: "",
    };
  },
  methods: {
    startTime: async function () {
      const time_start = await this.bsc.ctrs.pbp.stakeStart();
      this.time_msg = times.formatRelTS(time_start);
    },
  },
};
</script>
<style>
.time-msg {
  font-size: 15px;
}
</style>
