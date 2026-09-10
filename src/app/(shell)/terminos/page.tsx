import { PandatomicLogo } from "@/components/shared/pandatomic-logo";

export const metadata = {
  title: "Términos de uso, Nouttbuk",
};

export default function TerminosPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Términos de uso</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Última actualización: septiembre de 2026.
        </p>
      </div>

      <p className="text-sm text-foreground">
        Nouttbuk es un proyecto independiente, creado y mantenido por{" "}
        <PandatomicLogo /> sin fines comerciales. No somos una empresa
        constituida ni ofrecemos garantías propias de un servicio comercial.
        Al usar Nouttbuk aceptas estos términos.
      </p>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground">
          Quién puede registrarse
        </h2>
        <p className="text-sm text-muted-foreground">
          Nouttbuk es exclusivo para estudiantes con un correo institucional
          terminado en <code className="text-foreground">@pucp.edu.pe</code>.
          No está permitido crear cuentas con otro tipo de correo, ni
          suplantar la identidad de otra persona o intentar burlar esa
          restricción de dominio.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground">
          Tu contenido
        </h2>
        <p className="text-sm text-muted-foreground">
          Lo que publiques (apuntes, comentarios, reacciones) sigue siendo
          tuyo. Al publicar un apunte con visibilidad &quot;comunidad&quot;
          nos das permiso para mostrarlo dentro del feed público de
          Nouttbuk, incluso a personas sin sesión iniciada, y a otros
          estudiantes con quienes compartas un apunte de grupo para
          coeditarlo. Eres responsable de no publicar contenido que no
          tengas derecho a compartir (por ejemplo, material con derechos de
          autor de terceros) ni contenido plagiado, ofensivo o que viole las
          normas de tu universidad.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground">
          Uso aceptable
        </h2>
        <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          <li>No publicar spam, publicidad no solicitada ni malware.</li>
          <li>No acosar, amenazar ni difundir contenido discriminatorio.</li>
          <li>
            No intentar automatizar registros, sortear el CAPTCHA o crear
            cuentas falsas.
          </li>
          <li>
            No intentar acceder a apuntes o calendarios de otras personas
            sin su autorización, ni explotar fallas de seguridad.
          </li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Cualquier publicación puede reportarse desde la propia app.
          Revisamos los reportes manualmente y podemos eliminar contenido o
          cuentas que incumplan estos términos, sin previo aviso, cuando
          corresponda.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground">
          Disponibilidad del servicio
        </h2>
        <p className="text-sm text-muted-foreground">
          Nouttbuk se ofrece &quot;tal cual&quot;, sin garantía de
          disponibilidad continua. Al ser un proyecto independiente sin
          infraestructura empresarial detrás, puede haber interrupciones,
          cambios o, en algún momento, discontinuación del servicio.
          Intentaremos avisar con anticipación razonable si eso llegara a
          pasar.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground">Contacto</h2>
        <p className="text-sm text-muted-foreground">
          Para consultas sobre estos términos, escribe a{" "}
          <a
            href="mailto:contacto@pandatomic.com"
            className="text-primary underline"
          >
            contacto@pandatomic.com
          </a>
          . Puedes leer también nuestra{" "}
          <a href="/privacidad" className="text-primary underline">
            Política de privacidad
          </a>
          .
        </p>
      </section>

      <p className="text-xs text-muted-foreground">
        Este es un proyecto estudiantil independiente, no un servicio legal
        certificado. Estos términos pueden actualizarse a medida que la
        aplicación cambia.
      </p>
    </div>
  );
}
