import type {JournalEntry} from './workspace';
export type JournalDraft=Omit<JournalEntry,'created_at'|'updated_at'>;
export const meaningfulJournal=(draft:JournalDraft)=>!!(draft.title||draft.events||draft.challenges||draft.lessons||draft.goals||draft.vision);
export function journalEntries(entries:JournalEntry[],draft:JournalDraft):JournalDraft[]{
 const include=meaningfulJournal(draft)||entries.some(entry=>entry.id===draft.id);
 return [...entries.filter(entry=>entry.id!==draft.id),...(include?[draft]:[])].sort((a,b)=>a.date.localeCompare(b.date));
}
export function createJournalAutosave<T>(persist:(draft:T)=>Promise<void>,delay=650){
 let timer:ReturnType<typeof setTimeout>|undefined;
 const cancel=()=>{if(timer!==undefined)clearTimeout(timer);timer=undefined};
 return {
  cancel,
  schedule(draft:T){cancel();timer=setTimeout(()=>{timer=undefined;void persist(draft).catch(()=>{})},delay)},
  flush(draft:T){cancel();return persist(draft)}
 };
}
