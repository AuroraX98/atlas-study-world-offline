import {useCallback,useEffect,useRef,useState} from 'react';
import type {Snapshot} from '@/lib/study';
import type {ExercisePurpose,PracticeBank,PracticeExercise} from '@/lib/practice-types';
import {checkExercise,freshReviewExercise,practiceBanks,practiceEvidence,purposeLabels} from '@/lib/practice';
import {recoverPracticeDraft,flushPracticeDraft,type PracticeDraft as Draft,type RegisterPracticeFlush} from '@/lib/practice-draft';

type Props={id:string;data:Snapshot;pending:boolean;act:(command:Record<string,unknown>)=>Promise<Snapshot>;registerFlush?:RegisterPracticeFlush};
export default function PracticeReader({id,data,pending,act,registerFlush}:Props){
 const cardFlush=useRef<null|(()=>Promise<void>)>(null);
 const registerCardFlush=useCallback<RegisterPracticeFlush>(flush=>{cardFlush.current=flush;registerFlush?.(flush)},[registerFlush]);
 const change=async(update:()=>void)=>{try{await cardFlush.current?.();update()}catch{}};
 const bank=practiceBanks[id],attempts=data.workspace.exerciseAttempts??[],fresh=freshReviewExercise(id,attempts);
 const [purpose,setPurpose]=useState<ExercisePurpose>(fresh?'review':'guided'),[difficulty,setDifficulty]=useState('all'),[objective,setObjective]=useState('all'),[selected,setSelected]=useState(fresh?.id??'');
 if(!bank)return null;
 const evidence=practiceEvidence(id,attempts),filtered=bank.exercises.filter(e=>e.purpose===purpose&&(difficulty==='all'||e.difficulty===difficulty)&&(objective==='all'||e.objectiveId===objective));
 const exercise=filtered.find(e=>e.id===selected)??filtered[0],index=filtered.findIndex(e=>e.id===exercise?.id);
 const submitted=attempts.filter(a=>a.topic_id===id&&a.status!=='draft');
 return <section className="studio-section practice-bank" aria-label="Offline exercise bank">
  <div><p className="eyebrow">Offline practice · Choose your next task</p><h2>Practice this topic</h2></div>
  <p className="lesson-paragraph">{bank.scope}</p>
  <div className="practice-evidence" aria-label="Recorded learning evidence"><span>{data.workspace.lessonOpened?.some(l=>l.topic_id===id)?'Lesson opened':'Lesson opening not recorded'}</span><span>{data.workspace.lessonCompletions.some(l=>l.topic_id===id)?'Introductory check saved':'Introductory check not saved'}</span><span>{evidence.attempted} tasks attempted</span><span>{evidence.unaided} first answers checked without help</span><span>{evidence.selfReviewed} tasks self-reviewed</span><span>{evidence.applications} applications attempted</span><span>{evidence.laterRecall} fresh answers checked after a day</span></div>
  <p className="small-note">These are records of specific tasks. They do not establish mastery. Open work uses your own review; a reminder does not prove recall.</p>
  <details className="practice-objectives"><summary>Skills, preparation & common mistakes</summary>{bank.objectives.map(o=><div key={o.id}><h3>{o.title}</h3><p><strong>Before you start:</strong> {o.prerequisites.join(' · ')}</p><p><strong>Watch for:</strong> {o.misconceptions.join(' · ')}</p><p className="small-note">{bank.exercises.filter(e=>e.objectiveId===o.id&&e.purpose!=='example').length} tasks for this skill</p></div>)}</details>
  <div className="practice-filters"><label>Practice set<select value={purpose} onChange={e=>{const value=e.target.value as ExercisePurpose;void change(()=>{setPurpose(value);setSelected('')})}}>{Object.entries(purposeLabels).map(([value,label])=><option key={value} value={value}>{label} ({bank.exercises.filter(e=>e.purpose===value).length})</option>)}</select></label><label>Path<select value={difficulty} onChange={e=>{const value=e.target.value;void change(()=>{setDifficulty(value);setSelected('')})}}><option value="all">Core + extension</option><option value="core">Core</option><option value="extension">Extension</option></select></label><label>Skill<select value={objective} onChange={e=>{const value=e.target.value;void change(()=>{setObjective(value);setSelected('')})}}><option value="all">All skills</option>{bank.objectives.map(o=><option key={o.id} value={o.id}>{o.title}</option>)}</select></label></div>
  {purpose==='review'&&<p className="small-note">{fresh?'An unseen review task is available now. Try it before opening hints or solutions.':submitted.length?'Review tasks are available by choice. A later recall check needs at least a day after earlier practice; tasks already opened are revisits.':'Start with some practice. Return to an unseen task after a day for a later check.'}</p>}
  {filtered.length?<><label>Choose a task<select aria-label="Choose a practice task" value={exercise.id} onChange={e=>{const value=e.target.value;void change(()=>setSelected(value))}}>{filtered.map((e,i)=><option key={e.id} value={e.id}>{i+1}. {e.prompt.slice(0,95)}{attempts.some(a=>a.exercise_id===e.id)?' · opened':''}</option>)}</select></label><div className="practice-nav"><button className="secondary-button" disabled={pending||index===0} onClick={()=>void change(()=>setSelected(filtered[index-1].id))}>Previous task</button><span>{index+1} / {filtered.length}</span><button className="secondary-button" disabled={pending||index===filtered.length-1} onClick={()=>void change(()=>setSelected(filtered[index+1].id))}>Next task</button></div><ExerciseCard key={exercise.id} {...{bank,exercise,data,pending,act}} registerFlush={registerCardFlush}/></>:<p role="status">No tasks match these filters. Choose another path or skill.</p>}
  <details><summary>Saved attempts ({submitted.length})</summary><ol className="practice-history">{submitted.slice().sort((a,b)=>(b.submitted_at??b.updated_at)-(a.submitted_at??a.updated_at)).slice(0,30).map(a=>{const task=bank.exercises.find(e=>e.id===a.exercise_id);return <li key={a.id}><strong>{a.status==='self-reviewed'?'Self-reviewed':a.status==='correct'?'Answer matched':'Needs another attempt'}</strong> · {new Date(a.submitted_at??a.updated_at).toLocaleString()}<p>{task?.prompt}</p><p>Answer: {task?.format==='choice'?task.choices?.[Number(a.answer)]??a.answer:a.answer} · {a.hint_count} hints{a.solution_revealed?' · solution opened':''}</p>{a.reflection&&<p>Reflection: {a.reflection}</p>}</li>})}</ol>{submitted.length>30&&<p>Showing the most recent 30 attempts. All attempts remain in your backup.</p>}</details>
  <details><summary>Content scope & references</summary><p>These new exercises await subject specialist review. Use the worked methods to check assumptions and seek a teacher’s review for open work.</p><ul>{bank.sources.map(url=><li key={url}><a href={url} target="_blank" rel="noopener noreferrer">{new URL(url).hostname} ↗</a></li>)}</ul></details>
 </section>;
}

function ExerciseCard({bank,exercise,data,pending,act,registerFlush}:{bank:PracticeBank;exercise:PracticeExercise;data:Snapshot;pending:boolean;act:Props['act'];registerFlush:RegisterPracticeFlush}){
 const rows=(data.workspace.exerciseAttempts??[]).filter(a=>a.exercise_id===exercise.id&&a.topic_id===bank.topicId).sort((a,b)=>b.created_at-a.created_at),latest=rows[0];
 const draftKey=`atlas-exercise-draft-${exercise.id}`;
 const recoveryNotice=useRef('');
 const initial=():Draft=>{
  try{const recovered=recoverPracticeDraft(JSON.parse(localStorage.getItem(draftKey)??'null'),exercise,rows,()=>crypto.randomUUID());if(recovered){if(recovered.recovered)recoveryNotice.current='Recovered unsaved work as another attempt. Your submitted answer remains in Saved attempts.';try{localStorage.setItem(draftKey,JSON.stringify(recovered.draft))}catch{}return recovered.draft;}localStorage.removeItem(draftKey);}catch{try{localStorage.removeItem(draftKey)}catch{}}
  return {attemptId:latest?.id??crypto.randomUUID(),answer:latest?.answer??'',reflection:latest?.reflection??'',hintCount:latest?.hint_count??0,solutionRevealed:latest?.solution_revealed??exercise.purpose==='example',expectedUpdatedAt:latest?.updated_at??null};
 };
 const [draft,setDraft]=useState<Draft>(initial),[dirty,setDirty]=useState(()=>{try{return !!localStorage.getItem(draftKey)}catch{return false}}),[error,setError]=useState(''),[saving,setSaving]=useState(false),[result,setResult]=useState<ReturnType<typeof checkExercise>|null>(()=>{const saved=rows.find(a=>a.id===draft.attemptId);return saved&&saved.status!=='draft'?checkExercise(exercise,saved.answer):null});
 const [submitRequested,setSubmitRequested]=useState(false),[cacheKept,setCacheKept]=useState(true);
 const current=useRef(draft),savingRef=useRef(false),mounted=useRef(true);
 useEffect(()=>()=>{mounted.current=false},[]);
 const keep=(next:Draft)=>{current.current=next;setDraft(next);setDirty(true);setError('');try{localStorage.setItem(draftKey,JSON.stringify(next));setCacheKept(true)}catch{setCacheKept(false)}};
 const save=async(submit:boolean,next=current.current)=>{
  if(pending||savingRef.current){if(submit)setSubmitRequested(true);return false;}
  if(submit)setSubmitRequested(false);
  savingRef.current=true;setSaving(true);setError('');
  try{
   const snapshot=await act({action:'exercise-save',id:next.attemptId,topicId:bank.topicId,exerciseId:exercise.id,contentVersion:bank.version,answer:next.answer,hintCount:next.hintCount,solutionRevealed:next.solutionRevealed,reflection:next.reflection,submit:submit||!!result,expectedUpdatedAt:next.expectedUpdatedAt});
   const saved=snapshot.workspace.exerciseAttempts.find(a=>a.id===next.attemptId)!;
   const updated={...next,hintCount:saved.hint_count,solutionRevealed:saved.solution_revealed,expectedUpdatedAt:saved.updated_at};
   if(mounted.current){current.current=updated;setDraft(updated);setDirty(false);if(submit)setResult(checkExercise(exercise,next.answer));}
   try{if(localStorage.getItem(draftKey)===JSON.stringify(next))localStorage.removeItem(draftKey)}catch{}return true;
  }catch(e){if(mounted.current){setSubmitRequested(false);setError(e instanceof Error?e.message:'Your draft could not save.');}return false;}
  finally{savingRef.current=false;if(mounted.current)setSaving(false)}
 };
 useEffect(()=>{
  if(!dirty||pending||saving||error||submitRequested)return;
  const timeout=setTimeout(()=>void save(false),800);return()=>clearTimeout(timeout);
 },[draft,dirty,pending,saving,error,submitRequested]);
 useEffect(()=>{if(submitRequested&&!pending&&!saving&&!error)void save(true)},[submitRequested,pending,saving,error]);
 useEffect(()=>{registerFlush(()=>flushPracticeDraft(dirty,()=>save(false)));return()=>registerFlush(null)},[draft,dirty,pending,saving,result,registerFlush]);
 useEffect(()=>{if(!dirty||cacheKept)return;const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue=''};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn)},[dirty,cacheKept]);
 // Record seeing the task, and solution exposure for worked examples.
 useEffect(()=>{if(!latest)keep(current.current)},[]);
 const busy=pending||saving||submitRequested,completed=!!result;
 const revealHint=async()=>{const next={...current.current,hintCount:Math.min(exercise.hints.length,draft.hintCount+1)};keep(next);await save(false,next)};
 const revealSolution=async()=>{const next={...current.current,solutionRevealed:true};keep(next);await save(false,next)};
 const retry=()=>{setResult(null);keep({attemptId:crypto.randomUUID(),answer:'',reflection:'',hintCount:0,solutionRevealed:exercise.purpose==='example',expectedUpdatedAt:null})};
 const restore=()=>{const saved=(data.workspace.exerciseAttempts??[]).find(a=>a.id===current.current.attemptId);if(!saved)return;const next={attemptId:saved.id,answer:saved.answer,reflection:saved.reflection,hintCount:saved.hint_count,solutionRevealed:saved.solution_revealed,expectedUpdatedAt:saved.updated_at};current.current=next;setDraft(next);setDirty(false);setSubmitRequested(false);setError('');setResult(saved.status==='draft'?null:checkExercise(exercise,saved.answer));try{localStorage.removeItem(draftKey)}catch{}};
 return <article className="practice-exercise">
  {recoveryNotice.current&&<p role="status" className="small-note">{recoveryNotice.current}</p>}
  <p className="eyebrow">{purposeLabels[exercise.purpose]} · {exercise.difficulty} · {bank.objectives.find(o=>o.id===exercise.objectiveId)?.title}</p>
  <h3 className="exercise-prompt">{exercise.prompt}</h3>
  {exercise.purpose!=='example'&&<form onSubmit={e=>{e.preventDefault();void save(true)}}>
   {exercise.format==='choice'?<fieldset><legend>Choose your answer</legend>{exercise.choices?.map((choice,i)=><label className="lesson-choice" key={i}><input type="radio" required name={`practice-${exercise.id}`} checked={draft.answer===String(i)} value={i} disabled={busy||completed} onChange={()=>keep({...draft,answer:String(i)})}/>{choice}</label>)}</fieldset>:<label>{exercise.format==='number'?'Your answer (use the units in the prompt; fractions such as 3/4 are accepted)':exercise.format==='rubric'?'Your work or a description of what you made':'Your answer'}<textarea required rows={exercise.format==='number'?2:4} maxLength={5000} value={draft.answer} disabled={busy||completed} onChange={e=>keep({...draft,answer:e.target.value})}/></label>}
   <label>{exercise.format==='rubric'?'Your review: which criteria did you meet, and what will you revise?':'Your method or reflection (optional)'}<textarea required={exercise.format==='rubric'} rows={3} maxLength={5000} value={draft.reflection} disabled={busy||completed} onChange={e=>keep({...draft,reflection:e.target.value})}/></label>
   {exercise.format==='rubric'&&<div className="practice-rubric"><h4>Check your work against these criteria</h4><ul>{exercise.rubric?.map(item=><li key={item}>{item}</li>)}</ul><p>For another view, show your work to a teacher or peer. Saving this task records your own review.</p></div>}
   <div className="action-row">{!completed?<><button className="primary-button" disabled={busy||!draft.answer.trim()||exercise.format==='rubric'&&!draft.reflection.trim()}>{exercise.format==='rubric'?'Save my self-review':'Check & save answer'}</button><button className="secondary-button" type="button" disabled={busy||!dirty} onClick={()=>void save(false)}>Save draft</button></>:<button className="secondary-button" type="button" disabled={busy} onClick={retry}>Start another attempt</button>}</div>
  </form>}
  <p className="small-note" aria-live="polite">{saving?'Saving to this computer…':dirty?'Draft waiting to save…':draft.expectedUpdatedAt===null?'New task · local save pending':'Saved state on this computer'}</p>
  {dirty&&!cacheKept&&<p role="alert" className="error-banner">Browser draft recovery is unavailable. Save or copy your work before closing or reloading. Navigation waits for a successful save.</p>}
  {error&&<div role="alert" className="error-banner"><p>{error} {cacheKept?'Your draft is kept for retry.':'Your work remains in this view. Save or copy it before closing.'}</p><button className="secondary-button" disabled={busy} onClick={()=>void save(false)}>Retry saving</button>{(data.workspace.exerciseAttempts??[]).some(a=>a.id===draft.attemptId)&&<button className="secondary-button" onClick={restore}>Load saved attempt</button>}</div>}
  {result&&<p role="status" className={result.status==='correct'?'lesson-correct':result.status==='incorrect'?'lesson-retry':'muted'}>{result.feedback}</p>}
  {exercise.purpose!=='example'&&<div className="action-row"><button className="secondary-button" disabled={busy||draft.hintCount>=exercise.hints.length} onClick={()=>void revealHint()}>Show hint {Math.min(draft.hintCount+1,exercise.hints.length)} / {exercise.hints.length}</button><button className="secondary-button" disabled={busy||draft.solutionRevealed} onClick={()=>void revealSolution()}>Show worked solution</button></div>}
  {draft.hintCount>0&&<ol className="practice-hints">{exercise.hints.slice(0,draft.hintCount).map((hint,i)=><li key={i}>{hint}</li>)}</ol>}
  {draft.solutionRevealed&&<div className="practice-solution"><h4>{exercise.format==='rubric'?'One model approach':'Worked solution'}</h4><ol>{exercise.solution.map((step,i)=><li key={i}><p>{step.step}</p><p className="muted"><strong>Why:</strong> {step.why}</p></li>)}</ol><details><summary>Common mistakes & next steps</summary>{exercise.mistakes.map((mistake,i)=><p key={i}><strong>{exercise.format==='choice'&&exercise.choices?.[Number(mistake.answer)]||mistake.answer}:</strong> {mistake.feedback}</p>)}</details></div>}
 </article>;
}
