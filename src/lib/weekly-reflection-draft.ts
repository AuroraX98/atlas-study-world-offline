import {weekKey} from './workspace';
export type WeeklyDraft={week:string;helped:string;difficult:string;next:string};
const draftKey='atlas-weekly-reflection-draft-v1',weekPreferenceKey='atlas-weekly-reflection-week-v1';
export function validReflectionWeek(value:unknown):value is string{
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const date=new Date(value+'T12:00:00');return !Number.isNaN(+date)&&weekKey(date)===value;
}
export function parseWeeklyDraft(raw:string|null):WeeklyDraft|null{
 if(!raw||raw.length>20000)return null;
 try{const item=JSON.parse(raw);if(!item||!validReflectionWeek(item.week)||!['helped','difficult','next'].every(field=>typeof item[field]==='string'&&item[field].length<=2000))return null;
 return {week:item.week,helped:item.helped,difficult:item.difficult,next:item.next};
 }catch{return null}
}
export function readWeeklyDraft(){try{return parseWeeklyDraft(localStorage.getItem(draftKey))}catch{return null}}
export function writeWeeklyDraft(draft:WeeklyDraft){const clean=parseWeeklyDraft(JSON.stringify(draft));if(!clean)return false;try{localStorage.setItem(draftKey,JSON.stringify(clean));return true}catch{return false}}
export function clearWeeklyDraft(saved:WeeklyDraft,storedBefore?:WeeklyDraft|null){try{const current=readWeeklyDraft(),expected=storedBefore===undefined?saved:storedBefore;if(current&&current.week===saved.week&&JSON.stringify(current)===JSON.stringify(expected))localStorage.removeItem(draftKey)}catch{}}
export function readReflectionWeek(){try{const week=localStorage.getItem(weekPreferenceKey);return validReflectionWeek(week)?week:null}catch{return null}}
export function rememberReflectionWeek(week:string){if(validReflectionWeek(week))try{localStorage.setItem(weekPreferenceKey,week)}catch{}}
export function withTargetRecord<T extends {id:string}>(items:T[],limit:number,targetId?:string){const shown=items.slice(0,limit),target=targetId?items.find(item=>item.id===targetId):undefined;return target&&!shown.some(item=>item.id===target.id)?[target,...shown]:shown}
