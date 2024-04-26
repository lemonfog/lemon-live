<script setup lang="ts">  
import { SWIPE_KEY } from './swipe'

const inited = ref(false)
const { parent, children, index } = useParent(SWIPE_KEY)

const slots = defineSlots()
const emit = defineEmits<{ inited: [index: number] }>()


const show = computed(() => {
  const isActive = parent?.active.value == index.value
  if (isActive) {
    if (!inited.value) {
      inited.value = true
      emit('inited', index.value)
    }
    return true
  }
  return (
    index.value == (parent!.active.value == 0 ? children!.length - 1 : parent!.active.value - 1) ||
    index.value == (parent!.active.value == children!.length - 1 ? 0 : parent!.active.value + 1)
  )
})

const comp = computed(() => show.value || inited.value || !parent?.props.lazy ? slots.default : null)
  
</script>

<template>
  <div v-show="show" w-full h-full shrink-0 pos-relative>
    <component :is="comp" />
  </div>
</template>
