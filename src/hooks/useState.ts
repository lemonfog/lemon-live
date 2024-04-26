
export const useState = <T = any>(initVal?: T): [Ref<T>, (val: T) => void] => {
  const state = ref(initVal) as Ref<T>
  const setState = (val: T) => state.value = val
  return [state, setState]
}

export const useBoolean = (initVal?: boolean): [Ref<boolean>, (val: boolean) => void, () => void] => {
  const state = ref(initVal || false)
  const setState = (val: boolean) => state.value = val
  const toggle = () => state.value = !state.value
  return [state, setState, toggle]
}

export const useReactiveState = <T extends object>(initVal: T): [T, (key: keyof T, val: any) => void] => {
  const state = reactive(initVal) as T
  const setState = (key: keyof T, val: any) => state[key] = val
  return [state, setState]
}

