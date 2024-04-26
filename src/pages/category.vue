<script setup lang="ts"> 
import { sites } from '../store';

const active = ref(0) 
let msg = ref()
 
const inited = (index:number)=>{
  if(sites[index].categories.value.length) return 
  msg.value='加载中...'
  useSiteFetch(sites[index].id,'getCategories').then(data=>{
    msg.value=null
    sites[index].categories.value = data
  },err=>msg.value=err)
}

</script>

<template>
  <Tabs v-model:active="active">
    <Tab v-for="site in sites" :title="site.name" @inited="inited" :key="site.id"> 
        <div v-if="msg" text-center >
          {{ msg }}
        </div>
        <Tabs v-else  v-model:active="site.categoryActive.value">
          <Tab v-for="category in site.categories.value" :title="category.name" :key="category.id" >
            <div flex flex-wrap gap-4>
              <router-link :to="`/category/${site.id}/${subCategory.cid}`" v-for="subCategory in category.list" w-14 cursor-pointer>
                <img v-lazy="subCategory.pic"  w-14 h-14 rounded>
                <div text-xs text-center>{{ subCategory.name }}</div>
              </router-link>
            </div>
          </Tab>
        </Tabs>
 
    </Tab>
  </Tabs>

</template>
