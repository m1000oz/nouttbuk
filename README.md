# Nouttbuk

> **Tus apuntes, tu comunidad.**

Nouttbuk es una plataforma colaborativa de apuntes diseñada para estudiantes universitarios. Combina una biblioteca privada organizada por materias con una red académica viva que permite coedición en tiempo real y publicación abierta a un feed universitario.

---

## 🎨 Identidad de Marca

La identidad visual de Nouttbuk se basa en el concepto de **un cuaderno anillado girado en 45 grados con dos troqueles centrales en forma de «tt»**, que revelan la capa turquesa de colaboración interior bajo la cubierta índigo de estudio privado.

- **Manual de Marca:** Consulta [`BRAND-GUIDELINES.md`](file:///home/mexyniti/Escritorio/nouttbuk/BRAND-GUIDELINES.md) para especificaciones de color, geometría, área de seguridad y reglas de uso.
- **Activos de Marca:** Ubicados en `public/brand/` (isotipos vectoriales, logos horizontales, compactos, apilados, favicon y app icons).
- **Componentes React:** `<NouttbukLogo />` y `<NouttbukIsotipo />` disponibles en `@/components/brand`.

---

## 🚀 Stack Tecnológico

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, React 19)
- **Base de Datos y Auth:** [Supabase](https://supabase.com/) (PostgreSQL + RLS + Storage)
- **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Componentes UI:** [shadcn/ui](https://ui.shadcn.com/) sobre `@base-ui/react` (estilo base-nova)
- **Editor de Apuntes:** [Tiptap v2](https://tiptap.dev/) con extensiones matemáticas KaTeX y paginación real
- **Colaboración en Vivo:** [Liveblocks](https://liveblocks.io/) + [Yjs](https://yjs.dev/)
- **Animaciones:** [Motion](https://motion.dev/) (interacción cotidiana) + [anime.js v4](https://animejs.com/) (momentos de marca)
- **Iconografía:** [Phosphor Icons](https://phosphoricons.com/)

---

## 💻 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Correr servidor de desarrollo
npm run dev

# Chequeo de tipos
npm run typecheck

# Tests unitarios e integración
npm test
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación.
# nouttbuk
