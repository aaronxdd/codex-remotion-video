import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCls} from './news-service.mjs';
import {createHotService} from './hot-service.mjs';
test('财联社公开摘要解析与危险图片过滤',()=>{
 const html='<script id="__NEXT_DATA__">'+JSON.stringify({props:{pageProps:{hotArticleData:[{id:123,title:'测试财经',brief:'<b>摘要</b>',ctime:1700000000,img:'javascript:alert(1)',readNum:80}]}}})+'</script>';
 const [a]=parseCls(html);assert.equal(a.source,'财联社');assert.equal(a.summary,'摘要');assert.equal(a.image,'');assert.equal(a.url,'https://www.cls.cn/detail/123');
 assert.throws(()=>parseCls('<html/>'));
});
test('热点无密钥时不发认证请求，明确缺失状态并缓存',async()=>{
 let count=0;const service=createHotService({get:async()=>{count++;return {articles:[{id:'cls-1',sourceId:'cls',views:1}]};}},{},()=>{throw new Error('不应请求');});
 const d=await service.get();assert.equal(d.platforms.find(p=>p.id==='x').status,'setup');assert.equal(d.platforms.find(p=>p.id==='youtube').status,'setup');assert.equal(d.platforms.find(p=>p.id==='weibo').items.length,0);assert.equal(d.platforms[0].items.length,1);await service.get();assert.equal(count,1);
});
