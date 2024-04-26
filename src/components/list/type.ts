
export type status = 'normal'| 'loading' | 'finshed' | 'loaderror' |'refreshing'|  'pulling' 

export type loadStatus =  Exclude<status,'refreshing'|  'pulling' >

export type onLoad = (setStatus: (val: loadStatus) => void) => void

export type onRefresh = (reset: () => void) => void



