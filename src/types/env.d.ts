/// <reference types="vite/client" />

export { };



declare module 'vue-router' {
  interface RouteMeta {
    index: number
    name: string
    icon: string
    site: site
    id: string
    [x: string]: any
  }
}

declare global { 
  interface Window {
    Flv:import('lemon-mse').Flv

  }
  
  /** 响应 */
  type Data<T = any> = {
    code: number; // 200 | 400
    msg: string;
    data: T;
  };
  /** 分页 */
  type Page<T = any> = {
    total?: number;
    pageSize?: number;
    hasMore: boolean;
    list: T[];
  };
  /** query参数 */
  type QueryParams = {
    method?: string;
    id?: string; // roomid cid
    pid?: string; // bilibli获取分类下房间必须
    kw?: string; // 搜索关键字
    page?: number; // 第几页
    getStream?: boolean; //  getRoomDetail 专用 是否获取直播流信息 默认为true
    /**
     * @斗鱼 rate 1流畅；2高清；3超清；4蓝光4M；0原画
     * @虎牙 bitRate 500 2000 4000
     * @哔哩 qn 10000原画 150高清 250超清 400蓝光
     */
    rate?: number;
    cdn?: string; // 斗鱼 ws-h5(scdncmccjisszidc) hs-h5 tct-h5 tctc-h5 虎牙 AL TX HW HY
    streamOther?: any; // 获取直链可复用参数
  };
  /** 站点实例 */
  type LiveSite = Expand<{
    /** 获取网站的分类 */
    getCategories: () => Promise<LiveCategory[]>;
    /** 获取分类下房间 */
    getCategoryRooms: (query: QueryParams) => Promise<Page<LiveRoomItem>>;
    /** 获取推荐的房间 */
    getRecommendRooms: (query: QueryParams) => Promise<Page<LiveRoomItem>>;
    /** 获取房间详情 */
    getRoomDetail: (query: QueryParams) => Promise<LiveRoomDetail>;
    /** 获取房间直播流信息 */
    getRoomStream: (
      query: QueryParams,
      stream?: any,
    ) => Promise<LiveStream>;
    /** 获取直链 */
    getPlayUrl: (query: QueryParams) => Promise<string>;
    /** 查询直播状态 */
    getLiveStatus: (query: QueryParams) => Promise<LiveStatus[]>;
    /** 搜索直播间 */
    searchRooms: (query: QueryParams) => Promise<Page<LiveRoomItem>>;
    /** 搜索直播间 */
    searchAnchors: (query: QueryParams) => Promise<Page<any>>;
  }>;

  type LiveSiteMethod = keyof LiveSite;

  /** 直播状态 */
  type LiveStatus = {
    id: string;
    status: boolean;
    msg: string;
  };

  /** 展开一层 */
  type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

  /** 展开多层 */
  type ExpandAll<T> = T extends object
    ? T extends infer O ? { [K in keyof O]: ExpandAll<O[K]> } : never
    : T;
  /** 网站主分类 */
  type LiveCategory = {
    id: string;
    name: string;
    list: LiveSubCategory[];
  };
  /** 网站二级分类 */
  type LiveSubCategory = {
    cid: string;
    pid: string;
    name: string;
    pic: string;
  };
  /** 房间信息 */
  type LiveRoomItem = {
    siteId: siteId
    sitename: string
    status: boolean;
    cid?: string;
    category: string;
    online: number;
    roomId: string;
    title: string;
    nickname: string;
    avatar: string;
    cover: string;
    isRecord?: boolean;
    introduction: string;
    notice?: string;
    url?: string;
    ws?:string
    stream: LiveStream;
  };
  /** 主播信息 */
  type LiveAnchorItem = Expand<
    Pick<LiveRoomItem, "roomId" | "avatar" | "nickname" | "status">
  >;

  /** 直播流信息 */
  type LiveStream = ({ type: 'hls' | 'flv', list: StreamList[] })[]

  /** 直播线路 */
  type LiveLine = {
    name: string;
    cdn?: string;
    url: string;
  };

  // type Quality = "原画" | "蓝光" | "超清" | "高清" | "流畅";
  // type StreamList = Record<string, LiveLine[]>;
  type StreamList = {
    name: string
    lines: LiveLine[]
  }

  /** 直播清晰度 */
  type LiveRate = {
    name: string;
    rate?: number;
    bitRate?: number;
    qn?: string;
  };
}
