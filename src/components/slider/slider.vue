<script setup lang="ts">

const props = withDefaults(defineProps<{
  max?: number,
  min?: number,
  width?: number,
  height?: number
}>(), {
  max: 100,
  min: 0,
  height: 100,
  width: 30
})
const value = defineModel<number>('value', { required: true })

const root = ref() as Ref<HTMLDivElement>
const verticle = props.width < props.height

let rect: DOMRect
const start = (e: MouseEvent) => {
  e.stopPropagation()
  move(e)
  document.addEventListener('mousemove', move, true)
  document.addEventListener('mouseup', end, true)
}

// const precent = ref((value.value - props.min) / (props.max - props.min) * 100)
const precent = computed(()=>(value.value - props.min) / (props.max - props.min) * 100)

const style = computed(() => {
  const v = 100 - precent.value
  const top = `top:${v}%`
  const left = `left:${v}%`
  return verticle ? (
    {
      loaded: top,
      indicator: top
    }
  ) : (
    {
      loaded: `${left};transform:translateX(-100%)`,
      indicator: left
    }
  )
}) 

const move = (e: MouseEvent) => {
  e.stopPropagation()
  e = getMouseTouchEvent(e)
  const delta = Math.min(verticle ? rect.height : rect.width, Math.max(0, verticle ? e.clientY - rect.y : e.clientX - rect.x))
  const cent = 100 - (delta / (verticle ? rect.height : rect.width) * 100 | 0)
  // precent.value = cent 
  value.value = ((props.max - props.min) * cent | 0) / 100 + props.min | 0
 
}

const end = (e: MouseEvent) => {
  e.stopPropagation()
  document.removeEventListener('mousemove', move, true)
  document.removeEventListener('mouseup', end, true)
}

onMounted(() => {
  rect = root.value.getBoundingClientRect()
  root.value.addEventListener('mousedown', start, true)
})
onBeforeUnmount(() => {
  root.value.removeEventListener('mousedown', start, true)
})


</script>

<template>
  <div cursor-pointer :style="{ width: `${props.width}px`, height: `${props.height}px` }" :class="verticle ? ' py-4 ' : 'px-4'"
    flex justify-center>
    <div w-full h-full pos-relative flex justify-center items-center ref="root" @click="move">
      <div bg-gray pos-relative overflow-hidden :class="verticle ? 'h-full w-2px' : 'w-full h-2px'">
        <div w-full bg-amber h-full pos-absolute :style="style.loaded"></div>
      </div>
      <div pos-absolute w-12px h-12px bg-amber rounded-2 :style="style.indicator" :class="verticle ? '-mt-6px' : '-ml-6px'">
      </div>

    </div>
  </div>
</template>
