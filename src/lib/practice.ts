import {stemBanks} from './practice-stem';
import {appliedBanks} from './practice-applied';
import type {ExerciseAttempt,PracticeExercise} from './practice-types';
export const practiceBanks={...stemBanks,...appliedBanks};
export const purposeLabels={example:'Worked examples',guided:'Guided practice',independent:'Independent practice',transfer:'Reasoning & transfer',application:'Applications',review:'Fresh review'} as const;
const normal=(answer:string)=>answer.trim().toLowerCase().replace(/−/g,'-').replace(/≤/g,'<=').replace(/≥/g,'>=').replace(/\s+/g,' ');
const expression=(answer:string)=>normal(answer).replace(/\s*([=<>+*/(),])\s*/g,'$1');
// Parse values, not JavaScript. Fractions and scientific notation are supported;
// units remain in the prompt so a missing unit is never silently guessed.
export function numericAnswer(answer:string):number|null{
 const value=answer.trim().replace(/−/g,'-');
 const pattern=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
 const parts=value.split('/').map(s=>s.trim());
 if(parts.length>2||parts.some(s=>!pattern.test(s)))return null;
 const operands=parts.map(Number);if(operands.some(n=>!Number.isFinite(n)))return null;
 const result=operands[0]/(parts.length===2?operands[1]:1);
 return Number.isFinite(result)?result:null;
}
export function checkExercise(exercise:PracticeExercise,answer:string):{status:'correct'|'incorrect'|'self-reviewed';feedback:string}{
 if(exercise.format==='rubric')return {status:'self-reviewed',feedback:'Compare your work with each criterion and the model approach. This records your own review; Atlas does not grade this work.'};
 let correct=false;
 if(exercise.format==='number'){
  const value=numericAnswer(answer),expected=exercise.answer;
  correct=value!==null&&expected!==undefined&&Math.abs(value-expected)<=Math.max(exercise.tolerance??1e-9,Number.EPSILON*Math.abs(expected)*4);
 }else if(exercise.format==='choice')correct=answer===String(exercise.answer);
 else correct=(exercise.acceptedAnswers??[]).some(a=>normal(a)===normal(answer)||expression(a)===expression(answer));
 if(correct)return {status:'correct',feedback:'This answer matches the check. Explain your method or compare it with the worked steps.'};
 const mistake=exercise.mistakes.find(m=>normal(m.answer)===normal(answer)||(exercise.format==='choice'&&normal(m.answer)===normal(exercise.choices?.[Number(answer)]??''))||(exercise.format==='number'&&numericAnswer(m.answer)!==null&&numericAnswer(m.answer)===numericAnswer(answer)));
 return {status:'incorrect',feedback:mistake?.feedback??exercise.hints[0]??'Compare your method with the worked steps, then try again.'};
}
export function freshReviewExercise(topicId:string,attempts:ExerciseAttempt[],now=Date.now()):PracticeExercise|undefined{
 const bank=practiceBanks[topicId];if(!bank)return;
 const due=attempts.some(a=>a.topic_id===topicId&&a.review_at!==null&&a.review_at<=now);
 if(!due)return;
 // A solution reveal also counts as exposure. Never call an already opened task fresh.
 const seen=new Set(attempts.filter(a=>a.topic_id===topicId).map(a=>a.exercise_id));
 return bank.exercises.find(e=>e.purpose==='review'&&!seen.has(e.id));
}
export function practiceEvidence(topicId:string,attempts:ExerciseAttempt[]){
 const rows=attempts.filter(a=>a.topic_id===topicId),submitted=rows.filter(a=>a.status!=='draft');
 const distinct=(items:ExerciseAttempt[])=>new Set(items.map(a=>a.exercise_id)).size;
 const unaided=submitted.filter(a=>a.status==='correct'&&a.hint_count_on_submit===0&&a.solution_on_submit===false&&!rows.some(prior=>prior.id!==a.id&&prior.exercise_id===a.exercise_id&&prior.created_at<=a.created_at&&(prior.solution_revealed||prior.hint_count||prior.status!=='draft')));
 const bank=practiceBanks[topicId];
 return {attempted:distinct(submitted),checked:distinct(submitted.filter(a=>a.status==='correct')),unaided:distinct(unaided),applications:distinct(submitted.filter(a=>bank?.exercises.find(e=>e.id===a.exercise_id)?.purpose==='application')),selfReviewed:distinct(submitted.filter(a=>a.status==='self-reviewed')),laterRecall:distinct(unaided.filter(a=>bank?.exercises.find(e=>e.id===a.exercise_id)?.purpose==='review'&&rows.some(prior=>prior.exercise_id!==a.exercise_id&&prior.status!=='draft'&&prior.submitted_at!==null&&prior.submitted_at+86400000<=a.created_at)))};
}
