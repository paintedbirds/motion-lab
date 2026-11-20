// Scenes of this family: depth, walls and reveals. Same contract as lab.js: scene(scene, cards) pushes opaque
// cards and may return a camera. Cards stay flat and face the viewer; depth is shown with size, place, order
// and speed. Every scene is a pure function of the loop progress `p` and ends exactly where it starts.
import {mod,lerp,clamp,smooth,glide,linear,fit,cellAspect,cardShape,cellSize,board,cardBitmap,TAU} from './motion.js';

// Progress through `steps` equal moves. Each move rests first, then eases in and out during `move` of its time.
function stepped(p,steps,move=.7){const at=p*steps,done=Math.min(steps-1,Math.floor(at));return done+glide(linear(at-done,1-move,1))}
// One image on its own has nothing to hand over to: it comes a little closer and goes back.
function alone(scene,cards,boxW,boxH,radius=.04){
  const {w,h,p,energy,studio,active}=scene,[cw,ch]=fit(cardShape(scene,active[0].img),boxW,boxH),grow=1+.08*energy/.7*glide(linear(p,.08,.46))*(1-glide(linear(p,.54,.92)));
  cards.push({img:active[0].img,x:w/2,y:h/2,w:cw*grow,h:ch*grow,radius,z:0,alpha:1,shadow:studio});
}
// Fewer than five images cannot fill a wall without sitting next to themselves: each one is shown once on a
// board. Its lines move a little apart, the board comes slightly closer, and everything goes back.
function calm(scene,cards,columns){
  const {w,h,unit,p,size,active,n}=scene,b=board(n,w,h,cellAspect(scene,.5,1.9),unit*.03,Math.min(1,size)*.92,columns);
  const run=glide(linear(p,.08,.48))*(1-glide(linear(p,.54,.96))),grow=1+.04*run;
  b.cells.forEach((cell,i)=>{
    const slide=(mod(cell.line,2)?1:-1)*run*(columns?b.py:b.px)*.07,x=cell.x+(columns?0:slide),y=cell.y+(columns?slide:0);
    cards.push({img:active[i].img,x:w/2+(x-w/2)*grow,y:h/2+(y-h/2)*grow,w:b.cw*grow,h:b.ch*grow,radius:.05,z:0,alpha:1});
  });
}

// A wall wrapped over a ball of radius `R` and seen from the front. Cards stay flat: where the ball turns away
// they get smaller and sit closer together by the same amount, so they never touch. Rows run against each other.
// With fewer than five images each one is shown once and the ball turns a little to visit three areas.
function ball(scene,cards,{R,cw,ch,gap,box,pan}){
  const {w,h,p,size,active,n}=scene,px=cw+gap,py=ch+gap;
  // `s` and `t` are distances along the surface from its centre, sideways and down.
  const put=(img,s,t,cw,ch)=>{
    const a=s/R,b=t/R;if(Math.abs(a)>1.5||Math.abs(b)>1.5)return;
    const depth=Math.cos(a)*Math.cos(b),x=R*Math.cos(b)*Math.sin(a),y=R*Math.sin(b);
    if(depth<.06||Math.abs(x)-cw*depth/2>w/2||Math.abs(y)-ch*depth/2>h/2)return;
    cards.push({img,x:w/2+x,y:h/2+y,w:cw*depth,h:ch*depth,radius:.05,z:depth,alpha:1});
  };
  if(n<5){
    const b=board(n,box[0],box[1],cw/ch,gap*1.5,Math.min(1,size)),spanX=Math.max(...b.cells.map(cell=>Math.abs(cell.x-box[0]/2)))+b.cw/2,spanY=Math.max(...b.cells.map(cell=>Math.abs(cell.y-box[1]/2)))+b.ch/2;
    // The move to the next area eases in and out, with a rest on each one.
    const stops=[[0,0],[spanX*pan,spanY*pan*.86],[-spanX*pan*.86,-spanY*pan]],at=p*3,leg=Math.floor(at-.66),move=smooth((at-.66-leg)/.68);
    const from=stops[mod(leg,3)],to=stops[mod(leg+1,3)],fx=lerp(from[0],to[0],move),fy=lerp(from[1],to[1],move);
    b.cells.forEach((cell,i)=>put(active[i].img,cell.x-box[0]/2-fx,cell.y-box[1]/2-fy,b.cw,b.ch));
    return;
  }
  // Each row repeats a few images and travels that many cells per loop. Larger sets are shared out between rows.
  const cycle=[5,6,4].find(c=>n%c===0)||5,sets=Math.ceil(n/cycle),rows=Math.floor(1.15*R/py),reach=1.5*R;
  for(let r=-rows;r<=rows;r++){
    const shift=(mod(r,2)?px/2:0)+(mod(r,2)?-1:1)*p*cycle*px,first=Math.round(mod(r,sets)*n/sets);
    for(let k=Math.floor((-reach-shift)/px);k<=Math.ceil((reach-shift)/px);k++)put(active[mod(first+mod(k+r*3,cycle),n)].img,k*px+shift,r*py,cw,ch);
  }
}

// Cúpula: a wall that bulges towards the viewer and fills the frame. The screen in the middle is the large one
// and the rest get smaller towards the edges. The bulge swells once per loop and settles back.
function dome(scene,cards){
  const {w,h,unit,p,portrait,energy,size,n}=scene;
  if(n===1)return alone(scene,cards,w*.8*size,h*.8*size);
  const aspect=cellAspect(scene,.5,1.9),[cw,ch]=cellSize(w*(portrait?.56:.34)*size,aspect,portrait?.8:1.3);
  const swell=glide(linear(p,.06,.5))*(1-glide(linear(p,.56,1))),bend=lerp(.62,.62+.4*energy/.7,swell);
  ball(scene,cards,{R:Math.hypot(w,h)/2/Math.sin(Math.min(1.4,bend)),cw,ch,gap:unit*.02,box:[w,h],pan:.14});
}

// Planeta: the same wall on a ball small enough to show its sides. Bands of screens turn against each other,
// come round one side, pass large through the middle and leave by the other side.
function globe(scene,cards){
  const {w,h,unit,portrait,size,n}=scene;
  if(n===1)return alone(scene,cards,w*.8*size,h*.8*size);
  const R=unit*(portrait?.8:.64)*size,[cw,ch]=cellSize(R*.84,cellAspect(scene,.5,1.9),1.3);
  ball(scene,cards,{R,cw,ch,gap:unit*.018,box:[Math.min(w,R*2.4),Math.min(h,R*2.2)],pan:.3});
}

// Túnel: a corridor seen from its middle. Screens line the four walls and the camera glides forward, so they
// rush past on the sides and stream out of the vanishing point. Each wall is drawn in true perspective, one thin
// strip at a time, so a screen is never distorted, only foreshortened. The camera advances a whole number of
// screens per loop and the images repeat in the same order, so the end matches the start.
function tunnel(scene,cards){
  const {w,h,p,energy,active,n}=scene;
  const aspect=Math.max(.6,Math.min(1.8,cellAspect(scene,.6,1.8)));
  // World units: the corridor is 2 tall and as wide as the frame. Its cross-section fills the frame at depth 1.1.
  const H=1,W=w/h,f=h/2*1.1,far=24,L=Math.max(.9,.8*aspect),gap=.1,pitch=L+gap,perLoop=Math.max(7,n);
  const bitmaps=[0,1,2,3].map(k=>cardBitmap(active[0].img,k<2?L/(2*H):(2*W)/L,.03));
  const offset=Math.max(1,Math.floor(n/4));
  return c=>{
    const cx=w/2+Math.sin(p*TAU)*energy*.018*w,cy=h/2+Math.cos(p*TAU)*energy*.012*h,step=Math.max(1,Math.round(w/960)),cam=p*perLoop*pitch;
    c.imageSmoothingQuality='high';
    for(let i=Math.floor(cam/pitch)-1;i<=Math.ceil((cam+far)/pitch);i++){
      const za=i*pitch-cam,zb=za+L;if(zb<=.2||za>=far)continue;
      c.globalAlpha=1-smooth(linear(Math.max(za,0),far*.5,far));if(c.globalAlpha<.01)continue;
      for(let k=0;k<4;k++){
        const bm=cardBitmap(active[mod(mod(i,perLoop)+k*offset,n)].img,k<2?L/(2*H):(2*W)/L,.03),bw=bm.width,bh=bm.height;
        if(k<2){
          // Side wall: one column of the bitmap per column of the frame. On the left wall the picture reads
          // towards the viewer, on the right wall away from it.
          const s=k?1:-1,near=Math.max(za,.2),x1=cx+s*f*W/near,x2=cx+s*f*W/zb,lo=Math.max(0,Math.min(x1,x2)),hi=Math.min(w,Math.max(x1,x2));
          for(let x=Math.floor(lo);x<hi;x+=step){
            const z1=f*W/Math.abs(x-cx),z2=f*W/Math.abs(x+step-cx),zm=f*W/Math.abs(x+step/2-cx);
            if(zm<za||zm>zb)continue;
            const u1=k?(z1-za)/L:(zb-z1)/L,u2=k?(z2-za)/L:(zb-z2)/L,sx=Math.min(u1,u2)*bw,sw=Math.max(1,Math.abs(u2-u1)*bw);
            c.drawImage(bm,sx,0,Math.min(sw,bw-sx),bh,x,cy-f*H/zm,step,2*f*H/zm);
          }
        }else{
          // Floor and ceiling: one row of the bitmap per row of the frame.
          const s=k===2?1:-1,near=Math.max(za,.2),y1=cy+s*f*H/near,y2=cy+s*f*H/zb,lo=Math.max(0,Math.min(y1,y2)),hi=Math.min(h,Math.max(y1,y2));
          for(let y=Math.floor(lo);y<hi;y+=step){
            const z1=f*H/Math.abs(y-cy),z2=f*H/Math.abs(y+step-cy),zm=f*H/Math.abs(y+step/2-cy);
            if(zm<za||zm>zb)continue;
            const v1=k===2?(zb-z1)/L:(z1-za)/L,v2=k===2?(zb-z2)/L:(z2-za)/L,sy=Math.min(v1,v2)*bh,sh=Math.max(1,Math.abs(v2-v1)*bh);
            c.drawImage(bm,0,sy,bw,Math.min(sh,bh-sy),cx-f*W/zm,y,2*f*W/zm,step);
          }
        }
      }
    }
    c.globalAlpha=1;
  };
}

// A card turned around its vertical axis, in true perspective. The bitmap is cut into thin vertical strips and each
// strip is scaled by its own distance, so the card narrows and shortens on the far side without any distortion.
// `yaw` is in radians, `f` the focal length in pixels.
function yawCard(c,bm,cx,cy,w,h,yaw,f){
  const sin=Math.sin(yaw),cos=Math.cos(yaw),strips=Math.max(10,Math.min(90,Math.round(w/3))),bw=bm.width,bh=bm.height;
  const at=u=>{const x=(u-.5)*w,s=f/(f+x*sin);return [cx+x*cos*s,s]};
  let [x0,s0]=at(0);
  for(let i=0;i<strips;i++){
    const [x1,s1]=at((i+1)/strips),sm=(s0+s1)/2,left=Math.min(x0,x1),width=Math.abs(x1-x0)+.6;
    c.drawImage(bm,i*bw/strips,0,bw/strips,bh,left,cy-h*sm/2,width,h*sm);
    x0=x1;s0=s1;
  }
}

// Paralaje: a set of columns that rise together, each card turned a little around its own axis. Near columns are
// large and fast, far ones smaller and slower, and cards overlap like a stack seen from the side. Every column
// travels a whole number of its own cards per loop and repeats its images in that period, so the end matches the start.
function parallax(scene,cards){
  const {w,h,unit,p,energy,size,active,n}=scene;
  if(n===1)return alone(scene,cards,w*.8*size,h*.8*size);
  if(n<5)return calm(scene,cards,true);
  const aspect=Math.max(.7,Math.min(1.6,cellAspect(scene,.7,1.6))),cols=Math.max(4,Math.min(9,Math.round(w/(unit*.36)))),pitchX=w*1.12/(cols-1);
  const layers=[{s:.62,k:2,y:.52},{s:.8,k:3,y:0},{s:1.02,k:4,y:.25}],f=unit*2.6;
  return c=>{
    c.imageSmoothingQuality='high';
    // Far columns first so near ones cover them.
    const order=Array.from({length:cols},(_,i)=>i).sort((i,j)=>layers[i%3].s-layers[j%3].s);
    for(const i of order){
      const L=layers[(i*2)%3],cw=Math.min(pitchX*1.7,unit*.8)*L.s*Math.min(1.1,size),ch=cw/aspect,pitch=ch*1.06,cx=-w*.06+i*pitchX,start=L.y+((i*.37)%1);
      const yaw=(i%2?1:-1)*(.32+.07*Math.sin(p*TAU+i))*Math.min(1,.5+energy),shift=p*L.k*pitch;
      for(let j=Math.floor((shift-h/2-ch)/pitch);j<=Math.ceil((shift+h/2+ch)/pitch)+1;j++){
        const img=active[mod(mod(j,L.k)+i*Math.max(1,Math.floor(n/cols)+1),n)].img,y=h/2+(j+start)*pitch-shift;
        yawCard(c,cardBitmap(img,aspect,.05),cx,y,cw,ch,yaw,f);
      }
    }
  };
}

// Compuerta: the screen opens in two halves that slide apart like doors, and the next one comes forward
// from behind them. Tall screens open upwards and downwards.
function doors(scene,cards){
  return reveal(scene,cards,({base,out,into,u,cw,ch})=>{
    const e=glide(u),tall=ch>cw*1.15,d=(tall?ch:cw)/2*e,r=Math.min(cw,ch)*base.radius,grow=lerp(.9,1,e);
    cards.push({...base,img:into,w:cw*grow,h:ch*grow,z:0});
    for(const s of [-1,1])cards.push({...base,img:out,x:base.x+(tall?0:s*d),y:base.y+(tall?s*d:0),z:1,mask:c=>{
      if(tall)c.roundRect(-cw/2,s<0?-ch/2+d:0,cw,ch/2-d,s<0?[r,r,0,0]:[0,0,r,r]);
      else c.roundRect(s<0?-cw/2+d:0,-ch/2,cw/2-d,ch,s<0?[r,0,0,r]:[0,r,r,0]);
    }});
  });
}

// Mazo: a tidy deck with the next screens peeking above the first. On every step the front screen slides
// down and out of the frame, the deck steps forward and a new screen rises at the back.
function peel(scene,cards){
  const {w,h,p,portrait,size,active,n}=scene,aspect=cellAspect(scene,.6,1.7);
  const [cw,ch]=fit({width:aspect,height:1},w*(portrait?.78:.56)*size,h*(portrait?.52:.66)*size);
  if(n===1)return alone(scene,cards,cw,ch,.05);
  // The deck never shows an image twice, so short lists get a shorter deck.
  const levels=Math.min(3,n-1),peek=ch*.09,t=stepped(p,n,.62),top=h/2-ch/2+(levels-1)*peek/2;
  for(let i=0;i<n;i++){
    const q=mod(i-t,n),img=active[i].img;
    if(q>n-1){cards.push({img,x:w/2,y:top+ch/2+(n-q)*(h-top+ch*.1),w:cw,h:ch,radius:.05,z:5,alpha:1,shadow:true});continue}
    if(q>=levels)continue;
    // The last place of the deck is where a screen comes up from behind the others.
    const rise=Math.max(0,q-(levels-1)),s=1-.08*q,edge=top-(q-rise)*peek+rise*peek*1.6;
    cards.push({img,x:w/2,y:edge+ch*s/2,w:cw*s,h:ch*s,radius:.05,z:-q,alpha:1,shadow:true});
  }
}

// Espiral: one stream of screens leaves the centre along a spiral and grows as it comes closer. The spiral is
// stretched to the shape of the frame, and every screen stays clear of the others at any moment of the turn.
const reaches=new Map();
// How far from the centre a screen sits, in widths, so that no two screens of the stream ever touch.
// It depends on the card shape and the stretch of the spiral, and is worked out once for each.
function spiralReach(rate,turn,aspect,stretch){
  const key=aspect.toFixed(3)+'|'+stretch.toFixed(3);if(reaches.has(key))return reaches.get(key);
  const clear=reach=>{
    for(let start=0;start<1;start+=.025){
      const list=[];for(let k=-10;k<=4;k++){const u=start+k,s=Math.pow(rate,u);list.push([Math.cos(u*turn)*reach*s*stretch,-Math.sin(u*turn)*reach*s/stretch,s,s/aspect])}
      for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++)if(Math.abs(list[i][0]-list[j][0])<(list[i][2]+list[j][2])*.52&&Math.abs(list[i][1]-list[j][1])<(list[i][3]+list[j][3])*.52)return false;
    }
    return true;
  };
  let low=.2,high=6;for(let i=0;i<16;i++){const middle=(low+high)/2;if(clear(middle))high=middle;else low=middle}
  reaches.set(key,high);return high;
}
function spiral(scene,cards){
  const {w,h,p,energy,size,active,n}=scene;
  if(n===1)return alone(scene,cards,w*.8*size,h*.8*size);
  const aspect=cellAspect(scene,.5,1.9),rate=1.4,turn=1.4,stretch=Math.max(.75,Math.min(1.33,Math.sqrt(w/h))),reach=spiralReach(rate,turn,aspect,stretch);
  const cw=Math.min(w/2/(reach*stretch+.5),h/2/(reach/stretch+.5/aspect))*1.2*size,ch=cw/aspect,cycle=n*Math.max(1,Math.round(10*energy/.7/n)),travel=p*cycle;
  const far=Math.log(.09)/Math.log(rate),near=Math.log(Math.hypot(w,h)/cw)/Math.log(rate);
  for(let j=Math.ceil(travel-near);j<=Math.floor(travel-far);j++){
    const u=travel-j,s=Math.pow(rate,u),x=w/2+Math.cos(u*turn+.5)*reach*cw*s*stretch,y=h/2-Math.sin(u*turn+.5)*reach*cw*s/stretch;
    if(Math.abs(x-w/2)-cw*s/2>w/2||Math.abs(y-h/2)-ch*s/2>h/2)continue;
    cards.push({img:active[mod(j,n)].img,x,y,w:cw*s,h:ch*s,radius:.05,z:s,alpha:smooth(linear(s,.09,.16))});
  }
}

// Gradas: rows of screens that step away from the viewer, the near one at the bottom. Rows run against each
// other and each travels the same number of its own places, so the far rows are smaller and slower.
// The whole plane leans a little.
function tiers(scene,cards){
  const {w,h,unit,p,energy,size,active,n}=scene;
  if(n===1)return alone(scene,cards,w*.8*size,h*.8*size);
  const camera=c=>{c.translate(w/2,h/2);c.rotate(-.06);c.translate(-w/2,-h/2)};
  if(n<5){calm(scene,cards);return camera}
  const aspect=cellAspect(scene,.56,1.7),gap=unit*.028,ref=Math.min(h*(aspect<.8?.6:.44),w*.7/aspect);
  const rows=Math.max(2,Math.min(6,Math.round(h/(ref*.75)))),step=(1-(rows===2?.6:.55))/(rows-1),scale=j=>1-step*j;
  let sum=0;for(let j=0;j<rows;j++)sum+=scale(j);
  const tall=(h*1.06-gap*(rows-1))/sum*size,cycle=Math.min(n,Math.max(3,Math.round(4*energy/.7)));
  // One more row below and above the ones that fit, for the corners the lean uncovers.
  let edge=h/2+h*.53*size+gap+tall*scale(-1);
  for(let j=-1;j<=rows&&scale(j)>.15;j++){
    const s=scale(j),ch=tall*s,cw=ch*aspect,px=cw+gap,y=edge-ch/2,shift=(mod(j,2)?-1:1)*p*cycle*px+(mod(j,2)?px/2:0),first=Math.round(mod(j,3)*n/3),reach=Math.hypot(w,h)/2+cw;edge-=ch+gap;
    for(let k=Math.floor((-reach-shift)/px);k<=Math.ceil((reach-shift)/px);k++)
      cards.push({img:active[mod(first+mod(k,cycle),n)].img,x:w/2+k*px+shift,y,w:cw,h:ch,radius:.05,z:s,alpha:1});
  }
  return camera;
}

// Hilo: a feed that climbs one post at a time, with the posts in a zigzag. The one in the middle is being
// read: it is a little larger. Where the zigzag does not fit, the posts form a single file with a small sway.
function feed(scene,cards){
  const {w,h,unit,p,portrait,energy,size,studio,active,n}=scene,aspect=cellAspect(scene,.6,1.7),gap=unit*.04;
  const cw=(portrait&&aspect>=1?w*.78:Math.min(w*.44,h*(portrait?.5:.62)*aspect))*Math.min(1.1,size),ch=cw/aspect;
  if(n===1)return alone(scene,cards,cw*1.3,ch*1.3,.05);
  const side=Math.min((cw+gap)/2,(w*.95-cw)/2),py=side>=(cw+gap)/2-.5?ch*.78:ch+gap;
  // Posts alternate sides, so the feed repeats after an even number of them.
  const most=2*Math.round(6*energy/.7),cycle=Math.max(4,n%2?(2*n<=most?2*n:2*Math.floor(Math.min(n,most)/2)):Math.min(n,most)),t=stepped(p,cycle,.62),span=Math.ceil((h/2+ch)/py);
  for(let k=Math.floor(t)-span;k<=Math.floor(t)+span+1;k++){
    const front=1-clamp(Math.abs(k-t)),grow=1+.07*front;
    cards.push({img:active[mod(mod(k,cycle),n)].img,x:w/2+(mod(k,2)?1:-1)*side,y:h/2+(k-t)*py,w:cw*grow,h:ch*grow,radius:.05,z:front,alpha:1,shadow:studio&&front>.5});
  }
}

// Ventanas: a board of up to four screens. One after another, each closes towards the outside of the board
// and opens again from its centre with the next image. Their turns are spread out, so the board is never empty.
function windows(scene,cards){
  const {w,h,unit,p,size,active,n}=scene;
  if(n===1)return alone(scene,cards,w*.8*size,h*.8*size);
  const cells=Math.min(4,n),few=n<=cells,pages=few?n:Math.ceil(n/cells),total=pages*cells,pick=(cell,page)=>active[few?mod(cell+page,n):mod(cell+page*cells,total)%n].img;
  const grid=board(cells,w,h,cellAspect(scene,.6,1.7),unit*.03,Math.min(1,size)),{cw,ch}=grid,at=p*pages,page=Math.min(pages-1,Math.floor(at)),f=at-page,r=Math.min(cw,ch)*.05;
  // On a board of two lines the change goes round it; on a single line it goes along it.
  const round=grid.cells.some(cell=>cell.line),place=cell=>round?mod(Math.atan2(cell.y-h/2,cell.x-w/2)+2.4,TAU):0,order=grid.cells.map((cell,i)=>i).sort((a,b)=>place(grid.cells[a])-place(grid.cells[b])||a-b);
  order.forEach((i,turn)=>{
    const cell=grid.cells[i],start=.16+.5*turn/(cells-1),opening=f>=start+.17,e=opening?glide(linear(f,start+.17,start+.34)):1-glide(linear(f,start,start+.17));
    if(e<.002)return;
    // The window is anchored to the inner side of its cell while it opens and to the outer side while it closes.
    const ax=Math.sign(Math.round(cell.x-w/2))*(opening?-1:1),ay=Math.sign(Math.round(cell.y-h/2))*(opening?-1:1),card={img:pick(i,opening?page+1:page),x:cell.x,y:cell.y,w:cw,h:ch,radius:.05,z:0,alpha:1};
    if(e<.998)card.mask=c=>c.roundRect(ax<0?-cw/2:ax>0?cw/2-cw*e:-cw*e/2,ay<0?-ch/2:ay>0?ch/2-ch*e:-ch*e/2,cw*e,ch*e,r);
    cards.push(card);
  });
}

// Iris: every screen keeps coming closer inside its frame. The next one opens from the middle of it, seen from
// further away, and takes the frame over.
function iris(scene,cards){
  return reveal(scene,cards,({base,out,into,u,f,from,each,cw,ch})=>{
    const zoom=t=>1+.1*t/(1+each),r=Math.min(cw,ch)*.04,frame=(img,k,g,z)=>cards.push({...base,img,w:cw*k,h:ch*k,radius:0,z,mask:c=>c.roundRect(-cw*g/2,-ch*g/2,cw*g,ch*g,r)});
    if(u<1)frame(out,zoom(1-from+f),1,0);
    if(u>0)frame(into,zoom(f-from),u<1?glide(u):1,1);
  },true);
}

// Tajo: the next screen comes in behind a slanted edge that crosses the card. The edge changes side and lean
// on every change.
function slash(scene,cards){
  return reveal(scene,cards,({base,out,into,u,turn,cw,ch})=>{
    const lean=ch*.36,dir=turn%2?-1:1,edge=lerp(-cw/2-lean/2,cw/2+lean/2,smooth(u));
    cards.push({...base,img:out,z:0},{...base,img:into,z:1,mask:c=>{c.moveTo(-dir*(cw/2+2),-ch/2-2);c.lineTo(dir*(edge+lean/2),-ch/2-2);c.lineTo(dir*(edge-lean/2),ch/2+2);c.lineTo(-dir*(cw/2+2),ch/2+2);c.closePath()}});
  });
}

// Persiana: the next screen appears in slats that open from the middle of the card towards its ends.
// Wide cards get upright slats and tall ones get level slats.
function blinds(scene,cards){
  return reveal(scene,cards,({base,out,into,u,cw,ch})=>{
    const tall=ch>cw*1.15,slats=6,long=tall?ch:cw,sw=long/slats;
    cards.push({...base,img:out,z:0},{...base,img:into,z:1,mask:c=>{
      for(let j=0;j<slats;j++){
        const d=Math.abs(j-(slats-1)/2)/((slats-1)/2),e=smooth(linear(u,d*.45,d*.45+.55)),open=sw*e+(e>0?.8:0),at=-long/2+(j+.5)*sw;
        if(tall)c.rect(-cw/2-2,at-open/2,cw+4,open);else c.rect(at-open/2,-ch/2-2,open,ch+4);
      }
    }});
  });
}

// Azulejos: the next screen appears in blocks that grow from their own centres, in a wave that starts at one
// corner. The corner changes on every change.
function tiles(scene,cards){
  return reveal(scene,cards,({base,out,into,u,turn,cw,ch})=>{
    const across=Math.max(3,Math.min(7,Math.round(4.4*Math.sqrt(cw/ch)))),down=Math.max(3,Math.min(7,Math.round(across*ch/cw))),bw=cw/across,bh=ch/down;
    cards.push({...base,img:out,z:0},{...base,img:into,z:1,mask:c=>{
      for(let a=0;a<across;a++)for(let b=0;b<down;b++){
        const d=((turn%2?across-1-a:a)/(across-1)+b/(down-1))/2,e=smooth(linear(u,d*.6,d*.6+.4));
        if(e>0)c.rect(-cw/2+(a+.5)*bw-(bw*e+.8)/2,-ch/2+(b+.5)*bh-(bh*e+.8)/2,bw*e+.8,bh*e+.8);
      }
    }});
  });
}

export const scenes={dome,globe,tunnel,spiral,parallax,tiers,feed,windows,iris,slash,blinds,doors,tiles,peel};
