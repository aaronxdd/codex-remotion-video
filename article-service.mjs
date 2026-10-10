import {clean, safeUrl} from './news-service.mjs';
const hosts=new Set(['www.cls.cn','www.chinanews.com.cn','www.chinanews.com','www.ithome.com','news.un.org']);
export function parseBody(html, hostname) {
  let content='';
  if(hostname==='www.cls.cn'){
    const match=html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    const article=match && JSON.parse(match[1]).props?.pageProps?.articleDetail;
    if(!article || article.isFree!==true) throw new Error('来源未提供可公开读取的正文');
    content=article.content||'';
  } else {
    for(const match of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
      try {
        const visit=(v)=>{if(!v||typeof v!=='object')return;if(typeof v.articleBody==='string')content=v.articleBody;for(const x of Object.values(v))if(typeof x==='object')Array.isArray(x)?x.forEach(visit):visit(x);};
        visit(JSON.parse(match[1]));
      } catch {}
    }
  }
  const paragraphs=content.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<\/(?:p|div|h[1-6])>|<br\s*\/?\s*>/gi,'\n').split(/\n+/).map(clean).filter(Boolean);
  if(!paragraphs.length)throw new Error('暂未解析到公开正文');
  return paragraphs;
}
export function createArticleService(fetcher=fetch){
  const cache=new Map(),pending=new Map();
  return {async get(article){
    const hit=cache.get(article.url);if(hit&&Date.now()-hit.time<600000)return {...article,...hit.result};
    if(!pending.has(article.url))pending.set(article.url,(async()=>{
      let result;
      try {
        let url=new URL(article.url);let response;
        const signal=AbortSignal.timeout(12000);
        for(let i=0;i<4;i++){
          if(!hosts.has(url.hostname)||!['http:','https:'].includes(url.protocol)||url.port||url.username||url.password)throw new Error('该来源暂不支持站内正文解析');
          response=await fetcher(url.href,{redirect:'manual',signal,headers:{Accept:'text/html'}});
          if([301,302,303,307,308].includes(response.status)){url=new URL(response.headers.get('location'),url);continue;}
          break;
        }
        if(!response?.ok)throw new Error('来源限制访问或暂时不可用');
        const reader=response.body.getReader();const chunks=[];let size=0;
        while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>4*1024*1024){await reader.cancel();throw new Error('正文页面超过大小限制');}chunks.push(value);}
        const bytes=Buffer.concat(chunks);
        const charset=response.headers.get('content-type')?.match(/charset=([\w-]+)/i)?.[1]||'utf-8';
        const body=parseBody(new TextDecoder(charset).decode(bytes),url.hostname);
        const html=new TextDecoder(charset).decode(bytes);
        const images=[];
        if(url.hostname==='www.cls.cn'){
          const match=html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
          const detail=match&&JSON.parse(match[1]).props?.pageProps?.articleDetail;
          if(detail?.isFree===true){
            for(const src of detail.images||[])if(typeof src==='string')images.push(src);
            for(const match of (detail.content||'').matchAll(/<img[^>]*src=["']([^"']+)["']/gi))images.push(match[1]);
          }
        }
        result={body,bodyImages:[...new Set(images.map(src=>safeUrl(src,url.href)).filter(Boolean))].slice(0,12),bodyStatus:'ok',bodyMessage:'已解析来源公开正文，内容及图片版权归原作者所有。'};
      }catch(e){result={body:[],bodyStatus:'unavailable',bodyMessage:e.name==='TimeoutError'?'正文请求超时，请稍后重试。':e.message?.startsWith('来源')||e.message?.startsWith('暂未')||e.message?.startsWith('该来源')?e.message:'正文暂时无法解析，请查看来源原文。'};}
      cache.set(article.url,{time:Date.now(),result});if(cache.size>200)cache.delete(cache.keys().next().value);return result;
    })().finally(()=>pending.delete(article.url)));
    return {...article,...await pending.get(article.url)};
  }};
}
