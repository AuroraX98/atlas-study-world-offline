import {z} from 'zod';
import {lessonPreferencesSchema,focusSchema,type LessonPreferences} from './assistant-schema';
export type AssistantPlannerDraft={title:string;topic:string;minutes:number;track:boolean;preferences:LessonPreferences};
export type AssistantReplyDraft={reply:string;words:number};
const prefix='atlas-assistant-draft-v1-';
const draftPreferences=lessonPreferencesSchema.extend({explanationLanguage:z.string().max(60),focus:z.array(focusSchema).max(8)});
const validId=(id:string)=>id.length>0&&id.length<=200&&!/[\u0000-\u001f]/.test(id);
function parse(raw:string|null,kind:'planner'|'reply'){
 if(!raw||raw.length>20000)return null;
 try{const value=JSON.parse(raw);if(!value||typeof value!=='object')return null;
  if(kind==='reply'){if(typeof value.reply!=='string'||value.reply.length>5000||!Number.isInteger(value.words)||value.words<0||value.words>100000)return null;return {reply:value.reply,words:value.words} as AssistantReplyDraft;}
  const preferences=draftPreferences.safeParse(value.preferences);
  if(typeof value.title!=='string'||value.title.length>180||typeof value.topic!=='string'||value.topic.length>200||typeof value.minutes!=='number'||!Number.isFinite(value.minutes)||Math.abs(value.minutes)>100000||typeof value.track!=='boolean'||!preferences.success)return null;
  return {title:value.title,topic:value.topic,minutes:value.minutes,track:value.track,preferences:preferences.data} as AssistantPlannerDraft;
 }catch{return null}
}
function read(id:string,kind:'planner'|'reply'){if(!validId(id))return null;try{return parse(localStorage.getItem(prefix+kind+'-'+id),kind)}catch{return null}}
function write(id:string,kind:'planner'|'reply',value:AssistantPlannerDraft|AssistantReplyDraft){if(!validId(id))return false;const clean=parse(JSON.stringify(value),kind);if(!clean)return false;try{localStorage.setItem(prefix+kind+'-'+id,JSON.stringify(clean));return true}catch{return false}}
export const readAssistantPlanner=(subject:string)=>read(subject,'planner') as AssistantPlannerDraft|null;
export const writeAssistantPlanner=(subject:string,value:AssistantPlannerDraft)=>write(subject,'planner',value);
export const readAssistantReply=(lessonId:string)=>read(lessonId,'reply') as AssistantReplyDraft|null;
export const writeAssistantReply=(lessonId:string,value:AssistantReplyDraft)=>write(lessonId,'reply',value);
export function clearBuiltAssistantPlanner(subject:string,captured:AssistantPlannerDraft){const current=readAssistantPlanner(subject);if(!current||JSON.stringify(current)!==JSON.stringify(captured))return false;try{localStorage.removeItem(prefix+'planner-'+subject);return true}catch{return false}}
/** A late response must not remove text entered while the request was running. */
export function clearSentAssistantReply(lessonId:string,sentReply:string){const current=readAssistantReply(lessonId);if(!current||current.reply!==sentReply)return false;return writeAssistantReply(lessonId,{...current,reply:''})}
export function clearCompletedAssistantDraft(lessonId:string,captured:AssistantReplyDraft){const current=readAssistantReply(lessonId);if(!current||JSON.stringify(current)!==JSON.stringify(captured))return false;try{localStorage.removeItem(prefix+'reply-'+lessonId);return true}catch{return false}}
