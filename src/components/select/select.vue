<script setup lang="ts"> 
 
const active = defineModel<number>('active', { required: true })

defineProps(['list'])
// const emit = defineEmits<{change:[index:number]}>()
const show = ref(false)
const click = (e: MouseEvent) => {
  const index = (e.target as HTMLElement).dataset.index 
  if (!index) return
  if (index != '-1') {
    active.value = parseInt(index)
    // emit('change',active.value)
  }
  show.value = !show.value
}
 

</script>

<template>
  <div inline-block pos-relative @click="click" cursor-pointer text-center>
    <div v-if="show" z-1 fixed top-0 bottom-0 left-0 right-0 bg-transparent data-index="-1"></div>
    <div px-2 py-1  data-index="-1"  hover:text-amber> {{ list[active] }}</div>
    <div  text-center v-show="show" z-1 pos-absolute top-0 class="left-50% " w-max style="transform:translate3d(-50%,-100%,0);">
      <div :data-index="index"  v-for="i, index in list" :class="{ 'text-amber': index == active }" px-2 py-1  hover:text-amber>
        {{ i }} 
      </div>
    </div>
  </div>
</template>
