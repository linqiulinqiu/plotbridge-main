<template>
  <el-col id="infoMy">
    <el-col id="destroy">
      <p>
        {{ $t("destroy") }} :
        <el-button @click="destroy" type="primary" :loading="burn_loading">{{
          $t("destroy")
        }}</el-button>
      </p>
    </el-col>
    <p>{{ $t("sell") }} :</p>
    <el-col>
      <p>
        1、{{ $t("send-tomk") }}
        <el-button @click="send" type="primary" :loading="send_loading">{{
          $t("send")
        }}</el-button>
      </p>
    </el-col>
    <el-col>
      <p>2、{{ $t("set-sell-info") }}</p>
      <el-col>
        <label for="price" class="labels">{{ $t("price") }}</label>
        <p>
          <el-input
            v-model="nftPrice"
            placeholder="input price"
            maxlength="20"
            show-word-limit
            id="price"
            class="price-input"
          ></el-input>
          <el-select v-model="ptName" class="selecToken">
            <el-option value="BNB" key="BNB" label="BNB"></el-option>
            <el-option key="USDT" label="USDT" value="USDT"></el-option>
          </el-select>
        </p>

        <label for="description" class="labels"> {{ $t("desc") }}</label>
        <el-input
          type="text"
          :placeholder="this.$t('input-desc')"
          v-model="nftDesc"
          maxlength="50"
          show-word-limit
          id="description"
          class="desc"
        />
        <p>
          <el-button
            type="primary"
            @click="sellNFT"
            :loading="set_loading"
            class="btn-infomy"
          >
            {{ $t("sell") }}
          </el-button>
        </p>
        <el-button class="btn-cancel" @click="clearPbtId">{{
          $t("cancel")
        }}</el-button>
      </el-col>
    </el-col>
    <el-dialog
      :visible.sync="destroy_dialog"
      width="40%"
      :title="$t('destroy')"
    >
      <p v-html="$t('destroy-tips')" class="font-color"></p>
      <span slot="footer" class="dialog-footer">
        <el-button @click="cancelBurn">{{ $t("cancel") }}</el-button>
        <el-button @click="burnPBT" type="primary" :loading="destroy_loading">{{
          $t("destroy")
        }}</el-button>
      </span>
    </el-dialog>
  </el-col>
</template>
<script>
import { mapState } from "vuex";
import market from "../../../market";
export default {
  name: "InfoMy",
  props: ["curNFT", "clearPbtId"],
  data() {
    return {
      nftPrice: "",
      nftDesc: "",
      ptName: "BNB",
      sendToMarket: true,
      send_loading: false,
      set_loading: false,
      burn_loading: false,
      destroy_loading: false,
      destroy_dialog: false,
    };
  },
  methods: {
    destroy: function () {
      this.destroy_dialog = true;
    },
    cancelBurn: function () {
      this.destroy_dialog = false;
    },
    burnPBT: async function () {
      this.destroy_loading = true;
      this.burn_loading = true;
      const id = this.curNFT.id;
      try {
        const res = await market.burnNFT(id);
        const obj = this;
        await market.waitEventDone(res, function (evt) {
          obj.destroy_loading = false;
          obj.destroy_dialog = false;
          obj.burn_loading = false;
          obj.$store.commit("setCurrentPbtId", false);
        });
      } catch (e) {
        console.log("burnPBT err", e);
        this.burn_loading = false;
        this.destroy_loading = false;
      }
    },
    send: async function () {
      this.send_loading = true;
      const id = this.curNFT.id;
      try {
        const tx = await market.sendToMarket(id);
        const obj = this;
        await market.waitEventDone(tx, async function (tx, evt) {
          obj.sendToMarket = false;
          obj.send_loading = false;
        });
      } catch (e) {
        this.sendToMarket = true;
        this.send_loading = false;
        console.log("sendToMarket errr", e.message);
        if (e.data.code == 3) {
          console.log("send err", e.data.message);
          this.$message(e.data.message);
        }
      }
    },
    sellNFT: async function () {
      this.set_loading = true;
      const id = this.curNFT.id;
      if (this.nftPrice === 0 || this.nftPrice == null) {
        this.$message(this.$t("price-tips"));
        this.set_loading = false;
        this.change_loading = false;
      }
      try {
        const res = await market.setSellInfo(
          id,
          this.ptName,
          this.nftPrice,
          this.nftDesc
        );
        const obj = this;
        await market.waitEventDone(res, async function (evt) {
          obj.set_loading = false;
          obj.sendToMarket = true;
          obj.$store.commit("setCurrentPbtId", false);
        });
        return res;
      } catch (e) {
        this.set_loading = false;
        console.log("setSellInfo errr", e.message);
      }
    },
  },
};
</script>
<style>
#destroy {
  height: 70px;
}
#infoMy {
  font-size: 18px;
}
p.font-color {
  color: #fff;
  font-size: 16px;
}
</style>