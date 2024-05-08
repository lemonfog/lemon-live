## API
> 格式：https://lemonlive.deno.dev/api/[site]/[method]/[id]?&kw=[kw]&page=[page]

### site
huya douyu douyin bilibili cc 

### method
| method                |  说明           |  例如                                                              |
| :-------------------: | :------------: | :----------------------------------------------------------------: |               
| **getCategories**     | 获取网站直播分类 | https://lemonlive.deno.dev/api/huya/getCategories                  |
| **getCategoryRooms**  | 获取分类下的房间 | https://lemonlive.deno.dev/api/huya/getCategoryRooms               |
| **getRecommendRooms** | 获取推荐房间    | https://lemonlive.deno.dev/api/huya/getRecommendRooms               |
| **getRoomDetail**     | 获取房间详情    | https://lemonlive.deno.dev/api/huya/getRoomDetail/11336726          |
| **getRoomStream**     | 获取房间直播流  | https://lemonlive.deno.dev/api/huya/getRoomStream/11336726          |
| **getLiveStatus**     | 获取直播状态    | https://lemonlive.deno.dev/api/huya/getLiveStatus/11336726,11352874 |
| **searchRooms**       | 搜索直播间     | https://lemonlive.deno.dev/api/huya/searchRooms?kw=王者&page=1       |
 
