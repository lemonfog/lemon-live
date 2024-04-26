import { InjectionKey, Ref } from "vue"

 

export type SwipeProps = {
  autoplay?: number
  initVal?: number
  loop?: boolean
  vertical?: boolean
  lazy?: boolean
  duration?:number
  scrollable?:boolean
}


export const SWIPE_KEY = Symbol('swipe') as InjectionKey<{ props: SwipeProps, active: Ref<number>}>

