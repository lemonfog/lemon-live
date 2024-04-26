export type status = 'normal'|'pulling'|'refreshing' 
 

export type onRefresh = (ok:()=>void)=>void