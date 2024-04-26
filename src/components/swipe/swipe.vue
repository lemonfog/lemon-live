<script setup lang="ts">  
import { SWIPE_KEY, type SwipeProps } from './swipe';

const props = withDefaults(defineProps<SwipeProps>(), {
  loop: true,
  lazy: true,
  vertical: false,
  duration: 500,
})

let el: HTMLElement
const root = ref() as Ref<HTMLElement>
const active = defineModel<number>('active', { default: 0 })

const children = useChildren(SWIPE_KEY, { props, active })

let maxIndex: number
let lastChild: HTMLElement
let firstChild: HTMLElement

let delta = 0
let startTime = 0
let swiping = false
let state: {
  len: number,
  client: 'clientX' | 'clientY'
  translate: 'translateX' | 'translateY'
}

onMounted(() => {
  state = props.vertical ? { translate: 'translateY', client: 'clientY', len: root.value!.clientHeight } : { translate: 'translateX', client: 'clientX', len: root.value!.clientWidth }
  el = root.value!.firstElementChild as HTMLElement
  // maxIndex = el.childElementCount - 1
  // lastChild = el.lastElementChild as HTMLElement
  // firstChild = el.firstElementChild as HTMLElement  
  firstChild = children[0].$el
  maxIndex = children.length - 1
  lastChild = children[maxIndex].$el 
  move()
})

const move = (newVal: number = active.value, oldVal?: number) => {
  /**
   *        3 0 1 2 3   0
   *        0 1 2 3     -1
   *      0 1 2 3       -2
   *    0 1 2 3 0 1 2   -3
   *    1 2 3 0         -4 first 4    
   *          0 1 2 3   0   
   */
  // console.log(swiping, swiping==( oldVal!=undefined),newVal,oldVal)
  el.style.transition = swiping ? `transform ${props.duration}ms` : ""
  swiping = false
  const { len, translate } = state

  if (!props.loop) {
    delta = len * newVal * -1
    el.style.transform = `${translate}(${delta}px)`
    return
  }

  if (oldVal == maxIndex && newVal == 0)
    return el.style.transform = `${translate}(${len * (maxIndex + 1) * -1}px)`

  else if (oldVal == 0 && newVal == maxIndex)
    return el.style.transform = `${translate}(${len}px)`

  delta = len * newVal * -1
  el.style.transform = `${translate}(${delta}px)`
  firstChild.style.transform = newVal == maxIndex ? `${translate}(${len * (maxIndex + 1)}px)` : ""
  lastChild.style.transform = newVal == 0 ? `${translate}(${len * (maxIndex + 1) * -1}px)` : ""
  reMove && setTimeout(() => { move(), reMove = true }, 0)
}
watch(active, move)
let reMove = true
const { events, setEvent } = useMouseTouch(root)
setEvent('start', () => {
  startTime = Date.now()
  reMove = false
  move()
  swiping = true 
})
setEvent('move', () => {
  if (!swiping) return
  let _delta = events.start[state.client] - events.move[state.client]
  if (!props.loop) _delta = Math.min(10, Math.abs(_delta)) * (_delta > 0 ? 1 : -1)
  el.style.transition = ""
  el.style.transform = `${state.translate}(${delta + _delta * -1}px)`
})
setEvent('end', () => { 
  if (!swiping) return
  const delta = events.end[state.client] - events.start[state.client]
  if (delta == 0) return swiping = false
  const _delta = Math.abs(delta)
  const shouldSwipe = _delta / (Date.now() - startTime) > 0.25 || _delta > state.len / 2
  if (!shouldSwipe) return move()
  delta > 0 ? prev() : next()
})

const setActive = (val: number) => active.value = props.loop ? (val > maxIndex ? 0 : val < 0 ? maxIndex : val) : Math.max(Math.min(val, maxIndex), 0)

const prev = () => setActive(--active.value)

const next = () => setActive(++active.value)

// const slots = defineSlots()
// console.log(slots.default())

</script>

<template>
  <div ref="root" pos-relative overflow-hidden>
    <div flex h-full w-full cursor-pointer select-none :class="{ 'flex-col': vertical }">
      <!-- <slot /> -->
      <component :is="$slots.default"></component>
    </div>
  </div>
</template> 
