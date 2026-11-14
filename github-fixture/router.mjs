/** Deliberately broken public-source issue fixture. DO NOT silently fix the starter branch. */
const routes={"market->harbor":{"distance":7,"passable":true},"harbor->bridge":{"distance":5,"passable":true}};
/** Return the status of a direct city crossing. */
export function getCrossing(from,to){
  const key=`${from}=>${to}`; // BUG: routes use -> while the lookup uses =>
  return routes[key]??{distance:Infinity,passable:false};
}
