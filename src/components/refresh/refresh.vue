<script setup lang="ts">
import type { status } from './refresh'
 
const deltaY = ref(0)
const root = ref<HTMLElement>() as Ref<HTMLElement>
const [status, setStatus] = useState<status>('normal')

const emit = defineEmits<{ refresh: [ok: () => void] }>()

const {events,setEvent} = useMouseTouch(root) 

const onStart = (e:Event) => { 
  e.preventDefault()  
  if(status.value!=='normal') return 
  // if (events.start.clientY - root.value.getBoundingClientRect().top > 80) return 
  setStatus('pulling')
  deltaY.value = 0 
}

const onMove = () => {  
  if(status.value!=='pulling') return
  const y =  events.move.clientY - events.start.clientY
  deltaY.value  = y
  if (y < 0) return 
  deltaY.value = y > 40 ? 40 : y 
}
const onEnd = () => {  
  if(status.value!='pulling' ) return  
  if (deltaY.value < 10) return ok()
  // deltaY.value = 40
  status.value = 'refreshing'
  emit('refresh',ok)
}

const ok = ()=>{
  setStatus('normal'); deltaY.value = 0 
}

setEvent('start',onStart)
setEvent('move',onMove)
setEvent('end',onEnd)

const refreshStyle = computed(() => {
  if (deltaY.value <= 1) return { display: 'none' }
  return { top: `${deltaY.value}px`, transform: `rotate(${(deltaY.value / 40).toFixed(2)}turn)` }
})

// const style = computed(()=>{ 
//   return { height:deltaY.value+'px',transition:deltaY.value==40 || deltaY.value==0 ?'height .3s':''  }
// })

</script>

<template>
  <div ref="root" select-none @mouseleave="onEnd" pos-relative>
    <div pos-absolute class="left-50% ring1" :style="refreshStyle" z-1 p-1 rounded-6 text-amber bg-white>
      <div text-center :class="{ 'animate-spin': status == 'refreshing' }" w-6 h-6 class="i-ri-refresh-line">
      </div>
    </div>
    <!-- <div text-center box-border  transition-all flex justify-center items-center bg-gray bg-op-20 :style="style"> 
      <div v-show="deltaY>20" :class="{ 'animate-spin': status == 'refreshing' }" w-5 h-5 class="i-ri-refresh-line"></div>
    </div> -->
    <slot></slot>
  </div>
</template>
