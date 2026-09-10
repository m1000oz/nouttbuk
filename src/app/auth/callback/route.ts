import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

// Destino del "Authorized redirect URI" que se configura en Google Cloud
// Console (a través de Supabase Auth, no directo a este dominio): GoTrue
// procesa el código de Google en su propio /auth/v1/callback y recién ahí
// redirige acá con `?code=...` para intercambiarlo por una sesión, o con
// `?error_description=...` si algo falló antes de llegar a nuestro lado (p.
// ej. el trigger de dominio institucional rechazando una cuenta que no es
// @pucp.edu.pe). En ambos casos se vuelve a `/` con el modal de login
// abierto, nunca se deja a la persona en una URL de callback en blanco.
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

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        `${origin}/?login=1&auth_error=${encodeURIComponent(error.message)}`,
      );
    }
  }

  // A diferencia del login con correo/contraseña (que ya trae usuario/
  // carrera desde el formulario de registro), una cuenta creada vía Google
  // cae en los valores de respaldo de handle_new_user() (usuario
  // autogenerado, sin carrera). /perfil muestra el aviso de "completa tu
  // perfil" cuando detecta ese patrón, ver perfilIncompleto en esa página.
  // destinoSeguro es /perfil salvo que el llamador haya pedido otro destino
  // relativo propio (recuperar-form.tsx pide /actualizar-contrasena).
  return NextResponse.redirect(`${origin}${destinoSeguro}`);
}
