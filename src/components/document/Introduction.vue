<template>
  <el-col>
    <h1>{{$t('intoduction')}}</h1>
    <el-col>
      <p v-html="$t('intoduction1')"></p>
      <p>
        <li v-for="winfo in winfos" :key='winfo.symbol'>
            {{ winfo.name }} ({{winfo.symbol}}) <a v-if="winfo.url" :href="winfo.url"  target='_blank'>{{winfo.bsymbol}}</a>
        </li>
      </p>
    </el-col>
    <h2>FAQ：</h2>
    <el-col>
      <h3 v-html="$t('intoduction2')"></h3>
      <p v-html="$t('intoduction3')"></p>
      <h3 v-html="$t('intoduction4')"></h3>
      <p v-html="$t('intoduction5')"></p>
      <h3 v-html="$t('intoduction6')"></h3>
      <p v-html="$t('intoduction7')"></p>
      <h3 v-html="$t('intoduction8')"></h3>
      <p v-html="$t('intoduction9')"></p>
      <h3 v-html="$t('intoduction10')"></h3>
      <p v-html="$t('intoduction11')"></p>
      <h3 v-html="$t('intoduction12')"></h3>
      <p v-html="$t('intoduction13')"></p>
    </el-col>
  </el-col>
</template>

<script>
import pbw from 'pbwallet';

export default {
  name: "Introduction",
  data() {
    const symbols = pbw.wcoin_list('symbol')
    const winfos = {}
    for(let i in symbols){
        const s = symbols[i]
        winfos[s] = pbw.wcoin_info(s, 'symbol')
        //TODO: URL should be different for "testnet" and "mainnet"
       if('address' in winfos[s]){
          winfos[s].url = 'https://bscscan.com/token/'+winfos[s].address
        }
        
      }
    return {
        winfos: winfos
    }
  },

};

</script>
<style scoped>
.el-col {
  padding: 30px;
}
</style>
