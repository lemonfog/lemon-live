<script setup lang="ts">  
import { removeFollow} from '../../store'
defineProps<{
  list:Ref<LiveRoomItem[]>
}>()

 
</script>

<template>
  <div grid md:grid-cols-2 lg:grid-cols-3>
    <div v-for="i in list.value" :key="`${i.siteId}/${i.roomId}`" flex justify-between items-center px-4 py-2>
      <router-link :to="`/${i.siteId}/play/${i.roomId}`" flex items-center gap-2 md:gap-4>
        <img w-12 h-12 rounded-20 md:w-20 md:h-20 v-lazy="i.avatar" alt="">
        <div>{{ i.nickname }} </div>
        <div w-3 h-3 rounded-3 :class="[i.status ? 'bg-green' : 'bg-red']"></div>
        <div>{{ i.status ? '直播中' : '未开播' }}</div>
      </router-link>
      <div w-6 h-6 hover:text-amber class="i-mdi-heart-off-outline" @click="removeFollow(i.siteId,i.roomId)"></div>
    </div>
  </div>
</template>
