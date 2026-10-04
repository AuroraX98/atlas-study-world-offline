import assert from 'node:assert/strict';
import {galleryDraftKey,parseGalleryDraft,readGalleryDraft,writeGalleryDraft,clearGalleryDraft,sameGalleryDraft,type GalleryDraft} from '../src/lib/gallery-draft';
import {registerCustomSubjects} from '../src/lib/study';

const memory=new Map<string,string>();
Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>memory.get(key)??null,setItem:(key:string,value:string)=>memory.set(key,value),removeItem:(key:string)=>memory.delete(key)}});
const draft:GalleryDraft={subject:'art',title:'Perspective study',reflection:'I drew a room and checked the vanishing point.',link:'https://example.com/drawing'};
assert(writeGalleryDraft(draft));
assert.deepEqual(readGalleryDraft(),draft); // Reopening the form/reloading reads the saved local form.
assert.deepEqual(parseGalleryDraft(JSON.stringify({...draft,apiKey:'secret',connection:{key:'secret'},completed_at:1})),draft);
assert(!memory.get(galleryDraftKey)!.includes('apiKey'));
assert.equal(parseGalleryDraft('{broken'),null);
assert.equal(parseGalleryDraft(JSON.stringify({...draft,subject:'unregistered-subject'})),null);
for(const [field,limit] of [['title',180],['reflection',5000],['link',2000]] as const){
 assert(parseGalleryDraft(JSON.stringify({...draft,[field]:'x'.repeat(limit)})));
 assert.equal(parseGalleryDraft(JSON.stringify({...draft,[field]:'x'.repeat(limit+1)})),null);
}
assert.equal(parseGalleryDraft('x'.repeat(45001)),null);
assert(!writeGalleryDraft({...draft,title:'x'.repeat(181)}));
assert.deepEqual(readGalleryDraft(),draft);

const newer={...draft,subject:'physics' as const,reflection:'A new explanation typed while the save was running.'};
writeGalleryDraft(newer);
assert.equal(clearGalleryDraft(draft),false);
assert.deepEqual(readGalleryDraft(),newer);
assert.equal(sameGalleryDraft(draft,newer),false);
assert.equal(clearGalleryDraft(newer),true);
assert.equal(readGalleryDraft(),null);

const empty={subject:'german' as const,title:'',reflection:'',link:''};
assert(writeGalleryDraft(empty));
assert.deepEqual(readGalleryDraft(),empty); // Choosing a subject never creates completed practice.
const customId='custom-test-gallery' as const;
registerCustomSubjects([{id:customId,name:'Robotics',color:'#abcdef',glyph:'R'}]);
assert(writeGalleryDraft({...draft,subject:customId}));
assert.equal(readGalleryDraft()?.subject,customId);
registerCustomSubjects([]);
assert.equal(readGalleryDraft(),null); // Removed subjects are not silently attributed to another subject.
assert.equal(readGalleryDraft([customId])?.subject,customId);

Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:()=>{throw Error('unavailable')},setItem:()=>{throw Error('full')},removeItem:()=>{throw Error('unavailable')}}});
assert.equal(readGalleryDraft(),null);
assert.equal(writeGalleryDraft(draft),false);
assert.equal(clearGalleryDraft(draft),false);
console.log('Passed: gallery drafts recover bounded form fields and custom subjects, omit unrelated data, retain edits made during saving, clear only the saved copy and report unavailable local storage.');
