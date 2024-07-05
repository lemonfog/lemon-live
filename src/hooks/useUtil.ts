
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


export const hasScrollY = (el: HTMLElement) => {
  if (el.scrollTop > 0) return true
  el.scrollTop = 1
  const result = !!el.scrollTop
  el.scrollTop = 0
  return result
}

export const asyncPool = async (arr: any[], limit: number, iteratorFn: (item:any)=>any) => {
  const resultList = [];
  const executing: any[] = [];
  for (const item of arr) { 
    const p = Promise.resolve().then(() => { 
      return iteratorFn(item);
    });
    resultList.push(p);
    if (limit <= arr.length) {
      const e: any = p.then(() => {
        return executing.splice(executing.indexOf(e), 1);
      });
      executing.push(e);
      if (executing.length >= limit) { 
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(resultList);
};
