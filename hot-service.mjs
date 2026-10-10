import { createHash } from "node:crypto";
export function createHotService(news, env = process.env, fetcher = fetch) {
  let cached, pending, last = 0;
  const request = async (url, headers = {}) => {
    const response = await fetcher(url, {headers, signal: AbortSignal.timeout(12000)});
    if (!response.ok) throw new Error('来源暂时不可用');
    return response.json();
  };
  async function load() {
    const platforms = await Promise.all([
      ['cls','财联社热门', async () => ({items:(await news.get()).articles.filter(a=>a.sourceId==='cls').sort((a,b)=>b.views-a.views), note:'公开首页热门资讯，按来源阅读量排序；非电报实时流。'})],
      ['x','X', async () => {
        if (!env.X_BEARER_TOKEN) return {status:'setup', items:[], note:'需要在服务端配置 X_BEARER_TOKEN，并开通官方趋势接口权限。'};
        const data=await request('https://api.x.com/2/trends/by/woeid/1', {Authorization:`Bearer ${env.X_BEARER_TOKEN}`});
        if (!Array.isArray(data.data)) throw new Error();
        return {note:'X 全球趋势，不等于已核实新闻。',items:data.data.map((a,i)=>({id:`x-${createHash("sha256").update(a.trend_name).digest("hex").slice(0,18)}`,title:a.trend_name,summary:'平台热门话题，请结合权威新闻来源核实。',source:'X',url:`https://x.com/search?q=${encodeURIComponent(a.trend_name)}`}))};
      }],
      ['weibo','微博', async () => ({status:'unavailable', items:[], note:'微博当前拒绝匿名热搜访问，待接入授权数据服务。暂不展示榜单。'})],
      ['youtube','YouTube', async () => {
        if (!env.YOUTUBE_API_KEY) return {status:'setup',items:[],note:'需要在服务端配置 YOUTUBE_API_KEY。官方热门榜目前覆盖音乐、影视与游戏，不是综合新闻榜。'};
        const data=await request(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=US&maxResults=20&key=${encodeURIComponent(env.YOUTUBE_API_KEY)}`);
        if (!Array.isArray(data.items)) throw new Error();
        return {note:'美国地区热门视频：音乐、影视与游戏。',items:data.items.map(a=>({id:`yt-${a.id}`,title:a.snippet.title,summary:a.snippet.description.slice(0,180),source:'YouTube',url:`https://www.youtube.com/watch?v=${encodeURIComponent(a.id)}`,publishedAt:a.snippet.publishedAt}))};
      }],
    ].map(async ([id,name,run])=> {
      try { const result=await run(); return {id,name,status:result.items.length?'ok':'unavailable',updatedAt:new Date().toISOString(),...result}; }
      catch {return {id,name,status:'error',items:[],note:'接口请求失败，请检查网络、密钥及服务权限。',updatedAt:null};}
    }));
    cached={platforms}; last=Date.now(); return cached;
  }
  return {get() {if(cached && Date.now()-last<120000) return Promise.resolve(cached); if(!pending) pending=load().finally(()=>pending=null); return pending;}};
}
