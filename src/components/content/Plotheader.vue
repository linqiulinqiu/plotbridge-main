<template>
  <div class="container">
    <el-row type="flex" justify="space-between">
      <el-col id="logo" :lg="3" :md="4" :sm="6" :xs="0">
        <img
          style="width: 160px"
          src="../../assets/image/logo_000.png"
          alt="LOGO"
        />
      </el-col>
      <el-col id="version" :lg="4" :md="0" :sm="0" :xs="0">
        <p v-for="(version, pkg) in versions" :key="version">
          <span>{{ pkg }}-{{ version }}<br /></span>
        </p>
      </el-col>
      <el-col
        id="menu"
        :lg="{ span: 8, offset: 4 }"
        :md="{ span: 9, offset: 1 }"
        :sm="9"
        :xs="14"
      >
        <el-menu
          :router="true"
          :default-active="this.menuIndex"
          text-color="#fff"
          mode="horizontal"
          background-color="#25272e"
          @select="selectTag"
        >
          <el-menu-item
            v-for="item in this.nav"
            :key="item.link"
            :index="item.link"
            >{{ item.tag }}
          </el-menu-item>
        </el-menu>
      </el-col>
      <el-col id="connect" :lg="3" :md="5" :sm="4" :xs="5">
        <el-button
          v-if="!baddr"
          @click="connect_wallet"
          class="connect"
          :loading="connect_loading"
          >{{ $t("connect") }}</el-button
        >
        <span v-else style="color: #fff" class="baddr font">
          <el-tooltip effect="light" placement="bottom">
            <span slot="content" class="font">
              {{ $t("bsc") }}: {{ baddr }}
            </span>
            <el-button class="font">{{
              baddr.substr(0, 6) + "..." + baddr.substr(-4, 4)
            }}</el-button>
          </el-tooltip>
        </span>
      </el-col>
      <el-col id="changelang" :lg="3" :md="5" :sm="5" :xs="5">
        <el-select v-model="lang">
          <el-option
            v-for="item in langs"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          ></el-option>
        </el-select>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { mapState } from "vuex";
import market from "../../market";
import data from "../../data";
import { i18n, setup } from "../../locales";
import store from "../../store";

function versions() {
  const vs = {};
  vs.App = process.env.VUE_APP_MY_VERSION;
  const dep = JSON.parse(process.env.VUE_APP_DEP_VERSIONS);
  for (let n in dep) {
    const v = dep[n].split("/");
    if (v.length > 1) {
      const f = v[1].split("#");
      if (f.length > 1) {
        vs[f[0]] = f[1];
      }
    }
  }
  console.log("vs=", vs);
  return vs;
}
function tags(path) {
  const mode = path.substr(1, path.length - 1);
  let tag = "";
  if (mode.indexOf("/") != -1) {
    tag = "/" + mode.substr(0, mode.indexOf("/"));
  } else {
    tag = "/" + mode;
  }
  return tag;
}
export default {
  name: "Plotheader",
  computed: mapState({
    baddr: "baddr",
    myList: "myList",
    marketList: "marketList",
    nav() {
      return [
        { tag: this.$t("home"), link: "/Home" },
        { tag: this.$t("bridge"), link: "/Bridge" },
        { tag: this.$t("market"), link: "/Market" },
        { tag: this.$t("swap"), link: "/Swap" },
        { tag: this.$t("stake"), link: "/Stake" },
        { tag: this.$t("presale"), link: "/Presale" },
        { tag: this.$t("doc"), link: "/Doc" },
      ];
    },
    menuIndex() {
      const path = tags(this.$route.path);
      return path;
    },
  }),
  watch: {
    lang: function () {
      setup(this.lang);
    },
  },
  data() {
    return {
      connect_loading: false,
      langs: [
        { value: "en", label: "English" },
        { value: "zh", label: "简体中文" },
      ],
      lang: i18n.locale,
      versions: versions(),
    };
  },
  methods: {
    selectTag: function (key) {
      this.$store.commit("setCurrentPbtId", false);
    },

    connect_wallet: async function () {
      this.connect_loading = true;
      const commit = this.$store.commit;
      const bsc = await data.connect(commit);
      if(typeof(bsc)=='string'||!bsc){
        if(bsc){
            this.$message.error(`Connect failed: ${bsc}`)
        }else{
            const h = this.$createElement
            this.$msgbox({
                title: 'Connect failed',
                message: h('div',null,[
                h('h4',null,'A BSC wallet is required for further operation,'),
                h('p',null,'make sure you have MetaMask or other BSC wallet installed.'),
                h('p',null,'Or, MetaMask can be install via the official plugin store of your web-browser'),
                h('p',null,'(Chrome),(Firefox),(Brave)')
                ])
            })
        }
        this.connect_loading = false;
      }else{
        commit("setBaddr", bsc.addr);
        await data.loadAlllists_brief(store);
        await data.loadAlllists_detail(store);
        this.connect_loading = false;
      }
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
.el-col,
.el-option {
  color: #38f2af;
}

#menu,
#connect,
#logo,
#version,
#changelang {
  height: 90px;
  box-sizing: border-box;
  font-size: 16px;
}
#changelang {
  margin-top: 6px;
}
#changelang .el-select {
  width: 99%;
  margin: 0 auto;
  padding: 0px;
}
#connect .el-button {
  margin-top: 25px;
  background-color: #38f2af;
  color: #000000;
  width: 99%;
  height: 40px;
  text-align: center;
  font-size: 14px;
  cursor: pointer;
  padding: 0px;
  box-shadow: 0px 2px 2px 0px rgba(56, 242, 175, 0.08);
}
#connect .baddr {
  color: #38f2af;
  width: 99%;
  margin: 0 auto;
  font-size: 16px;
  display: inline-block;
  margin: 0 auto;
}
#logo {
  padding-top: 15px;
}
#version {
  line-height: 30px !important;
  text-align: center;
}
#version span {
  display: block;
  float: left;
  margin: 5px 20px 0px;
}
#menu .el-menu {
  width: 95%;
  margin: 0 auto;
  height: 90px;
  border: none !important;
}
#menu .el-menu--horizontal > .el-menu-item {
  height: 90px;
  width: 14.28%;
  font-size: 15px;
  font-weight: 700;
  padding: 15px 0px;
}
#menu .el-menu--horizontal > .el-menu-item.is-active {
  color: #38f2af !important;
  border-bottom: #38f2af 2px solid !important;
}
</style>
