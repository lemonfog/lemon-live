<script setup lang="ts">

const props = defineProps<{
  max:number
  min:number
  step:number
}>()

const value = defineModel<number>('value',{required:true})

const increase = ()=> value.value =   Math.min(value.value+props.step,props.max)  
const decrease = ()=> value.value =   Math.max(value.value-props.step,props.min)  
</script>

<template>
  <div rounded-4 flex bg-gray-7 w-min p-2 py-1 gap-2>
    <div class="i-ri-subtract-fill" @click="decrease"> </div>
    <div>{{ value }}</div>
    <div class="i-ri-add-fill" @click="increase"></div>
  </div>
</template>
