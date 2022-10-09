<template>
  <div class="content">
    <el-container>
      <el-aside :width="asideStyle.width" id="menu-aside">
        <FoldButton
          v-model="asideStyle"
          :openWidth="'250px'"
          @fold="fold($event)"
          style="z-index: 99"
          class="f-btn"
        />
        <el-col v-if="!asideStyle.isFold">
          <el-menu
            id="doc-menu"
            :router="true"
            :default-active="this.menuIndex"
            text-color="#fff"
            background-color="#25272e"
            @select="handleSelect"
          >
            <el-menu-item
              v-for="item in this.menuLink"
              :index="item.link"
              :key="item.index"
            >
              <i class="el-icon-document"></i>
              <span slot="title">{{ item.value }}</span>
            </el-menu-item>
          </el-menu>
        </el-col>
      </el-aside>
      <el-main>
        <router-view></router-view>
      </el-main>
    </el-container>
  </div>
</template>

<script>
function menuItem() {
  const mode = location.hash.substr(1, location.hash.length - 1);
  return mode;
}
import FoldButton from "../components/lib/FoldButton.vue";

export default {
  name: "Doc",
  components: {
    FoldButton,
  },
  computed: {
    menuLink() {
      return [
        {
          index: "1",
          link: "/Doc/Introduction",
          value: this.$t("intruction"),
        },
        {
          index: "2",
          link: "/Doc/Activities",
          value: this.$t("activities"),
        },
        {
          index: "3",
          link: "/Doc/GuideforBridge",
          value: this.$t("guide-bridge"),
        },
        {
          index: "4",
          link: "/Doc/GuideforMarket",
          value: this.$t("guide-market"),
        },
        {
          index: "5",
          link: "/Doc/GuideforWallet",
          value: this.$t("guide-wallet"),
        },
        {
          index: "6",
          link: "/Doc/Contact",
          value: this.$t("contact"),
        },
      ];
    },
  },
  data() {
    return {
      asideStyle: { width: "250px", isFold: false },
      menuIndex: menuItem(),
    };
  },
  methods: {
    handleSelect: function (key, keyPath) {
      this.menuIndex = key;
    },
    fold: function ($event) {
      // console.log("fold function", $event);
    },
  },
};
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
.content {
  display: flex;
  color: #ffffff;
  font-size: 14px;
  position: relative;
}
.f-btn {
  left: 0px;
}
.el-main {
  width: 100vw;
}
#doc-menu {
  padding-top: 50px;
}
.el-menu .el-menu-item {
  padding-left: 60px !important;
}
</style>