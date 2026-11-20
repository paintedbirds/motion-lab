// Names and descriptions of the scenes in lab-anillos.js. Plain data, so the server can read it too.
const group='Anillos y carruseles';
export const presets={
  carousel: {name:'Calesita', description:'Una calesita vista desde arriba: la pantalla del frente es la grande y las demás dan la vuelta por atrás.', chapters:['Frente','Vueltas','Regreso'], still:.02, group},
  dial: {name:'Noria', description:'Una rueda enorme que asoma por un borde: las pantallas cruzan en arco y la de arriba es la grande.', chapters:['Arriba','Pasos','Vuelta'], still:.02, group},
  bellows: {name:'Fuelle', description:'Una fila plegada como un fuelle: una pantalla abierta y las demás esperan como franjas finas.', chapters:['Abierta','Pliegues','Vuelta'], still:.02, group},
  vortex: {name:'Remolino', description:'Dos anillos de pantallas, uno adentro del otro, que giran en sentidos opuestos.', chapters:['Giro','Cruce','Continuidad'], still:.2, group},
  bloom: {name:'Brote', description:'La primera pantalla al centro; las demás salen de atrás en espiral, la rodean y vuelven a esconderse.', chapters:['Centro','Anillo','Regreso'], still:.5, group},
  wheel: {name:'Rueda', description:'Un óvalo de pantallas que avanza de a un lugar; cada una crece y se achica mientras da la vuelta.', chapters:['Óvalo','Pasos','Vuelta'], still:.02, group},
  lens: {name:'Lente', description:'Un anillo de pantallas chicas que gira sin parar; la cámara se acerca a un lado, las ve pasar y vuelve.', chapters:['Anillo','De cerca','Regreso'], still:.5, group},
  halo: {name:'Corona', description:'Un anillo acostado y apenas inclinado: las pantallas pasan grandes por delante y chicas por detrás.', chapters:['Giro','Fondo','Continuidad'], still:.2, group},
  drum: {name:'Tambor', description:'Tiras de pantallas enrolladas en tambores que ruedan en sentidos opuestos; cada una crece al pasar por el medio.', chapters:['Rodar','Cruce','Continuidad'], still:.2, group},
  stairs: {name:'Escalera', description:'Carriles de pantallas en escalera que avanzan de a un escalón, unos para un lado y otros para el otro.', chapters:['Escalones','Cruce','Vuelta'], still:.02, group},
  gears: {name:'Ronda', description:'Una mesa vista desde arriba, armada en bloques: cuatro pantallas caminan de esquina a esquina alrededor de la del medio.', chapters:['Bloques','Rondas','Vuelta'], still:.02, group},
};
