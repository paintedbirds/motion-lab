// More scenes for the editor, built on the same contract as the ones in motion.js: a scene reads the frame
// and the images, pushes opaque cards and may return a camera. Every scene is a pure function of the loop
// progress `p`, ends exactly where it starts, and eases in and out of each move.
import {mod,lerp,clamp,smooth,spring,glide,linear,fit,cellAspect,cardShape,board} from './motion.js';

// Progress through `steps` equal moves. Each move rests first, then eases in and out during `move` of its
// time, so every image gets a still moment and nothing starts or lands at full speed.
function stepped(p,steps,move=.7){const at=p*steps,done=Math.min(steps-1,Math.floor(at));return done+glide(linear(at-done,1-move,1))}
// A short list repeated until it has at least `min` entries, so neighbours in a row are never the same image.
const atLeast=(active,min)=>active.length>=min?active:Array.from({length:active.length*Math.ceil(min/active.length)},(_,i)=>active[i%active.length]);
// Position of an entry in a ring of `m`, relative to the one in front: from -m/2 to m/2.
const around=(i,t,m)=>mod(i-t+m/2,m)-m/2;
const mix=(a,b,t)=>({x:lerp(a.x,b.x,t),y:lerp(a.y,b.y,t),w:lerp(a.w,b.w,t),h:lerp(a.h,b.h,t)});
// One image on its own has nothing to hand over to: it comes a little closer and goes back.
function alone(scene,cards,boxW,boxH,radius=.04){
  const {w,h,p,energy,studio,active}=scene,[cw,ch]=fit(cardShape(scene,active[0].img),boxW,boxH),grow=1+.08*energy/.7*glide(linear(p,.08,.46))*(1-glide(linear(p,.54,.92)));
  cards.push({img:active[0].img,x:w/2,y:h/2,w:cw*grow,h:ch*grow,radius,z:0,alpha:1,shadow:studio});
}

// Pasarela: one large screen in the centre with a smaller one on each side. On every step the row moves one
// place: the next screen grows into the centre and the previous one shrinks away. Each screen keeps its own
// side of the row, above or below, so the small ones alternate. Sideways, or upwards in portrait formats.
function slider(scene,cards){
  const {w,h,p,portrait,size,studio,active,n}=scene,aspect=cellAspect(scene,.62,1.5);
  let ch=h*(portrait?.38:.68)*size,cw=ch*aspect;const widest=w*(portrait?.74:.44)*size;if(cw>widest){cw=widest;ch=cw/aspect}
  if(n===1)return alone(scene,cards,cw,ch,.06);
  const list=atLeast(active,6),m=list.length,t=stepped(p,n),long=portrait?ch:cw,gap=(portrait?h:w)*.045,near=long*.75+gap,far=long*.5+gap,lean=(portrait?cw:ch)*.14;
  for(let i=0;i<m;i++){
    const d=around(i,t,m),off=Math.abs(d);if(off>2.6)continue;
    const k=clamp(off),s=lerp(1,.5,k),along=Math.sign(d)*(k*near+Math.max(0,off-1)*far),side=(mod(i,n)%2?1:-1)*lean*k;
    cards.push({img:list[i].img,x:w/2+(portrait?side:along),y:h/2+(portrait?along:side),w:cw*s,h:ch*s,radius:.06,z:-off,alpha:1,shadow:studio&&off<.5});
  }
}

// Relevo: the main screen with a rail of up to three small ones beside it, or under it in portrait formats.
// On every step the first one in the rail grows over the main screen and takes its place, the rail moves up
// and a new screen comes in at its end.
function shift(scene,cards){
  const {w,h,unit,p,portrait,size,studio,active,n}=scene,pad=unit*.06,gap=unit*.022,k=Math.min(1,size),bw=(w-pad*2)*k,bh=(h-pad*2)*k,x0=(w-bw)/2,y0=(h-bh)/2,rail=Math.min(3,n-1);
  if(!rail)return alone(scene,cards,bw,bh,.03);
  // With a card ratio chosen in the editor every card takes that shape inside its place; otherwise it fills it.
  const inside=box=>{if(!scene.ratio)return box;const [cw,ch]=fit({width:scene.ratio,height:1},box.w,box.h);return {...box,w:cw,h:ch}};
  let main,place;
  if(portrait){
    const rh=bh*.2,tw=(bw-gap*2)/3;main=inside({x:w/2,y:y0+(bh-rh-gap)/2,w:bw,h:bh-rh-gap});
    place=i=>i>rail?{...place(rail),x:w+tw}:inside({x:w/2+(i-1-(rail-1)/2)*(tw+gap),y:y0+bh-rh/2,w:tw,h:rh});
  }else{
    const rw=bw*.26,th=(bh-gap*2)/3;main=inside({x:x0+(bw-rw-gap)/2,y:h/2,w:bw-rw-gap,h:bh});
    place=i=>i>rail?{...place(rail),y:h+th}:inside({x:x0+bw-rw/2,y:h/2+(i-1-(rail-1)/2)*(th+gap),w:rw,h:th});
  }
  const t=stepped(p,n,.62),spot=i=>i?place(i):main;
  for(let i=0;i<n;i++){
    const q=mod(i-t,n),img=active[i].img;
    // The screen being replaced stays in place underneath until the next one covers it.
    if(q>n-1)cards.push({img,...main,radius:.03,z:-5,alpha:1,live:true});
    if(q>rail+1)continue;
    const at=Math.floor(q),box=mix(spot(at),spot(at+1),q-at),lead=q<1;
    cards.push({img,...box,radius:lead?lerp(.03,.07,q):.07,z:lead?10:0,alpha:1,live:true,shadow:studio&&lead});
  }
}

// Columnas: columns of screens that drift in opposite directions without stopping. The number of columns
// follows the shape of the screens, so tall phone screens get more columns than wide ones.
function drift(scene,cards){
  const {w,h,unit,p,energy,size,active,n}=scene,aspect=cellAspect(scene,.56,1.7),gap=unit*.03,span=w*.92;
  const cols=Math.max(2,Math.min(7,Math.round((span+gap)/(aspect*h*.37*size+gap)))),cw=(span+gap)/cols-gap,ch=cw/aspect,py=ch+gap;
  // Each column shows a run of `cycle` screens and travels exactly that many places, so the loop closes.
  const cycle=Math.min(n,Math.max(3,Math.round(lerp(1.2,3,energy)*h/py)));
  for(let col=0;col<cols;col++){
    const down=col%2?1:-1,first=Math.round(col*n/cols),shift=down*p*cycle*py+(col%2?py/2:0),x=(w-span)/2+cw/2+col*(cw+gap);
    for(let k=Math.floor((-h/2-ch-shift)/py);k<=Math.ceil((h/2+ch-shift)/py);k++)
      cards.push({img:active[mod(first+mod(k,cycle),n)].img,x,y:h/2+k*py+shift,w:cw,h:ch,radius:.05,z:0,alpha:1});
  }
}

// Tira: a wall of three rows. The camera comes close to the middle row, the row passes one screen at a time,
// and the camera goes back to the whole wall.
function strip(scene,cards){
  const {w,h,unit,p,energy,size,active,n}=scene,aspect=cellAspect(scene,.6,1.7),gap=unit*.025;
  let ch=(h*.84-gap*2)/3*Math.min(1.1,size),cw=ch*aspect;if(cw>w*.6){cw=w*.6;ch=cw/aspect}
  const px=cw+gap,py=ch+gap,close=Math.max(1.2,Math.min(h*.76/ch,w*.84/cw)),near=glide(linear(p,.06,.26))*(1-glide(linear(p,.76,.96))),zoom=Math.exp(Math.log(close)*near);
  const cycle=Math.min(n,Math.max(2,Math.round(4*energy/.7))),travel=px*stepped(linear(p,.2,.82),cycle,.72),reachX=w/2/zoom+cw,reachY=h/2/zoom+ch;
  for(let r=-Math.ceil(reachY/py);r<=Math.ceil(reachY/py);r++){
    const move=r?0:-travel,first=Math.round(mod(r,3)*n/3);
    for(let k=Math.floor((-reachX-move)/px);k<=Math.ceil((reachX-move)/px);k++)
      cards.push({img:active[mod(first+(r?k:mod(k,cycle)),n)].img,x:k*px+move,y:r*py,w:cw,h:ch,radius:.05,z:0,alpha:1});
  }
  return c=>{c.translate(w/2,h/2);c.scale(zoom,zoom)};
}

// Lupa: every screen once on a board. One at a time, a screen leaves its place, grows to the front and goes
// back to the same place.
function zoomgrid(scene,cards){
  const {w,h,unit,p,size,studio,active,n}=scene,m=Math.min(n,6);
  if(m===1)return alone(scene,cards,w*.8*size,h*.8*size);
  const shown=active.slice(0,m),aspect=cellAspect({...scene,active:shown},.6,1.7),grid=board(m,w,h,aspect,unit*.03,Math.min(1,size)),at=p*m,turn=Math.min(m-1,Math.floor(at)),f=at-turn;
  const open=glide(linear(f,.1,.42))*(1-glide(linear(f,.6,.92)));
  shown.forEach((a,i)=>{
    const cell=grid.cells[i];
    if(i!==turn||open<.001){cards.push({img:a.img,x:cell.x,y:cell.y,w:grid.cw,h:grid.ch,radius:.05,z:0,alpha:1});return}
    const [fw,fh]=fit(cardShape(scene,a.img),w*.9,h*.88);
    cards.push({img:a.img,x:lerp(cell.x,w/2,open),y:lerp(cell.y,h/2,open),w:lerp(grid.cw,fw,open),h:lerp(grid.ch,fh,open),radius:lerp(.05,.03,open),z:10,alpha:1,live:true,shadow:true});
  });
}

// Mosaico: a band of blocks that never stops, each one a large screen followed by four small ones.
// Portrait formats get two bands that run against each other.
function marquee(scene,cards){
  const {w,h,unit,p,portrait,energy,size,active,n}=scene,aspect=cellAspect(scene,.6,1.7),gap=unit*.03,bands=portrait?2:1;
  const tall=h*(portrait?.3:.56)*Math.min(1.2,size),bigW=tall*aspect,sh=(tall-gap)/2,sw=sh*aspect,block=bigW+sw*2+gap*3;
  // The band repeats every `blocks` blocks and travels exactly that far.
  const blocks=Math.max(1,Math.round(lerp(1,2.4,energy)*w/block));
  for(let band=0;band<bands;band++){
    const yc=h/2+(band-(bands-1)/2)*(tall+gap*1.5),shift=(band%2?1:-1)*p*blocks*block+band*block*.5;
    for(let u=Math.floor(-shift/block)-1;u*block+shift<w;u++){
      const left=u*block+shift,base=mod(u,blocks)*5+band*2;
      cards.push({img:active[mod(base,n)].img,x:left+bigW/2,y:yc,w:bigW,h:tall,radius:.05,z:0,alpha:1});
      for(let s=0;s<4;s++)cards.push({img:active[mod(base+1+s,n)].img,x:left+bigW+gap+sw/2+(s>>1)*(sw+gap),y:yc-tall/2+sh/2+(s&1)*(sh+gap),w:sw,h:sh,radius:.07,z:0,alpha:1});
    }
  }
}

// Portada: one image fills the whole frame, with a row of small ones over it. On every step the row moves
// one place and the next small image grows until it fills the frame.
function reel(scene,cards){
  const {w,h,unit,p,portrait,size,active,n}=scene,at=p*n,now=Math.min(n-1,Math.floor(at)),stay=at-now;
  // The image in the back keeps coming slowly closer while it is the main one.
  cards.push({img:active[now].img,x:w/2,y:h/2,w:w*(1+.05*stay),h:h*(1+.05*stay),radius:0,z:-20,alpha:1});
  if(n===1)return;
  const list=atLeast(active,Math.max(7,n)),m=list.length,t=stepped(p,n,.62),move=t-now,aspect=cellAspect(scene,.7,1.5);
  let th=unit*.17*size,tw=th*aspect;if(tw>w*.3){tw=w*.3;th=tw/aspect}
  const px=tw+unit*.022,yc=h*(portrait?.8:.77),small=d=>{const front=1-clamp(Math.abs(d));return {x:w/2+d*px,y:yc-th*.1*front,w:tw*(1+.08*front),h:th*(1+.08*front)}};
  if(move>0)cards.push({img:active[mod(now+1,n)].img,...mix(small(1-move),{x:w/2,y:h/2,w,h},move),radius:lerp(.08,0,move),z:-10,alpha:1,live:true,shadow:true});
  for(let i=0;i<m;i++){
    const d=around(i,t,m);if(Math.abs(d)*px>w/2+tw)continue;
    cards.push({img:list[i].img,...small(d),radius:.08,z:-Math.abs(d)*.01,alpha:1,shadow:true});
  }
}

// Giro and Recambio: a board of equal cells where every screen is replaced by another one, cell after cell.
// In Giro the card turns around like a page; in Recambio it shrinks away and the next one pops back in.
// Each round rests first, so the board is still for a moment before the next change.
function swap(scene,cards,turn){
  const {w,h,unit,p,size,active,n}=scene;
  if(n===1)return alone(scene,cards,w*.8*size,h*.8*size);
  const cells=n<4?n:n<8?4:6,few=n<=cells,rounds=few?n:Math.ceil(n/cells),total=rounds*cells;
  // With more images than cells each cell works through its own part of the list and ends where it began.
  const pick=(cell,round)=>active[few?mod(cell+round,n):mod(cell+round*cells,total)%n].img;
  const grid=board(cells,w,h,cellAspect(scene,.6,1.7),unit*.03,Math.min(1,size)),at=p*rounds,round=Math.min(rounds-1,Math.floor(at)),f=at-round;
  grid.cells.forEach((cell,i)=>{
    const u=linear(f,.48+.3*i/cells,.7+.3*i/cells),out=u<.5,k=out?1-glide(u*2):turn?smooth(u*2-1):spring(u*2-1),sx=Math.max(.02,k);
    cards.push({img:pick(i,out?round:round+1),x:cell.x,y:cell.y,w:grid.cw,h:grid.ch,radius:.05,z:u>0&&u<1?5:0,alpha:1,sx,sy:turn?1:sx});
  });
}
const flip=(scene,cards)=>swap(scene,cards,true),pop=(scene,cards)=>swap(scene,cards,false);

// Isométrico: a wall lying on a table, seen from above at an angle. Its rows run against each other.
function iso(scene,cards){
  const {w,h,unit,p,energy,size,active,n}=scene,aspect=cellAspect(scene,.7,1.6),gap=unit*.04,ch=unit*.36*size/Math.sqrt(aspect),cw=ch*aspect,px=cw+gap,py=ch+gap;
  const cycle=Math.min(n,Math.max(3,Math.round(4*energy/.7))),reach=Math.hypot(w,h)*.75,lines=Math.ceil(reach/py);
  for(let r=-lines;r<=lines;r++){
    const shift=(mod(r,2)?-1:1)*p*cycle*px+(mod(r,2)?px/2:0),first=Math.round(mod(r,3)*n/3);
    for(let k=Math.floor((-reach-shift)/px);k<=Math.ceil((reach-shift)/px);k++){
      const x=k*px+shift,y=r*py;
      // Skip what falls outside the frame once the table is turned.
      if(Math.abs((x-y)*.866)>w/2+cw||Math.abs((x+y)*.5)>h/2+cw)continue;
      cards.push({img:active[mod(first+mod(k,cycle),n)].img,x,y,w:cw,h:ch,radius:.06,z:0,alpha:1});
    }
  }
  return c=>{c.translate(w/2,h/2);c.transform(.866,.5,-.866,.5,0,0)};
}

export const labScenes={slider,shift,drift,strip,zoomgrid,marquee,reel,flip,pop,iso};
