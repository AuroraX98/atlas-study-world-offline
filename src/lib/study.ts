import catalog from "./catalog.json";
import type {WorkspaceData} from "./workspace";
import {languages,languageIds,isLanguage,type LanguageId} from './languages';
const coreIds=['math','physics','quantum','coding','ai','art'] as const;
export const subjectIds=[...coreIds,...languageIds] as const;
export type SubjectId=typeof coreIds[number]|LanguageId|`custom-${string}`;
export type CustomSubject={id:`custom-${string}`;name:string;color:string;glyph:string};
export const subjects: {id:SubjectId;name:string;color:string;glyph:string;topics:typeof catalog.math.suggested_topic_milestones;rewards:typeof catalog.math.achievements}[]=[...coreIds.map((id,index)=>({id,name:catalog[id].subject,color:catalog[id].accent_color,glyph:['∑','φ','ψ','</>','✧','✎'][index],topics:catalog[id].suggested_topic_milestones,rewards:catalog[id].achievements})),...languages.map(l=>{const original=['spanish','german','latin'].includes(l.id)?catalog[l.id as 'spanish'|'german'|'latin']:null;return {id:l.id,name:l.name,color:original?.accent_color??'#d6b27d',glyph:l.glyph,topics:original?.suggested_topic_milestones??[],rewards:original?.achievements??[1,3,6,10,20,35,50,75,100,150].map((hours,i)=>({hours,name:`${l.name} ${['Study Spark','Phrase Pathfinder','Conversation Compass','Reading Lantern','Practice Grove','Story Keeper','Language Navigator','Culture Explorer','Fluent Effort','Study Constellation'][i]}`,description:`${hours} hours of ${l.name} study`}))}})];
export function registerCustomSubjects(items:CustomSubject[]){
 subjects.splice(0,subjects.length,...subjects.filter(s=>!s.id.startsWith('custom-')));
 for(const item of items)subjects.push({...item,topics:[],rewards:[1,3,6,10,20,35,50,75,100,150].map((hours,i)=>({hours,name:`${item.name} ${['First Spark','Explorer','Pathfinder','Practice Grove','Dedicated Learner','Navigator','Milestone Maker','Expert Effort','Constellation','Study Legend'][i]}`,description:`${hours} hours invested in ${item.name}`}))} as typeof subjects[number]);
}
export function worldSubjects(language:LanguageId,selected?:SubjectId){const core=subjects.filter(s=>!isLanguage(s.id)&&!s.id.startsWith('custom-'));return [...core,subjects.find(s=>s.id===(selected?.startsWith('custom-')?selected:language))!].filter(Boolean)}
export const thresholds=[0,1,3,6,10,20,35,50,75,100,150];
export function levelFor(ms:number){let index=0;while(index<thresholds.length-1&&ms>=thresholds[index+1]*3600000)index++;return {level:index+1,current:thresholds[index],next:thresholds[index+1]??null,percent:index===thresholds.length-1?100:Math.min(100,Math.max(0,(ms/3600000-thresholds[index])/(thresholds[index+1]-thresholds[index])*100))};}
export function formatTime(ms:number){const min=Math.floor(ms/60000);if(ms>0&&min===0)return ms<1000?"<1s":`${Math.floor(ms/1000)}s`;return min>=60?`${Math.floor(min/60)}h ${min%60}m`:`${min}m`;}
export function elapsedTime(ms:number){if(ms<86400000)return formatTime(ms);return `${Math.floor(ms/86400000)}d ${Math.floor(ms/3600000)%24}h`;}
export function remainingMs(session:Session,now=Date.now()){const elapsed=session.accumulated_ms+(session.status==="running"&&session.running_since!==null?Math.max(0,now-session.running_since):0);return Math.max(0,session.planned_seconds*1000-elapsed);}
export type Session={id:string;user_id?:string;subject:SubjectId;goal_id:string|null;topic_id?:string|null;planned_seconds:number;accumulated_ms:number;running_since:number|null;status:"running"|"paused"|"completed"|"stopped";credited_ms:number;started_at:number;ended_at:number|null;note:string};
export type Step={id:string;text:string;done:boolean};
export type Goal={id:string;subject:SubjectId;title:string;reason:string;target_date:string;steps:Step[];started_at:number;completed_at:number|null;note:string;paused:number;next_step:string;estimated_minutes:number|null};
export type Settings={focusMinutes:number;shortBreak:number;longBreak:number;calm:boolean;sound:boolean;equipped:Partial<Record<SubjectId,string>>};
export type TopicProgress={topic_id:string;subject:SubjectId;learned:number;learned_at:number|null};
export type Badge={badge_id:string;subject:SubjectId;earned_at:number};
export type Snapshot={wordEntries?:{id:string;subject:SubjectId;count:number;created_at:number}[];customSubjects:CustomSubject[];workspace:WorkspaceData;goalEffort:Record<string,number>;sessionCount:number;completedCount:number;topics:TopicProgress[];badges:Badge[];wordCounts:Partial<Record<SubjectId,number>>;sessions:Session[];active:Session|null;goals:Goal[];settings:Settings;totals:Record<SubjectId,number>;serverNow:number};
export const defaults:Settings={focusMinutes:25,shortBreak:5,longBreak:15,calm:false,sound:false,equipped:{}};
