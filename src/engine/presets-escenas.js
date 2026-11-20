// Names and descriptions of the scenes in lab-escenas.js. Plain data, so the server can read it too.
const group='Escenas encadenadas';
export const presets={
  trio: {name:'Crescendo', description:'Una pantalla, después tres en una diagonal que se inclina para el otro lado, después todas en columnas que se cruzan, y vuelven a ser una.', chapters:['Una','Tres','Todas'], still:.66, group},
  sweep: {name:'Barrida', description:'La pantalla principal se abre en una fila que pasa de largo, la fila se enrosca en un anillo que gira y todo vuelve al centro.', chapters:['Fila','Anillo','Regreso'], still:.3, group},
  trail: {name:'Estela', description:'Una pantalla recorre un camino en zigzag y va dejando a las demás en su lugar; después la última las junta de nuevo.', chapters:['Camino','Estela','Recogida'], still:.54, group},
  dance: {name:'Enroque', description:'Pantallas de distintos tamaños que cambian de lugar de a pares, girando una alrededor de la otra.', chapters:['Mosaico','Cambios','Vuelta'], still:.02, group},
  ladder: {name:'Peldaños', description:'Una grilla con todas las pantallas se estira en una escalera que baja hacia vos, cada escalón más grande que el anterior, y vuelve a armarse.', chapters:['Grilla','Escalera','Regreso'], still:.45, group},
  scatter: {name:'Constelación', description:'Pantallas de distintos tamaños se juntan en una pila en abanico, la pila se abre en un dial que gira de a un paso y cada una vuelve a su lugar.', chapters:['Sueltas','Pila','Dial'], still:.02, group},
  pile: {name:'Pila', description:'Cada pantalla llega desde un costado, gira apenas en el aire y cae suave sobre la anterior.', chapters:['Primera','Caídas','Vuelta'], still:.02, group},
  pulse: {name:'Latido', description:'El conjunto se abre en un anillo, gira hasta dejar otra pantalla arriba y se cierra sobre esa; en cada latido queda una distinta al centro.', chapters:['Primera','Segunda','Tercera'], still:.17, group},
};
