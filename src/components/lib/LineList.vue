<template>
  <p>
    <span>
      <p v-for="li in this.list" :key="li">
        <a v-if="typeof li == 'object'" :href="li.url" target="_blank">{{
          li.text
        }}</a>
        <span v-else>
          {{ li }}
        </span>
      </p>
    </span>
  </p>
</template>
<script>
export default {
  props: ["list"],
};
</script>