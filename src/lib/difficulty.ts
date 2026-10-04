import {topicTracks} from './learning';
export const stageLabels:Record<string,string>={Foundations:'Beginner',Developing:'Intermediate',Advanced:'Advanced','Specialist topics':'Advanced · Specialist'};
export function topicDifficulty(id:string){const topic=Object.values(topicTracks).flat().find(t=>t.id===id);return topic?stageLabels[topic.stage]??topic.stage:null;}
