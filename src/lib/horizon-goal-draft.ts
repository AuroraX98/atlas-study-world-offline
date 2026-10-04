import type {HorizonGoal} from './workspace';
const prefix='atlas-horizon-goal-draft-v1-';
const valid=(horizon:string)=>['week','month','six-months','year','five-years'].includes(horizon);
export function readHorizonDraft(horizon:HorizonGoal['horizon']){if(!valid(horizon))return '';try{const value=localStorage.getItem(prefix+horizon);return typeof value==='string'&&value.length<=500?value:''}catch{return ''}}
export function writeHorizonDraft(horizon:HorizonGoal['horizon'],title:string){if(!valid(horizon)||typeof title!=='string'||title.length>500)return false;try{localStorage.setItem(prefix+horizon,title);return true}catch{return false}}
/** Leave a newer draft untouched if the user kept typing while a goal saved. */
export function clearHorizonDraft(horizon:HorizonGoal['horizon'],captured:string){if(!valid(horizon)||readHorizonDraft(horizon)!==captured)return false;try{localStorage.removeItem(prefix+horizon);return true}catch{return false}}
