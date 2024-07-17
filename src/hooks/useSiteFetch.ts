import { cookies } from "../store"

const baseUrl = 'https://lemonlive-24.deno.dev/api/'
const baseUrlSync = 'https://lemonlive.deno.dev/api/'
// const baseUrl = 'http://localhost:8000/api/'


export const useSiteFetch = (id: siteId, method: LiveSiteMethod, params: QueryParams = {}) => {
  params['token'] = (Date.now() / 1000 | 0).toString(16)
  if (id == 'douyin') params.cookie = cookies[id]
  return useFetch(`${baseUrl}${id}/${method}?${new URLSearchParams(params as any).toString()}`)
}



export const useCheckFollows = async (site: site) => {
  const ids = Object.keys(site.follows)
  if (!ids.length) return Promise.resolve(false)
  if (site.id == 'douyin') {
    const list = await asyncPool(ids,4,(id)=>useSiteFetch('douyin','getLiveStatus',{id}))
    list.forEach((data,i)=>site.follows[ids[i]].status = data[ids[i]].status )
    return
    // let i = 0
    // return new Promise((resolve) => {
    //   run()
    //   function run() {
    //     new Promise(() => {
    //       useSiteFetch('douyin', 'getLiveStatus', { id: ids[i] }).then(
    //         (data: any) => {
    //           console.log(i, ids[i], data)
    //           site.follows[ids[i]].status = data[ids[i]].status
    //           i++
    //           if (i < ids.length) run()
    //           else resolve('')
    //         }
    //       )
    //     }) 
    //   }
    // })
  }

  await useSiteFetch(site.id, 'getLiveStatus', { id: ids.join(',') }).then(data =>
    Object.keys(data).forEach(id => {
      site.follows[id].status = data[id].status
    })
  )
}


export const useSyncPush = (body: string) => useFetch(`${baseUrlSync}sync`, { method: 'POST', body })
export const useSyncPull = (key: string) => useFetch(`${baseUrlSync}sync/${key}`)

export const useFetch = (url: string, init?: RequestInit) => fetch(url, init).then(async res => {
  // if (!res.ok) return Promise.reject(res.statusText)
  const data = await res.json()
  if (data.code != 200) {
    return Promise.reject(data.msg)
  }
  return data.data
}, e => {
  console.log(e.message);
  Promise.reject('网络异常！')
})