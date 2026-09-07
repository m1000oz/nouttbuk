// Posiciones y tiempos fijos (no Math.random(), evita mismatch de
// hidratación): motas de polvo suspendidas en el aire, como se ven al pasar
// luz de lámpara en un cuarto oscuro. El detalle que hace que el escritorio
// del atelier se sienta habitado, no una imagen plana de un solo tinte.
const MOTAS = [
  { top: "8%", left: "18%", duracion: "18s", retraso: "0s", tam: 3 },
  { top: "15%", left: "64%", duracion: "22s", retraso: "-4s", tam: 2 },
  { top: "30%", left: "35%", duracion: "26s", retraso: "-9s", tam: 2 },
  { top: "12%", left: "82%", duracion: "20s", retraso: "-2s", tam: 3 },
  { top: "40%", left: "9%", duracion: "24s", retraso: "-14s", tam: 2 },
  { top: "22%", left: "48%", duracion: "19s", retraso: "-7s", tam: 2 },
  { top: "36%", left: "72%", duracion: "27s", retraso: "-11s", tam: 3 },
];

// Puramente decorativo (aria-hidden, pointer-events:none), congelado si el
// usuario prefiere menos movimiento (ver @media (prefers-reduced-motion) en
// globals.css). Vive detrás de la hoja, dentro de .lienzo-editor.
export function AmbienteAtelier() {
  return (
    <div className="polvo-contenedor" aria-hidden>
      {MOTAS.map((mota, indice) => (
        <span
          key={indice}
          className="mota-polvo"
          style={{
            top: mota.top,
            left: mota.left,
            width: mota.tam,
            height: mota.tam,
            animationDuration: mota.duracion,
            animationDelay: mota.retraso,
          }}
        />
      ))}
    </div>
  );
}
