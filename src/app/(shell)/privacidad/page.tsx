export const metadata = {
  title: "Política de privacidad, Nouttbuk",
};

// Página estática, pública, accesible sin sesión (mismo criterio que
// Comunidad: es contenido de consulta, no una pantalla gated). Contenido
// honesto sobre lo que la app realmente guarda y hace, no una plantilla
// genérica, describe el modelo de datos y proveedores reales de este
// proyecto.
export default function PrivacidadPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Política de privacidad
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Última actualización: septiembre de 2026.
        </p>
      </div>

      <p className="text-sm text-foreground">
        Nouttbuk es un proyecto independiente creado por{" "}
        <strong>PandAtomic</strong>, sin fines comerciales ni una empresa
        constituida detrás. No cobramos por el servicio ni vendemos datos a
        terceros. Este documento explica, en lenguaje simple, qué datos
        guardamos y por qué.
      </p>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground">
          Quién puede usar Nouttbuk
        </h2>
        <p className="text-sm text-muted-foreground">
          El registro solo está disponible con un correo institucional
          terminado en <code className="text-foreground">@pucp.edu.pe</code>,
          validado tanto al crear la cuenta como en nuestra base de datos.
          Si te registras con Google, exigimos la misma verificación de
          dominio sobre la cuenta institucional de Google que uses.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground">
          Qué datos guardamos
        </h2>
        <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">Perfil:</strong> nombre,
            nombre de usuario, carrera, universidad y, si la subes, una foto
            de perfil.
          </li>
          <li>
            <strong className="text-foreground">Apuntes:</strong> el
            contenido que escribes, sus etiquetas, la carpeta y el curso al
            que lo asocies, y el nivel de visibilidad que elijas (privado,
            grupo o comunidad).
          </li>
          <li>
            <strong className="text-foreground">Actividad social:</strong>{" "}
            reacciones, guardados, comentarios y reportes que hagas sobre
            publicaciones de la comunidad.
          </li>
          <li>
            <strong className="text-foreground">Calendario:</strong> los
            bloques de horario que crees y con quién decidas compartirlos.
          </li>
          <li>
            <strong className="text-foreground">Cuenta:</strong> tu correo
            institucional y la contraseña (que nunca vemos en texto plano,
            la gestiona nuestro proveedor de autenticación).
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground">
          Quién puede ver cada cosa
        </h2>
        <p className="text-sm text-muted-foreground">
          Cada apunte tiene un nivel de visibilidad que tú eliges:{" "}
          <strong className="text-foreground">privado</strong> (solo tú),{" "}
          <strong className="text-foreground">grupo</strong> (tú y las
          personas que invites, con permiso de lectura o edición), o{" "}
          <strong className="text-foreground">comunidad</strong> (visible
          públicamente en el feed de Comunidad, incluso sin iniciar sesión).
          Esta separación está aplicada directamente en nuestra base de
          datos (Row Level Security de Postgres), no solo en la interfaz, así
          que un apunte privado nunca es accesible por otra vía dentro de la
          app.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground">
          Con quién compartimos datos
        </h2>
        <p className="text-sm text-muted-foreground">
          No vendemos ni compartimos tus datos con terceros para publicidad.
          Usamos estos proveedores para que Nouttbuk funcione:
        </p>
        <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">Supabase:</strong> aloja
            nuestra base de datos, el sistema de cuentas y las imágenes que
            subes.
          </li>
          <li>
            <strong className="text-foreground">Liveblocks:</strong>{" "}
            sincroniza en vivo los apuntes que editas en tiempo real con
            otras personas dentro de un grupo.
          </li>
          <li>
            <strong className="text-foreground">Cloudflare Turnstile:</strong>{" "}
            verifica, al iniciar sesión o registrarte, que quien completa el
            formulario no es un bot automatizado.
          </li>
          <li>
            <strong className="text-foreground">Vercel:</strong> aloja la
            aplicación web.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground">
          Tus opciones
        </h2>
        <p className="text-sm text-muted-foreground">
          Puedes editar tu perfil, cambiar la visibilidad de cualquier
          apunte o eliminarlo en cualquier momento desde la propia
          aplicación. Si quieres eliminar tu cuenta por completo o tienes
          alguna otra solicitud sobre tus datos, escríbenos y la
          procesaremos manualmente.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground">Contacto</h2>
        <p className="text-sm text-muted-foreground">
          Nouttbuk es mantenido por PandAtomic. Para consultas sobre esta
          política o solicitudes relacionadas con tus datos, escribe a{" "}
          <span className="text-foreground">[correo de contacto pendiente]</span>.
        </p>
      </section>

      <p className="text-xs text-muted-foreground">
        Este es un proyecto estudiantil independiente, no un servicio legal
        certificado ni una empresa constituida. Este documento puede
        actualizarse a medida que la aplicación cambia.
      </p>
    </div>
  );
}
