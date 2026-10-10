export type HeatArticle = {publishedAt:string|null;views?:number};
// Editorial sorting score, not a measurement of popularity across platforms.
export function heat(a:HeatArticle, now=Date.now()) {
  const date=Date.parse(a.publishedAt||"");
  const hours=Number.isFinite(date)?Math.max(0,(now-date)/3600000):Infinity;
  const freshness=hours<=6?3:hours<=24?2:1;
  const reads=Number.isFinite(a.views)&&Number(a.views)>0?Number(a.views):0;
  return Math.min(5,freshness+(reads>=100000?2:reads>=10000?1:0));
}
