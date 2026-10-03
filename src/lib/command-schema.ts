import {z} from 'zod';
import {subjectIds,type Snapshot,type SubjectId} from './study';
import {languageIds,topicTracks} from './learning';
import {plannerDefaults,type TopicDetail,type PracticeEntry,type EvidenceFile,type WordReview,type WeeklyReflection,type WorkspaceData} from './workspace';
const subject=z.enum(subjectIds).or(z.string().regex(/^custom-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i).transform(v=>v as `custom-${string}`)),key=z.string().uuid(),day=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>{const d=new Date(v+'T12:00:00Z');return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===v});
export const plannerSchema=z.object({dailyMinutes:z.number().int().min(5).max(360),busyMinutes:z.number().int().min(5).max(60),days:z.array(z.number().int().min(0).max(6)).max(7),priorities:z.array(subject).min(1).max(subjectIds.length+100)});
const link=z.string().max(2000).refine(v=>!v||/^https:\/\//i.test(v)&&(()=>{try{const url=new URL(v);return url.protocol==='https:'&&!url.username&&!url.password}catch{return false}})());
export const workspaceCommands=[
 z.object({action:z.literal('topic-create'),id:key,subject,title:z.string().trim().min(1).max(180),note:z.string().max(5000).default('')}),
 z.object({action:z.literal('topic-note'),topicId:z.string().min(1).max(100),note:z.string().max(5000),blocker:z.string().max(2000),nextStep:z.string().max(1000)}),
 z.object({action:z.literal('topic-level'),topicId:z.string().min(1).max(100),level:z.number().int().min(0).max(4)}),
 z.object({action:z.literal('topic-review'),topicId:z.string().min(1).max(100),confidence:z.enum(['easy','uncertain','practice'])}),
 z.object({action:z.literal('review-later'),topicId:z.string().min(1).max(100),days:z.number().int().min(1).max(30)}),
 z.object({action:z.literal('practice-add'),id:key,subject,topicId:z.string().max(100).nullable(),title:z.string().trim().min(1).max(180),reflection:z.string().trim().min(1).max(5000),link}),
 z.object({action:z.literal('words-review'),id:key,subject:z.enum(languageIds),count:z.number().int().min(1).max(100000)}),
 z.object({action:z.literal('planner-settings'),preferences:plannerSchema}),
 z.object({action:z.literal('day-mode'),day,mode:z.enum(['normal','busy','rest'])}),
 z.object({action:z.literal('weekly-reflection'),week:day,helped:z.string().max(2000),difficult:z.string().max(2000),next:z.string().max(2000)}),
 z.object({action:z.literal('goal-plan'),id:key,paused:z.boolean(),nextStep:z.string().max(1000),estimatedMinutes:z.number().int().min(1).max(100000).nullable()})
] as const;



const step=z.object({id:key,text:z.string().trim().min(1).max(300),done:z.boolean()});
export const commandSchema=z.discriminatedUnion("action",[
 ...workspaceCommands,
 z.object({action:z.literal('journal-save'),id:key,date:day,title:z.string().max(180),events:z.string().max(10000),challenges:z.string().max(10000),lessons:z.string().max(10000),goals:z.string().max(10000),vision:z.string().max(10000)}),
 z.object({action:z.literal('subject-create'),id:key,name:z.string().trim().min(1).max(60)}),
 z.object({action:z.literal('horizon-goal-add'),id:key,horizon:z.enum(['week','month','six-months','year','five-years']),title:z.string().trim().min(1).max(500)}),
 z.object({action:z.literal('horizon-goal-update'),id:key,done:z.boolean()}),
 z.object({action:z.literal("topic-update"),topicId:z.string().min(1).max(100),learned:z.boolean()}),
 z.object({action:z.literal("words-add"),id:key,subject:z.enum(languageIds),count:z.number().int().min(1).max(100000)}),
 z.object({action:z.literal("words-set"),subject:z.enum(languageIds),count:z.number().int().min(0).max(1000000)}),
 z.object({action:z.literal("start"),id:key,subject,seconds:z.number().int().min(60).max(7200),goalId:key.nullable().optional(),topicId:z.string().min(1).max(100).nullable().optional()}),
 z.object({action:z.enum(["pause","resume","finish"]),id:key}),
 z.object({action:z.literal("goal-create"),id:key,subject,title:z.string().trim().min(1).max(180),reason:z.string().max(1000),targetDate:day.or(z.literal('')),steps:z.array(step).max(30)}),
 z.object({action:z.literal("goal-update"),id:key,completed:z.boolean(),steps:z.array(step).max(30),note:z.string().max(2000).optional()}),
 z.object({action:z.literal("session-note"),id:key,note:z.string().max(2000)}),
 z.object({action:z.literal("settings"),settings:z.object({focusMinutes:z.number().int().min(1).max(120),shortBreak:z.number().int().min(1).max(60),longBreak:z.number().int().min(1).max(60),calm:z.boolean(),sound:z.boolean(),equipped:z.record(subject,z.string().min(1).max(150))})})
]);
