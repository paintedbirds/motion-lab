import {dimensions,duration,ratios,frames} from './config.js';
import {labScenes} from './lab.js';
import {scenes as anillos} from './lab-anillos.js';
import {scenes as profundidad} from './lab-profundidad.js';
import {scenes as escenas} from './lab-escenas.js';
export const TAU=Math.PI*2;
export const mod=(n,m)=>((n%m)+m)%m;
export const lerp=(a,b,t)=>a+(b-a)*t;
export const clamp=t=>Math.max(0,Math.min(1,t));
export const ease=t=>{t=clamp(t);return t*t*t*(t*(t*6-15)+10)};
export const easeOut=t=>1-Math.pow(1-clamp(t),3);
export const easeBack=t=>{t=clamp(t);const k=1.9;return 1+(k+1)*Math.pow(t-1,3)+k*Math.pow(t-1,2)};
export const smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
// Cubic bezier easing, as in CSS. `glide` starts gently and takes a long time to land,
// so a move neither jumps away nor snaps into place.
export function bezier(x1,y1,x2,y2){
  return x=>{
    x=clamp(x);let t=x;
    for(let i=0;i<8;i++){
      const slope=3*x1*(1-t)*(1-3*t)+3*x2*t*(2-3*t)+3*t*t;if(Math.abs(slope)<1e-5)break;
      t=clamp(t-(3*x1*(1-t)*(1-t)*t+3*x2*(1-t)*t*t+t*t*t-x)/slope);
    }
    return 3*y1*(1-t)*(1-t)*t+3*y2*(1-t)*t*t+t*t*t;
  };
}
// A landing that goes slightly past its target and settles, and a drop that bounces on the floor.
export const spring=t=>{t=clamp(t);return 1-Math.exp(-9*t)*Math.cos(9*t)};
export const bounce=t=>{t=clamp(t);const k=7.5625;return t<1/2.75?k*t*t:t<2/2.75?k*(t-=1.5/2.75)*t+.75:t<2.5/2.75?k*(t-=2.25/2.75)*t+.9375:k*(t-=2.625/2.75)*t+.984375};
// Repeatable pseudo-random value from 0 to 1, so small irregularities are the same on every frame.
export const noise=i=>{const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x)};
export const glide=bezier(.32,0,.12,1);
// Distance from 0 to 1 for something that speeds up between a and b, keeps its speed,
// and slows to a stop between c and d. Used so walls never appear or halt at full speed.
export function cruise(p,a,b,c,d){
  const run=(a,b)=>{const u=clamp((p-a)/(b-a));return (u*u*u-u*u*u*u/2)*(b-a)+Math.max(0,p-b)};
  return (run(a,b)-run(c,d))/(d-b+(b-a)/2-(d-c)/2);
}
export const phase=(p,a,b)=>ease((p-a)/(b-a));
export const linear=(p,a,b)=>clamp((p-a)/(b-a));
export const fit=(img,w,h)=>{const s=Math.min(w/img.width,h/img.height);return [img.width*s,img.height*s]};
const sprites=new WeakMap(),tiles=new WeakMap(),tones=new WeakMap();

export async function loadImages(assets){
  return Promise.all(assets.map(asset=>new Promise((resolve,reject)=>{
    const img=new Image();img.onload=()=>resolve({...asset,img});
    img.onerror=()=>reject(new Error('No se pudo abrir '+asset.name));img.src=asset.src;
  })));
}

// Average colour of an image, used as the backdrop when a screen sits inside a cell of another shape.
function tone(img){
  let found=tones.get(img);
  if(!found){
    const dot=document.createElement('canvas');dot.width=dot.height=1;
    const c=dot.getContext('2d',{willReadFrequently:true});c.drawImage(img,0,0,1,1);
    const d=c.getImageData(0,0,1,1).data;found=`rgb(${d[0]},${d[1]},${d[2]})`;tones.set(img,found);
  }
  return found;
}

// Framing of an image inside a card. `zoom` 1 fills the card; above 1 it comes closer, below 1 it shows more,
// down to the whole image. `x` and `y` say which part stays in view, from 0 (left, top) to 1 (right, bottom).
// By default an image fills its card and keeps its upper part, where a screen has its header.
export const CROP={zoom:1,x:.5,y:.25};
const crops=new WeakMap();
const framing=img=>crops.get(img)||CROP;
const framingKey=img=>{const f=framing(img);return f===CROP?'':`|${f.zoom.toFixed(3)},${f.x.toFixed(3)},${f.y.toFixed(3)}`};
// Draws an image into a card with a given framing, never distorted. Only an image zoomed out by hand
// leaves part of the card empty; that part takes the average colour of the image.
export function frame(c,img,crop,x,y,w,h){
  const cover=Math.max(w/img.width,h/img.height),whole=Math.min(w/img.width,h/img.height),scale=Math.max(whole,cover*crop.zoom),dw=img.width*scale,dh=img.height*scale;
  if(dw<w-.5||dh<h-.5){c.fillStyle=tone(img);c.fillRect(x,y,w,h)}
  c.drawImage(img,x+(w-dw)*(dw>w?crop.x:.5),y+(h-dh)*(dh>h?crop.y:.5),dw,dh);
}
// The frame drawn around every screen: none, a browser window or a phone. Set once per drawing from the config.
let chrome='none';
// A phone needs rounder corners than a plain card. Cards without corners fill the frame and stay bare.
const corner=radius=>chrome==='phone'&&radius>0?Math.max(radius,.13):radius;
const dark=img=>{const [r,g,b]=tone(img).match(/\d+/g).map(Number);return .299*r+.587*g+.114*b<110};
// Draws an image into a card, inside the chosen frame. The frame is drawn in the card's own space, so it
// moves, grows and gets clipped with the card in every scene. `bare` skips the frame.
function place(c,img,x,y,w,h,bare=false){
  const crop=framing(img),u=Math.min(w,h);
  if(bare||chrome==='none')return frame(c,img,crop,x,y,w,h);
  if(chrome==='browser'){
    // The bar takes the tone of the screen: dark screens get a dark window.
    const night=dark(img),bar=u*.085,dot=bar*.13,pill=Math.min(w*.46,w-bar*4.2);
    c.fillStyle=night?'#24272b':'#eceef1';c.fillRect(x,y,w,bar);
    ['#ff5f57','#febc2e','#28c840'].forEach((color,i)=>{c.fillStyle=color;c.beginPath();c.arc(x+bar*.6+i*bar*.42,y+bar/2,dot,0,TAU);c.fill()});
    if(pill>bar){c.fillStyle=night?'#3a3f45':'#ffffff';c.beginPath();c.roundRect(x+(w-pill)/2,y+bar*.24,pill,bar*.52,bar*.26);c.fill()}
    c.fillStyle=night?'#00000066':'#0000001f';c.fillRect(x,y+bar-Math.max(1,bar*.03),w,Math.max(1,bar*.03));
    return frame(c,img,crop,x,y+bar,w,h-bar);
  }
  const edge=u*.04,rim=Math.max(1,u*.007);
  c.fillStyle='#0f1113';c.fillRect(x,y,w,h);
  c.save();c.beginPath();c.roundRect(x+edge,y+edge,w-edge*2,h-edge*2,u*.095);c.clip();frame(c,img,crop,x+edge,y+edge,w-edge*2,h-edge*2);c.restore();
  // The camera island only makes sense on an upright phone.
  if(h>w*1.15){c.fillStyle='#0f1113';c.beginPath();c.roundRect(x+w/2-u*.14,y+edge+u*.03,u*.28,u*.075,u*.04);c.fill()}
  c.strokeStyle='#ffffff30';c.lineWidth=rim;c.beginPath();c.roundRect(x+rim/2,y+rim/2,w-rim,h-rim,u*.13-rim/2);c.stroke();
}

// Rounded copy of an image for cells whose shape stays fixed. Cached per shape.
function tile(img,aspect,radius){
  let cache=tiles.get(img);if(!cache){cache=new Map();tiles.set(img,cache)}
  const key=chrome+aspect.toFixed(2)+'|'+radius+framingKey(img);let found=cache.get(key);if(found)return found;
  if(cache.size>16)cache.clear();
  const long=Math.min(1400,Math.max(img.width,img.height));
  const w=Math.max(2,Math.round(aspect>=1?long:long*aspect)),h=Math.max(2,Math.round(aspect>=1?long/aspect:long));
  found=document.createElement('canvas');found.width=w;found.height=h;
  const c=found.getContext('2d');c.beginPath();c.roundRect(0,0,w,h,Math.min(w,h)*corner(radius));c.clip();place(c,img,0,0,w,h,!radius);
  cache.set(key,found);return found;
}

// A card as a bitmap of a given shape, framed like any other card. Scenes that bend a card in perspective slice it.
export const cardBitmap=(img,aspect,radius=0)=>tile(img,aspect,radius);

// Cards are opaque. `live` cards change shape, so they are clipped per frame; the rest reuse a cached tile.
// Only the playful scenes pass `sx` and `sy`, for a brief squash when a card lands.
function paintCard(c,card){
  const {img,x,y,w,h}=card;if(w<2||h<2||card.alpha<.004)return;
  c.save();c.globalAlpha=card.alpha;c.translate(x,y);if(card.rot)c.rotate(card.rot);if(card.sx)c.scale(card.sx,card.sy);
  // `mask` draws a path around the card's centre; only what falls inside it is painted. Used by reveals.
  if(card.mask){c.beginPath();card.mask(c,w,h);c.clip()}
  if(card.shadow){c.shadowColor='#00000059';c.shadowBlur=w*.07;c.shadowOffsetY=w*.03}
  if(card.live){
    const r=Math.min(w,h)*corner(card.radius);
    if(card.shadow){c.fillStyle='#1c2022';c.beginPath();c.roundRect(-w/2,-h/2,w,h,r);c.fill();c.shadowColor='transparent'}
    c.beginPath();c.roundRect(-w/2,-h/2,w,h,r);c.clip();place(c,img,-w/2,-h/2,w,h,!card.radius);
  }else c.drawImage(tile(img,w/h,card.radius),-w/2,-h/2,w,h);
  c.restore();
}

// Shape shared by every card of a scene, and the one place that decides it. A card ratio chosen in the editor
// wins. Otherwise it is the median shape of the images when most are close to it, within `min` and `max`.
// In a mixed set the first image decides: the images on its side (wide or tall) set the shape, kept moderate.
// The result is also left in `scene.cell`, so the editor can show the same shape in its crop dialog.
export function cellAspect(scene,min=.5,max=1.9){
  if(scene.ratio)return scene.cell=scene.ratio;
  const {active}=scene,ratio=a=>a.img.width/a.img.height,list=active.map(ratio).sort((a,b)=>a-b),middle=list=>list[Math.floor(list.length/2)];
  let shape=middle(list);
  if(list.filter(r=>Math.max(r/shape,shape/r)<=1.3).length<list.length*.6){
    const wide=ratio(active[0])>=1.15,side=list.filter(r=>r>=1.15===wide);if(side.length*3>=list.length)shape=Math.max(.75,Math.min(1.4,middle(side)));
  }
  return scene.cell=Math.max(min,Math.min(max,shape));
}
// Shape of a card that shows one image on its own: the chosen card ratio, or the image itself.
export const cardShape=(scene,img)=>scene.ratio?{width:scene.ratio,height:1}:img;
// Cell size for a wall. Down to the `ref` shape a cell is `cw` wide; taller cells keep that area
// instead of growing with their height, so phone screens get tall cells without filling the frame.
export function cellSize(cw,aspect,ref){const k=Math.sqrt(Math.min(1,aspect/ref));return [cw*k,cw*k/aspect]}

// A wall needs enough different images. With fewer than five the same one would sit next to itself,
// so each image is shown once on a board: as large as the frame allows, in lines of equal cells.
const WALL=5;
export function board(n,w,h,aspect,gap,size,columns){
  let best;
  for(let lines=1;lines<=n;lines++){
    const per=Math.ceil(n/lines),across=columns?lines:per,down=columns?per:lines,cw=Math.min(w*.9/across-gap,(h*.84/down-gap)*aspect);
    if(!best||cw>best.cw*1.02)best={lines,per,cw};
  }
  const cw=best.cw*size,ch=cw/aspect,px=cw+gap,py=ch+gap,cells=[];
  for(let i=0;i<n;i++){
    const line=Math.floor(i/best.per),here=Math.min(best.per,n-line*best.per),a=line-(best.lines-1)/2,b=i-line*best.per-(here-1)/2;
    cells.push({line,x:w/2+(columns?a:b)*px,y:h/2+(columns?b:a)*py});
  }
  return {cw,ch,px,py,cells};
}
// Where each line of a wall starts in the list of images, for sets of eight or more. Neighbouring lines
// travel `sweep` cells against each other and lines two apart travel together; each line starts where
// its images stay furthest from their copies in the lines around it. `allowed` can rule out a start.
export function starts(n,sweep,allowed){
  const found=new Map([[0,0]]),near=d=>Math.min(mod(d,n),n-mod(d,n));
  const apart=(a,b)=>{
    if(mod(a-b,2)===0)return near(found.get(a)-found.get(b))+1;
    const even=mod(a,2)?b:a,odd=mod(a,2)?a:b,at=found.get(even)-found.get(odd)+.5,lo=Math.min(at,at+sweep),hi=Math.max(at,at+sweep);
    return Math.floor(hi/n)!==Math.floor(lo/n)?0:Math.min(mod(lo,n),n-mod(hi,n));
  };
  for(const line of [1,-1,2,-2,3,-3,4]){
    let best=-1,pick=0;
    for(let start=0;start<n;start++){
      if(allowed&&!allowed(line,start))continue;
      found.set(line,start);
      const score=Math.min(...[...found.keys()].filter(other=>other!==line&&Math.abs(other-line)<3).map(other=>apart(line,other)));
      if(score>best){best=score;pick=start}
    }
    found.set(line,pick);
  }
  return found;
}
// How much a phone screen the first image is, from 0 (4:5 or wider) to 1 (3:5 or taller). Phone screens get a taller box.
export const tallness=img=>clamp((.8-img.width/img.height)/.2);

// Vitrina: one screen, a diagonal stack, then a wall of rows
// that slide in opposite directions, and back to a stack fanned the other way.
// Beats are in seconds of the 15 second reference clip.
function showcase(scene,cards){
  const {w,h,unit,p,portrait,energy,size,studio,active,n}=scene,s=p*15,hero=active[0].img,first=cardShape(scene,hero);
  const [hw,hh]=fit(first,w*(portrait?.8:.42)*size,h*lerp(portrait?.34:.46,portrait?.5:.62,tallness(first))*size);
  const aspect=cellAspect(scene,.5,1.9),gap=unit*.012,run=cruise(s,3.6,5.4,9.8,11.3);
  const arrive=linear(s,3.6,4.9),leave=linear(s,11,12.2),far=Math.hypot(w,h)/2,cells=[];
  // `enter` is the cell the first screen settles into, `exit` the one it is picked up from.
  let cw=hw,ch=hh,enter=[w/2,h/2],exit=enter;
  if(n>=WALL){
    [cw,ch]=cellSize(w/(portrait?1.5:3.08)*size,aspect,portrait?.9:1.3);
    // The wall speeds up as it appears and slows to a stop before it closes. Its travel is a whole
    // number of cells plus a half, and one row up, so the first screen ends exactly in the centre again.
    const px=cw+gap,py=ch+gap,steps=Math.max(0,Math.round(2.3*energy/.7-.5)),slide=-(steps+.5)*px*run,rise=-py*run;
    // Each row starts further along the list, so rows that are visible together show different images.
    // The cell the first screen is picked up from always carries the first image.
    const rows=n<8?null:starts(n,2*steps+1,(row,start)=>row!==1||![steps,steps+1,steps+2].includes(start));
    const cellX=(r,k)=>w/2+k*px+(mod(r,2)?px/2-slide:slide),cellY=r=>h/2+r*py+rise;
    const image=(r,k)=>r===1&&(!rows||k===-steps-1)?mod(k+steps+1,n):mod(k+(rows?.get(r)??r*2),n);
    enter=[cellX(0,0),cellY(0)];exit=[cellX(1,-steps-1),cellY(1)];
    if(arrive>0&&leave<1)for(let r=Math.floor((-h/2-ch/2-rise)/py);r<=Math.ceil((h/2+ch/2-rise)/py);r++){
      const shift=cellX(r,0)-w/2;
      for(let k=Math.floor((-w/2-cw/2-shift)/px);k<=Math.ceil((w/2+cw/2-shift)/px);k++)cells.push({x:cellX(r,k),y:cellY(r),img:active[image(r,k)].img});
    }
  }else if(n>1){
    // Two to four images: a board where each one appears once, with rows that drift a little apart.
    const b=board(n,w,h,aspect,gap*2.5,size);cw=b.cw;ch=b.ch;
    b.cells.forEach((cell,i)=>cells.push({x:cell.x+(mod(cell.line,2)?1:-1)*(run-.5)*b.px*.1,y:cell.y,img:active[i].img}));
    enter=exit=[cells[0].x,cells[0].y];
  }
  if(arrive>0&&leave<1)for(const {x,y,img} of cells){
    // Cells open outwards from the centre and close back towards it.
    const reach=Math.min(1,Math.hypot(x-w/2,y-h/2)/far);
    const seen=glide(linear(arrive,reach*.45,reach*.45+.55))*(1-glide(linear(leave,(1-reach)*.45,(1-reach)*.45+.55)));
    if(seen<.003)continue;
    const grow=lerp(.84,1,seen);
    cards.push({img,x,y,w:cw*grow,h:ch*grow,radius:.035,z:-10,alpha:smooth(seen*1.4)});
  }
  // The stack opens up and to the right first, then down and to the left before the loop closes.
  // Cards leave one after another and gather in the reverse order, and keep drifting while open.
  const count=Math.min(n,5),settle=glide(arrive),release=glide(leave);
  // The stack steps along a diagonal. A tall first screen would turn it into a column, so it gets an even step.
  const even=(hw*.075+hh*.14)/2,stepX=lerp(hw*.075,even,tallness(first)),stepY=lerp(hh*.14,even,tallness(first));
  for(let i=count-1;i>=0;i--){
    const lead=count>1?i/(count-1):0,fan=(from,open,close,to)=>glide(linear(linear(s,from,open),.25*(1-lead),.25*(1-lead)+.75))*(1-glide(linear(linear(s,close,to),.25*lead,.25*lead+.75)));
    const first=fan(.6,1.7,2.4,3.3),second=fan(12.5,13.6,13.9,14.8),open=Math.max(first,second),side=second>first?-1:1;
    if(i&&open<.002)continue;
    const drift=1+.05*(side>0?linear(s,.6,3.3):linear(s,12.5,14.8)),offset=(i-(count-1)/2)*open*drift*side;
    let x=w/2+offset*stepX,y=h/2-offset*stepY,cardW=hw,cardH=hh;
    if(n===1){
      // A single image has no stack and no wall: it comes closer and goes back.
      const push=1+.14*glide(linear(s,3.6,6))*(1-glide(linear(s,9.4,12.2)));cardW*=push;cardH*=push;
    }else if(!i&&s>=3.6&&s<12.2){
      if(s>=4.9&&s<11)continue;
      const [cellX,cellY,k]=s<11?[...enter,settle]:[...exit,1-release];
      x=lerp(w/2,cellX,k);y=lerp(h/2,cellY,k);cardW=lerp(hw,cw,k);cardH=lerp(hh,ch,k);
    }
    cards.push({img:active[i].img,x,y,w:cardW,h:cardH,radius:.03,z:-i,alpha:1,live:true,shadow:studio});
  }
}

// Despliegue: a hero screen, a vertical stack peeking behind it,
// then every screen leaves from behind the hero into columns that travel in opposite directions,
// gathers back into it, and the hero takes a small breath before the loop restarts.
function spread(scene,cards){
  const {w,h,unit,p,portrait,energy,size,studio,active,n}=scene,hero=active[0].img,first=cardShape(scene,hero);
  const [hw,hh]=fit(first,w*(portrait?.8:.44)*size,h*(portrait?lerp(.36,.52,tallness(first)):.6)*size);
  const aspect=cellAspect(scene,.5,portrait?1.4:1.6),gap=unit*.022,dip=.1*(1-Math.cos(TAU*linear(p,.9,1)))/2;
  if(n===1){
    // A single image has nothing to unfold: it comes closer, goes back and takes the same breath.
    const grow=1+.02*smooth(p/.1)*(1-smooth(linear(p,.78,.88)))+.12*glide(linear(p,.12,.34))*(1-glide(linear(p,.56,.78)))-dip;
    cards.push({img:hero,x:w/2,y:h/2,w:hw*grow,h:hh*grow,radius:.07,z:0,alpha:1,live:true,shadow:studio});return;
  }
  const out=linear(p,.11,.29),back=linear(p,.74,.9),peek=glide(linear(p,.04,.12))*(1-glide(linear(p,.87,.95)));
  const breath=p<.5?1+.02*smooth(p/.1):1-dip,run=cruise(p,.11,.3,.6,.76);
  let cw,ch;
  // Before they leave, screens wait behind the hero: `level` is their place in the peeking stack,
  // and screens from other columns (`col`) stay hidden.
  const card=(img,targetX,targetY,shown,level,col)=>{
    let x=targetX,y=targetY,cardW=cw,cardH=ch;
    if(shown<.999){
      const step=Math.max(-3,Math.min(3,level)),tuck=col?.8:1-.05*Math.abs(step);
      x=lerp(w/2,targetX,shown);y=lerp(h/2+(col?0:step*hh*.085*peek),targetY,shown);
      cardW=lerp(hw*breath*tuck,cw,shown);cardH=lerp(hh*breath*tuck,ch,shown);
    }
    cards.push({img,x,y,w:cardW,h:cardH,radius:.07,z:-Math.abs(level)-Math.abs(col)*10,alpha:1,live:shown<.999,shadow:studio&&!col&&!level&&shown<.5});
  };
  const show=reach=>glide(linear(out,reach*.4,reach*.4+.6))*(1-glide(linear(back,(1-reach)*.3,(1-reach)*.3+.7)));
  if(n<WALL){
    // Two to four images: each one appears once, in columns that drift a little in opposite directions.
    const b=board(n,w,h,aspect,gap,size,true);cw=b.cw;ch=b.ch;
    b.cells.forEach((cell,i)=>card(active[i].img,cell.x,cell.y+(mod(cell.line,2)?1:-1)*(run-.5)*b.py*.14,show(i?.8:0),i?(i%2?1:-1)*Math.ceil(i/2):0,0));
    return;
  }
  [cw,ch]=cellSize(w*(portrait?.46:.31)*size,aspect,portrait?.8:1.1);const px=cw+gap,py=ch+gap;
  // The centre column travels a whole number of cells, so a cell lands exactly in the centre when
  // the columns stop. That cell carries the hero image and becomes the hero again.
  let steps=Math.max(1,Math.round(2*energy/.7));if([1,n-1].includes(mod(steps,n)))steps++;
  // Each column starts further along the list, so neighbouring columns show different images.
  const travel=steps*py*run,home=p<.5?0:-steps,lines=n<8?null:starts(n,-2*steps);
  const columns=Math.ceil((w/2+cw/2)/px);
  for(let col=-columns;col<=columns;col++){
    const offset=(mod(col,2)?-1:1)*travel+(mod(col,2)?py/2:0);
    let from=Math.floor((-h/2-ch/2-offset)/py),to=Math.ceil((h/2+ch/2-offset)/py);
    if(!col){from=Math.min(from,home-3);to=Math.max(to,home+3)}
    for(let k=from;k<=to;k++){
      const level=k-home,shown=show(Math.min(1,(Math.abs(col)+Math.abs(level)*.5)/3));
      const stacked=!col&&Math.abs(level)<=3&&(!level||peek>.01);
      if(shown<.002&&!stacked)continue;
      card(active[!col&&k===-steps?0:mod(k+(lines?.get(col)??col*2),n)].img,w/2+col*px,h/2+k*py+offset,shown,level,col);
    }
  }
}

// Ticker: a tilted wall whose rows drift in opposite directions while the
// camera visits three areas. It pulls back, travels and pushes in as one arc, so it never stops dead.
function ticker(scene,cards){
  const {w,h,unit,p,portrait,energy,size,active,n}=scene,few=n<WALL,aspect=cellAspect(scene,.5,few?1.9:1.3);
  const beats=3,at=p*beats,t=at-Math.floor(at),close=smooth(linear(t,.04,.32))*(1-smooth(linear(t,.68,.96)));
  const zoom=Math.exp(Math.log(lerp(1.2,1.9,energy))*close+.05*close*t);
  // With fewer than five images the camera visits three areas of a board that shows each one once,
  // a little smaller so its corners stay inside the frame once it is tilted.
  const b=few&&board(n,w,h,aspect,unit*.03,size*.86),[cw,ch]=few?[b.cw,b.ch]:cellSize(w*(portrait?.5:.23)*size,aspect,1),gap=cw*.05,px=cw+gap,py=ch+gap;
  const spanX=few?Math.max(...b.cells.map(cell=>Math.abs(cell.x-w/2)))+cw/2:0,spanY=few?Math.max(...b.cells.map(cell=>Math.abs(cell.y-h/2)))+ch/2:0;
  // The move to the next area starts as the camera pulls back and ends as it pushes in again.
  const stops=few?[[0,0],[spanX*.42,spanY*.4],[-spanX*.4,-spanY*.42]]:[[0,0],[px*1.3,py*.8],[-px*.9,-py*.9]],leg=Math.floor(at-.68),move=smooth((at-.68-leg)/.64);
  const from=stops[mod(leg,beats)],to=stops[mod(leg+1,beats)],fx=lerp(from[0],to[0],move),fy=lerp(from[1],to[1],move);
  if(few)b.cells.forEach((cell,i)=>cards.push({img:active[i].img,x:cell.x-w/2,y:cell.y-h/2,w:cw,h:ch,radius:.05,z:0,alpha:1}));
  else{
    // Each row repeats a few images and drifts that many cells per loop, so the speed does not depend on
    // how many images there are. Larger sets are shared out between the rows: every image appears,
    // and neighbouring rows show different ones.
    const cycle=[5,6,4].find(size=>n%size===0)||5,sets=Math.ceil(n/cycle),reach=Math.hypot(w,h)/2/zoom;
    for(let r=Math.floor((fy-reach-ch)/py);r<=Math.ceil((fy+reach+ch)/py);r++){
      const shift=(mod(r,2)?px/2:0)+(mod(r,2)?-1:1)*p*cycle*px,first=Math.round(mod(r,sets)*n/sets);
      for(let k=Math.floor((fx-reach-cw-shift)/px);k<=Math.ceil((fx+reach+cw-shift)/px);k++)
        cards.push({img:active[mod(first+mod(k+r*3,cycle),n)].img,x:k*px+shift,y:r*py,w:cw,h:ch,radius:.09,z:0,alpha:1});
    }
  }
  return c=>{c.translate(w/2,h/2);c.scale(zoom,zoom);c.rotate(-.14);c.translate(-fx,-fy)};
}

// Foco: each screen takes the centre in turn and hands over to the next one, sideways or, in portrait
// formats, upwards. Screens keep their own shape and stay opaque; the next ones wait smaller at the edges.
function spotlight(scene,cards){
  const {w,h,unit,p,portrait,energy,size,studio,active,n}=scene,boxW=w*(portrait?.86:.72)*size,boxH=h*(portrait?.56:.78)*size,span=portrait?h:w,gap=unit*.04;
  if(n===1){
    // A single image has no handover: it comes closer and goes back.
    const [cw,ch]=fit(cardShape(scene,active[0].img),boxW,boxH),grow=1+.1*energy/.7*glide(linear(p,.08,.46))*(1-glide(linear(p,.54,.92)));
    cards.push({img:active[0].img,x:w/2,y:h/2,w:cw*grow,h:ch*grow,radius:.03,z:0,alpha:1,shadow:studio});return;
  }
  const sizes=active.map(a=>fit(cardShape(scene,a.img),boxW,boxH)),widest=Math.max(...sizes.map(s=>s[portrait?1:0]));
  // Screens waiting at the edges must all be different, so a short list keeps them out of the frame.
  const sides=Math.floor((n-2)/2),pitch=Math.max(widest*.92+gap,(span/2+widest*.42)/(sides+1));
  const pos=p*n,index=Math.floor(pos),t=pos-index,change=glide(linear(t,.58,1)),hold=ease(linear(t,0,.58))*(1-change);
  for(let i=-sides-1;i<=sides+2;i++){
    const slot=i-change,near=Math.max(0,1-Math.abs(slot)),scale=.84+.16*near+(i?0:.035*energy/.7*hold),[cw,ch]=sizes[mod(index+i,n)];
    if(Math.abs(slot)*pitch-widest*.42>span/2)continue;
    cards.push({img:active[mod(index+i,n)].img,x:w/2+(portrait?0:slot*pitch),y:h/2+(portrait?slot*pitch:0),w:cw*scale,h:ch*scale,radius:.03,z:near,alpha:1,shadow:studio&&near>.5});
  }
}

// Órbita: a tight cluster of screens on a slowly turning sphere.
// Screens always face the viewer; depth only changes their size and stacking order.
function orbit(scene,cards){
  const {w,h,unit,p,energy,size,active,n}=scene,count=Math.max(12,Math.min(18,n*3)),turn=p*TAU,tilt=.32,radius=unit*.3*size,sizes=[1,.84,1.1,.92];
  for(let i=0;i<count;i++){
    const lat=1-2*(i+.5)/count,ring=Math.sqrt(1-lat*lat),theta=i*2.39996+turn;
    const x3=Math.cos(theta)*ring,z3=Math.sin(theta)*ring,y3=lat*Math.cos(tilt)-z3*Math.sin(tilt),depth=(lat*Math.sin(tilt)+z3*Math.cos(tilt)+1)/2;
    const img=active[i%n].img,box=unit*.42*size*lerp(.72,1.15,depth)*sizes[i%4],[cw,ch]=fit(cardShape(scene,img),box,box);
    cards.push({img,x:w/2+x3*radius*1.05,y:h/2+y3*radius*.95+Math.sin(turn*2+i)*unit*.012*energy,w:cw,h:ch,radius:.04,z:depth,alpha:1});
  }
}
// A grid of slots with a margin, sized to the frame. Shared by the playful scenes.
function table(scene){
  const {w,h,unit,size}=scene,shape=w/h,cols=shape>1.3?4:shape>.9?3:2,aspect=cellAspect(scene,.7,1.8),gap=unit*.03;
  // As many rows as fit at the width-limited size, so the table fills the frame in every format.
  const rows=Math.max(1,Math.min(5,Math.floor(h*.86/((w*.9/cols-gap)/aspect+gap)))),cw=Math.min(w*.9/cols-gap,(h*.86/rows-gap)*aspect)*size,ch=cw/aspect,slots=[];
  for(let r=0;r<rows;r++)for(let col=0;col<cols;col++)slots.push({x:w/2+(col-(cols-1)/2)*(cw+gap),y:h/2+(r-(rows-1)/2)*(ch+gap),r,col});
  return {cw,ch,rows,slots};
}

// Baraja: a deck dips, deals its screens in arcs around the table, a wave runs through them,
// and they are swept back in the reverse order. The centre slot, when there is one, is dealt last.
function deal(scene,cards){
  const {w,h,unit,p,active,n}=scene,{cw,ch,slots}=table(scene),count=slots.length;
  const middle=slot=>Math.hypot(slot.x-w/2,slot.y-h/2)<1,order=[...slots].sort((a,b)=>middle(a)-middle(b)||Math.atan2(a.y-h/2,a.x-w/2)-Math.atan2(b.y-h/2,b.x-w/2));
  const dip=1-.06*Math.sin(Math.PI*linear(p,.04,.12)),sweep=linear(p,.5,.68)*1.7-.35;
  for(let j=0;j<count;j++){
    const slot=order[j],leaves=.11+j/count*.3,returns=.72+(count-1-j)/count*.15;
    const out=linear(p,leaves,leaves+.16),home=linear(p,returns,returns+.12),placed=spring(Math.pow(out,1.3))*(1-glide(home));
    const flight=out<1?Math.sin(Math.PI*out):Math.sin(Math.PI*home),side=slot.x<w/2?-1:1,pop=Math.exp(-Math.pow((slot.x/w-sweep)/.13,2))*placed;
    const grow=lerp(1.25*dip,1,Math.min(1,placed))*(1+.1*flight+.07*pop);
    cards.push({img:active[j%n].img,radius:.05,alpha:1,shadow:true,z:-j+(flight>.01?50:0),w:cw*grow,h:ch*grow,
      x:lerp(w/2+(noise(j+9)-.5)*unit*.02,slot.x,placed),y:lerp(h/2-j*unit*.004,slot.y,placed)-unit*(.07*flight+.012*pop),
      rot:(noise(j)-.5)*.16*(1-Math.min(1,placed))+side*.3*flight*(out<1?1-out:1)});
  }
}

// Caída: screens fall into place row by row, stretch on the way down, squash and bounce as they land,
// then hop and drop out of the frame.
function drop(scene,cards){
  const {h,unit,p,active,n}=scene,{cw,ch,rows,slots}=table(scene);
  slots.forEach((slot,i)=>{
    // Lower rows go first. Delays are shared out over the rows so the last screen is gone before the loop restarts.
    const turn=(rows-1-slot.r)/Math.max(1,rows-1),enters=.03+turn*.16+noise(i)*.04+slot.col*.01,exits=.7+turn*.07+noise(i+5)*.03;
    const u=linear(p,enters,enters+.2),v=linear(p,exits,exits+.18);
    if(u<=0||v>=1)return;
    // The first and second landings are where the bounce curve touches the floor.
    const hit=Math.exp(-Math.pow((u-.364)/.05,2))+.45*Math.exp(-Math.pow((u-.727)/.04,2)),stretch=u<.364?u/.364:0;
    const sy=1-.12*hit+.07*stretch,hop=Math.sin(Math.PI*linear(v,0,.22)),fall=Math.pow(linear(v,.18,1),2);
    cards.push({img:active[i%n].img,radius:.05,alpha:1,shadow:true,z:i,w:cw,h:ch,sx:1+.09*hit-.03*stretch,sy,
      x:slot.x,y:lerp(-ch*(.7+noise(i+2)),slot.y,bounce(u))+ch*(1-sy)/2-unit*.025*hop+fall*(h-slot.y+ch)*1.1,
      rot:(noise(i+3)-.5)*.16*(1-bounce(u))+(noise(i+7)-.5)*.5*fall});
  });
}

// Ola: a wall whose rows drift in opposite directions while two waves cross it,
// lifting each screen as they pass.
function wave(scene,cards){
  const {w,h,unit,p,portrait,energy,size,active,n}=scene,aspect=cellAspect(scene,portrait?.9:1.2,1.8),cw=w/(portrait?1.6:3.6)*size,ch=cw/aspect,gap=unit*.014,px=cw+gap,py=ch+gap,far=Math.hypot(w,h)/2;
  const pass=Math.floor(p*2),front=lerp(-1.8,1.8,p*2-pass),dx=pass?-.86:.89,dy=pass?.51:.45;
  for(let r=Math.floor((-h/2-ch)/py);r<=Math.ceil((h/2+ch)/py);r++){
    const shift=(mod(r,2)?px/2:0)+(mod(r,2)?-1:1)*p*n*px;
    for(let k=Math.floor((-w/2-cw-shift)/px);k<=Math.ceil((w/2+cw-shift)/px);k++){
      const x=w/2+k*px+shift,y=h/2+r*py,lift=Math.exp(-Math.pow((((x-w/2)*dx+(y-h/2)*dy)/far-front)/.26,2)),grow=1+.12*energy/.7*lift;
      cards.push({img:active[mod(k+r*2,n)].img,x,y:y-unit*.02*lift,w:cw*grow,h:ch*grow,radius:.045,z:lift,alpha:1,rot:(pass?-.015:.015)*lift,shadow:lift>.04});
    }
  }
}
const scenes={showcase,spread,ticker,spotlight,orbit,deal,drop,wave,...labScenes,...anillos,...profundidad,...escenas};

// Rounded copy of an image with its shadow, for the exploration presets. Cached per shape and framing.
function sprite(img,studio,aspect){
  let cache=sprites.get(img);if(!cache){cache=new Map();sprites.set(img,cache)}
  const key=chrome+(studio?'studio':'clean')+aspect.toFixed(2)+framingKey(img);let found=cache.get(key);if(found)return found;
  if(cache.size>8)cache.clear();
  const long=Math.min(1800,Math.max(img.width,img.height)),w=Math.max(2,Math.round(aspect>=1?long:long*aspect)),h=Math.max(2,Math.round(aspect>=1?long/aspect:long)),pad=64,r=Math.min(w,h)*corner(.023);
  const canvas=document.createElement('canvas');canvas.width=w+pad*2;canvas.height=h+pad*2;
  const c=canvas.getContext('2d');c.shadowColor=studio?'#0007':'#0003';c.shadowBlur=studio?30:12;c.shadowOffsetY=studio?20:8;
  c.fillStyle='#202629';c.beginPath();c.roundRect(pad,pad,w,h,r);c.fill();c.shadowColor='transparent';c.clip();place(c,img,pad,pad,w,h);
  if(studio){const light=c.createLinearGradient(0,pad,0,pad+h);light.addColorStop(0,'#ffffff16');light.addColorStop(.4,'#ffffff00');c.fillStyle=light;c.fillRect(pad,pad,w,h)}
  found={canvas,w,h,pad};cache.set(key,found);return found;
}

// Background: one flat colour, a linear gradient at any angle (0 is up, 90 right, 180 down), or a radial glow.
// Without an angle the linear gradient keeps the slight tilt of the first clips.
function backdrop(c,config,w,h){
  const {top,bottom}=config,mode=config.bgMode||'linear';
  if(mode==='solid')return top;
  let g;
  if(mode==='radial'){const r=Math.hypot(w,h)*.62;g=c.createRadialGradient(w/2,h*.38,0,w/2,h*.38,r);g.addColorStop(0,top);g.addColorStop(1,bottom);return g}
  if(Number.isFinite(config.angle)){
    const a=config.angle*Math.PI/180,dx=Math.sin(a),dy=-Math.cos(a),half=(Math.abs(w*dx)+Math.abs(h*dy))/2;
    g=c.createLinearGradient(w/2-dx*half,h/2-dy*half,w/2+dx*half,h/2+dy*half);
  }else g=c.createLinearGradient(w/2-h*.09,0,w/2+h*.09,h);
  g.addColorStop(0,top);g.addColorStop(.32,top);g.addColorStop(.66,bottom);g.addColorStop(1,bottom);return g;
}
// Optional background layers. Everything moves on the loop phase, so the video still repeats without a cut.
// `bgMotion`: 'drift' sways the gradient or slowly zooms a background image; 'aurora' adds soft blobs of colour,
// taken from the images when `bgFromImages` is on. `bgMode` 'image' draws the user's own picture, with blur and dimming.
const backgrounds=new Map(),blurred=new Map();
export function loadBackground(src){
  if(!src)return Promise.resolve(null);
  if(backgrounds.has(src))return Promise.resolve(backgrounds.get(src));
  return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{backgrounds.set(src,img);resolve(img)};img.onerror=()=>reject(new Error('No se pudo abrir la imagen de fondo.'));img.src=src});
}
const hexAlpha=(color,alpha)=>color.startsWith('#')?color.slice(0,7)+Math.round(alpha*255).toString(16).padStart(2,'0'):color.replace('rgb(','rgba(').replace(')',`,${alpha})`);
// Average colours of dull screenshots look grey; push them away from grey so the glow reads as their colour.
function vivid(rgb){
  const [r,g,b]=rgb.match(/\d+/g).map(Number),m=(r+g+b)/3,k=1.9,f=v=>Math.max(0,Math.min(255,Math.round(m+(v-m)*k+30)));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}
function paintImageBackground(c,config,w,h,p){
  const img=backgrounds.get(config.bgImage),a=p*TAU,moving=config.bgMotion==='drift';
  c.fillStyle=config.top;c.fillRect(0,0,w,h);
  if(img){
    const blur=Math.max(0,Math.min(40,config.bgBlur||0))*w/1280;let source=img;
    if(blur>.5){
      const key=config.bgImage.length+'|'+config.bgImage.slice(-40)+'|'+Math.round(blur)+'|'+w+'|'+h;
      let cached=blurred.get(key);
      if(!cached){
        if(blurred.size>8)blurred.clear();
        cached=document.createElement('canvas');cached.width=w;cached.height=h;
        const k=cached.getContext('2d'),s=Math.max(w/img.width,h/img.height)*1.12;k.filter=`blur(${blur}px)`;
        k.drawImage(img,(w-img.width*s)/2,(h-img.height*s)/2,img.width*s,img.height*s);blurred.set(key,cached);
      }
      source=cached;
    }
    const cover=Math.max(w/source.width,h/source.height),zoom=1+(moving?.07*(.5-.5*Math.cos(a)):0),dw=source.width*cover*zoom,dh=source.height*cover*zoom;
    const px=moving?Math.sin(a)*.5:0,py=moving?Math.cos(a)*.35:0;
    c.drawImage(source,(w-dw)/2+px*(dw-w)*.5,(h-dh)/2+py*(dh-h)*.5,dw,dh);
  }
  const dim=Math.max(0,Math.min(80,config.bgDim||0))/100;
  if(dim){c.fillStyle=`rgba(0,0,0,${dim})`;c.fillRect(0,0,w,h)}
}
function paintBackdrop(c,config,images,w,h,p){
  const mode=config.bgMode||'linear',motion=config.bgMotion||'none',a=p*TAU;
  if(mode==='image'){paintImageBackground(c,config,w,h,p);return}
  // A swaying gradient: the angle swings around its own value and returns to it at the end of the loop.
  const base=motion==='drift'&&mode==='linear'?{...config,angle:(Number.isFinite(config.angle)?config.angle:180)+Math.sin(a)*28}:config;
  c.fillStyle=backdrop(c,base,w,h);c.fillRect(0,0,w,h);
  if(motion!=='aurora')return;
  const used=config.bgFromImages?images.filter(i=>i.selected).slice(0,4).map(i=>vivid(tone(i.img))):[];
  const colors=used.length?used:[config.bottom,config.top===config.bottom?'#ffffff':config.top,config.bottom,config.top];
  const radius=Math.max(w,h)*.55;
  colors.forEach((color,i)=>{
    const k=1+(i%2),m=1+((i+1)%2),phase=i*1.7,x=w*(.5+.4*Math.cos(a*k+phase)),y=h*(.5+.36*Math.sin(a*m+phase*.8));
    const g=c.createRadialGradient(x,y,0,x,y,radius);g.addColorStop(0,hexAlpha(color,.6));g.addColorStop(1,hexAlpha(color,0));
    c.fillStyle=g;c.fillRect(0,0,w,h);
  });
}
export function draw(canvas,config,images,time,{preview=false,long=0}={}){
  let [w,h]=dimensions(config,preview);
  chrome=frames.includes(config.frame)?config.frame:'none';
  // `long` sets the long edge in pixels, for the small stills of the preset picker.
  if(long){const k=long/Math.max(w,h);w=Math.round(w*k);h=Math.round(h*k)}
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
  const c=canvas.getContext('2d',{alpha:false}),p=mod(time/duration(config),1),angle=p*TAU;
  const portrait=h>w*1.12,unit=Math.min(w,h),energy=config.intensity/100,size=config.scale/90,studio=config.effect==='studio';
  paintBackdrop(c,config,images,w,h,p);
  if(studio){
    const x=w*(.5+.26*Math.cos(angle)),y=h*(.55+.2*Math.sin(angle));
    const light=c.createRadialGradient(x,y,0,x,y,Math.max(w,h)*.8);light.addColorStop(0,config.bottom+'90');light.addColorStop(1,config.bottom+'00');c.fillStyle=light;c.fillRect(0,0,w,h);
  }
  const active=images.filter(a=>a.selected);if(!active.length)return;
  for(const a of active)crops.set(a.img,a.crop||CROP);
  // `ratio` is the card ratio chosen in the editor, or 0 when the scene decides from the images.
  const scene={w,h,unit,p,portrait,energy,size,studio,active,n:active.length,ratio:ratios[config.ratio]||0};
  if(scenes[config.preset]){
    const list=[],camera=scenes[config.preset](scene,list);
    list.sort((a,b)=>a.z-b.z);c.save();if(camera)camera(c);for(const card of list)paintCard(c,card);c.restore();
  }else explore(c,config,active,{...scene,angle});
  if(studio){const vignette=c.createRadialGradient(w/2,h/2,unit*.3,w/2,h/2,Math.hypot(w,h)*.65);vignette.addColorStop(0,'#0000');vignette.addColorStop(1,'#0004');c.fillStyle=vignette;c.fillRect(0,0,w,h)}
  // The card shape the scene used, when it has one for all its cards.
  return scene.cell;
}

// Earlier explorations (Cascada, Abanico), kept as they were until they are rebuilt on the scenes above.
function explore(c,config,active,{w,h,unit,p,angle,portrait,energy,size,studio,ratio}){
  const n=active.length,cards=[];
  function add(index,x,y,maxW,maxH,rotation=0,z=0,alpha=1,tilt=0){
    const img=active[mod(index,n)].img,[cw,ch]=fit(ratio?{width:ratio,height:1}:img,maxW,maxH);
    cards.push({img,x,y,cw,ch,rotation,z,alpha,tilt});
  }
  // Each preset is periodic, with motion continuing through the whole sequence.
  if(config.preset==='cascade'){
    const lanes=portrait?2:3,slots=Math.max(n,4);
    for(let lane=0;lane<lanes;lane++)for(let i=0;i<slots;i++){
      const t=mod(i/slots+p*(lane%2===0?1:-1)+lane*.13,1),y=lerp(-h*.5,h*1.5,t);
      const x=w*(lane+.5)/lanes+Math.sin(t*TAU+lane)*unit*.12*energy;
      const depth=.7+.3*Math.sin(t*Math.PI),cw=w/(portrait?1.6:2.6)*size*depth;
      add(i+lane*2,x,y,cw,h*(portrait?.35:.55)*depth,(-.12+lane*.10+Math.sin(t*TAU)*.07)*energy,depth,phase(t,0,.1)*(1-phase(t,.9,1)),Math.sin(t*TAU)*.22*energy);
    }
  }else if(config.preset==='fan'){
    const open=.5-.5*Math.cos(angle),swing=Math.sin(angle)*.045*energy;
    for(let i=n-1;i>=0;i--){
      const j=n===1?0:i/(n-1)-.5,spread=lerp(.14,1,open),z=1-i/n;
      const x=w*.5+j*w*(portrait?.48:.8)*spread,y=h*.5+j*h*(portrait?.54:.05)*spread+Math.abs(j)*unit*.12*open;
      const maxW=w*(portrait?.76:.55)*size*(1-open*.30),maxH=h*(portrait?.45:.68)*size;
      add(i,x+Math.sin(angle+i*.5)*unit*.015*energy,y,maxW,maxH,j*(portrait?.34:.52)*open*energy+swing,z,1,j*.2*open*energy);
    }
  }
  cards.sort((a,b)=>a.z-b.z);
  for(const card of cards){
    if(card.alpha<.002)continue;
    const s=sprite(card.img,studio,card.cw/card.ch),padX=card.cw*s.pad/s.w,padY=card.ch*s.pad/s.h;
    c.save();c.globalAlpha=card.alpha;c.translate(card.x,card.y);c.rotate(card.rotation);
    c.transform(Math.cos(card.tilt),Math.sin(card.tilt)*.10,0,1,0,0);
    c.drawImage(s.canvas,-card.cw/2-padX,-card.ch/2-padY,card.cw+padX*2,card.ch+padY*2);c.restore();
  }
}

// Plain note for the editor when a scene adapts to the number of images, or cannot use them well.
// What the editor needs to know to warn about a scene: the first experiments, which repeat images in short
// lists; the scenes that give each image one turn; and how many images a scene shows at most.
const EARLY=['orbit','deal','drop','wave','cascade','fan'];
const TURNS=['slider','shift','reel','carousel','dial','bellows','wheel','iris','slash','blinds','doors','tiles','peel','feed'];
const SHOWS={zoomgrid:6,dance:4,sweep:5,pulse:5,scatter:6,ladder:8,pile:8,trio:9,trail:9,feed:12,bloom:13,lens:16,halo:12};
export function advice(config,count){
  if(!count)return '';
  const walls=['showcase','spread','ticker'].includes(config.preset),each=duration(config)/count;
  if(walls&&count===1)return config.preset==='ticker'?'Con una sola imagen no hay mural: la cámara recorre tres zonas de esa pantalla. Con 5 o más aparece el mural.':'Con una sola imagen no hay mural: se muestra sola y se acerca despacio. Con 5 o más aparece el mural.';
  if(walls&&count<WALL)return `Con ${count} imágenes no hay mural: cada una aparece una sola vez, bien grande. Con 5 o más aparece el mural.`;
  if(config.preset==='spotlight'){
    if(count===1)return 'Con una sola imagen no hay relevos: queda en el centro y se acerca despacio.';
    if(each<1.2)return `Con ${count} imágenes, cada una queda ${each.toFixed(1).replace('.',',')} segundos en pantalla. Subí la duración o usá menos imágenes.`;
  }
  else if(!EARLY.includes(config.preset)&&!walls){
    // The newer scenes adapt to any count. Some show only part of a long list, and the ones that give
    // each image a turn need time for each turn.
    const shown=SHOWS[config.preset];
    if(shown&&count>shown)return `Este movimiento muestra las primeras ${shown} imágenes. Reordená la lista para elegir cuáles.`;
    if(TURNS.includes(config.preset)&&count>1&&each<1.2)return `Con ${count} imágenes, cada una queda ${each.toFixed(1).replace('.',',')} segundos en pantalla. Subí la duración o usá menos imágenes.`;
  }
  else if(!walls&&count<WALL)return 'Este movimiento repite las imágenes cuando hay menos de 5. Vitrina, Despliegue, Ticker y Foco se adaptan mejor.';
  return '';
}
