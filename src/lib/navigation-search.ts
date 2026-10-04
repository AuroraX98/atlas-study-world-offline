import {subjects,subjectIds,type Snapshot,type SubjectId} from './study';
import {availableTopics} from './workspace';
import {allAwards} from './learning';
import type {NavigationTarget} from './navigation';
export type SearchEntry={id:string;title:string;kind:string;subject?:SubjectId;text:string;searchText:string;topicId?:string;tab?:string;view?:string;target:NavigationTarget};
export type SavedPlace={id:string;title:string;kind:string;target:NavigationTarget;visitedAt:number};
export type SavedPlacesState={recent:SavedPlace[];pinned:SavedPlace[]};
export const savedPlacesKey='atlas-saved-places-v1';
export const savedPlacesEvent='atlas-saved-places-changed';
const validTabs=new Set(['world','today','subjects','focus','goals','rewards','journal','progress','assistant','settings','learning','history']);
const validViews=new Set(['overview','learning','vocabulary','notes','practice','rewards','plan','reviews','gallery','weekly','activity','all','time','earned']);
const validKinds=new Set(['goal','journal','practice','file','badge','session','weekly','horizon','lesson']);
const text=(value:unknown,max:number)=>typeof value==='string'&&value.length>0&&value.length<=max&&!/[\u0000-\u001f]/.test(value);
export function validatePlaceTarget(value:unknown):NavigationTarget|null{
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const item=value as Record<string,unknown>;
 if(typeof item.tab!=='string'||!validTabs.has(item.tab))return null;
 if(item.view!==undefined&&(typeof item.view!=='string'||!validViews.has(item.view)))return null;
 if(item.subject!==undefined&&(typeof item.subject!=='string'||!(subjectIds.includes(item.subject as typeof subjectIds[number])||/^custom-[a-zA-Z0-9-]{1,100}$/.test(item.subject))))return null;
 if(item.topicId!==undefined&&!text(item.topicId,180)||item.recordId!==undefined&&!text(item.recordId,180))return null;
 if(item.recordKind!==undefined&&(typeof item.recordKind!=='string'||!validKinds.has(item.recordKind)))return null;
 // Copy recognized navigation fields only. Never persist arbitrary settings or credentials.
 return {tab:item.tab,...(item.subject?{subject:item.subject as SubjectId}:{}),...(item.view?{view:item.view as string}:{}),...(item.topicId?{topicId:item.topicId as string}:{}),...(item.recordId?{recordId:item.recordId as string}:{}),...(item.recordKind?{recordKind:item.recordKind as string}:{})};
}
export const placeId=(target:NavigationTarget)=>JSON.stringify([target.tab,target.subject??'',target.view??'',target.topicId??'',target.recordKind??'',target.recordId??'']);
export function parseSavedPlaces(raw:string|null):SavedPlacesState{
 const empty={recent:[],pinned:[]} as SavedPlacesState;
 if(!raw||raw.length>100000)return empty;
 try{const parsed=JSON.parse(raw);if(!parsed||typeof parsed!=='object')return empty;
 const clean=(items:unknown,max:number)=>{if(!Array.isArray(items))return [];const seen=new Set<string>();return items.slice(0,100).flatMap((item):SavedPlace[]=>{const target=validatePlaceTarget(item?.target);if(!target||!text(item.title,180)||!text(item.kind,50)||!Number.isFinite(item.visitedAt)||item.visitedAt<0)return [];const id=placeId(target);if(seen.has(id))return [];seen.add(id);return [{id,title:item.title,kind:item.kind,target,visitedAt:item.visitedAt}]}).slice(0,max)};
 return {recent:clean(parsed.recent,12),pinned:clean(parsed.pinned,20)};
 }catch{return empty}
}
export function readSavedPlaces():SavedPlacesState{try{return parseSavedPlaces(localStorage.getItem(savedPlacesKey))}catch{return {recent:[],pinned:[]}}}
function writeSavedPlaces(value:SavedPlacesState){try{localStorage.setItem(savedPlacesKey,JSON.stringify(value));window.dispatchEvent(new Event(savedPlacesEvent));return true}catch{return false}}
export function recordRecentPlace(target:NavigationTarget,title:string,kind='Page'){
 const validated=validatePlaceTarget(target);if(!validated||!text(title,180)||!text(kind,50))return false;
 const saved=readSavedPlaces(),place={id:placeId(validated),target:validated,title,kind,visitedAt:Date.now()};
 return writeSavedPlaces({...saved,recent:[place,...saved.recent.filter(p=>p.id!==place.id)].slice(0,12)});
}
export function togglePinnedPlace(target:NavigationTarget,title:string,kind='Page'){
 const validated=validatePlaceTarget(target);if(!validated||!text(title,180)||!text(kind,50))return false;
 const saved=readSavedPlaces(),id=placeId(validated),exists=saved.pinned.some(p=>p.id===id);
 if(!exists&&saved.pinned.length>=20)return false;
 return writeSavedPlaces({...saved,pinned:exists?saved.pinned.filter(p=>p.id!==id):[...saved.pinned,{id,target:validated,title,kind,visitedAt:Date.now()}]});
}
export function removeRecentPlace(id:string){const saved=readSavedPlaces();return writeSavedPlaces({...saved,recent:saved.recent.filter(p=>p.id!==id)})}
export function studySearchEntries(data:Snapshot):SearchEntry[]{
 const names=new Map([...subjects,...data.customSubjects].map(s=>[s.id,s.name]));
 const details=new Map(data.workspace.topics.map(t=>[t.topic_id,t]));
 const awardNames=data.badges.length?new Map(allAwards(data).map(a=>[a.id,a.name])):new Map<string,string>();
 const entries:Omit<SearchEntry,'searchText'>[]=[
  ...availableTopics(data).map(t=>{const note=details.get(t.id);return {id:'topic-'+t.id,title:t.title,kind:'Topic',subject:t.subject,text:`${t.title} ${note?.note??''} ${note?.blocker??''} ${note?.next_step??''}`,topicId:t.id,target:{tab:'subjects',subject:t.subject,view:'learning',topicId:t.id}}}),
  ...data.goals.map(g=>({id:'goal-'+g.id,title:g.title,kind:'Goal',subject:g.subject,text:`${g.title} ${g.reason} ${g.note} ${g.next_step}`,tab:'goals',target:{tab:'goals',subject:g.subject,recordKind:'goal',recordId:g.id}})),
  ...data.workspace.horizonGoals.map(g=>({id:'horizon-'+g.id,title:g.title,kind:'Goal',text:`${g.title} ${g.horizon}`,tab:'goals',target:{tab:'goals',recordKind:'horizon',recordId:g.id}})),
  ...data.workspace.practice.map(p=>({id:'practice-'+p.id,title:p.title,kind:'Practice',subject:p.subject,text:`${p.title} ${p.reflection}`,tab:'today',view:'gallery',target:{tab:'today',view:'gallery',subject:p.subject,recordKind:'practice',recordId:p.id}})),
  ...data.workspace.files.map(f=>({id:'file-'+f.id,title:f.filename,kind:'File',subject:f.subject,text:f.filename,tab:'today',view:'gallery',target:{tab:'today',view:'gallery',subject:f.subject,recordKind:'file',recordId:f.id}})),
  ...data.badges.map(b=>{const title=awardNames.get(b.badge_id)??'Achievement';return {id:'badge-'+b.badge_id,title,kind:'Reward',subject:b.subject,text:title,tab:'rewards',target:{tab:'rewards',subject:b.subject,recordKind:'badge',recordId:b.badge_id}}}),
  ...data.workspace.assistantLessons.map(l=>({id:'lesson-'+l.id,title:l.title,kind:'AI lesson',subject:l.subject,text:`${l.title} ${l.preferences.focus.map(f=>f.topic).join(' ')}`,tab:'assistant',target:{tab:'assistant',subject:l.subject,recordKind:'lesson',recordId:l.id}})),
  ...data.workspace.journal.map(e=>({id:'journal-'+e.id,title:e.title||`Journal entry · ${e.date}`,kind:'Journal',text:`${e.date} ${e.title} ${e.events} ${e.challenges} ${e.lessons} ${e.goals} ${e.vision}`,tab:'journal',target:{tab:'journal',recordKind:'journal',recordId:e.id}})),
  ...data.sessions.filter(s=>s.note).map(s=>({id:'session-'+s.id,title:`${names.get(s.subject)??'Study'} session reflection`,kind:'Session reflection',subject:s.subject,text:s.note,tab:'progress',view:'activity',target:{tab:'progress',view:'activity',subject:s.subject,recordKind:'session',recordId:s.id}})),
  ...data.workspace.reflections.map(r=>({id:'weekly-'+r.week,title:`Weekly reflection · ${r.week}`,kind:'Reflection',text:`${r.helped} ${r.difficult} ${r.next}`,tab:'progress',view:'weekly',target:{tab:'progress',view:'weekly',recordKind:'weekly',recordId:r.week}})),
  ...[['today','Today','Daily plan and review queue'],['subjects','Subjects','Learning paths, vocabulary, topics and study notes'],['goals','Goals','Short and long term plans'],['rewards','Rewards','Achievements and island customization'],['journal','Journal','Write and export personal entries'],['progress','Progress','Weekly reports and study history'],['assistant','Assistant','Build an AI lesson']].map(([tab,title,text])=>({id:'page-'+tab,title,kind:'Page',text,tab,target:{tab}}))
 ];
 return entries.map(e=>({...e,searchText:`${e.title} ${e.text} ${e.subject?names.get(e.subject)??'':''}`.toLowerCase()}));
}
export function availableSavedPlaces(saved:SavedPlacesState,data:Snapshot):SavedPlacesState{
 const entries=studySearchEntries(data),known=new Set(entries.map(e=>placeId(e.target)));
 const exists=(place:SavedPlace)=>place.target.recordId||place.target.topicId?known.has(place.id):!place.target.subject||subjects.some(s=>s.id===place.target.subject)||data.customSubjects.some(s=>s.id===place.target.subject);
 return {recent:saved.recent.filter(exists),pinned:saved.pinned.filter(exists)};
}
