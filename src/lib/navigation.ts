import {useCallback,useEffect,useRef,useState} from 'react';
import type {Snapshot,SubjectId} from './study';
import {subjects} from './study';
import {availableTopics} from './workspace';

/** Only navigation metadata is persisted here. Never pass lesson text or credentials. */
export type NavigationTarget={tab:string;subject?:SubjectId;view?:string;topicId?:string;recordId?:string;recordKind?:string;lessonTopicId?:string;studyTopicId?:string;goalId?:string;minutes?:number;page?:number};
export const navigationTabs=['today','subjects','world','goals','rewards','progress','journal','assistant'] as const;
export const navigationLabels:Record<string,string>={today:'Today',subjects:'Subjects',world:'Study world',goals:'Goals',rewards:'Rewards',progress:'Progress',journal:'Journal',assistant:'Assistant'};
const currentKey='atlas-navigation-v1',lastKey='atlas-last-study-v1',scrollKey='atlas-navigation-scroll-v1';
const cleanId=(value:unknown)=>typeof value==='string'&&value.length>0&&value.length<=200&&!/[\u0000-\u001f]/.test(value)?value:undefined;
const views:Record<string,string[]>={today:['plan','reviews','gallery'],subjects:['overview','learning','notes','practice','rewards'],progress:['weekly','activity'],rewards:['all','time','learning','earned']};
export function cleanNavigation(value:unknown):NavigationTarget|null{
 if(!value||typeof value!=='object')return null;
 const v=value as Record<string,unknown>;let tab=v.tab,view=v.view;
 if(tab==='learning'){tab='subjects';view='learning'}
 if(tab==='history')tab='journal';
 if(tab==='today'&&view==='weekly')tab='progress';
 if(typeof tab!=='string'||!navigationTabs.includes(tab as typeof navigationTabs[number]))return null;
 const result:NavigationTarget={tab};
 const subject=cleanId(v.subject);if(subject)result.subject=subject as SubjectId;
 if(typeof view==='string'&&views[tab]?.includes(view))result.view=view;
 for(const name of ['topicId','recordId','lessonTopicId','studyTopicId','goalId'] as const){const id=cleanId(v[name]);if(id)result[name]=id}
 if(['goal','journal','practice','file','badge','weekly','session','horizon','lesson'].includes(String(v.recordKind)))result.recordKind=String(v.recordKind);
 if(typeof v.minutes==='number'&&Number.isInteger(v.minutes)&&v.minutes>=1&&v.minutes<=120)result.minutes=v.minutes;
 if(typeof v.page==='number'&&Number.isInteger(v.page)&&v.page>=0&&v.page<=10000)result.page=v.page;
 return result;
}
export function navigationHash(target:NavigationTarget){const clean=cleanNavigation(target)??{tab:'today'};const params=new URLSearchParams();for(const [key,value] of Object.entries(clean))params.set(key,String(value));return '#atlas?'+params.toString()}
export function parseNavigationHash(hash:string):NavigationTarget|null{if(!hash.startsWith('#atlas?')||hash.length>3000)return null;const params=new URLSearchParams(hash.slice(7));const raw:Record<string,unknown>=Object.fromEntries(params);for(const key of ['minutes','page'])if(params.has(key))raw[key]=Number(params.get(key));return cleanNavigation(raw)}
export function readNavigation(key=currentKey):NavigationTarget|null{try{return cleanNavigation(JSON.parse(localStorage.getItem(key)??'null'))}catch{return null}}
function storeNavigation(key:string,target:NavigationTarget){try{localStorage.setItem(key,JSON.stringify(cleanNavigation(target)))}catch{/* Navigation remains usable when storage is unavailable. */}}
export function validateNavigation(target:NavigationTarget,data:Snapshot):NavigationTarget{
 const next={...cleanNavigation(target)??{tab:'today'}};
 if(next.subject&&!subjects.some(s=>s.id===next.subject)&&!data.customSubjects.some(s=>s.id===next.subject))next.subject='math';
 const topics=availableTopics(data);
 for(const key of ['topicId','lessonTopicId','studyTopicId'] as const){if(next[key]&&next[key]!=='new'&&!topics.some(t=>t.id===next[key]))delete next[key]}
 if(next.goalId&&!data.goals.some(g=>g.id===next.goalId))delete next.goalId;
 if(next.recordId){const id=next.recordId;const valid=next.recordKind==='journal'?data.workspace.journal.some(e=>e.id===id):next.recordKind==='goal'?data.goals.some(e=>e.id===id):next.recordKind==='practice'?data.workspace.practice.some(e=>e.id===id):next.recordKind==='file'?data.workspace.files.some(e=>e.id===id):next.recordKind==='badge'?data.badges.some(e=>e.badge_id===id):next.recordKind==='weekly'?data.workspace.reflections.some(e=>e.week===id):next.recordKind==='session'?data.sessions.some(e=>e.id===id):next.recordKind==='horizon'?data.workspace.horizonGoals.some(e=>e.id===id):next.recordKind==='lesson'?data.workspace.assistantLessons.some(e=>e.id===id):false;if(!valid){delete next.recordId;delete next.recordKind}}
 return next;
}
export function rememberStudy(target:NavigationTarget){storeNavigation(lastKey,target)}
export function readLastStudy(){return readNavigation(lastKey)}
function saveScroll(target:NavigationTarget){try{const positions=JSON.parse(localStorage.getItem(scrollKey)??'{}');positions[navigationHash(target)]=Math.max(0,window.scrollY);const keys=Object.keys(positions);for(const key of keys.slice(0,Math.max(0,keys.length-60)))delete positions[key];localStorage.setItem(scrollKey,JSON.stringify(positions))}catch{}}
export function restoreNavigationScroll(target:NavigationTarget){let y=0;try{y=Number(JSON.parse(localStorage.getItem(scrollKey)??'{}')[navigationHash(target)])||0}catch{}window.scrollTo({top:y,behavior:'instant'})}
export function useAtlasNavigation(beforeNavigate:()=>Promise<void>){
 const [location,setLocation]=useState<NavigationTarget>(()=>parseNavigationHash(window.location.hash)??readNavigation()??{tab:'today',subject:'math'});
 const current=useRef(location),guard=useRef(beforeNavigate),busy=useRef(false),generation=useRef(0);guard.current=beforeNavigate;current.current=location;
 const navigate=useCallback(async(target:NavigationTarget,replace=false)=>{const next=cleanNavigation(target);if(!next||busy.current)return;busy.current=true;const token=++generation.current;saveScroll(current.current);try{await guard.current();if(token!==generation.current)return;if(navigationHash(next)!==navigationHash(current.current)){window.history[replace?'replaceState':'pushState']({atlas:true},'',navigationHash(next));current.current=next;storeNavigation(currentKey,next);setLocation(next)}}finally{busy.current=false}},[]);
 useEffect(()=>{
  const oldRestoration=window.history.scrollRestoration;window.history.scrollRestoration='manual';
  window.history.replaceState({atlas:true},'',navigationHash(current.current));storeNavigation(currentKey,current.current);
  let handling=false,scrollTimer:number|undefined;
  const changed=()=>{generation.current++;if(handling)return;handling=true;saveScroll(current.current);void (async()=>{try{await guard.current();const next=parseNavigationHash(window.location.hash);if(!next){window.history.replaceState({atlas:true},'',navigationHash(current.current));return}if(navigationHash(next)!==navigationHash(current.current)){current.current=next;storeNavigation(currentKey,next);setLocation(next)}}catch{window.history.replaceState({atlas:true},'',navigationHash(current.current))}finally{handling=false}})()};
  const save=()=>{saveScroll(current.current);storeNavigation(currentKey,current.current)};
  const scrolled=()=>{if(scrollTimer!==undefined)window.clearTimeout(scrollTimer);scrollTimer=window.setTimeout(save,300)};
  window.addEventListener('popstate',changed);window.addEventListener('hashchange',changed);window.addEventListener('pagehide',save);window.addEventListener('scroll',scrolled,{passive:true});
  return()=>{save();window.history.scrollRestoration=oldRestoration;if(scrollTimer!==undefined)window.clearTimeout(scrollTimer);window.removeEventListener('popstate',changed);window.removeEventListener('hashchange',changed);window.removeEventListener('pagehide',save);window.removeEventListener('scroll',scrolled)};
 },[]);
 return {location,navigate};
}
