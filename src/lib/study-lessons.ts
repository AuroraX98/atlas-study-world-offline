export type StudyLesson={title:string;explanation:string[];example:string;analogy:string;terms:{term:string;definition:string}[];question:string;choices:string[];answer:number;feedback:string;practice:string;sources:{title:string;url:string}[]};
import lessons from './study-lessons.json';
export const studyLessons=lessons as Record<string,StudyLesson>;
