import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Créditos, Nouttbuk",
  description: "Reconocimientos y créditos de Nouttbuk.",
};

export default function CreditosPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col px-4 py-8 md:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Créditos
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Agradecemos a todos los que hacen posible Nouttbuk.
        </p>
      </header>
      <div className="prose prose-sm dark:prose-invert">
        <p>
          Nouttbuk fue desarrollado con pasión para la comunidad estudiantil.
        </p>
        <h2>Tecnologías</h2>
        <ul>
          <li>Next.js y React</li>
          <li>Supabase</li>
          <li>Tailwind CSS</li>
          <li>Phosphor Icons</li>
        </ul>
      </div>
    </div>
  );
}
