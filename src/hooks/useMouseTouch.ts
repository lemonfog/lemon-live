function _isMobile() {
  try {
    document.createEvent("TouchEvent"); return true;
  } catch(e) {
    return false; 
  }
} 
export const isMobile = _isMobile()
// export const isMobile = 'ontouchstart' in document.documentElement
export const mouseEvents = (isMobile ? { start: 'touchstart', move: 'touchmove', end: 'touchend' } : { start: 'mousedown', move: 'mousemove', end: 'mouseup' }) as unknown as Record<string,'mouseup'>

type type = keyof typeof mouseEvents 
export const useMouseTouch = (target: Ref<HTMLElement | undefined>) => {
 
  const types = ['start', 'move', 'end'] as type[]
  const listeners = {} as Record<type, EventListener>
  const events = {} as Record<type, Touch | MouseEvent>

  const addHook = () => types.forEach(type => target.value?.addEventListener(mouseEvents[type], listeners[type]))

  const removeHook = () => types.forEach(type => target.value?.removeEventListener(mouseEvents[type], listeners[type]))
  onMounted(addHook)
  onActivated(addHook)
  onDeactivated(removeHook)
  onUnmounted(removeHook)

  const setEvent = (type: type, listener: (e:Event)=>void) =>
    listeners[type] = (ev: Event) => {
      const e = getMouseTouchEvent(ev)
      // if (e == undefined) console.log(type, ev)
      events[type] = e
      listener(ev)
    }

  return { events, setEvent }
}

export const getMouseTouchEvent = (e: any) => {
  return isMobile ? (e.touches == undefined ? e : e.touches[0] || e.changedTouches[0]) : e
}
