
export type status = 'normal' | 'loading' | 'finshed' | 'loaderror'

export type onLoad = (setStatus: (status: status) => void) => void

export type { onRefresh } from '../refresh/refresh'


