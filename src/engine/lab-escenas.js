// Scenes of this family: chained layouts and tidy scatters. Same contract as lab.js: scene(scene, cards) pushes
// opaque cards and may return a camera. Every card has one place in each layout of a scene and travels from one
// to the next, so the whole set moves together instead of one layout fading out and another fading in.
// Every scene is a pure function of `p` and ends exactly where it starts.
import {mod,lerp,glide,cruise,linear,noise,fit,cellAspect,cardShape,board,TAU} from './motion.js';

// One image on its own has nothing to travel to: it comes a little closer and goes back.
function alone(scene,cards,boxW,boxH,radius=.05){
  const {w,h,p,energy,studio,active}=scene,[cw,ch]=fit(cardShape(scene,active[0].img),boxW,boxH),grow=1+.08*energy/.7*glide(linear(p,.08,.46))*(1-glide(linear(p,.54,.92)));
  cards.push({img:active[0].img,x:w/2,y:h/2,w:cw*grow,h:ch*grow,radius,z:0,alpha:1,shadow:studio});
}
// Progress through `steps` equal moves. Each move rests first, then eases in and out during `move` of its time.
function stepped(p,steps,move=.7){const at=p*steps,done=Math.min(steps-1,Math.floor(at));return done+glide(linear(at-done,1-move,1))}
// The largest card of a shape inside a box, and the size of the main screen when it is alone in the centre.
const inside=(aspect,boxW,boxH)=>fit({width:aspect,height:1},boxW,boxH);
const hero=(scene,aspect)=>inside(aspect,scene.w*(scene.portrait?.8:.5)*scene.size,scene.h*(scene.portrait?.46:.64)*scene.size);
// The gathered layout: the first screen in the centre and the others tucked behind it, a little smaller.
const centre=(scene,hw,hh,i)=>({x:scene.w/2,y:scene.h/2,w:hw*(i?.86:1),h:hh*(i?.86:1),hid:i?1:0});
// Progress of one card through a move of the whole set, between `a` and `b` of the loop. Cards leave one
// after another: `lead` goes from 0 for the first to 1 for the last, and `share` is how much of the move
// those delays take. Each card starts gently and takes a long time to land.
const leg=(p,a,b,lead=0,share=.4)=>glide(linear(linear(p,a,b),lead*share,lead*share+1-share));
// A card part of the way between two places. `bend` curves its path to one side, so cards swing around
// each other instead of crossing in straight lines. `hid` is 1 while a card is tucked behind another one.
function between(a,b,k,bend=0){
  if(k<=0)return a;if(k>=1)return b;
  const arc=bend*Math.sin(Math.PI*k),dx=b.x-a.x,dy=b.y-a.y;
  return {x:lerp(a.x,b.x,k)-dy*arc,y:lerp(a.y,b.y,k)+dx*arc,w:lerp(a.w,b.w,k),h:lerp(a.h,b.h,k),rot:lerp(a.rot||0,b.rot||0,k),hid:lerp(a.hid||0,b.hid||0,k)};
}
const put=(cards,img,s,z,shadow)=>{if((s.hid||0)<.999)cards.push({img,x:s.x,y:s.y,w:s.w,h:s.h,rot:s.rot||0,radius:.05,z,alpha:1,shadow})};
// `k` cards in a line, side by side or one above the other, whichever keeps them larger. Each one sits a step
// further along the other axis, so the line reads as a diagonal.
function diagonal(k,scene,aspect,gap,size){
  const {w,h}=scene,across=inside(aspect,(w*.9-gap*(k-1))/k,h*.56),down=inside(aspect,w*.72,(h*.86-gap*(k-1))/k),flat=across[0]>=down[0],cw=(flat?across:down)[0]*size,ch=cw/aspect;
  const lean=k>1?Math.min((flat?ch:cw)*.3,(flat?h*.86-ch:w*.9-cw)/(k-1)):0,dx=flat?cw+gap:lean,dy=flat?lean:ch+gap;
  return {cw,ch,at:(j,tip=1)=>({x:w/2+j*dx*(flat?1:tip),y:h/2+j*dy*(flat?tip:1)})};
}
// An oval walked at an even pace: `u` counts turns, from the top and clockwise, and equal steps of `u` are
// equal distances along the edge, so cards keep their spacing all the way round.
function oval(a,b){
  const N=120,len=[0];
  for(let i=1;i<=N;i++){const t0=(i-1)/N*Math.PI*2,t1=i/N*Math.PI*2;len.push(len[i-1]+Math.hypot(a*(Math.sin(t1)-Math.sin(t0)),b*(Math.cos(t1)-Math.cos(t0))))}
  return u=>{
    const want=(u-Math.floor(u))*len[N];let lo=0,hi=N;
    while(hi-lo>1){const mid=(lo+hi)>>1;if(len[mid]<=want)lo=mid;else hi=mid}
    const t=(lo+(want-len[lo])/(len[hi]-len[lo]||1))/N*Math.PI*2;return {x:a*Math.sin(t),y:-b*Math.cos(t)};
  };
}
// Upright cards around an oval that fills a box, as large as they can be without touching each other at any
// moment of the turn. The search is kept, since it only depends on the frame and the number of cards.
const rings=new Map();
function ring(m,boxW,boxH,aspect,gap,most){
  const key=[m,Math.round(boxW),Math.round(boxH),aspect.toFixed(3),Math.round(most)].join();let found=rings.get(key);if(found)return found;
  const path=cw=>oval((boxW-cw)/2,(boxH-cw/aspect)/2),clear=cw=>{
    const ch=cw/aspect,at=path(cw);
    for(let s=0;s<24;s++){
      const spots=Array.from({length:m},(_,i)=>at((s/24+i)/m));
      for(let i=0;i<m;i++)for(let j=i+1;j<m;j++)if(Math.abs(spots[i].x-spots[j].x)<cw+gap&&Math.abs(spots[i].y-spots[j].y)<ch+gap)return false;
    }
    return true;
  };
  let lo=0,hi=Math.min(most,boxW*.5,boxH*.5*aspect);
  if(clear(hi))lo=hi;else for(let k=0;k<14;k++){const mid=(lo+hi)/2;if(clear(mid))lo=mid;else hi=mid}
  if(rings.size>40)rings.clear();
  found={cw:lo,ch:lo/aspect,at:path(lo)};rings.set(key,found);return found;
}

// Crescendo: one screen, then three on a diagonal that tips over to the other diagonal, then every screen in
// columns that drift against each other, and back to one. The screens that are not on show wait tucked
// behind the ones that are.
function trio(scene,cards){
  const {w,h,unit,p,size,studio,active,n}=scene,aspect=cellAspect(scene,.5,1.8),[hw,hh]=hero(scene,aspect);
  if(n===1)return alone(scene,cards,hw,hh);
  const m=Math.min(n,9),k=Math.min(3,m),gap=unit*.03,fill=Math.min(1,size),line=diagonal(k,scene,aspect,gap,fill),wall=board(m,w,h,aspect,gap,fill,true);
  // The first screens take the cells nearest the centre, so the main one has the shortest way home.
  const far=cell=>Math.round(Math.hypot(cell.x-w/2,cell.y-h/2)),cells=[...wall.cells].sort((a,b)=>far(a)-far(b));
  // Both layouts keep moving while they are on show: the diagonal slides sideways and its ends change
  // height one after the other, the columns cross.
  const slide=(linear(p,.05,.54)-.5)*.16,run=cruise(p,.37,.52,.8,.95)-.5;
  for(let i=0;i<m;i++){
    const c=i%k,seat=line.at((k===3?[0,-1,1][c]:c-(k-1)/2)+slide,1-2*glide(linear(p,.2+.03*c,.32+.03*c))),small=i<k?1:.86,cell=cells[i],first=centre(scene,hw,hh,i);
    const second={x:seat.x,y:seat.y,w:line.cw*small,h:line.ch*small,hid:i<k?0:1};
    const third={x:cell.x,y:cell.y+(mod(cell.line,2)?1:-1)*run*wall.py*.14,w:wall.cw,h:wall.ch};
    let s=between(first,second,leg(p,.05,.2,c/2),.05);
    s=between(s,third,leg(p,.37,.54,i/(m-1)),.05);
    s=between(s,first,leg(p,.78,.95,1-i/(m-1)));
    put(cards,active[i].img,s,-i,studio);
  }
}

// Barrida: the main screen opens into a row that passes by, one screen after another, sideways or upwards in
// portrait formats. The row then curls into a ring that keeps turning, and the ring closes on the main screen.
function sweep(scene,cards){
  const {w,h,unit,p,portrait,energy,size,studio,active,n}=scene,aspect=cellAspect(scene,.5,1.8),[hw,hh]=hero(scene,aspect);
  if(n===1)return alone(scene,cards,hw,hh);
  const m=Math.min(n,5),gap=unit*.035,rw=hw*.84,rh=hh*.84,long=portrait?rh:rw,pitch=long+gap,edge=(portrait?h:w)/2+long*.56;
  // With enough screens the row is a loop: it goes all the way round and stops where it began, with screens
  // on both sides of the main one. A screen changes ends far outside the frame. A short row passes once.
  const left=Math.floor((m-1)/2),loops=(left+1)*pitch>=edge&&(m-left-1)*pitch>=edge,t=(loops?m:m-1)*cruise(p,.08,.18,.4,.52);
  const circle=ring(m,w*.92,h*.88,aspect,gap,rw),turn=.45*energy/.7*cruise(p,.44,.6,.8,.96),span=loops?Math.max(1,m-1-left):m-1;
  for(let i=0;i<m;i++){
    const start=loops&&i>m-1-left?i-m:i,at=loops?mod(start-t+left+1-1e-6,m)-left-1+1e-6:i-t,end=loops?start:i-(m-1);
    // A screen that is out of the frame waits just outside it, so it never has far to come back.
    const along=Math.max(-edge,Math.min(edge,at*pitch)),spot=circle.at(end/m+turn),first=centre(scene,hw,hh,i);
    const second={x:w/2+(portrait?0:along),y:h/2+(portrait?along:0),w:rw,h:rh};
    const third={x:w/2+spot.x,y:h/2+spot.y,w:circle.cw,h:circle.ch};
    let s=between(first,second,leg(p,.04,.17,Math.abs(start)/span));
    s=between(s,third,leg(p,.44,.6,Math.abs(end)/span),.1);
    s=between(s,first,leg(p,.8,.96,1-Math.abs(end)/span),.1);
    put(cards,active[i].img,s,-i,studio);
  }
}

// Estela: the main screen travels a winding path across the frame and leaves the other screens behind it,
// each one in its place. Then the last one sets off along the same path, gathers them and slips under the
// main screen, which goes back to the centre.
function trail(scene,cards){
  const {w,h,unit,p,size,studio,active,n}=scene,aspect=cellAspect(scene,.5,1.8),[hw,hh]=hero(scene,aspect);
  if(n===1)return alone(scene,cards,hw,hh);
  const m=Math.min(n,9),grid=board(m,w,h,aspect,unit*.03,Math.min(1,size)),rows=[],d=.5;
  // The path visits the cells of a board line by line, turning back at the end of each line, with rounded turns.
  grid.cells.forEach(cell=>(rows[cell.line]||(rows[cell.line]=[])).push(cell));
  const stops=rows.flatMap((row,r)=>r%2?row.reverse():row),stop=j=>stops[Math.max(0,Math.min(m-1,j))];
  const curve=(a,b,c,e,f)=>.5*(2*b+(c-a)*f+(2*a-5*b+4*c-e)*f*f+(3*b-a-3*c+e)*f*f*f);
  const at=q=>{q=Math.max(0,Math.min(m-1,q));const j=Math.min(m-2,Math.floor(q)),f=q-j,[a,b,c,e]=[stop(j-1),stop(j),stop(j+1),stop(j+2)];return {x:curve(a.x,b.x,c.x,e.x,f),y:curve(a.y,b.y,c.y,e.y,f)}};
  const head=(m-1)*cruise(p,.11,.2,.42,.52),tail=lerp(-d,m-1,cruise(p,.56,.66,.84,.92)),out=leg(p,.03,.13),home=leg(p,.88,.98);
  for(let i=0;i<m;i++){
    // A screen rides under the main one until its own stop comes up, and slows down into it. Later it
    // starts moving again as the gathering screen reaches it.
    const rank=i?i-1:m-1;let q=!i||head<=rank-d?head:head>=rank+d?rank:head-(head-rank+d)**2/(4*d);
    if(i)q=Math.max(0,tail<=q-d?q:tail>=q+d?tail:q+(tail-q+d)**2/(4*d));
    const first=centre(scene,hw,hh,i),on={...at(q),w:grid.cw,h:grid.ch,hid:i&&q>=Math.min(head,m-1)-1e-6?1:0};
    put(cards,active[i].img,between(between(first,on,out),first,home),-i,studio);
  }
}

// Enroque: screens of different sizes, loosely placed. In every round screens swap places in pairs, each pair
// turning around its middle: one passes over and the other under, and both take the size of their new place.
// Four screens on a square swap sideways and then top to bottom. Screens in a line swap with one neighbour and
// then with the other. Either way, after the last round every screen is home again.
function dance(scene,cards){
  const {w,h,unit,p,size,active,n}=scene,aspect=cellAspect(scene,.5,1.8);
  if(n===1)return alone(scene,cards,...hero(scene,aspect));
  const m=Math.min(n,4),gap=unit*.05;let best;
  for(let cols=1;cols<=m;cols++){if(m%cols)continue;const cw=Math.min(w*.92/cols-gap,(h*.88*cols/m-gap)*aspect);if(!best||cw>best.cw)best={cols,cw}}
  const cols=best.cols,rows=m/cols,square=cols>1&&rows>1,cw=best.cw*Math.min(1,size),ch=cw/aspect,px=cw+gap,py=ch+gap;
  const slots=Array.from({length:m},(_,j)=>{
    const col=j%cols,row=Math.floor(j/cols),s=[1,.76,.88][(col+row*2)%3];
    return {x:w/2+(col-(cols-1)/2)*px+(noise(j*3+1)-.5)*cw*(1-s)*.9,y:h/2+(row-(rows-1)/2)*py+(noise(j*3+2)-.5)*ch*(1-s)*.9,w:cw*s,h:ch*s,rot:(noise(j+5)-.5)*.07};
  });
  // The pairs of places that swap in a round.
  const pairs=r=>{const skip=m>2?r%2:0;return square?(r%2?[[0,2],[1,3]]:[[0,1],[2,3]]):Array.from({length:Math.floor((m-skip)/2)},(_,q)=>[q*2+skip,q*2+skip+1])};
  const rounds=square?4:m>2?m*2:2,now=p*rounds,round=Math.min(rounds-1,Math.floor(now)),f=now-round,at=slots.map((_,j)=>j),going=slots.map((_,j)=>[j,0]);
  for(let r=0;r<round;r++)for(const [a,b] of pairs(r))[at[a],at[b]]=[at[b],at[a]];
  // Each round rests first. Its pairs leave one after the other.
  pairs(round).forEach(([a,b],q,list)=>{const late=.16*q/Math.max(1,list.length-1),k=glide(linear(f,.34+late,.84+late));going[a]=[b,k];going[b]=[a,k]});
  slots.forEach((from,j)=>{
    const [goal,k]=going[j],to=slots[goal],far=Math.hypot(to.x-from.x,to.y-from.y),over=j<goal,moving=k>0&&k<1;
    const s=between(from,to,k,far>1?.3*Math.min(px,py)/far:0),lift=moving?1+(over?.06:-.08)*Math.sin(Math.PI*k):1;
    put(cards,active[at[j]].img,{...s,w:s.w*lift,h:s.h*lift},moving&&over?10:-at[j],true);
  });
}

// Peldaños: a board with every screen stretches into a staircase of large screens that comes down towards
// the viewer: each step is larger than the one above it, passes through the centre and leaves by the corner.
// Then the staircase folds back into the board.
function ladder(scene,cards){
  const {w,h,unit,p,portrait,size,studio,active,n}=scene,aspect=cellAspect(scene,.5,1.8),[hw,hh]=hero(scene,aspect);
  if(n===1)return alone(scene,cards,hw,hh);
  const m=Math.min(n,8),gap=unit*.03,grid=board(m,w,h,aspect,gap,Math.min(1,size)),sw=hw*.9,sh=hh*.9,deep=.2;
  const dx=portrait?Math.min(sw*.34,(w*.94-sw)/2):sw+gap,dy=portrait?sh+gap:Math.min(sh*.5,(h*.94-sh)/2);
  // Steps grow at an even rate, and the distance between two of them grows with them, so they never touch.
  const step=at=>{const grow=Math.exp(deep*at),run=(grow-1)/deep;return {x:w/2+run*dx,y:h/2+run*dy,w:sw*grow,h:sh*grow}};
  // A step that is out of the frame waits just outside it, so it never has far to come back.
  const gone=at=>{const s=step(at);return Math.abs(s.x-w/2)-s.w/2>w/2||Math.abs(s.y-h/2)-s.h/2>h/2};
  let near=0,back=0;while(near<8&&!gone(near))near+=.1;while(back>-8&&!gone(back))back-=.1;
  const t=(m-1)*cruise(p,.12,.3,.62,.8);
  for(let i=0;i<m;i++){
    const cell=grid.cells[i],first={x:cell.x,y:cell.y,w:grid.cw,h:grid.ch};
    let s=between(first,step(Math.max(back,Math.min(near,i-t))),leg(p,.07,.25,i/(m-1)),.08);
    s=between(s,first,leg(p,.72,.92,1-i/(m-1)),.08);
    put(cards,active[i].img,s,-i,studio);
  }
}

// Constelación: screens of different sizes, loosely placed and drifting apart very slowly. They gather into
// a stack fanned along a diagonal, the fan swings over to the other diagonal, and the stack opens into a
// dial that turns a few clicks. From the dial every screen goes back to the place it left.
function scatter(scene,cards){
  const {w,h,unit,p,size,studio,active,n}=scene,aspect=cellAspect(scene,.5,1.8),[hw,hh]=hero(scene,aspect);
  if(n===1)return alone(scene,cards,hw,hh);
  const m=Math.min(n,6),grid=board(m,w,h,aspect,unit*.05,Math.min(1,size)),circle=ring(m,w*.92,h*.88,aspect,unit*.035,hw*.8);
  // Places on the dial follow the order of the loose places around the centre, clockwise from the top, and the
  // dial ends its last click with every screen on the side it has to go back to.
  const around=cell=>mod(Math.atan2(cell.x-w/2,h/2-cell.y),TAU),rank=[];
  grid.cells.map((cell,i)=>i).sort((a,b)=>around(grid.cells[a])-around(grid.cells[b])).forEach((i,r)=>rank[i]=r);
  const clicks=Math.min(3,m-1),turned=stepped(linear(p,.48,.76),clicks,.72)-clicks,swing=1-2*glide(linear(p,.2,.34)),far=p<.5?p:p-1;
  const fan=Math.min(m,5),sw=hw*.86,sh=hh*.86;
  for(let i=0;i<m;i++){
    const cell=grid.cells[i],s=[1,.76,.88][(i+cell.line)%3],way=noise(i+11)*TAU,level=Math.min(i,fan-1)-(fan-1)/2,spot=circle.at((rank[i]+turned)/m);
    const loose={x:cell.x+(noise(i*3+1)-.5)*grid.cw*(1-s)*.9+Math.cos(way)*unit*.06*far,y:cell.y+(noise(i*3+2)-.5)*grid.ch*(1-s)*.9+Math.sin(way)*unit*.06*far,w:grid.cw*s,h:grid.ch*s,rot:(noise(i+5)-.5)*.1};
    const stacked={x:w/2+level*sw*.085*swing,y:h/2-level*sh*.13,w:sw*(i<fan?1:.9),h:sh*(i<fan?1:.9),hid:i<fan?0:1};
    const dial={x:w/2+spot.x,y:h/2+spot.y,w:circle.cw,h:circle.ch};
    let at=between(loose,stacked,leg(p,.06,.22,1-i/(m-1)),.08);
    at=between(at,dial,leg(p,.32,.48,i/(m-1)),.1);
    at=between(at,loose,leg(p,.76,.94,rank[i]/(m-1)),.08);
    put(cards,active[i].img,at,-i,studio);
  }
}

// Pila: a tidy pile where every screen covers the one before. The next screen is tossed in from one side and
// then the other, turns a little on its way and lands softly, slightly askew. The pile squares up under it.
function pile(scene,cards){
  const {w,h,p,energy,studio,active,n}=scene,aspect=cellAspect(scene,.5,1.8),[hw,hh]=hero(scene,aspect);
  if(n===1)return alone(scene,cards,hw,hh);
  const m=Math.min(n,8),now=p*m,turn=Math.min(m-1,Math.floor(now)),f=now-turn,tuck=glide(linear(f,0,.3)),land=glide(linear(f,.3,1));
  // Each screen has its own small lean on the pile, to one side or the other.
  const side=i=>i%2?1:-1,lean=i=>side(i)*(.022+.028*noise(i+3))*Math.min(1.3,energy/.7),next=mod(turn+1,m),under=mod(turn-1,m);
  const flat={x:w/2,y:h/2,w:hw,h:hh};
  // The screen two places down straightens and shrinks a little, so the next one to land hides it completely.
  if(tuck<1)put(cards,active[under].img,{...flat,w:hw*lerp(1,.86,tuck),h:hh*lerp(1,.86,tuck),rot:lean(under)*(1-tuck)},0,true);
  put(cards,active[turn].img,{...flat,rot:lean(turn)},1,true);
  if(land>0)put(cards,active[next].img,between({x:w/2+side(next)*(w/2+hw*.64),y:h/2-h*.08,w:hw*1.1,h:hh*1.1,rot:side(next)*.13},{...flat,rot:lean(next)},land,-side(next)*.1),2,true);
}

// Latido: the set opens into a ring, the ring turns until another screen is at the top, and it closes on
// that one. Each beat puts a different screen in the centre, and over the whole loop the ring goes round once.
function pulse(scene,cards){
  const {w,h,unit,p,size,studio,active,n}=scene,aspect=cellAspect(scene,.5,1.8),[hw,hh]=hero(scene,aspect);
  if(n===1)return alone(scene,cards,hw,hh);
  const m=Math.min(n,5),beats=Math.min(m,3),circle=ring(m,w*.92,h*.88,aspect,unit*.035,hw*.84),now=p*beats,beat=Math.min(beats-1,Math.floor(now));
  // The screens that take the centre are spread evenly through the set. The last beat ends on the first one.
  const main=b=>Math.round(b*m/beats),turned=b=>lerp(main(b),main(b+1),cruise(now-b,.12,.36,.66,.9));
  let turn=0;for(let b=0;b<=beat;b++)turn=turned(b);
  // Half way through a beat, with the ring open, the next main screen moves to the top of the stacking order.
  const front=mod(main(now-beat<.5?beat:beat+1),m);
  for(let i=0;i<m;i++){
    const spot=circle.at((i-turn)/m),place={x:w/2+spot.x,y:h/2+spot.y,w:circle.cw,h:circle.ch};
    const home=b=>centre(scene,hw,hh,i===mod(main(b),m)?0:1),away=b=>Math.abs(mod(i-main(b)+m/2,m)-m/2)/(m/2);
    const s=between(between(home(beat),place,leg(now-beat,.1,.38,away(beat)),.1),home(beat+1),leg(now-beat,.62,.92,away(beat+1)),.1);
    put(cards,active[i].img,s,i===front?1:-mod(i-front,m),studio);
  }
}

export const scenes={trio,sweep,trail,dance,ladder,scatter,pile,pulse};
