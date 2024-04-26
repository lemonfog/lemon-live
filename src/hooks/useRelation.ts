import type { ComponentInternalInstance, ComponentPublicInstance, InjectionKey } from "vue" 

export const useChildren = <ProvideValue, Child extends ComponentPublicInstance = ComponentPublicInstance<{}, any>>(key: InjectionKey<ProvideValue>,value?:ProvideValue) => {
  const children: Child[] = reactive([]) 
  const link = (child: ComponentInternalInstance) => {
    if (child.proxy) {
      children.push(child.proxy as Child)
    }
  }
  const unlink = (child: ComponentInternalInstance) => {
    const index = children.indexOf(child.proxy as Child)
    children.splice(index, 1)
  }

  provide(key, Object.assign({ link, unlink,children },value)) 
  return children
}

type ParentProvide<T> = T & {
  link(child: ComponentInternalInstance): void
  unlink(child: ComponentInternalInstance): void
  children:ComponentPublicInstance[]
}

export const useParent = <T>(key: InjectionKey<ParentProvide<T>>) => { 
  const parent = inject(key) 
  if (parent == undefined) return { parent,index:ref(-1) }
  const instance = getCurrentInstance()!
  const { link, unlink,children } = parent
  link(instance)
  onUnmounted(() => unlink(instance))
  const index =  computed(()=> children.indexOf(instance.proxy!))
  return {parent,children,index}

}