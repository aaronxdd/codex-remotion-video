/// <reference types="vite/client" />
export const snapshotMode = import.meta.env?.VITE_PAGES === "true";
const base = import.meta.env?.BASE_URL || "/";
export const pageLink = (path:string) => snapshotMode ? base + (path === "/" ? "" : "?view=" + encodeURIComponent(path)) : path;
export const pagePath = () => snapshotMode ? new URLSearchParams(window.location.search).get("view") || "/" : window.location?.pathname || "/";
export const newsUrl = (force=false) => snapshotMode ? base+"data/news.json" : "/api/news"+(force?"?refresh=1":"");
export const hotUrl = () => snapshotMode ? base+"data/hot.json" : "/api/hot";
export const articleUrl = (id:string) => snapshotMode ? base+"data/articles/"+encodeURIComponent(id)+".json" : "/api/article/"+encodeURIComponent(id);
