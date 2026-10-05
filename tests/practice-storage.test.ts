import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {blankState,mutate,settle,mergeBackup,transact,exportBackup,openDatabase} from '../src/lib/offline-store';
import {practiceBanks,checkExercise,practiceEvidence} from '../src/lib/practice';
import {backupSchema} from '../src/lib/backup';
import type {PracticeExercise} from '../src/lib/practice-types';
import {weeklyReport} from '../src/components/weekly-progress';

const bank=Object.values(practiceBanks).find(b=>b.exercises.some(e=>e.format==='number'))!;
assert(bank,'At least one topic must contain numerical practice.');
const exercise=bank.exercises.find(e=>e.format==='number')!;
const correct=String(exercise.answer);
assert.equal(checkExercise(exercise,correct).status,'correct');
const command=(overrides:Record<string,unknown>={})=>({action:'exercise-save',id:randomUUID(),topicId:bank.topicId,exerciseId:exercise.id,contentVersion:bank.version,answer:correct,hintCount:0,solutionRevealed:false,reflection:'',submit:true,expectedUpdatedAt:null,...overrides});
const backup=(s:ReturnType<typeof blankState>,version=3)=>({format:'atlas-study-backup',version,...structuredClone(s.data),wordEntries:structuredClone(s.wordEntries),fileData:[]});
let s=blankState();
const old=s as any;delete old.data.workspace.exerciseAttempts;delete old.data.workspace.lessonOpened;
settle(s,100);assert.deepEqual(s.data.workspace.exerciseAttempts,[]);assert.deepEqual(s.data.workspace.lessonOpened,[]);
mutate(s,{action:'lesson-open',topicId:bank.topicId},100);mutate(s,{action:'lesson-open',topicId:bank.topicId},200);
assert.deepEqual(s.data.workspace.lessonOpened,[{topic_id:bank.topicId,opened_at:100}]);
const first=command();mutate(s,first,1000);
assert.equal(s.data.workspace.exerciseAttempts[0].status,'correct');assert.equal(s.data.workspace.exerciseAttempts[0].review_at,86401000);
assert.equal(s.data.workspace.exerciseAttempts[0].submitted_at,1000);assert.equal(s.data.workspace.exerciseAttempts[0].hint_count_on_submit,0);assert.equal(s.data.workspace.exerciseAttempts[0].solution_on_submit,false);
assert.equal(s.data.workspace.topics.find(t=>t.topic_id===bank.topicId)?.level,1);
assert(!s.data.badges.some(b=>b.badge_id===`topic-${bank.topicId}`),'One answer must not manufacture mastery rewards.');
mutate(s,command({answer:'987654321',status:'correct'}),1000);
assert.equal(s.data.workspace.exerciseAttempts[0].status,'incorrect','Commands cannot supply their own result.');
const draft=command({answer:'',submit:false});mutate(s,draft,1000);
assert.equal(s.data.workspace.exerciseAttempts[0].status,'draft');assert.equal(s.data.workspace.exerciseAttempts[0].review_at,null);
assert.equal(s.data.workspace.exerciseAttempts[0].submitted_at,null);assert.equal(s.data.workspace.exerciseAttempts[0].hint_count_on_submit,null);assert.equal(s.data.workspace.exerciseAttempts[0].solution_on_submit,null);
assert.throws(()=>mutate(s,command({answer:'  '}),1000),/Write an answer/);
assert.throws(()=>mutate(s,command({contentVersion:bank.version+1}),1000),/version/);
assert.throws(()=>mutate(s,command({exerciseId:'missing-exercise'}),1000),/exercise/);
assert.throws(()=>mutate(s,command({hintCount:exercise.hints.length+1}),1000),/hint count/);
assert.throws(()=>mutate(s,command({answer:'x'.repeat(5001)}),1000));
assert.throws(()=>mutate(s,{...first,answer:'Changed'},1100),/another tab/);
const alternate=bank.exercises.find(e=>e.id!==exercise.id)!;
assert.throws(()=>mutate(s,{...first,exerciseId:alternate.id,expectedUpdatedAt:1000},1100),/another exercise/);
mutate(s,{...first,hintCount:exercise.hints.length,solutionRevealed:true,expectedUpdatedAt:1000},1100);
mutate(s,{...first,hintCount:0,solutionRevealed:false,expectedUpdatedAt:1100},1100);
const revised=s.data.workspace.exerciseAttempts.find(a=>a.id===first.id)!;
assert.equal(revised.hint_count,exercise.hints.length);assert(revised.solution_revealed);assert.equal(revised.created_at,1000);assert.equal(revised.updated_at,1101);
assert.equal(revised.submitted_at,1000);assert.equal(revised.hint_count_on_submit,0);assert.equal(revised.solution_on_submit,false,'Opening help later must not rewrite first-submission evidence.');
assert.equal(s.data.workspace.exerciseAttempts.filter(a=>a.id===first.id).length,1);
mutate(s,{...first,submit:false,expectedUpdatedAt:1101},1102);
assert.equal(revised.status,'correct');assert.equal(revised.review_at,86401000);
assert.throws(()=>mutate(s,{...first,answer:'An edited answer',expectedUpdatedAt:1102},1103),/another attempt/);
const review=bank.exercises.find(e=>e.purpose==='review')!;
assert(review,'Numerical practice needs a fresh review exercise.');
const reviewAnswer=review.format==='number'||review.format==='choice'?String(review.answer):review.acceptedAnswers?.[0]??'My review response';
mutate(s,command({exerciseId:review.id,answer:reviewAnswer,reflection:'I checked my work.'}),86402000);
assert.equal(revised.review_at,null,'Submitting fresh review fulfills prior overdue reminders.');
assert.equal(s.data.workspace.topics.find(t=>t.topic_id===bank.topicId)?.review_at,172802000);

const rubricBank=Object.values(practiceBanks).find(b=>b.exercises.some(e=>e.format==='rubric'))!;
assert(rubricBank,'At least one topic must contain rubric practice.');
const rubric=rubricBank.exercises.find(e=>e.format==='rubric') as PracticeExercise;
const rubricCommand=command({topicId:rubricBank.topicId,exerciseId:rubric.id,contentVersion:rubricBank.version,answer:'My worked response.'});
assert.throws(()=>mutate(s,rubricCommand,1200),/reflection/);
mutate(s,{...rubricCommand,reflection:'I compared my response with each rubric point.'},1200);
assert.equal(s.data.workspace.exerciseAttempts[0].status,'self-reviewed');

const imported=blankState();mergeBackup(imported,backup(s),1300);
assert.deepEqual(imported.data.workspace.exerciseAttempts,s.data.workspace.exerciseAttempts);
assert.deepEqual(imported.data.workspace.lessonOpened,s.data.workspace.lessonOpened);
mergeBackup(imported,backup(s),1300);assert.equal(imported.data.workspace.exerciseAttempts.length,s.data.workspace.exerciseAttempts.length);
const localRevision=structuredClone(imported.data.workspace.exerciseAttempts[0]);
const differentContent=backup(s);differentContent.workspace.exerciseAttempts[0].reflection='An older reflection from another backup.';
mergeBackup(imported,differentContent,1300);
assert.deepEqual(imported.data.workspace.exerciseAttempts[0],localRevision,'Current local content wins for matching attempt identities.');
for(const change of [
 (b:ReturnType<typeof backup>)=>{b.workspace.exerciseAttempts.push({...b.workspace.exerciseAttempts[0]});},
 (b:ReturnType<typeof backup>)=>{b.workspace.exerciseAttempts[0].exercise_id='missing';},
 (b:ReturnType<typeof backup>)=>{b.workspace.exerciseAttempts[0].hint_count=99;},
 (b:ReturnType<typeof backup>)=>{b.workspace.exerciseAttempts[0].status='correct';},
 (b:ReturnType<typeof backup>)=>{b.workspace.exerciseAttempts[0].exercise_id=exercise.id;b.workspace.exerciseAttempts[0].topic_id=bank.topicId;b.workspace.exerciseAttempts[0].content_version=bank.version;b.workspace.exerciseAttempts[0].answer=correct;b.workspace.exerciseAttempts[0].hint_count=0;b.workspace.exerciseAttempts[0].status='correct';},
 (b:ReturnType<typeof backup>)=>{b.workspace.exerciseAttempts[0].updated_at=0;},
 (b:ReturnType<typeof backup>)=>{b.workspace.exerciseAttempts[0].submitted_at=b.workspace.exerciseAttempts[0].updated_at+1;},
 (b:ReturnType<typeof backup>)=>{b.workspace.exerciseAttempts[0].hint_count_on_submit=99;},
 (b:ReturnType<typeof backup>)=>{b.workspace.exerciseAttempts[0].solution_on_submit=true;b.workspace.exerciseAttempts[0].solution_revealed=false;},
]){const malformed=backup(s);change(malformed);malformed.wordCounts.spanish=999;const before=structuredClone(imported);assert.throws(()=>mergeBackup(imported,malformed,1400));assert.deepEqual(imported,before,'An invalid backup must leave even direct state callers unchanged.');}
const legacy=backup(blankState(),2) as any;delete legacy.workspace.exerciseAttempts;delete legacy.workspace.lessonOpened;
assert(backupSchema.safeParse(legacy).success);const legacyState=blankState();mergeBackup(legacyState,legacy,1500);assert.deepEqual(legacyState.data.workspace.exerciseAttempts,[]);
delete legacy.version;delete legacy.format;assert(backupSchema.safeParse(legacy).success);
const longLived=blankState(),oldDraft=command({submit:false,hintCount:exercise.hints.length,solutionRevealed:true});mutate(longLived,oldDraft,1000);
mutate(longLived,{...oldDraft,hintCount:0,solutionRevealed:false,submit:true,expectedUpdatedAt:1000},86401000);
const longLivedAttempt=longLived.data.workspace.exerciseAttempts[0];assert.equal(longLivedAttempt.created_at,1000);assert.equal(longLivedAttempt.submitted_at,86401000);assert.equal(longLivedAttempt.hint_count_on_submit,exercise.hints.length);assert.equal(longLivedAttempt.solution_on_submit,true,'First submission snapshots include all persisted earlier help.');
assert.equal(practiceEvidence(bank.topicId,longLived.data.workspace.exerciseAttempts).unaided,0);
const afterSubmission=blankState(),firstAnswer=command();mutate(afterSubmission,firstAnswer,1000);
assert.equal(practiceEvidence(bank.topicId,afterSubmission.data.workspace.exerciseAttempts).unaided,1);
mutate(afterSubmission,{...firstAnswer,submit:false,hintCount:exercise.hints.length,solutionRevealed:true,expectedUpdatedAt:1000},2000);
assert.equal(practiceEvidence(bank.topicId,afterSubmission.data.workspace.exerciseAttempts).unaided,1,'Opening the explanation after a correct first answer preserves its recorded independence.');
const weeklyState=blankState(),weeklyAnswer=command(),lastWeek=new Date(2026,8,29,12).getTime(),thisWeek=new Date(2026,9,6,12).getTime();
mutate(weeklyState,weeklyAnswer,lastWeek);
mutate(weeklyState,{...weeklyAnswer,submit:false,solutionRevealed:true,expectedUpdatedAt:lastWeek},thisWeek);
const weeklyAttempts=(week:string)=>weeklyReport(weeklyState.data,week).sections.find(section=>section.heading==='My exercise attempts')!.lines[0];
assert(weeklyAttempts('2026-09-28').startsWith('1 saved attempts'),'The first submission belongs in its original week.');
assert(weeklyAttempts('2026-10-05').startsWith('0 saved attempts'),'Opening old feedback must not count the response again in the current week.');

const legacyIdb=blankState();delete (legacyIdb.data.workspace as any).exerciseAttempts;delete (legacyIdb.data.workspace as any).lessonOpened;
const db=await openDatabase();await new Promise<void>((resolve,reject)=>{const tx=db.transaction('workspace','readwrite');tx.objectStore('workspace').put(legacyIdb,'main');tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);});
const saved=command({submit:false});await transact(state=>mutate(state,saved,2000));
const simultaneous=await Promise.allSettled([transact(state=>mutate(state,{...saved,submit:true,expectedUpdatedAt:2000},2100)),transact(state=>mutate(state,{...saved,answer:'987654321',submit:true,expectedUpdatedAt:2000},2100))]);
assert.equal(simultaneous.filter(r=>r.status==='fulfilled').length,1);assert.equal(simultaneous.filter(r=>r.status==='rejected').length,1);
const persisted=await transact(state=>structuredClone(state),false);assert.equal(persisted.data.workspace.exerciseAttempts.length,1);
const exported=await exportBackup();assert.equal(exported.version,3);assert(!/apiKey|Authorization|testing-key|secret-key|accessToken/.test(JSON.stringify(exported)),'Practice backups contain no credential fields.');const restored=blankState();mergeBackup(restored,exported,2200);
assert.deepEqual(restored.data.workspace.exerciseAttempts,persisted.data.workspace.exerciseAttempts);
const badIdb=structuredClone(exported);badIdb.workspace.exerciseAttempts[0].exercise_id='missing';
const beforeIdb=await transact(state=>structuredClone(state),false);await assert.rejects(transact(state=>mergeBackup(state,badIdb,2300)));assert.deepEqual(await transact(state=>state,false),beforeIdb);
console.log('Passed: saved practice migration, store-derived correctness, rubric reflection, optimistic concurrent writes, monotonic assistance, first-submission time and exposure snapshots, retry identity, review reminders, v3 round-trip and legacy imports, local revision precedence, invalid backup rollback in memory and IndexedDB.');
