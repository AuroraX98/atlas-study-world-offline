import type {LanguageId} from '@/lib/languages';
"use client";
import {useEffect,useRef,useState} from "react";
import {worldSubjects,levelFor,type SubjectId,type Settings} from "@/lib/study";
import type * as THREE from "three";
export default function StudyWorld({language,selected,onSelect,totals,settings,badgeCounts}:{language:LanguageId;selected:SubjectId;onSelect:(id:SubjectId)=>void;totals:Record<SubjectId,number>;settings:Settings;badgeCounts:Partial<Record<SubjectId,number>>}){
 const subjects=worldSubjects(language,selected),subjectKey=subjects.map(s=>s.id).join(',');
 const host=useRef<HTMLDivElement>(null),labels=useRef<(HTMLButtonElement|null)[]>([]),select=useRef(onSelect),selectedRef=useRef(selected),focusedRef=useRef<SubjectId|null>(null),navigate=useRef<(id:SubjectId|null)=>void>(()=>{}),[focused,setFocused]=useState<SubjectId|null>(null),[failed,setFailed]=useState(false);
 const totalKey=JSON.stringify(totals),equippedKey=JSON.stringify(settings.equipped),badgeKey=JSON.stringify(badgeCounts);
 select.current=onSelect;selectedRef.current=selected;
 const visit=(id:SubjectId)=>{select.current(id);navigate.current(id)};
 useEffect(()=>{if(focusedRef.current&&focusedRef.current!==selected)navigate.current(selected)},[selected]);
 useEffect(()=>{let disposed=false,frame=0,cleanup=()=>{};
 (async()=>{try{const T=await import('three');const {OrbitControls}=await import('three/examples/jsm/controls/OrbitControls.js');if(disposed||!host.current)return;
 const container=host.current,scene=new T.Scene();scene.fog=new T.FogExp2(0x071222,.016);
 const renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.6));renderer.setClearColor(0x071222,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.4;container.appendChild(renderer.domElement);
 const reducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
 const overviewPosition=new T.Vector3(0,15,22),overviewTarget=new T.Vector3(0,2,0);
 const camera=new T.PerspectiveCamera(45,1,.1,160);camera.position.copy(overviewPosition);camera.lookAt(overviewTarget);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;controls.target.copy(overviewTarget);controls.minDistance=5;controls.maxDistance=36;controls.minPolarAngle=.35;controls.maxPolarAngle=1.3;controls.autoRotate=!settings.calm&&!reducedMotion;controls.autoRotateSpeed=.22;controls.enableZoom=true;
 scene.add(new T.AmbientLight(0x7794c6,2));const sun=new T.DirectionalLight(0xd5ffef,3);sun.position.set(3,14,10);scene.add(sun);const rim=new T.DirectionalLight(0x7a75ff,3);rim.position.set(-12,3,-12);scene.add(rim);
 const geom:THREE.BufferGeometry[]=[],mats:THREE.Material[]=[];const material=(color:string|number,glow=0)=>{const m=new T.MeshStandardMaterial({color,metalness:.25,roughness:.6,emissive:color,emissiveIntensity:glow});mats.push(m);return m};
 const mesh=(g:THREE.BufferGeometry,m:THREE.Material,parent:THREE.Object3D,x=0,y=0,z=0)=>{geom.push(g);const obj=new T.Mesh(g,m);obj.position.set(x,y,z);parent.add(obj);return obj;};
 const groups:THREE.Group[]=[],rings:THREE.Mesh[]=[],anchorHeights:number[]=[];
 const positions=[[-6,0,2],[-3,1,-4],[2,.3,-6],[6,.1,-2],[6,.4,4],[2,1.2,7],[-3,.2,7],[-7,.6,-4],[0,.2,.5]];
 subjects.forEach((s,i)=>{const group=new T.Group();const [x,y,z]=positions[i];group.position.set(x,y,z);group.userData.subject=s.id;scene.add(group);groups.push(group);
 const rock=material('#202d47'),top=material('#27464a'),accent=material(s.color,.65),dark=material('#0a1725'),level=levelFor(totals[s.id]).level,count=Math.min(12,(badgeCounts[s.id]??0));
 const base=mesh(new T.CylinderGeometry(1.65,.65,1.5,7),rock,group,0,-1,0);base.userData.subject=s.id;mesh(new T.CylinderGeometry(1.68,1.6,.18,7),top,group,0,-.2,0);
 const ringMat=new T.MeshBasicMaterial({color:s.color,transparent:true,opacity:.6});mats.push(ringMat);const ring=mesh(new T.TorusGeometry(1.95,.015,6,64),ringMat,group,0,-.15,0);ring.rotation.x=Math.PI/2;rings.push(ring);
 const symbol=mesh(i===0?new T.IcosahedronGeometry(.58,0):i>=4?new T.TorusKnotGeometry(.4,.095,70,8,2,i===5?5:3):new T.OctahedronGeometry(.6,0),accent,group,0,.9,0);symbol.userData.subject=s.id;
 mesh(new T.CylinderGeometry(.36,.48,.35,12),dark,group,0,.05,0);
 for(let k=0;k<Math.max(2,count+2);k++){const a=k*2.399,r=.85+(k%2)*.35;mesh(new T.ConeGeometry(.18,.7+(k%3)*.13,4),material(k%2?s.color:'#3e8c76',.13),group,Math.cos(a)*r,.24,Math.sin(a)*r)}
 if(count>0){const tower=mesh(new T.CylinderGeometry(.17,.26,.5+count*.12,5),accent,group,-.75,.3+count*.06,-.4);tower.rotation.z=.12;}
 const equipped=settings.equipped[s.id];if(equipped!==undefined){const trophy=mesh(new T.TorusGeometry(.34,.06,8,30),material(s.color,1),group,.8,.6,-.4);const code=Array.from(equipped).reduce((n,c)=>n+c.charCodeAt(0),0)%10;trophy.rotation.y=code*.3;mesh(new T.OctahedronGeometry(.16+(code*.012),0),accent,group,.8,.6,-.4)}
 anchorHeights.push(new T.Box3().setFromObject(group).max.y-y+.25);
 });
 const starGeo=new T.BufferGeometry();geom.push(starGeo);const stars=new Float32Array(800*3);for(let i=0;i<800;i++){const a=i*2.399,b=Math.acos(1-2*(i+.5)/800),r=38+(i%11);stars[i*3]=Math.sin(b)*Math.cos(a)*r;stars[i*3+1]=Math.cos(b)*r;stars[i*3+2]=Math.sin(b)*Math.sin(a)*r;}starGeo.setAttribute('position',new T.BufferAttribute(stars,3));const starMat=new T.PointsMaterial({color:0xc2e2ff,size:.09,transparent:true,opacity:.55});mats.push(starMat);scene.add(new T.Points(starGeo,starMat));
 const core=mesh(new T.TorusGeometry(1.3,.025,8,64),material('#b4f2cf',1),scene,0,-1,0);core.rotation.x=Math.PI/2;const core2=mesh(new T.TorusGeometry(1.8,.013,8,64),material('#7a75ff',.7),scene,0,-1,0);core2.rotation.x=Math.PI/2;
 // Camera and labels share CSS dimensions; pixel ratio only changes rendering resolution.
 type CameraMove={from:THREE.Vector3;to:THREE.Vector3;fromTarget:THREE.Vector3;toTarget:THREE.Vector3;started:number};
 let move:CameraMove|null=null;
 const resize=()=>{
  const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;
  camera.aspect=w/h;camera.fov=w/h<1?65:45;camera.updateProjectionMatrix();renderer.setSize(w,h,false);
  overviewTarget.y=w/h<1?3.4:2;
  if(!focusedRef.current){if(move)move.toTarget.copy(overviewTarget);else controls.target.copy(overviewTarget)}
 };
 const observer=new ResizeObserver(resize);observer.observe(container);resize();
 const moveTo=(id:SubjectId|null,immediate=false)=>{
  focusedRef.current=id;setFocused(id);controls.autoRotate=false;controls.enableDamping=false;controls.update();
  const group=id?groups[subjects.findIndex(s=>s.id===id)]:null;
  const target=group?group.position.clone().add(new T.Vector3(0,1.1,0)):overviewTarget.clone();
  const distance=container.clientWidth/container.clientHeight<1?6.5:8.5;
  const offset=camera.position.clone().sub(controls.target).normalize().multiplyScalar(distance);
  const destination=group?target.clone().add(offset):overviewPosition.clone();
  if(immediate||reducedMotion||settings.calm){camera.position.copy(destination);controls.target.copy(target);move=null;controls.enableDamping=true;controls.autoRotate=!id&&!settings.calm&&!reducedMotion;controls.update()}
  else move={from:camera.position.clone(),to:destination,fromTarget:controls.target.clone(),toTarget:target,started:performance.now()};
 };
 navigate.current=moveTo;
 if(focusedRef.current)moveTo(selectedRef.current,true);
 const interruptMove=()=>{move=null;controls.enableDamping=true};controls.addEventListener('start',interruptMove);
 const ray=new T.Raycaster(),pointer=new T.Vector2();let downX=0,downY=0,pressed=false;
 const down=(e:PointerEvent)=>{pressed=e.isPrimary&&e.button===0;downX=e.clientX;downY=e.clientY};
 const cancel=()=>{pressed=false};
 const up=(e:PointerEvent)=>{
  if(!pressed)return;pressed=false;if(Math.hypot(e.clientX-downX,e.clientY-downY)>6)return;
  const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
  camera.updateMatrixWorld();scene.updateMatrixWorld();ray.setFromCamera(pointer,camera);
  const hit=ray.intersectObjects(groups,true)[0];let object:THREE.Object3D|undefined=hit?.object;
  while(object&&!object.userData.subject)object=object.parent??undefined;
  if(object?.userData.subject){select.current(object.userData.subject);moveTo(object.userData.subject)}
 };
 renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('pointercancel',cancel);
 const start=performance.now(),point=new T.Vector3();let previous=start;
 const animate=()=>{
  if(disposed)return;const now=performance.now(),seconds=(now-start)/1000,delta=Math.min((now-previous)/1000,.05);previous=now;
  groups.forEach((g,i)=>{g.position.y=positions[i][1]+(settings.calm||reducedMotion?0:Math.sin(seconds*.65+i)*.14);(rings[i].material as THREE.MeshBasicMaterial).opacity=selectedRef.current===subjects[i].id?.9:.16});
  if(move){const t=Math.min(1,(now-move.started)/850),ease=t*t*(3-2*t);camera.position.lerpVectors(move.from,move.to,ease);controls.target.lerpVectors(move.fromTarget,move.toTarget,ease);if(t===1){move=null;controls.enableDamping=true;controls.autoRotate=!focusedRef.current&&!settings.calm&&!reducedMotion}}
  controls.update(delta);scene.updateMatrixWorld();camera.updateMatrixWorld();
  const projected=groups.map((g,i)=>{
   point.set(0,anchorHeights[i],0);g.localToWorld(point);point.project(camera);
   return {i,x:(point.x*.5+.5)*container.clientWidth,y:(-point.y*.5+.5)*container.clientHeight,visible:point.z>=-1&&point.z<=1&&Math.abs(point.x)<1.1&&Math.abs(point.y)<1.1&&(!focusedRef.current||focusedRef.current===subjects[i].id)};
  });
  const placed:{left:number;right:number;top:number;bottom:number}[]=[];
  // Lift overlapping names vertically, keeping every name centered on its own island.
  projected.sort((a,b)=>b.y-a.y).forEach(({i,x,y,visible})=>{
   const label=labels.current[i];if(!label)return;
   const width=label.offsetWidth,height=label.offsetHeight;let bottom=y;
   if(visible){for(let attempt=0;attempt<subjects.length;attempt++){const overlap=placed.find(box=>x+width/2+4>box.left&&x-width/2-4<box.right&&bottom>box.top-4&&bottom-height<box.bottom+4);if(!overlap)break;bottom=overlap.top-4}placed.push({left:x-width/2,right:x+width/2,top:bottom-height,bottom})}
   label.style.left=visible?`${x}px`:'0px';label.style.top=visible?`${bottom}px`:'0px';label.style.setProperty('--stem',`${y-bottom+7}px`);
   label.style.opacity=visible?'1':'0';label.style.visibility=visible?'visible':'hidden';label.style.pointerEvents=visible?'auto':'none';label.tabIndex=visible?0:-1;
  });
  renderer.render(scene,camera);frame=requestAnimationFrame(animate);
 };animate();
 cleanup=()=>{observer.disconnect();navigate.current=()=>{};controls.removeEventListener('start',interruptMove);renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('pointercancel',cancel);controls.dispose();geom.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove()};
 }catch(e){console.error('3D world unavailable',e);if(!disposed)setFailed(true)}})();return()=>{disposed=true;cancelAnimationFrame(frame);cleanup()};
 },[subjectKey,totalKey,settings.calm,equippedKey,badgeKey]);
 return <div className={'world-canvas'+(focused?' island-closeup':'')} ref={host} aria-label="Interactive 3D study islands. Drag to explore. Select an island for a close-up.">{!failed&&<button className="world-reset" onClick={()=>navigate.current(null)}>↖ Whole world</button>}{failed?<div className="world-fallback"><p>Explore your subjects below.</p><p className="muted">3D graphics are unavailable on this device.</p></div>:subjects.map((s,i)=><button key={s.id} ref={el=>{labels.current[i]=el}} onClick={()=>visit(s.id)} aria-label={`Explore ${s.name} island, level ${levelFor(totals[s.id]).level}`} aria-pressed={focused===s.id} className={'island-label '+(selected===s.id?'active':'')} style={{'--subject':s.color} as React.CSSProperties}><span>{s.glyph}</span>{s.name}<small>LV {levelFor(totals[s.id]).level}</small></button>)}</div>;
}
