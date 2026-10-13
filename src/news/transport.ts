/// <reference types="vite/client" />
export const snapshotMode = import.meta.env?.VITE_PAGES === "true";
const base = import.meta.env?.BASE_URL || "/";
const apiBase = String(import.meta.env?.VITE_API_BASE || "").replace(/\/$/, "");
export const liveApiMode = Boolean(apiBase);
export const pageLink = (path:string) => snapshotMode ? base + (path === "/" ? "" : "?view=" + encodeURIComponent(path)) : path;
export const pagePath = () => snapshotMode ? new URLSearchParams(window.location.search).get("view") || "/" : window.location?.pathname || "/";
export const newsUrl = (force=false) => liveApiMode ? apiBase+"/api/news"+(force?"?refresh=1":"") : snapshotMode ? base+"data/news.json" : "/api/news"+(force?"?refresh=1":"");
export const hotUrl = () => liveApiMode ? apiBase+"/api/hot" : snapshotMode ? base+"data/hot.json" : "/api/hot";
export const articleUrl = (id:string) => liveApiMode ? apiBase+"/api/article/"+encodeURIComponent(id) : snapshotMode ? base+"data/articles/"+encodeURIComponent(id)+".json" : "/api/article/"+encodeURIComponent(id);
