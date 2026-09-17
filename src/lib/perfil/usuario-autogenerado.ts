// Un signup vía Google no pasa por nuestro formulario (que sí junta
// nombre/usuario/carrera antes de crear la cuenta), así que handle_new_user()
// cae en su respaldo automático: usuario = "user_" + los primeros 8
// caracteres del id. Ese patrón es la única señal disponible para detectar
// "esta cuenta nunca completó su perfil" sin agregar una columna nueva solo
// para esto.
export const USUARIO_AUTOGENERADO = /^user_[0-9a-f]{8}$/;

export function esUsuarioAutogenerado(usuario: string | null | undefined): boolean {
  return Boolean(usuario && USUARIO_AUTOGENERADO.test(usuario));
}

// El mismo trigger cae en `split_part(email, '@', 1)` para `nombre` cuando
// tampoco hay `raw_user_meta_data ->> 'nombre'`. A diferencia de `usuario`,
// ese valor no tiene un patrón fijo (varía según el correo institucional de
// cada quien), así que la única señal confiable no es una forma sino una
// igualdad exacta: si el nombre guardado es literalmente la parte local del
// correo, nunca se personalizó. Esto cubre el caso real encontrado en
// producción de alguien que ya cambió su `usuario` (dejando de matchear
// USUARIO_AUTOGENERADO) pero nunca tocó `nombre`, que seguía mostrando el
// valor feo derivado del correo en Amigos/perfil público.
export function esNombreAutogenerado(
  nombre: string | null | undefined,
  email: string | null | undefined,
): boolean {
  if (!nombre || !email) return false;
  return nombre === email.split("@")[0];
}

export function esPerfilIncompleto(
  perfil: { nombre: string | null | undefined; usuario: string | null | undefined },
  email: string | null | undefined,
): boolean {
  return esUsuarioAutogenerado(perfil.usuario) || esNombreAutogenerado(perfil.nombre, email);
}
