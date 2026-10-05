import assert from 'node:assert/strict';
import {practiceBanks,checkExercise,numericAnswer,freshReviewExercise,practiceEvidence} from '../src/lib/practice';
import {topicTracks} from '../src/lib/learning';
import type {ExerciseAttempt,PracticeExercise} from '../src/lib/practice-types';
const topics=Object.values(topicTracks).flat();
assert.equal(topics.length,96);
assert.deepEqual(Object.keys(practiceBanks).sort(),topics.map(t=>t.id).sort(),'Every declared topic has an authored bank');
let tasks=0,examples=0;const globalIds=new Set<string>();
for(const topic of topics){
 const bank=practiceBanks[topic.id];assert.equal(bank.topicId,topic.id);assert(bank.version>=1);assert(bank.scope.trim());assert(bank.objectives.length>=3);assert.equal(bank.reviewStatus,'awaiting-subject-review');
 const objectiveIds=new Set(bank.objectives.map(o=>o.id));assert.equal(objectiveIds.size,bank.objectives.length);
 for(const o of bank.objectives){assert(o.title.trim());assert(o.prerequisites.every(p=>p.trim()));assert(o.misconceptions.length);const mapped=bank.exercises.filter(e=>e.objectiveId===o.id);for(const purpose of ['guided','independent','review'])assert(mapped.some(e=>e.purpose===purpose),`${topic.id}/${o.id} lacks ${purpose}`);}
 for(const purpose of ['example','transfer','application'])assert(bank.exercises.some(e=>e.purpose===purpose),`${topic.id} lacks ${purpose}`);
 const learner=bank.exercises.filter(e=>e.purpose!=='example');assert(learner.length>=12,topic.id+' needs useful task choice');assert.equal(new Set(learner.map(e=>e.prompt)).size,learner.length,'Repeated prompts cannot inflate learner coverage');
 for(const e of bank.exercises){
  assert(!globalIds.has(e.id),e.id+' repeats');globalIds.add(e.id);assert(e.id.length<=100);assert(objectiveIds.has(e.objectiveId));assert(e.prompt.trim());assert(e.hints.length>=2);assert(e.hints.every(h=>h.trim()));assert(e.solution.length>=2);assert(e.solution.every(s=>s.step.trim()&&s.why.trim()));assert(e.mistakes.length);
  if(e.purpose==='example')examples++;else tasks++;
  if(e.format==='number'){assert(Number.isFinite(e.answer));assert.equal(checkExercise(e,String(e.answer)).status,'correct');assert.equal(checkExercise(e,'0/0').status,'incorrect');if(e.answer!==0&&Math.abs(e.answer!)>(e.tolerance??1e-9))assert.equal(checkExercise(e,'0').status,'incorrect',e.id+' must reject zero, including tiny physical constants');}
  if(e.format==='choice'){assert(e.choices&&e.choices.length>=2);assert(Number.isInteger(e.answer)&&e.answer!>=0&&e.answer!<e.choices!.length,e.id+' invalid answer index');assert.equal(checkExercise(e,String(e.answer)).status,'correct');for(let i=0;i<e.choices!.length;i++)if(i!==e.answer)assert.equal(checkExercise(e,String(i)).status,'incorrect');}
  if(e.format==='text'){assert(e.acceptedAnswers?.length);for(const answer of e.acceptedAnswers!)assert.equal(checkExercise(e,answer).status,'correct');}
  if(e.format==='rubric'){assert(e.rubric&&e.rubric.length>=2);assert.equal(checkExercise(e,'any work').status,'self-reviewed');}
 }
}
assert.equal(numericAnswer('3 / 4'),.75);assert.equal(numericAnswer('−2.5'),-2.5);assert.equal(numericAnswer('1e3'),1000);
for(const unsafe of ['','1/0','NaN','Infinity','1+1','alert(1)','1,000','2 m'])assert.equal(numericAnswer(unsafe),null);
const numeric:PracticeExercise={id:'test',objectiveId:'test',purpose:'independent',difficulty:'core',format:'number',prompt:'Find 18 ÷ 3 × 2 + 1.',answer:13,hints:['Equal priority operations run left to right.','Compute 18 ÷ 3 first.'],solution:[{step:'18 ÷ 3 = 6',why:'Division appears first.'},{step:'6 × 2 + 1 = 13',why:'Multiplication precedes addition.'}],mistakes:[{answer:'4',feedback:'Multiplying the divisor changes the grouping; division and multiplication run left to right.'}]};
assert.equal(checkExercise(numeric,'4').feedback,numeric.mistakes[0].feedback);assert.equal(checkExercise(numeric,'13').status,'correct');
const topicId=topics[0].id,bank=practiceBanks[topicId],review=bank.exercises.find(e=>e.purpose==='review')!,independent=bank.exercises.find(e=>e.purpose==='independent')!;
const attempt=(exerciseId:string,created:number,patch:Partial<ExerciseAttempt>={}):ExerciseAttempt=>({id:String(created),topic_id:topicId,exercise_id:exerciseId,content_version:1,answer:'1',hint_count:0,solution_revealed:false,status:'correct',reflection:'',created_at:created,updated_at:created,review_at:created+86400000,submitted_at:created,hint_count_on_submit:0,solution_on_submit:false,...patch});
const first=attempt(independent.id,1000);
assert.equal(freshReviewExercise(topicId,[first],1001),undefined,'A future reminder is not due');
assert(freshReviewExercise(topicId,[first],86401000),'A due reminder offers unseen review');
assert.notEqual(freshReviewExercise(topicId,[first,attempt(review.id,2000,{status:'draft',review_at:null})],86401000)?.id,review.id,'Opening a review prevents calling it fresh');
assert.equal(practiceEvidence(topicId,[first,attempt(review.id,2000)]).laterRecall,0,'Immediate review is not later recall');
assert.equal(practiceEvidence(topicId,[first,attempt(review.id,86402000)]).laterRecall,1);
assert.equal(practiceEvidence(topicId,[attempt(independent.id,1,{status:'draft',hint_count:1,review_at:null}),attempt(independent.id,2)]).unaided,0,'Earlier help cannot become unaided by retrying');
assert.equal(practiceEvidence(topicId,[attempt(independent.id,1,{solution_revealed:true,solution_on_submit:true}),attempt(independent.id,2)]).unaided,0);
assert.equal(practiceEvidence(topicId,[{...attempt(independent.id,1,{solution_revealed:true,solution_on_submit:true}),id:'earlier'},attempt(independent.id,1)]).unaided,0,'Equal timestamps cannot erase earlier assistance');
assert.equal(practiceEvidence(topicId,[attempt(independent.id,1,{updated_at:86402000,submitted_at:86402000}),attempt(review.id,86403000)]).laterRecall,0,'An old draft just submitted is not earlier practice from a day ago');
assert.equal(practiceEvidence(topicId,[attempt(independent.id,1,{solution_revealed:true,solution_on_submit:false})]).unaided,1,'Reading a solution after a correct answer preserves the first-submission evidence');
console.log(`Passed practice content/checker contract: 96 topic banks, ${tasks} learner tasks, ${examples} worked examples; safe number parsing, first-answer evidence and fresh later review.`);
