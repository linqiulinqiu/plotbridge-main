<template>
  {{/*
  <el-row type="flex" justify="space-between" :gutter="20">
    <el-col
      :lg="{ span: 17 }"
      :md="{ span: 17 }"
      :sm="{ span: 18 }"
      :xs="{ span: 18 }"
    >
      <p v-if="locktime > 0">{{ $t("lock-time") }}：{{ locktime_str }}</p>
      <p>
        {{ $t("total-staked") }}：
        <span class="font">{{ hformat(lpamount) }}</span>
      </p>
      <p>
        APR：<span class="font">{{ apy }}%</span>
      </p>
      <p>
        {{ $t("staking") }}：
        <span class="font">{{ hformat(farm_amount) }}</span>
        <span class="font" v-if="!isNaN(farm_amount) && farm_amount != 0">
          ({{ hformat((farm_amount * 100) / lpamount) }}%)
        </span>
      </p>
      <span>
        {{ $t("earned") }}：
        <span class="font">{{ hformat(earned_amount) }}</span>
        &nbsp;&nbsp; PBP
      </span>
    </el-col>
    <el-col :span="6">
      <el-button
        class="stake-btn"
        v-if="can_withdraw"
        :loading="claim_loading"
        @click="claim"
        >{{ $t("claim") }}
      </el-button>

      <el-button @click="dia_set_amount = true" class="stake-btn">
        {{ $t("deposit") }}
      </el-button>
      <el-button
        v-if="can_withdraw"
        @click="dia_withdraw = true"
        class="stake-btn"
      >
        {{ $t("withdraw") }}
      </el-button>
      <LinkButton
        class="addlp stake-btn"
        v-if="this.isLp"
        :token="this.lptoken[0]"
        :btoken="this.lptoken[1]"
        :onlyLp="true"
      />
      <el-button v-else class="stake-btn">
        <router-link :to="this.toswap">{{ $t("buy") }}</router-link>
      </el-button>
    </el-col>
  </el-row>
  */}}
</template>