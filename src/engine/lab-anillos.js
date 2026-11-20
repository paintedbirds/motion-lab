// Scenes of this family: rings, orbits and carousels. Same contract as lab.js: scene(scene, cards) pushes
// opaque cards and may return a camera. Cards always face the viewer and stay upright while their centres
// travel the ring; depth is shown with size, position and order. Every scene is a pure function of `p`.
import {mod,lerp,clamp,smooth,glide,cruise,linear,fit,cellAspect,cardShape,TAU} from './motion.js';

// Progress through `steps` equal moves. Each move rests first, then eases in and out during `move` of its time.
function stepped(p,steps,move=.7){const at=p*steps,done=Math.min(steps-1,Math.floor(at));return done+glide(linear(at-done,1-move,1))}
// A short list repeated whole until it has at least `min` entries, so neighbours are never the same image.
const atLeast=(active,min)=>active.length>=min?active:Array.from({length:active.length*Math.ceil(min/active.length)},(_,i)=>active[i%active.length]);
// Position of an entry in a ring of `m`, relative to the one in front: from -m/2 to m/2.
const around=(i,t,m)=>mod(i-t+m/2,m)-m/2;
// How many places a ring gets: every image once when the count is between `min` and `max`, a short list
// repeated whole, a long one cut.
const places=(k,min,max)=>k>max?max:k>=min?k:k*Math.ceil(min/k);
const sized=(long,aspect)=>aspect>=1?[long,long/aspect]:[long*aspect,long];
// Room an upright card needs along a path so it never touches the next one, whatever the direction of travel.
const room=aspect=>Math.max(1,1.42*Math.min(aspect,1/aspect));
// One image on its own has no ring to travel: it comes a little closer and goes back.
function alone(scene,cards,boxW,boxH,radius=.05){
  const {w,h,p,energy,studio,active}=scene,[cw,ch]=fit(cardShape(scene,active[0].img),boxW,boxH),grow=1+.08*energy/.7*glide(linear(p,.08,.46))*(1-glide(linear(p,.54,.92)));
  cards.push({img:active[0].img,x:w/2,y:h/2,w:cw*grow,h:ch*grow,radius,z:0,alpha:1,shadow:studio});
}
// An oval walked at an even pace. `at(u)` takes a position from 0 to 1, from the top and clockwise, and
// gives a point around the centre. Equal steps of `u` are equal distances, so cards keep their spacing.
function oval(a,b){
  const N=180,len=[0];
  for(let i=1;i<=N;i++){const t0=(i-1)/N*TAU,t1=i/N*TAU;len.push(len[i-1]+Math.hypot(a*(Math.sin(t1)-Math.sin(t0)),b*(Math.cos(t1)-Math.cos(t0))))}
  return {a,b,length:len[N],at(u){
    const want=mod(u,1)*len[N];let lo=0,hi=N;
    while(hi-lo>1){const mid=(lo+hi)>>1;if(len[mid]<=want)lo=mid;else hi=mid}
    const t=(lo+(want-len[lo])/(len[hi]-len[lo]||1))/N*TAU;return {x:a*Math.sin(t),y:-b*Math.cos(t)};
  }};
}
// The largest cards for a ring of `slots` places that fills a box. `mean` is the average size of two
// neighbours when the places have different sizes.
function ringFit(boxW,boxH,slots,aspect,gap,cap,mean=1){
  let long=Math.min(cap,boxW*.46*(aspect>=1?1:1/aspect),boxH*.46*(aspect>=1?aspect:1)),cw,ch,path;const most=long;
  const shape=()=>{[cw,ch]=sized(long,aspect);path=oval(Math.max(1,boxW/2-cw/2),Math.max(1,boxH/2-ch/2))};
  for(let i=0;i<7;i++){shape();long=(long+Math.min(most,(path.length/slots-gap)/(room(aspect)*mean)))/2}
  shape();
  // On a tight oval the distance along the edge is not enough, so the cards themselves are checked.
  for(let i=0;i<8&&slots>1&&!clear(path,slots,cw*mean,ch*mean,gap);i++){long*=.94;shape()}
  return {cw,ch,path};
}
// The largest box of shape `q`, width over height, that fits inside a ring of cards without touching them.
function hole(path,cw,ch,gap,q){
  let lo=0,hi=path.b;
  for(let i=0;i<16;i++){const y=(lo+hi)/2;if(Math.hypot((q*y+cw/2+gap)/path.a,(y+ch/2+gap)/path.b)<=1)lo=y;else hi=y}
  return [q*lo*2,lo*2];
}

// Whether `slots` cards travelling a path stay clear of each other all the way around. A tight oval bends
// too much for the distance along it to tell, so this looks at the cards themselves.
function clear(path,slots,cw,ch,gap){
  for(let turn=0;turn<5;turn++){
    const at=Array.from({length:slots},(_,j)=>path.at((j+turn/5)/slots));
    for(let i=0;i<slots;i++)for(let j=i+1;j<slots;j++)if(Math.abs(at[i].x-at[j].x)<cw+gap*.6&&Math.abs(at[i].y-at[j].y)<ch+gap*.6)return false;
  }
  return true;
}

// Calesita: a carousel seen a little from above. The screen in front is the large one; the others get
// smaller as they go around the back, where they stay in view over the front row. On every step the ring
// moves one place. It turns sideways, or upwards in portrait formats with the back row at the left.
// Angles of the places around the ring, from the front. None of them sits right at the side, where a
// screen would be between the two rows, so at rest no screen covers another.
// Written with Math.PI: motion.js loads this file before its own constants exist.
const SPOTS=[0,50,115,155,180].map(a=>a*Math.PI/180);
function carousel(scene,cards){
  const {w,h,unit,p,portrait,size,studio,active,n}=scene,aspect=cellAspect(scene,.5,1.6),gap=unit*.03;
  let cw=w*(portrait?.44:.32)*size,ch=cw/aspect;const tallest=h*(portrait?.36:.44)*size;if(ch>tallest){ch=tallest;cw=ch*aspect}
  if(n===1)return alone(scene,cards,cw*1.5,ch*1.5,.06);
  const list=atLeast(active,8),m=list.length,t=stepped(p,n),long=portrait?ch:cw,across=portrait?cw:ch;
  // Far enough along that the front screen and the next one do not touch; `lift` opens the ring so the back shows.
  const reach=(long*.89+gap)/Math.sin(SPOTS[1]),lift=portrait?Math.max(across*.68,Math.min(across*1.1,(w*.9-across*.71)/1.91)):across*.68,off=(lift*.09+across*.29)/2;
  for(let i=0;i<m;i++){
    const d=around(i,t,m),far=Math.abs(d);if(far>4)continue;
    // With more images than places, a screen shrinks to nothing at the far point and the next one grows from it.
    const at=Math.min(3,Math.floor(far)),a=Math.sign(d)*lerp(SPOTS[at],SPOTS[at+1],far-at),depth=(Math.cos(a)+1)/2,s=(m>8?smooth(4-far):1)/(1+1.6*(1-depth)),along=Math.sin(a)*reach,out=Math.cos(a)*lift-off;
    cards.push({img:list[i].img,x:w/2+(portrait?out:along),y:h/2+(portrait?along:out),w:cw*s,h:ch*s,radius:.06,z:depth,alpha:1,shadow:studio&&depth>.9});
  }
}

// Noria: a big wheel whose centre is far outside the frame, so the screens cross on an arc. The one at the
// top is the large one and the wheel stops there on every step. In portrait formats the wheel sits at the
// left and the screens climb on its right side. Screens stay upright, with only a slight lean on the arc.
function dial(scene,cards){
  const {w,h,unit,p,portrait,size,studio,active,n}=scene,aspect=cellAspect(scene,.5,1.6),gap=unit*.03;
  let cw=w*(portrait?.62:.34)*size,ch=cw/aspect;const tallest=h*(portrait?.4:.52)*size;if(ch>tallest){ch=tallest;cw=ch*aspect}
  if(n===1)return alone(scene,cards,cw*1.5,ch*1.5,.06);
  const list=atLeast(active,8),m=list.length,t=stepped(p,n),long=portrait?ch:cw,across=portrait?cw:ch,step=portrait?.5:.4,R=(long*.9+gap)/Math.sin(step);
  // The arc is centred in the frame: the top screen on one side, the ones beside it on the other.
  const size2=d=>1/(1+.32*d),reachD=portrait?1:1.15,top=(R*(1-Math.cos(step*reachD))+across*size2(reachD)/2-across/2)/2;
  for(let i=0;i<m;i++){
    const d=around(i,t,m),far=Math.abs(d);if(far>3.4)continue;
    const a=d*step,s=size2(far),along=R*Math.sin(a),fall=R*(1-Math.cos(a))-top;
    cards.push({img:list[i].img,x:w/2+(portrait?-fall:along),y:h/2+(portrait?along:fall),w:cw*s,h:ch*s,radius:.06,z:-far,alpha:1,rot:portrait?0:.13*Math.tanh(a*2.5),shadow:studio&&far<.5});
  }
}

// Fuelle: a row folded like bellows. One screen is open and the rest wait as thin slices of themselves at
// both sides. On every step the open one folds and the next slice opens to its own shape. Nothing overlaps.
// Wide screens in a portrait format are stacked as a column of bands instead.
function bellows(scene,cards){
  const {w,h,unit,p,portrait,size,studio,active,n}=scene,gap=unit*.014,typical=cellAspect(scene,.45,1.9),column=portrait&&typical>.8,span=(column?h:w)*.92,slice=unit*.075;
  if(n===1)return alone(scene,cards,w*.8*size,h*.76*size,.04);
  // Every card has the same size across the row, chosen so a typical screen opens whole or nearly whole.
  const widest=column?h*.5:w*(portrait?.64:.56),high=Math.min(column?w*.86:h*.62,(column?widest*typical:widest/typical)*1.2)*Math.min(1.2,size);
  const open=img=>{const s=cardShape(scene,img),r=s.width/s.height;return Math.min(widest,column?high/r:high*r)};
  // As many slices at each side as fit, and no more than there are other images to show.
  const sides=Math.max(1,Math.min(5,Math.floor((n-1)/2),Math.floor((span-Math.max(...active.map(a=>open(a.img))))/2/(slice+gap))));
  const list=atLeast(active,sides*2+3),m=list.length,t=stepped(p,n,.66),first=Math.floor(t),f=t-first,row=[];
  for(let j=-sides-1;j<=sides+2;j++){
    const img=list[mod(first+j,m)].img,far=Math.abs(j-f),shown=1-clamp(far),edge=clamp(sides+1-far);
    row.push({j,img,shown,edge,thick:lerp(slice,open(img),shown)*edge});
  }
  // The open screen sits in the centre; while two are changing, the point between them does.
  const A=row[sides+1],B=row[sides+2],place=new Map([[0,-f*((A.thick+B.thick)/2+gap)]]);
  for(let k=sides+2;k<row.length;k++)place.set(row[k].j,place.get(row[k-1].j)+(row[k-1].thick+row[k].thick)/2+gap*Math.min(row[k-1].edge,row[k].edge));
  for(let k=sides;k>=0;k--)place.set(row[k].j,place.get(row[k+1].j)-(row[k+1].thick+row[k].thick)/2-gap*Math.min(row[k+1].edge,row[k].edge));
  for(const {j,img,shown,thick} of row){
    if(thick<2)continue;
    const tall=high*lerp(.88,1,shown),cw=column?tall:thick,ch=column?thick:tall,at=place.get(j);
    cards.push({img,x:w/2+(column?0:at),y:h/2+(column?at:0),w:cw,h:ch,radius:Math.min(.5,unit*.016/Math.min(cw,ch)),z:shown,alpha:1,live:true,shadow:studio&&shown>.5});
  }
}

// Remolino: two rings of screens, one inside the other, that turn against each other without stopping.
// The rings are ovals that fill the frame, as full of screens as they can be, and every screen stays upright.
function vortex(scene,cards){
  const {w,h,unit,p,size,active,n}=scene;
  if(n===1)return alone(scene,cards,w*.7*size,h*.7*size);
  const aspect=cellAspect(scene,.62,1.6),gap=unit*.026,k=Math.min(1,size),boxW=w*.95*k,boxH=h*.93*k;
  // The largest card that leaves room for four screens in the inner ring. The inner ring clears the outer
  // one at every angle, and is open enough that its own screens do not meet across it.
  const build=long=>{
    const [cw,ch]=sized(long,aspect),a=boxW/2-cw/2,b=boxH/2-ch/2,shrink=1-Math.hypot((cw+gap*2)/a,(ch+gap*2)/b);
    if(a<=0||b<=0||shrink*a<(cw+gap)/2||shrink*b<(ch+gap)/2)return null;
    const paths=[oval(a,b),oval(a*shrink,b*shrink)],counts=paths.map(path=>{
      let slots=Math.min(16,Math.floor(path.length/(long*room(aspect)+gap)));while(slots>2&&!clear(path,slots,cw,ch,gap))slots--;return slots;
    });
    return counts[1]>=4?{cw,ch,paths,counts}:null;
  };
  let lo=unit*.02,hi=unit*.34;for(let i=0;i<12;i++){const mid=(lo+hi)/2;if(build(mid))lo=mid;else hi=mid}
  const found=build(lo);if(!found)return alone(scene,cards,w*.7*size,h*.7*size);
  found.paths.forEach((path,ring)=>{
    // A ring repeats the list when it has more places than images, but never ends on the image it starts with.
    let slots=found.counts[ring];while(slots>n&&slots%n===1)slots--;
    // The inner ring carries on where the outer one stopped, or starts half way along a short list.
    const first=ring?(found.counts[0]<n?found.counts[0]:n>>1):0;
    for(let j=0;j<slots;j++){
      const q=path.at(j/slots+(ring?-p:p));
      cards.push({img:active[(first+j)%n].img,x:w/2+q.x,y:h/2+q.y,w:found.cw,h:found.ch,radius:.07,z:ring,alpha:1});
    }
  });
}

// Brote: the first screen in the centre with the others hidden behind it. They come out one after another
// in a spiral, form a ring that turns around it, and wind back in behind it in the reverse order.
function bloom(scene,cards){
  const {w,h,unit,p,energy,size,studio,active,n}=scene,hero=active[0].img,shape=cardShape(scene,hero),k=Math.min(1,size);
  if(n===1)return alone(scene,cards,w*.56*size,h*.62*size,.04);
  const [bw,bh]=fit(shape,w*.56*size,h*.62*size),rest=active.slice(1,13),count=rest.length,aspect=cellAspect({...scene,active:rest},.62,1.6),gap=unit*.03;
  const ring=ringFit(w*.95*k,h*.93*k,count,aspect,gap,unit*.26),[hw]=hole(ring.path,ring.cw,ring.ch,gap,shape.width/shape.height);
  const open=glide(linear(p,.05,.3))*(1-glide(linear(p,.74,.98))),spin=cruise(p,.07,.3,.72,.96)*Math.max(.4,count*.4)*energy/.7,grow=lerp(1,Math.min(1,hw/bw),open);
  for(let j=0;j<count;j++){
    const from=.07+.12*j/count,to=.72+.1*(count-1-j)/count,shown=glide(linear(p,from,from+.16))*(1-glide(linear(p,to,to+.16)));if(shown<.002)continue;
    const q=ring.path.at((j+spin)/count),s=lerp(.6,1,shown);
    cards.push({img:rest[j].img,x:w/2+q.x*shown,y:h/2+q.y*shown,w:ring.cw*s,h:ring.ch*s,radius:.06,z:-1-j,alpha:1});
  }
  cards.push({img:hero,x:w/2,y:h/2,w:bw*grow,h:bh*grow,radius:.04,z:0,alpha:1,shadow:studio});
}

// Rueda: an oval of screens that turns one place on every step. Places take turns being large and small,
// so each screen grows and shrinks as it goes around. With more images than places, a screen leaves through
// the lowest point of the oval and the next one comes in there.
function wheel(scene,cards){
  const {w,h,unit,p,size,studio,active,n}=scene;
  if(n===1)return alone(scene,cards,w*.6*size,h*.6*size);
  const whole=[2,3,4,5,6,8,10].includes(n),list=whole?atLeast(active,n<6?6:n):active,m=list.length,slots=whole?m:8,small=.68;
  const aspect=cellAspect(scene,.62,1.6),k=Math.min(1,size),ring=ringFit(w*.95*k,h*.93*k,slots,aspect,unit*.03,unit*.4,(1+small)/2),t=stepped(p,n,.66);
  for(let i=0;i<m;i++){
    const d=around(i,t,m),far=Math.abs(d);if(m>slots&&far>slots/2)continue;
    const q=ring.path.at(d/slots),s=lerp(small,1,(1+Math.cos(Math.PI*d))/2)*(m>slots?smooth(slots/2-far):1);
    cards.push({img:list[i].img,x:w/2+q.x,y:h/2+q.y,w:ring.cw*s,h:ring.ch*s,radius:.06,z:s,alpha:1,shadow:studio&&far<.5});
  }
}

// Lente: an oval of small screens that never stops turning. The camera goes close to one side of the ring,
// the screens pass in front of it one after another, and it pulls back to the whole ring.
function lens(scene,cards){
  const {w,h,unit,p,portrait,energy,size,active,n}=scene;
  if(n===1)return alone(scene,cards,w*.6*size,h*.6*size);
  const slots=places(n,9,16),period=Math.min(n,slots),aspect=cellAspect(scene,.62,1.6),k=Math.min(1,size),ring=ringFit(Math.min(w,h*1.3)*.95*k,Math.min(h,w*1.3)*.93*k,slots,aspect,unit*.02,unit*.3);
  const turn=Math.max(1,Math.round(slots*.4*energy/.7/period))*period,most=Math.max(1.01,Math.min(w*.46/ring.cw,h*.56/ring.ch));
  const near=glide(linear(p,.1,.36))*(1-glide(linear(p,.64,.9))),zoom=Math.exp(Math.log(most)*near),pull=(1-1/zoom)/(1-1/most);
  // The point the camera goes to: the top of the ring, or its right side in portrait formats, where screens pass upwards.
  const fx=portrait?ring.path.a*pull:0,fy=portrait?0:-ring.path.b*pull;
  for(let j=0;j<slots;j++){
    const q=ring.path.at((j-p*turn)/slots);
    cards.push({img:active[j%n].img,x:q.x,y:q.y,w:ring.cw,h:ring.ch,radius:.07,z:0,alpha:1});
  }
  return c=>{c.translate(w/2,h/2);c.scale(zoom,zoom);c.translate(-fx,-fy)};
}

// Corona: a ring lying almost flat, seen from above and slightly tilted. Screens are large as they pass in
// front and small at the back, and the ring turns without stopping. It lies on its side in portrait formats.
// A ring that runs across the long side of its screens gets fewer places, so the screens stay large.
function halo(scene,cards){
  const {w,h,unit,p,portrait,energy,size,active,n}=scene;
  if(n===1)return alone(scene,cards,w*.6*size,h*.6*size);
  const aspect=cellAspect(scene,.62,1.6),few=portrait===aspect>1,slots=places(n,few?6:8,few?8:12),period=Math.min(n,slots),gap=unit*.025,step=TAU/slots,back=.5;
  const span=(portrait?h:w)*.98,cross=(portrait?w:h)*.84,next=lerp(back,1,(Math.cos(step)+1)/2),kA=(1+next)/2/Math.sin(step),kB=.76/(2*Math.sin(step/2)),ratio=portrait?aspect:1/aspect;
  // The largest screen for which neighbours clear each other in front and at the sides of the ring.
  const long=Math.min(unit*.42,(span-2*gap/Math.sin(step))/(2*kA+.76),(cross-gap/Math.sin(step/2))/(2*kB+.76)/ratio)*Math.min(1,size),thick=long*ratio;
  const A=Math.min((span*Math.min(1,size)-long*.76)/2,(kA*long+gap/Math.sin(step))*1.3),B=Math.max(kB*thick+gap/(2*Math.sin(step/2)),Math.min(thick*1.7,(cross*Math.min(1,size)-thick*.76)/2));
  const turn=Math.max(1,Math.round(slots*.4*energy/.7/period))*period,cw=portrait?thick:long,ch=portrait?long:thick;
  for(let j=0;j<slots;j++){
    const a=(j-p*turn)*step,depth=(Math.cos(a)+1)/2,s=lerp(back,1,depth),along=Math.sin(a)*A,out=Math.cos(a)*B-thick*(1-back)/4;
    cards.push({img:active[j%n].img,x:portrait?out:along,y:portrait?along:out,w:cw*s,h:ch*s,radius:.07,z:depth,alpha:1});
  }
  return c=>{c.translate(w/2,h/2);c.rotate(-.14)};
}

// Tambor: strips of screens wrapped around drums that roll against each other. A screen comes in tiny at
// one edge of the drum, is at its largest as it crosses the middle and shrinks away at the other edge.
// Drums roll sideways, or upwards in portrait formats.
function drum(scene,cards){
  const {w,h,unit,p,portrait,energy,size,active,n}=scene;
  if(n===1)return alone(scene,cards,w*.7*size,h*.7*size);
  const aspect=cellAspect(scene,.6,1.7),gap=unit*.025,span=portrait?h:w,cross=portrait?w:h,half=span*.48;
  let long=span*(portrait?.36:.3)*Math.min(1.2,size),thick=portrait?long*aspect:long/aspect;
  if(thick>cross*.6){long*=cross*.6/thick;thick=cross*.6}
  // As many drums as fit across the frame, then a little larger so they fill it.
  const lanes=Math.max(1,Math.floor((cross*.94+gap)/(thick+gap))),fill=Math.min(1.3,(cross*.9-(lanes-1)*gap)/(lanes*thick));long*=fill;thick*=fill;
  // Each drum shows its own run of images and rolls a whole number of runs, so the loop closes.
  const pace=(long+gap)/half,period=Math.min(n,Math.max(4,Math.ceil(n/lanes))),travel=period*Math.max(1,Math.round(4*energy/.7/period)),reach=3/pace;
  for(let r=0;r<lanes;r++){
    const first=Math.round(r*n/lanes),shift=(r%2?-1:1)*p*travel+(r%2?.5:0),at=(r-(lanes-1)/2)*(thick+gap);
    for(let k=Math.ceil(-reach-shift);k<=reach-shift;k++){
      // On the drum a screen's size is how much it faces the viewer, and its position follows from the sizes before it.
      const turned=Math.tanh(pace*(k+shift)),s=1-turned*turned;if(s<.04)continue;
      cards.push({img:active[mod(first+mod(k,period),n)].img,x:w/2+(portrait?at:half*turned),y:h/2+(portrait?half*turned:at),w:(portrait?thick:long)*s,h:(portrait?long:thick)*s,radius:.06,z:s,alpha:1});
    }
  }
}

// Escalera: lanes of screens that step down like stairs, each screen half a place lower than the one before.
// On every beat one set of lanes moves a step along the diagonal and then the other set moves a step back.
// With fewer than five images there is a single staircase.
function stairs(scene,cards){
  const {w,h,unit,p,portrait,energy,size,active,n}=scene;
  if(n===1)return alone(scene,cards,w*.7*size,h*.7*size);
  const aspect=cellAspect(scene,.6,1.7),gap=unit*.03,one=n<5,k=Math.min(1.2,size);
  let cw,ch;
  if(portrait){cw=w*(one?.5:.4)*k;ch=cw/aspect;const most=h*(one?.34:.28)*k;if(ch>most){ch=most;cw=ch*aspect}}
  else{ch=h*(one?.4:.3)*k;cw=ch*aspect;const most=w*(one?.32:.28)*k;if(cw>most){cw=most;ch=cw/aspect}}
  // A step goes a whole place along the frame and half a place across it; lanes sit a place and a half apart.
  const px=cw+gap,py=ch+gap,sx=portrait?px/2:px,sy=portrait?py:py/2,lx=portrait?px*1.5:0,ly=portrait?0:py*1.5;
  const cycle=Math.min(n,Math.max(2,Math.round(4*energy/.7))),at=p*cycle,beat=Math.min(cycle-1,Math.floor(at)),f=at-beat;
  const go=[beat+glide(linear(f,.06,.48)),-beat-glide(linear(f,.52,.94))],lanes=one?0:5;
  for(let r=-lanes;r<=lanes;r++){
    const travel=go[mod(r,2)],first=Math.round(mod(r,5)*n/5);
    for(let j=-10-cycle;j<=10+cycle;j++){
      const x=(j+travel)*sx+r*lx,y=(j+travel)*sy+r*ly;if(Math.abs(x)>w/2+cw/2||Math.abs(y)>h/2+ch/2)continue;
      cards.push({img:active[mod(first+mod(j,cycle),n)].img,x:w/2+x,y:h/2+y,w:cw,h:ch,radius:.06,z:0,alpha:1});
    }
  }
}

// Ronda: a table seen from above at an angle, laid out in blocks: one screen in the middle and four at
// the corners. On every step the four walk along the edges of their block to the next corner, around the
// one in the middle. Neighbouring blocks walk in opposite directions, so screens on a shared edge travel together.
const LOOP=[[-1,-1],[1,-1],[1,1],[-1,1]];
function gears(scene,cards){
  const {w,h,unit,p,size,active,n}=scene;
  if(n===1)return alone(scene,cards,w*.7*size,h*.7*size);
  const aspect=cellAspect(scene,.7,1.6),gap=unit*.035,ch=unit*.3*size/Math.sqrt(aspect),cw=ch*aspect,px=cw+gap,py=ch+gap,bx=px*3,by=py*3;
  // Four steps are one whole round, so every screen ends on the corner it left from.
  const t=stepped(p,4,.6),reach=Math.hypot(w,h)*.75,walkers=Math.min(4,n-1),seen=(x,y)=>Math.abs((x-y)*.866)<w/2+cw&&Math.abs((x+y)*.5)<h/2+cw;
  for(let u=-Math.ceil(reach/bx);u<=Math.ceil(reach/bx);u++)for(let v=-Math.ceil(reach/by);v<=Math.ceil(reach/by);v++){
    // Blocks start at different places in the list; with two images they take turns in the middle.
    const odd=mod(u+v,2),base=n>=5?mod(u*2+v*3,n):n===2?odd:0,cx=u*bx,cy=v*by;
    if(seen(cx,cy))cards.push({img:active[base].img,x:cx,y:cy,w:cw,h:ch,radius:.06,z:0,alpha:1});
    for(let s=0;s<4;s++){
      const at=s+(odd?-t:t),k=Math.floor(at),f=at-k,from=LOOP[mod(k,4)],to=LOOP[mod(k+1,4)],x=cx+lerp(from[0],to[0],f)*px,y=cy+lerp(from[1],to[1],f)*py;
      if(seen(x,y))cards.push({img:active[mod(base+1+s%walkers,n)].img,x,y,w:cw,h:ch,radius:.06,z:0,alpha:1});
    }
  }
  return c=>{c.translate(w/2,h/2);c.transform(.866,.5,-.866,.5,0,0)};
}

export const scenes={carousel,dial,bellows,vortex,bloom,wheel,lens,halo,drum,stairs,gears};
