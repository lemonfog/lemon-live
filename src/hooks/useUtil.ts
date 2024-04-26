
export const map = <T, _T>(arr: _T[], iteratee: (item: _T) => T) => {
  let index = -1
  const len = arr.length
  const result = new Array(len)
  while (++index < len) {
    result[index] = iteratee(arr[index])
  }
  return result
}

export const foreach = <T>(arr: T[], iteratee: (item: T) => void) => {
  let index = -1
  const len = arr.length
  while (++index < len) {
    iteratee(arr[index])
  }
}


// export const isHidden = (elRef: Ref<HTMLElement | undefined>| HTMLElement)=>{
//   const el = unref(elRef)
//   if(!el) return false
//   const style = getComputedStyle(el)
//   const hidden = style.display === 'none'
//   const parentHidden = el.offsetParent==null&& style.position!=='fixed'
//   return hidden||parentHidden
// }
