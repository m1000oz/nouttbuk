import type * as Y from "yjs";

const esSurrogadoAlto = (codigo: number) => codigo >= 0xd800 && codigo <= 0xdbff;
const esSurrogadoBajo = (codigo: number) => codigo >= 0xdc00 && codigo <= 0xdfff;

// Lleva `nuevo` a un Y.Text cambiando SOLO el tramo que difiere (prefijo y
// sufijo comunes intactos), en una sola transacción. Reemplazar todo el texto
// en cada pulsación borraría y reinsertaría cada carácter, y las ediciones
// concurrentes de otra persona en otro punto del mismo texto se perderían o
// se duplicarían; con el diff mínimo cada edición toca solo lo que cambió.
export function reemplazarTextoCompartido(yTexto: Y.Text, nuevo: string): void {
  const actual = yTexto.toString();
  if (actual === nuevo) return;

  let inicio = 0;
  const maxInicio = Math.min(actual.length, nuevo.length);
  while (inicio < maxInicio && actual[inicio] === nuevo[inicio]) inicio += 1;
  // No partir un par sustituto (emoji): el prefijo común no puede terminar
  // entre sus dos mitades.
  if (inicio > 0 && esSurrogadoAlto(actual.charCodeAt(inicio - 1))) inicio -= 1;

  let fin = 0;
  const maxFin = Math.min(actual.length, nuevo.length) - inicio;
  while (
    fin < maxFin &&
    actual[actual.length - 1 - fin] === nuevo[nuevo.length - 1 - fin]
  ) {
    fin += 1;
  }
  if (fin > 0 && esSurrogadoBajo(actual.charCodeAt(actual.length - fin))) fin -= 1;

  const borrar = actual.length - inicio - fin;
  const insertar = nuevo.slice(inicio, nuevo.length - fin);
  const aplicar = () => {
    if (borrar > 0) yTexto.delete(inicio, borrar);
    if (insertar) yTexto.insert(inicio, insertar);
  };
  if (yTexto.doc) yTexto.doc.transact(aplicar);
  else aplicar();
}
