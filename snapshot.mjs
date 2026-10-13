import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createNewsService} from './news-service.mjs';
import {createHotService} from './hot-service.mjs';
import {createArticleService} from './article-service.mjs';
const read=async path=>{try{return JSON.parse(await readFile(path,'utf8'));}catch{return null;}};
const write=async(path,data)=>writeFile(path,JSON.stringify(data));
await mkdir('dist/data/articles',{recursive:true});
await mkdir('.snapshot',{recursive:true});
const service=createNewsService();
const data=await service.get();
if(!data.total)throw new Error('所有新闻源不可用，取消发布以保留上一版本。');
const previous=await read('.snapshot/news.json');
// Retain previous items for failed feeds, with their original acquisition timestamps.
for(const source of data.sources.filter(s=>s.status!=='ok')){
  const old=previous?.sources.find(s=>s.id===source.id);
  const items=previous?.articles.filter(a=>a.sourceId===source.id)||[];
  if(items.length){data.articles.push(...items);source.status='stale';source.count=items.length;source.updatedAt=old?.updatedAt||null;}
}
data.total=data.articles.length;
data.snapshotAt=new Date().toISOString();
data.mode='snapshot';
const hot=await createHotService({get:async()=>data}).get();
const detail=createArticleService();
const oldBodies=await read('.snapshot/bodies.json')||{};
const bodies={};
const items=[...new Map([...data.articles,...hot.platforms.flatMap(p=>p.items)].map(a=>[a.id,a])).values()];
let cursor=0;
await Promise.all(Array.from({length:6},async()=>{
  while(cursor<items.length){
    const a=items[cursor++];
    const old=oldBodies[a.id];
    let result=old?.bodyStatus==='ok'&&Date.now()-old.fetchedAt<86400000?{...a,body:old.body,bodyImages:old.bodyImages,bodyStatus:old.bodyStatus,bodyMessage:old.bodyMessage}:await detail.get(a);
    if(result.bodyStatus!=='ok'&&old?.bodyStatus==='ok')result={...result,body:old.body,bodyImages:old.bodyImages,bodyStatus:'ok',bodyMessage:'本次正文获取失败，展示上次保存的正文。'};
    bodies[a.id]={...result,fetchedAt:result.body===old?.body?old.fetchedAt:Date.now()};
    await write('dist/data/articles/'+a.id+'.json',result);
  }
}));
await write('dist/data/news.json',data);
await write('dist/data/hot.json',hot);
await write('.snapshot/news.json',data);
await write('.snapshot/bodies.json',bodies);
console.log(JSON.stringify({articles:data.total,parsed: Object.values(bodies).filter(a=>a.bodyStatus==='ok').length,snapshotAt:data.snapshotAt}));
