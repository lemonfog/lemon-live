<script setup lang="ts"> 
import { sites, active } from '../store';  

const siteId = computed(() => sites[active.value].id)
 
const msg = ref()

const inited = (index: number) => {
  if (sites[index].categories.value.length) return
  msg.value = '加载中...'
  useSiteFetch(siteId.value, 'getCategories').then(data => {
    msg.value = null
    sites[index].categories.value = data
  }, err => msg.value = err)
}

</script>

<template>
  <Tabs v-model:active="active" @tab-click="() => $router.push(`/${siteId}/category`)" pt-1 >
    <Tab v-for="site in sites" :title="site.name" @inited="inited" :key="site.id">
      <div v-if="msg" text-center>
        {{ msg }}
      </div>
      <Tabs v-else v-model:active="site.categoryActive.value">
        <Tab v-for="category in site.categories.value" :title="category.name" :key="category.id">
          <!-- <div pb-2 grid gap-4 px-2 justify-between style="grid-template-columns: repeat(auto-fill,3.5rem);"> -->
          <div pb-2 grid gap-4 px-4 md:px-2 grid-cols-4 sm:grid-cols-6  md:grid-cols-8  lg:grid-cols-10 xl:grid-cols-15 lass="2xl:grid-cols-18">
            <router-link :to="`/${site.id}/category/${subCategory.cid}`" v-for="subCategory in category.list"
              cursor-pointer>
              <img v-lazy="subCategory.pic" w-full aspect-ratio-square rounded>
              <div w-full text-truncate text-xs md:text-sm text-center>{{ subCategory.name }}</div>
            </router-link>
          </div>
        </Tab>
      </Tabs>

    </Tab>
  </Tabs>

</template>
