# Nouttbuk — Manual de Identidad de Marca y Sistema Visual (Rebranding Minimalista)

Este documento define la identidad visual oficial, filosofía de diseño, proporciones geométricas, paleta cromática, tipografía y reglas de uso del sistema de marca de **Nouttbuk**, enfocado en la comunidad de estudiantes universitarios.

---

## 1. Filosofía del Rebranding: Minimalismo Académico

### 1.1 El Enfoque
El diseño huye conscientemente de cualquier estética de render 3D plástico, brillos reflectantes baratos o degradados sobrecargados de corte infantil o genérico. 

La marca se construye bajo una **estética suiza / nórdica de alta precisión (inspirada en herramientas contemporáneas como Linear, Notion, Craft o Arc)**:
- **Formas puras y planas (Flat Vector Geometry):** Máxima legibilidad y sofisticación sobria.
- **Espacio negativo (Negative Space):** El dígrafo «tt» nace de perforaciones troqueladas precisas en el propio cuerpo del cuaderno.
- **Identidad estudiantil madura:** Un icono que los estudiantes universitarios portan con orgullo como sticker en su laptop o en la pantalla de su móvil en una biblioteca o aula de clases.

---

## 2. El Isotipo (Símbolo Oficial)

```
             /\
           / ●  \       <- Anillas estilizadas en el canto superior izquierdo
         /   \    \
       /   t   \    \   <- Troqueles 'tt' en la MISMA inclinación de 45°
     /       t   \    \
    \              /  /
     \____________/  /  <- Remate inferior con acento turquesa (#14B8A6)
       \          /
         \______/
```

### 2.1 Especificaciones Geométricas
1. **Inclinación a 45 grados:**
   - La silueta romboide isométrica evoca elevación, pensamiento estructurado y vanguardia tecnológica.
2. **Orientación unificada del dígrafo «tt»:**
   - Las dos letras `tt` están orientadas en la **misma dirección diagonal de 45°** de la cubierta del cuaderno, generando una coherencia matemática total con el eje de inclinación.
   - La trayectoria ascendente de los trazos (de abajo a la derecha) simboliza avance académico y progreso intelectual.
3. **Hueco / Troquel en espacio negativo:**
   - No es una estampa sobrepuesta: las «tt» actúan como cortes pasantes limpios que perforan la cubierta, dejando pasar el blanco puro o la superficie posterior.
4. **Anillado minimalista en el lomo:**
   - 5 arcos sólidos de sujeción sobre el canto superior izquierdo con orificios geométricos oscuros en el lomo.
5. **Capa base inferior:**
   - Un desfase plano en color Turquesa Comunidad (`#14B8A6`) asoma sutilmente por la esquina inferior derecha, aportando balance sin necesidad de sombras efectistas.

---

## 3. Paleta Cromática Oficial

| Muestra | Nombre | HEX | RGB | Uso |
|---|---|---|---|---|
| ![#4F46E5](https://placehold.co/18x18/4F46E5/4F46E5.png) | **Índigo Nouttbuk** | `#4F46E5` | 79, 70, 229 | Cubierta principal mate. Concentración y rigor académico. |
| ![#14B8A6](https://placehold.co/18x18/14B8A6/14B8A6.png) | **Turquesa Comunidad** | `#14B8A6` | 20, 184, 166 | Acento inferior del cuaderno y dígrafo «tt» en el texto. |
| ![#0F172A](https://placehold.co/18x18/0F172A/0F172A.png) | **Pizarra Profunda** | `#0F172A` | 15, 23, 42 | Fondo dark mode, base de app icons y tipografía en modo claro. |
| ![#FFFFFF](https://placehold.co/18x18/FFFFFF/FFFFFF.png) | **Blanco Puro** | `#FFFFFF` | 255, 255, 255 | Troqueles 'tt' en espacio negativo y anillas. |
| ![#64748B](https://placehold.co/18x18/64748B/64748B.png) | **Pizarra Media** | `#64748B` | 100, 116, 139 | Slogan y elementos secundarios. |

---

## 4. Tipografía y Wordmark

- **Tipografía Oficial:** **DM Sans** (geométrica, limpia, sin estridencias).
- **Tratamiento del Logotipo:**
  - `nouttbuk` en peso **ExtraBold (800)** con tracking `-0.025em`.
  - El dígrafo `tt` se resalta en **Turquesa (`#14B8A6`)**, logrando un anclaje visual inmediato con el nombre de la app.
- **Slogan Oficial:**
  > **«Tus apuntes, tu comunidad.»**
  - Set en DM Sans Medium (500), tracking sutil, tono Pizarra Media (`#64748B`).

---

## 5. Catálogo de Archivos y Componentes

- **Isotipo Master:** [`public/brand/nouttbuk-isotipo.svg`](file:///home/mexyniti/Escritorio/nouttbuk/public/brand/nouttbuk-isotipo.svg)
- **Isotipo Monocromático:** [`public/brand/nouttbuk-isotipo-monochrome.svg`](file:///home/mexyniti/Escritorio/nouttbuk/public/brand/nouttbuk-isotipo-monochrome.svg)
- **Logo Horizontal:** [`public/brand/nouttbuk-logo-horizontal.svg`](file:///home/mexyniti/Escritorio/nouttbuk/public/brand/nouttbuk-logo-horizontal.svg)
- **Logo Compacto UI:** [`public/brand/nouttbuk-logo-compact.svg`](file:///home/mexyniti/Escritorio/nouttbuk/public/brand/nouttbuk-logo-compact.svg)
- **App Icon PWA / Móvil:** [`public/icon-512.png`](file:///home/mexyniti/Escritorio/nouttbuk/public/icon-512.png) y [`public/icon-192.png`](file:///home/mexyniti/Escritorio/nouttbuk/public/icon-192.png)
- **Favicon Navegador:** [`src/app/icon.svg`](file:///home/mexyniti/Escritorio/nouttbuk/src/app/icon.svg) y [`src/app/favicon.ico`](file:///home/mexyniti/Escritorio/nouttbuk/src/app/favicon.ico)
- **Componentes React:** `<NouttbukLogo />` y `<NouttbukIsotipo />` en [`src/components/brand/`](file:///home/mexyniti/Escritorio/nouttbuk/src/components/brand/)
