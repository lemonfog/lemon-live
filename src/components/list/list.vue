<script setup lang="ts"> 
import type { status } from './type' 
const props = withDefaults(defineProps<{
  finshedText?: string
  errorText?: string
  immediate?: boolean
  offset?: number
}>(), {
  immediate: true,
  offset: 50,
  finshedText: '没有更多了',
  errorText: '加载失败，点击重新加载'
})

let startY = 0
const scrollTop = ref(0)
const deltaY = ref(0)

const status = ref<status>('normal')
const setSatatus = (value: status) => status.value = value

const root = ref() as Ref<HTMLElement>

const emit = defineEmits(['load', 'refresh'])
const isScroll = computed(() => root.value && root.value.scrollHeight > root.value.clientHeight)

const scroll = () => {
    scrollTop.value = root.value.scrollTop
    if (status.value != 'normal') return 
    const isEdge = root.value.scrollHeight - root.value.clientHeight - root.value.scrollTop < props.offset
    if (isEdge) emit('load', setSatatus)
  }

onMounted(() => {
  if (props.immediate) emit('load', setSatatus) 
  root.value.addEventListener(mouseEvents.start, onStart)
  root.value.addEventListener('scroll', scroll)
})

onActivated(() =>{
  root.value!.scrollTop = scrollTop.value  
  root.value.addEventListener(mouseEvents.start, onStart)
  root.value.addEventListener('scroll', scroll)

} )
const removehook  = ()=>{
  root.value.removeEventListener(mouseEvents.start, onStart)
  root.value.removeEventListener('scroll',scroll)
}
onDeactivated(removehook)
onBeforeUnmount(removehook)


const onStart = (e: Event) => {
  if (root.value.scrollTop != 0 || status.value != 'normal') return
  startY = (isMobile ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY)
  if (startY - root.value.getBoundingClientRect().top > 150) return
  e.preventDefault()

  deltaY.value = 0
  root.value?.addEventListener(mouseEvents.move, onMove)
  root.value?.addEventListener(mouseEvents.end, onEnd)

}
 

const onMove = (e: Event) => {
  const y = (isMobile ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY) - startY
  if (y < 0) return
  status.value = 'pulling'
  deltaY.value = y > 30 ? 30 : y
  e.preventDefault()
}

const reset = () => {
  setSatatus('normal')
  deltaY.value = 0
}

const onEnd = () => {
  root.value?.removeEventListener(mouseEvents.move, onMove)
  root.value?.removeEventListener(mouseEvents.end, onEnd)
  if (deltaY.value < 5) return reset()
  setSatatus('refreshing')
  emit('refresh', reset)
}
const refreshStyle = computed(() => {
  if (deltaY.value <= 0) return { display: 'none' }
  return { top: `${deltaY.value}px`, transform: `rotate(${(deltaY.value / 60).toFixed(2)}turn)` }
})

const bntShow = computed(() => scrollTop.value > 100)
const btnCilck = () => root.value.scrollTop = 0

const reLoad = () => emit('load', setSatatus)
defineExpose({
  isScroll
})
const slots = defineSlots()
</script>

<template>
  <div ref="root" pos-relative h-full class="scrolly">
    <div  pos-absolute class="left-50% ring1" :style="refreshStyle" z-1  p-1 rounded-6 text-amber bg-white >
      <div text-center :class="{ 'animate-spin': status == 'refreshing' }" w-6 h-6
        class="i-ri-refresh-line">
      </div>
    </div>
    <div v-show="bntShow" pos-sticky z-1 text-cyan w-6 h-6 p-2 @click="btnCilck"
      class="i-ri-arrow-up-circle-line top-[calc(100%-4rem)] left-[calc(100%-4rem)]"></div>
    <component :is="$slots.default"></component>

    <div v-show="status == 'loading'" text-center>加载中...</div>
    <div v-if="status == 'finshed'" text-center>{{ props.finshedText }}</div>
    <div v-if="status == 'loaderror'" text-center cursor-pointer @click="reLoad">{{ props.errorText }}</div>
  </div>
</template>