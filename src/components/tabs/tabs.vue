<script setup lang="ts">
import { TABS_KEY, type tabsProps } from './tabs'

const active = defineModel<number>('active', { default: 0 })

const props = withDefaults(defineProps<tabsProps>(), { lazy: true, swipeable: false, grow: false, swipeloop: true, justify: 'justify-center' })

const emit = defineEmits<{ tabClick: [index: number] }>()

const click = (index: number) => {
  active.value = index
  emit('tabClick', index)
}

const children = useChildren(TABS_KEY, { active, props })

const tabs = computed(() => map(children, i => i.title))


// const slots = defineSlots() 
</script>

<template>
  <div class="h-full" box-border>
    <div w-full box-border >
      <div flex p1 gap-1 items-center  h-8 box-border :class="[grow ? '' : justify,]" overflow-x-auto>
        <div v-for="tab, index in tabs" box-border shrink-0 rounded py-1 line-height-none text-center px-2 cursor-pointer hover:text-amber
          :class="{ 'text-amber': active == index, 'grow': grow }" @click="click(index)">{{ tab }}</div>
      </div>
    </div>
    <div class="h-[calc(100%-2rem)] scrolly" box-border pt-1>
      <!-- <Swipe v-if="swipeable" v-model:active="active" w-full h-full :lazy="lazy" :loop="swipeloop">
        <component :is="$slots.default"></component>
      </Swipe> -->
      <!-- <slot v-else/> -->
      <!--直接用slot v-for 子组件动态加载 可能会导致子组件重新挂载两次 -->
      <component :is="$slots.default"></component>
    </div>

  </div>
</template>