import { InjectionKey } from "vue"

 
/**
 * @lazy boolean 内容懒加载 
 * @grow boolean 标签grow
 * @swipeable boolean 内容滑动切换
 * @swipeloop boolean 只在swipe为true时有效 内容循环滑动
 */
export type tabsProps =  { 
  lazy?: boolean,
  grow?:boolean,
  swipeable?:boolean,
  swipeloop?:boolean, 
  justify?:'justify-start'|'justify-center'| 'justify-end'| 'justify-evenly'|'justify-around'
}

export const TABS_KEY = Symbol('tabs') as InjectionKey<{ props:tabsProps, active: Ref<number> }>
