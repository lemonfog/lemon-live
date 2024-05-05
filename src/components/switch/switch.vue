<script setup lang="ts">

const value = defineModel<boolean>('value',{required:true})


</script>

<template>
  <div pos-relative style="transition: background-color .3s;"
  @click="()=>value=!value"
   w-12 inline-block cursor-pointer rounded-6 h-6 
   :class="[value?'bg-amber':'bg-gray-4']"> 
    <div w-6 h-full rounded-6 bg-white style="transition: transform .3s ;"  :style="value?'transform:translateX(1.5rem)':''"></div>
  </div>
</template>
