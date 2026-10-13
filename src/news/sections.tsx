import {snapshotMode,pageLink,pagePath,newsUrl,hotUrl,articleUrl} from "./transport";
import React, {useEffect, useState} from "react";
type Item = {id:string;title:string;summary:string;source:string;url:string;publishedAt?:string|null;body?:string[];bodyMessage?:string;image?:string;bodyImages?:string[]};
function ArticleImage({src,source}:{src:string;source:string}){
  const [failed,setFailed]=useState(false);
  if(failed||!/^https?:\/\//.test(src))return null;
  return <figure className="reading-image"><img src={src} alt="新闻配图" loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/><figcaption>图片来源：{source}</figcaption></figure>;
}
const archiveKey="current-reading-cache";
function archive():Item[] {try {const value=JSON.parse(localStorage.getItem(archiveKey)||"[]"); return Array.isArray(value)?value:[];}catch{return [];}}
export function remember(items:Item[]) {try {localStorage.setItem(archiveKey,JSON.stringify([...new Map([...items,...archive()].map(a=>[a.id,a])).values()].slice(0,600)));}catch{/* Reading remains available from live feed. */}}
export function Detail({id,articles,loading}:{id:string;articles:Item[];loading:boolean}) {
  const [remote,setRemote]=useState<Item|null>(null),[pending,setPending]=useState(true);
  const a=remote||articles.find(a=>a.id===id)||archive().find(a=>a.id===id);
  useEffect(()=>{const controller=new AbortController();void fetch(articleUrl(id),{signal:controller.signal}).then(async r=>{if(r.ok){const item=await r.json();setRemote(item);remember([item]);}}).catch(()=>{}).finally(()=>setPending(false));return()=>controller.abort();},[id]);
  return <main className="reading-page"><a className="reading-back" href={pageLink("/")}>← 此刻 · 返回新闻</a>{a?<article>
    <div className="eyebrow">CURRENT / 站内阅读</div><h1>{a.title}</h1>
    <div className="reading-meta">{a.source} · {a.publishedAt?new Date(a.publishedAt).toLocaleString("zh-CN"):"来源未提供发布时间"}</div>
    {(a.image||a.bodyImages?.[0])&&<ArticleImage key={a.image||a.bodyImages?.[0]} src={(a.image||a.bodyImages?.[0])!} source={a.source}/>}
    <hr/><h2>{a.body?.length?"正文":"来源摘要"}</h2>
    {pending&&<p role="status">{snapshotMode ? "正在读取正文快照…" : "正在解析公开正文…"}</p>}
    {a.body?.length?<div className="article-body">{a.body.map((p,i)=><p className="reading-summary" key={i}>{p}</p>)}</div>:<p className="reading-summary">{a.summary||"来源未提供摘要。"}</p>}
    {a.bodyImages?.filter(src=>src!==(a.image||a.bodyImages?.[0])).map(src=><ArticleImage key={src} src={src} source={a.source}/>)}
    {!pending&&<div className="reading-note">{a.bodyMessage||"暂未获取到正文，可查看来源原文。"}</div>}
    {/^https?:\/\//.test(a.url)&&<a className="reading-original" href={a.url} target="_blank" rel="noopener noreferrer">查看来源原文 ↗</a>}
  </article>:<section><h1>{loading||pending?"正在加载新闻…":"这条新闻暂不可用"}</h1><p>来源可能已更新或当前连接失败。可返回首页重新选择新闻。</p></section>}</main>;
}
type Platform={id:string;name:string;status:string;note:string;updatedAt:string|null;items:Item[]};
export function HotPanel(){
  const [platforms,setPlatforms]=useState<Platform[]>([]),[active,setActive]=useState("cls"),[error,setError]=useState(""),[loading,setLoading]=useState(true);
  const load=async()=>{setLoading(true);try{const r=await fetch(hotUrl(),{signal:AbortSignal.timeout(25000)});if(!r.ok)throw new Error();const d=await r.json();setPlatforms(d.platforms);remember(d.platforms.flatMap((p:Platform)=>p.items));setError("");}catch{setError("热点暂时加载失败，请重试。");}finally{setLoading(false);}};
  useEffect(()=>{void load();const t=setInterval(()=>{if(document.visibilityState==="visible")void load();},120000);return()=>clearInterval(t);},[]);
  const current=platforms.find(p=>p.id===active);
  return <main className="reading-page hot-page"><a className="reading-back" href={pageLink("/")}>← 此刻 · 返回新闻</a><div className="eyebrow">WHAT'S TRENDING</div><h1>世界正在讨论。</h1><p>按平台查看热点。不同来源榜单独立呈现，不混合排名。</p>
    <div className="finance-tabs">{[["cls","财联社热门"],["x","X"],["weibo","微博"],["youtube","YouTube"]].map(([id,label])=><button key={id} className={id===active?"selected":""} onClick={()=>setActive(id)}>{label}</button>)}</div>
    <div className="hot-status"><span>{loading?"正在同步…":current?.status==="ok"?"已连接":current?.status==="setup"?"待配置密钥":"暂不可用"}</span><button onClick={()=>void load()} disabled={loading}>↻ 刷新</button></div>
    {error&&<p role="alert">{error}</p>}<p className="reading-note">{current?.note}</p>
    {current?.status==="ok"&&<small>获取时间：{current.updatedAt?new Date(current.updatedAt).toLocaleString("zh-CN"):"未知"}</small>}
    <div className="hot-list">{current?.items.map((a,i)=><a key={a.id} href={pageLink(`/news/${a.id}`)}><span>{String(i+1).padStart(2,"0")}</span><div><h2>{a.title}</h2><small>{a.source} · 站内查看 →</small></div></a>)}</div>
    {!loading&&!current?.items.length&&<div className="empty">此来源暂无可展示榜单，不使用模拟数据。</div>}
  </main>;
}

