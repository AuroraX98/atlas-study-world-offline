import type {ExerciseAttempt,PracticeExercise} from './practice-types';
export type PracticeDraft={attemptId:string;answer:string;reflection:string;hintCount:number;solutionRevealed:boolean;expectedUpdatedAt:number|null};
export type RegisterPracticeFlush=(flush:null|(()=>Promise<void>))=>void;
export async function flushPracticeDraft(dirty:boolean,save:()=>Promise<boolean>){if(dirty&&!await save())throw new Error('Your exercise has not saved. Keep this view open and retry saving, or copy your work.');}
// A completed attempt is immutable. Preserve different cached work as a new
// attempt instead of displaying it beside feedback for somebody else's answer.
export function recoverPracticeDraft(value:unknown,exercise:PracticeExercise,rows:ExerciseAttempt[],createId:()=>string):{draft:PracticeDraft;recovered:boolean}|null{
 const cached=value as PracticeDraft|null;
 if(!cached||typeof cached.attemptId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cached.attemptId)||typeof cached.answer!=='string'||cached.answer.length>5000||typeof cached.reflection!=='string'||cached.reflection.length>5000||!Number.isInteger(cached.hintCount)||cached.hintCount<0||cached.hintCount>exercise.hints.length||typeof cached.solutionRevealed!=='boolean'||!(cached.expectedUpdatedAt===null||Number.isSafeInteger(cached.expectedUpdatedAt)&&cached.expectedUpdatedAt>=0))return null;
 const saved=rows.find(a=>a.id===cached.attemptId);
 if(!saved||saved.status==='draft')return {draft:cached,recovered:false};
 if(saved.answer!==cached.answer||saved.reflection!==cached.reflection)return {draft:{...cached,attemptId:createId(),expectedUpdatedAt:null},recovered:true};
 return {draft:{...cached,hintCount:Math.max(cached.hintCount,saved.hint_count),solutionRevealed:cached.solutionRevealed||saved.solution_revealed,expectedUpdatedAt:saved.updated_at},recovered:false};
}
