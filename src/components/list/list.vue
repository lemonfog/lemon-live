<script setup lang="ts">
import { hasScrollY } from '../../hooks/useUtil';
import type { status } from './type'
const props = withDefaults(defineProps<{
  finshedText?: string
  errorText?: string
  immediate?: boolean
  offset?: number
  // refresh?: boolean
}>(), {
  immediate: true,
  offset: 50,
  refresh: false,
  finshedText: '没有更多了',
  errorText: '加载失败，点击重新加载'
})

const scrollTop = ref(0)

const [status,setStatus] = useState<status>('normal')

const root = ref() as Ref<HTMLElement>
const parentScroll = useScrollParent(root) as Ref<HTMLElement>

const emit = defineEmits<{ load: [setStatus: typeof setStatus], refresh: [ok: () => void] }>()

const scroll = () => {
  scrollTop.value = parentScroll.value.scrollTop;
  if (status.value != 'normal') return
  const isEdge = parentScroll.value.scrollHeight - parentScroll.value.clientHeight - parentScroll.value.scrollTop < props.offset
  if (isEdge) reLoad()
}

onMounted(() => {
  if (props.immediate) reLoad()
  parentScroll.value!.addEventListener('scroll', scroll, { passive: true })
})

onActivated(() => {
  parentScroll.value!.scrollTop = scrollTop.value
  parentScroll.value.addEventListener('scroll', scroll)
})
const removehook = () => {
  parentScroll.value.removeEventListener('scroll', scroll)
}
onDeactivated(removehook)
onBeforeUnmount(removehook)

const btnShow = computed(() => scrollTop.value > 50)
const btnCilck = () => parentScroll.value.scrollTop = 0
 
const reLoad = () => {
  setStatus('loading')
  emit('load', setStatus)
  setTimeout(()=>{ 
    if(hasScrollY(parentScroll.value)) return
    emit('load', setStatus)
  },2000)
  
}

// const onRefresh = (ok: () => void) => {
//   if (scrollTop.value == 0) emit('refresh', ok)
// }
</script>

<template>
  <div ref="root"  h-full select-none>
    <slot/>

    <!-- <Refresh v-if="props.refresh" @refresh="onRefresh">
      <component :is="$slots.default"></component>
    </Refresh>
    <component v-else :is="$slots.default"></component> -->

    <div v-show="status == 'loading'" text-center>加载中...</div>
    <div v-if="status == 'finshed'" text-center>{{ props.finshedText }}</div>
    <div v-if="status == 'loaderror'" text-center cursor-pointer @click="reLoad">{{ props.errorText }}</div>
    
    <div v-show="btnShow"  pos-sticky z-1 text-cyan w-6 h-6 p-2 @click="btnCilck"
      class="i-ri-arrow-up-circle-line  bottom-6  left-[calc(100%-4rem)]"></div>
  </div>
</template>