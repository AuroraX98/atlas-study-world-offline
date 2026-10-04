import {subjects,type SubjectId} from './study';

export type GalleryDraft={subject:SubjectId;title:string;reflection:string;link:string};
export const galleryDraftKey='atlas-evidence-gallery-draft-v1';
type SubjectIds=readonly string[];
const knownSubjects=()=>subjects.map(subject=>subject.id);

// Keep only the form fields. This draft is separate from completed practice and backups.
export function parseGalleryDraft(raw:string|null,validSubjectIds:SubjectIds=knownSubjects()):GalleryDraft|null{
 if(!raw||raw.length>45000)return null;
 try{
  const draft=JSON.parse(raw);
  if(!draft||Array.isArray(draft)||typeof draft.subject!=='string'||!validSubjectIds.includes(draft.subject))return null;
  if(typeof draft.title!=='string'||draft.title.length>180||typeof draft.reflection!=='string'||draft.reflection.length>5000||typeof draft.link!=='string'||draft.link.length>2000)return null;
  return {subject:draft.subject as SubjectId,title:draft.title,reflection:draft.reflection,link:draft.link};
 }catch{return null}
}
export function sameGalleryDraft(a:GalleryDraft|null|undefined,b:GalleryDraft|null|undefined){
 return !!a&&!!b&&a.subject===b.subject&&a.title===b.title&&a.reflection===b.reflection&&a.link===b.link;
}
export function readGalleryDraft(validSubjectIds:SubjectIds=knownSubjects()):GalleryDraft|null{
 try{return parseGalleryDraft(localStorage.getItem(galleryDraftKey),validSubjectIds)}catch{return null}
}
export function writeGalleryDraft(draft:GalleryDraft,validSubjectIds:SubjectIds=knownSubjects()){
 const clean=parseGalleryDraft(JSON.stringify(draft),validSubjectIds);if(!clean)return false;
 try{localStorage.setItem(galleryDraftKey,JSON.stringify(clean));return true}catch{return false}
}
// A successful asynchronous save must not remove edits entered while it was in flight.
export function clearGalleryDraft(saved:GalleryDraft,validSubjectIds:SubjectIds=knownSubjects()){
 try{
  const current=readGalleryDraft(validSubjectIds);
  if(!sameGalleryDraft(current,saved))return false;
  localStorage.removeItem(galleryDraftKey);return true;
 }catch{return false}
}
