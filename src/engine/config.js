import {presets as anillos} from './presets-anillos.js';
import {presets as profundidad} from './presets-profundidad.js';
import {presets as escenas} from './presets-escenas.js';
export const formats = {
  vertical: {label:'Reel / Story', ratio:'9:16', width:1080, height:1920},
  feed: {label:'Feed retrato', ratio:'4:5', width:1080, height:1350},
  square: {label:'Cuadrado', ratio:'1:1', width:1080, height:1080},
  portrait: {label:'Retrato', ratio:'3:4', width:1080, height:1440},
  wide: {label:'Horizontal', ratio:'16:9', width:1920, height:1080},
  landscape: {label:'Feed horizontal', ratio:'1.91:1', width:1200, height:628},
};
// `still` is the moment of the loop shown in the preset picker. The first four are the main ones;
// the rest stay available under "Más movimientos".
export const presets = {
  showcase: {name:'Vitrina', description:'Una pantalla, una pila en diagonal y un mural de filas que se cruzan.', chapters:['Pila','Mural','Regreso'], main:true, still:.5},
  spread: {name:'Despliegue', description:'La pantalla principal se abre en columnas que corren en sentidos opuestos.', chapters:['Principal','Columnas','Regreso'], main:true, still:.2},
  ticker: {name:'Ticker diagonal', description:'Un mural inclinado con una cámara que se acerca a tres zonas.', chapters:['Primer plano','Segundo','Tercero'], main:true, still:.03},
  spotlight: {name:'Foco', description:'Cada pantalla pasa por el centro y le deja el lugar a la siguiente.', chapters:['Entrada','Relevo','Cierre'], main:true, still:.02},
  orbit: {name:'Órbita', group:'Anillos y carruseles', description:'Un racimo de pantallas que gira despacio, siempre de frente.', chapters:['Giro','Profundidad','Retorno'], still:.2},
  deal: {name:'Baraja', group:'Primeras pruebas', description:'Un mazo reparte las pantallas en arco, una ola las recorre y vuelven al mazo.', chapters:['Reparto','Ola','Recogida'], still:.55},
  drop: {name:'Caída', group:'Primeras pruebas', description:'Las pantallas caen, rebotan al llegar y después se sueltan.', chapters:['Caída','Pausa','Salida'], still:.5},
  wave: {name:'Ola', group:'Primeras pruebas', description:'Un mural que se desliza mientras dos olas lo levantan al pasar.', chapters:['Primera ola','Cruce','Segunda ola'], still:.2},
  slider: {name:'Pasarela', group:'Protagonista', description:'Una pantalla grande al centro; las de los costados pasan y toman su lugar.', chapters:['Primera','Relevos','Vuelta'], still:.02},
  shift: {name:'Relevo', group:'Protagonista', description:'La pantalla principal con una fila de miniaturas; la primera pasa al frente.', chapters:['Principal','Relevos','Vuelta'], still:.02},
  drift: {name:'Columnas', group:'Murales y grillas', description:'Columnas de pantallas que se deslizan en sentidos opuestos.', chapters:['Deriva','Cruce','Continuidad'], still:.2},
  strip: {name:'Tira', group:'Murales y grillas', description:'Un mural que se acerca a una fila y la recorre pantalla por pantalla.', chapters:['Mural','Recorrido','Regreso'], still:.5},
  zoomgrid: {name:'Lupa', group:'Protagonista', description:'Cada pantalla sale de la grilla, crece al frente y vuelve a su lugar.', chapters:['Grilla','Turnos','Cierre'], still:.08},
  marquee: {name:'Mosaico', group:'Murales y grillas', description:'Una cinta de bloques: una pantalla grande y cuatro chicas.', chapters:['Cinta','Bloques','Continuidad'], still:.2},
  reel: {name:'Portada', group:'Protagonista', description:'Una imagen a pantalla completa; cada miniatura crece hasta ocuparla.', chapters:['Portada','Relevos','Vuelta'], still:.02},
  flip: {name:'Giro', group:'Murales y grillas', description:'Una grilla donde cada pantalla se da vuelta y muestra la siguiente.', chapters:['Grilla','Giros','Vuelta'], still:.02},
  pop: {name:'Recambio', group:'Murales y grillas', description:'Una grilla donde cada pantalla se achica y vuelve con otra imagen.', chapters:['Grilla','Cambios','Vuelta'], still:.02},
  iso: {name:'Isométrico', group:'Murales y grillas', description:'Un mural apoyado sobre una mesa, visto desde arriba, con filas que se cruzan.', chapters:['Deriva','Cruce','Continuidad'], still:.2},
  cascade: {name:'Cascada', group:'Primeras pruebas', description:'Una corriente diagonal de mockups con distintas escalas.', chapters:['Flujo','Capas','Continuidad'], still:.3},
  fan: {name:'Abanico', group:'Primeras pruebas', description:'La pila se abre, gira y se recompone en un movimiento.', chapters:['Apertura','Expansión','Regreso'], still:.4},
  ...anillos, ...profundidad, ...escenas,
};
// Card ratios the editor offers, as width over height. Auto lets each scene decide from the images.
export const ratios = {auto:0, '1:1':1, '4:3':4/3, '3:4':3/4, '4:5':4/5, '16:9':16/9, '9:16':9/16};
// Frames a screen can sit in. Anything else is drawn as `none`.
export const frames = ['none','browser','phone'];
// Shared by the editor and the server.
export const limits = {images:20, fileMB:12, edge:2400, requestMB:80};
export const defaults = {duration:15,speed:1,fps:30,quality:'full',format:'wide',preset:'showcase',ratio:'auto',scale:90,intensity:70,effect:'clean',frame:'none',top:'#f3f4f5',bottom:'#d9dce1',assets:[]};
export function dimensions(config,preview=false){
  const f=formats[config.format];
  let factor=config.quality==='draft'?Math.min(1,720/Math.min(f.width,f.height)):1;
  if(preview)factor=Math.min(factor,1280/Math.max(f.width,f.height));
  return [Math.round(f.width*factor/2)*2,Math.round(f.height*factor/2)*2];
}
export const frameCount = config => Math.max(1,Math.round(config.duration/config.speed*config.fps));
export const duration = config => frameCount(config)/config.fps;
