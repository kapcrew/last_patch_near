import type{BuildingId}from '../domain/logic.js';
import{paintBuilding}from './BuildingPainter.js';
import type{AssetRegistry}from './AssetRegistry.js';
export const SITES:{id:BuildingId;x:number;y:number;w:number;h:number;entry:[number,number]}[]=[
 {id:'bridge',x:268,y:232,w:103,h:58,entry:[320,298]},
 {id:'well',x:95,y:172,w:78,h:74,entry:[174,247]},
 {id:'library',x:414,y:157,w:104,h:94,entry:[460,264]},
 {id:'forge',x:518,y:244,w:104,h:76,entry:[555,320]}
];
export type Variant='broken'|'progress'|'restored';
export class WorldRenderer {
 private ctx:CanvasRenderingContext2D;private animation=0;private last=performance.now();
 readonly player={x:321,y:327};private route:[number,number][]=[];private pending:BuildingId|null=null;selected:BuildingId='bridge';onArrival:(id:BuildingId)=>void=()=>{};
 constructor(readonly canvas:HTMLCanvasElement,readonly assets:AssetRegistry,readonly getState:(id:BuildingId)=>Variant){const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas2D unavailable');this.ctx=ctx;ctx.imageSmoothingEnabled=false;}
 goTo(id:BuildingId){const site=SITES.find(s=>s.id===id)!;this.selected=id;this.pending=id;this.route=[[this.player.x,322],[site.entry[0],322],site.entry];}
 hit(x:number,y:number){return SITES.find(s=>x>=s.x-5&&y>=s.y-12&&x<s.x+s.w+5&&y<s.y+s.h+5)?.id||null}
 moveClick(x:number,y:number){const id=this.hit(x,y);if(id){this.goTo(id);return id}return null}
 private update(dt:number){let remaining=Math.min(dt,0.04)*112;while(this.route.length&&remaining>0){const [x,y]=this.route[0],dx=x-this.player.x,dy=y-this.player.y,d=Math.hypot(dx,dy);if(d<=remaining){this.player.x=x;this.player.y=y;this.route.shift();remaining-=d}else{this.player.x+=dx/d*remaining;this.player.y+=dy/d*remaining;remaining=0}}if(!this.route.length&&this.pending){const id=this.pending;this.pending=null;this.onArrival(id)}}
 render=(now:number)=>{const dt=Math.max(0,(now-this.last)/1000);this.last=now;this.animation+=dt;this.update(dt);this.draw();requestAnimationFrame(this.render)};
 private px(x:number,y:number,w:number,h:number,color:string){const c=this.ctx;c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
 private draw(){const c=this.ctx;c.imageSmoothingEnabled=false;c.clearRect(0,0,640,360);const bg=this.assets.get('background');if(bg)c.drawImage(bg,0,0,640,360);else{this.px(0,0,640,360,'#252f58');this.px(0,190,640,170,'#3c6156');this.px(280,190,110,170,'#37669b')}
 // Contact shadows keep interactive world elements legible without altering the background image.
 for(const site of SITES){const variant=this.getState(site.id);const sprite=this.assets.get(`${site.id}:${variant}`);if(sprite){c.drawImage(sprite,site.x,site.y,site.w,site.h)}else paintBuilding(c,site.id,site.x,site.y,site.w,site.h,variant,this.animation);if(site.id===this.selected){c.strokeStyle='#ffdeac';c.lineWidth=2;c.setLineDash([6,5]);c.strokeRect(site.x-5,site.y-7,site.w+10,site.h+14);c.setLineDash([])}const fl=variant==='restored'?'#b6e7b8':variant==='progress'?'#ffd99c':'#f4a6ad';this.px(site.x+site.w/2-10,site.y-17,20,11,'#151d35');this.px(site.x+site.w/2-7,site.y-14,14,5,fl)}
 // PATCHKEEPER: tiny character, detached from state machine.
 const p=this.player;this.px(p.x-6,p.y-19,12,10,'#2a3159');this.px(p.x-5,p.y-24,10,8,'#b9a6e2');this.px(p.x-3,p.y-22,6,3,'#f5d5be');this.px(p.x-8,p.y-9,16,9,'#f9c88e');this.px(p.x-5,p.y,4,5,'#2b2944');this.px(p.x+2,p.y,4,5,'#2b2944');
 const sparkle=(Math.sin(this.animation*4)+1)*.5;for(let i=0;i<9;i++){const x=(i*79+17)%640,y=(i*53+37)%330;if(sparkle>(i%3)*.27)this.px(x,y,2,2,'#f3debd')}
 }
}
