// Names and descriptions of the scenes in lab-profundidad.js. Plain data, so the server can read it too.
const group='Profundidad y revelados';
export const presets={
  dome: {name:'Cúpula', description:'Un mural que se abomba hacia vos: la pantalla del medio es la grande y las demás se achican hacia los bordes.', chapters:['Mural','Se hincha','Regreso'], still:.5, group},
  globe: {name:'Planeta', description:'Una bola de pantallas con bandas que giran en sentidos opuestos: asoman por un costado, pasan grandes por el medio y se van por el otro.', chapters:['Giro','Cruce','Continuidad'], still:.2, group},
  tunnel: {name:'Túnel', description:'Un pasillo con pantallas en las cuatro paredes y la cámara avanzando hacia el fondo.', chapters:['Fondo','Avance','Continuidad'], still:.2, group},
  parallax: {name:'Paralaje', description:'Un grupo de columnas inclinadas en perspectiva que suben juntas: las de cerca son grandes y rápidas, las de lejos más chicas y lentas.', chapters:['Cerca','Lejos','Continuidad'], still:.2, group},
  doors: {name:'Compuerta', description:'La pantalla se abre en dos mitades como una compuerta y la siguiente llega desde atrás.', chapters:['Primera','Aperturas','Vuelta'], still:.16, group},
  peel: {name:'Mazo', description:'Un mazo prolijo con las próximas pantallas asomando arriba: la del frente baja y sale, y el mazo avanza un lugar.', chapters:['Mazo','Relevos','Vuelta'], still:.02, group},
  spiral: {name:'Espiral', description:'Una fila de pantallas sale del centro en espiral y crece a medida que se acerca, sin taparse.', chapters:['Centro','Vueltas','Continuidad'], still:.2, group},
  tiers: {name:'Gradas', description:'Filas de pantallas en escalones que se alejan: las de adelante son grandes y rápidas, las del fondo más chicas y lentas.', chapters:['Adelante','Fondo','Continuidad'], still:.2, group},
  feed: {name:'Hilo', description:'Un hilo de publicaciones en zigzag que sube de a una; la del medio se agranda un poco mientras la leés.', chapters:['Hilo','Pasos','Vuelta'], still:.02, group},
  windows: {name:'Ventanas', description:'Una grilla de hasta cuatro pantallas que se cierran hacia afuera y vuelven a abrirse desde el centro con otra imagen.', chapters:['Grilla','Cambios','Vuelta'], still:.02, group},
  iris: {name:'Iris', description:'Cada pantalla se acerca despacio dentro de su marco y la siguiente se abre desde el medio.', chapters:['Primera','Aperturas','Vuelta'], still:.17, group},
  slash: {name:'Tajo', description:'La pantalla siguiente entra detrás de un borde inclinado que cruza la tarjeta, una vez de cada lado.', chapters:['Primera','Cortes','Vuelta'], still:.16, group},
  blinds: {name:'Persiana', description:'La pantalla siguiente aparece en tablillas que se abren desde el medio hacia las puntas.', chapters:['Primera','Tablillas','Vuelta'], still:.16, group},
  tiles: {name:'Azulejos', description:'La pantalla siguiente aparece en bloques que crecen en una ola desde una esquina.', chapters:['Primera','Bloques','Vuelta'], still:.16, group},
};
