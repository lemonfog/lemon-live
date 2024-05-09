<script setup lang="ts"> 
import { sites } from '../store';

const route = useRoute()
const router = useRouter()

const active = ref((() => {
  if (!route.query.site) return 0
  const index = sites.findIndex(i => i.id == route.query.site)
  return index == -1 ? 0 : index
})())

const siteId = computed(() => sites[active.value].id)

watch(siteId,()=>  router.push(`/category/?site=${siteId.value}`))

onActivated(()=> router.replace(`/category/?site=${siteId.value}`) )

let msg = ref()
 
const inited = (index:number)=>{
  if(sites[index].categories.value.length) return 
  msg.value='加载中...'
  useSiteFetch(siteId.value,'getCategories').then(data=>{
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
        <Tabs v-else  v-model:active="site.categoryActive.value" >
          <Tab v-for="category in site.categories.value" :title="category.name" :key="category.id">
            <div pb-2 grid gap-4 px-2  justify-between style="grid-template-columns: repeat(auto-fill,3.5rem);">
              <router-link :to="`/category/${site.id}/${subCategory.cid}`" v-for="subCategory in category.list" cursor-pointer>
                <img v-lazy="subCategory.pic"  w-full aspect-ratio-square rounded>
                <div w-full text-truncate text-xs text-center>{{ subCategory.name }}</div>
              </router-link>
            </div>
          </Tab>
        </Tabs>
 
    </Tab>
  </Tabs>

</template>
