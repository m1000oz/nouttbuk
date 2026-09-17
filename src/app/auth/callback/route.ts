import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { esPerfilIncompleto } from "@/lib/perfil/usuario-autogenerado";

// Destino del "Authorized redirect URI" que se configura en Google Cloud
// Console (a través de Supabase Auth, no directo a este dominio) y también
// el destino de todo enlace de recuperación de contraseña. GoTrue redirige
// acá con `?code=...` en el único caso de éxito real (Google o el enlace de
// recuperación), con `?error_description=...` si algo falló antes de
// llegar a nuestro lado (p. ej. el trigger de dominio institucional
// rechazando una cuenta que no es @pucp.edu.pe), o sin ningún parámetro de
// éxito/error legible acá (el error real vive en el fragmento de la URL,
// ver el chequeo de `!code` más abajo). En todos los casos que no sean el
// de éxito se vuelve a `/` con el modal de login abierto y un mensaje,
// nunca se deja a la persona en una URL de callback en blanco ni se la deja
// avanzar como si hubiera tenido éxito.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const errorDescription = searchParams.get("error_description");
  const next = searchParams.get("next");
  // Solo se acepta una ruta relativa propia (ej. "/actualizar-contrasena"
  // para el flujo de recuperar contraseña): nunca una URL absoluta ni
  // "//host" (protocol-relative), que redirigiría fuera del sitio.
  const destinoSeguro =
    next && next.startsWith("/") && !next.startsWith("//") ? next : "/perfil";

  if (errorDescription) {
    return NextResponse.redirect(
      `${origin}/?login=1&auth_error=${encodeURIComponent(errorDescription)}`,
    );
  }

  if (!code) {
    // GoTrue reporta un token vencido/inválido/reusado (otp_expired, etc.)
    // en el FRAGMENTO de la URL (`#error=...`), nunca como query param: ese
    // formato es un resabio del flujo implícito, pensado para que un script
    // en el cliente lea `location.hash`. Un fragmento nunca llega a este
    // route handler (corre en el servidor), así que la ausencia de `code`
    // acá es la única señal visible del lado del servidor de que la
    // verificación falló. Antes de este chequeo, este caso caía directo al
    // `return` final asumiendo éxito, así que un enlace de recuperación ya
    // vencido igual terminaba en /actualizar-contrasena, donde el chequeo
    // de esa página ("¿hay alguna sesión?") aprobaba igual si el navegador
    // ya tenía una sesión propia activa sin relación con el enlace, es
    // decir, la expiración de 1 hora no se llegaba a aplicar realmente
    // (bug real reportado 2026-09-10: un enlace abierto 8 horas después
    // seguía funcionando).
    return NextResponse.redirect(
      `${origin}/?login=1&auth_error=${encodeURIComponent(
        "El enlace no es válido o ya venció. Solicita uno nuevo.",
      )}`,
    );
  }

  const supabase = await createClient();
  const { error, data } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/?login=1&auth_error=${encodeURIComponent(error.message)}`,
    );
  }

  // A diferencia del login con correo/contraseña (que ya trae usuario/
  // carrera desde el formulario de registro), una cuenta creada vía Google
  // cae en los valores de respaldo de handle_new_user() (usuario
  // autogenerado, sin carrera). Bug real reportado: como destinoSeguro por
  // defecto es /perfil, y /perfil es la única página protegida que a
  // propósito queda exenta del bloqueo forzado de /completar-perfil (para no
  // generar un loop cuando ese mismo /completar-perfil te devuelve ahí), una
  // cuenta de Google podía "pasar de largo" el chequeo entero mientras nunca
  // navegara a Inicio/Mis apuntes/Amigos por su cuenta: aterrizaba en
  // /perfil, veía como mucho el aviso suave, y podía seguir usando el resto
  // de la app (Comunidad, perfiles públicos) sin completar nunca sus datos.
  // Forzamos el chequeo acá mismo, en el instante justo en que termina el
  // login con Google, en vez de depender de que la persona visite después
  // alguna de las otras páginas protegidas. `next` (usado solo por el enlace
  // de recuperación de contraseña por correo, nunca por Google) nunca
  // convive con un perfil incompleto, así que sobreescribirlo acá no rompe
  // ese flujo.
  if (data.user) {
    const { data: perfil } = await supabase
      .from("profiles")
      .select("nombre, usuario")
      .eq("id", data.user.id)
      .single();

    if (esPerfilIncompleto({ nombre: perfil?.nombre, usuario: perfil?.usuario }, data.user.email)) {
      return NextResponse.redirect(`${origin}/completar-perfil`);
    }
  }

  return NextResponse.redirect(`${origin}${destinoSeguro}`);
}
