<script setup lang="ts"> 
import { TABS_KEY } from './tabs'
const props = defineProps<{
  title: string
  
}>()
 
const inited = ref(false)
const slots = defineSlots()
const { parent, index, children } = useParent(TABS_KEY)

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
  return parent?.props.swipeable &&
    // 上一个 下一个 
    (
      index.value == (parent.active.value == 0 ? children.length - 1 : parent.active.value - 1) ||
      index.value == (parent.active.value == children.length - 1 ? 0 : parent.active.value + 1)
    ) 
})

const comp = computed(() => show.value|| parent?.props.swipeable || inited.value || !parent?.props.lazy ? slots.default : null)

defineExpose({ title: props.title }) 
</script>

<template>
  <div v-show="show || parent?.props.swipeable" h-full w-full shrink-0 class="scrolly">
    <SwipeItem v-if="parent?.props.swipeable">
      <component :is="comp" />
    </SwipeItem>
    <component v-else :is="comp" />
  </div>
</template>
