import type { Metadata, Viewport } from "next";
import {
  Abril_Fatface,
  Anton,
  Archivo_Black,
  Bangers,
  Barlow,
  Bebas_Neue,
  Bitter,
  Caveat,
  Cormorant_Garamond,
  Courier_Prime,
  Crimson_Text,
  Dancing_Script,
  DM_Sans,
  EB_Garamond,
  Fjalla_One,
  Great_Vibes,
  IBM_Plex_Mono,
  Indie_Flower,
  Inter,
  JetBrains_Mono,
  Kalam,
  Karla,
  Lato,
  Libre_Baskerville,
  Lobster,
  Lora,
  Manrope,
  Merriweather,
  Montserrat,
  Mulish,
  Newsreader,
  Noto_Serif,
  Nunito,
  Open_Sans,
  Oswald,
  Pacifico,
  Passion_One,
  Permanent_Marker,
  Playfair_Display,
  Poppins,
  PT_Serif,
  Raleway,
  Righteous,
  Roboto,
  Roboto_Mono,
  Rubik,
  Sacramento,
  Satisfy,
  Shadows_Into_Light,
  Space_Mono,
  Ubuntu,
  Work_Sans,
} from "next/font/google";
import "./globals.css";
import { RegistrarServiceWorker } from "@/components/pwa/registrar-service-worker";
import { Toaster } from "@/components/ui/toast";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

// Solo para el editor de apuntes (título y encabezados del manuscrito): una
// serif editorial pensada para lectura larga, no una segunda voz genérica.
// El resto de la app se queda en DM Sans, ver DESIGN-SYSTEM.md.
const newsreader = Newsreader({
  variable: "--font-manuscrito",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
});

// Solo para el selector de fuente del editor de apuntes (SelectorFuente en
// editor-controles-formato.tsx): una manuscrita real, no una segunda serif
// editorial más. Pedida explícitamente para dar más personalidad al texto
// del cuerpo del apunte, no solo al título/encabezados (que ya usan
// --font-manuscrito).
const caveat = Caveat({
  variable: "--font-cursiva",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

// Paleta ampliada del selector de fuente del editor (SelectorFuente en
// editor-controles-formato.tsx), pedida explícitamente ("mínimo 50 tipos de
// letra") tras encontrar mediocres las 3-4 opciones anteriores. Un solo peso
// (400) por fuente: alcanza para elegir/previsualizar la personalidad de
// cada una en el menú, y evita que next/font tenga que validar qué otros
// pesos existen para cada una de las 49 familias. Cada una es una constante
// de módulo aparte porque next/font analiza el import de forma estática (no
// hay forma de generar esto en un loop): el costo real es solo de build, no
// de runtime, ya que un archivo de fuente nunca se descarga en el navegador
// hasta que algún texto realmente usa esa familia (con el menú cerrado no
// hay descarga alguna; abrir el menú sí dispara la descarga de las 49
// vistas previas, una sola vez por sesión de navegador, gracias a la caché).
const roboto = Roboto({ variable: "--font-roboto", subsets: ["latin"], weight: ["400"] });
const openSans = Open_Sans({ variable: "--font-open-sans", subsets: ["latin"], weight: ["400"] });
const lato = Lato({ variable: "--font-lato", subsets: ["latin"], weight: ["400"] });
const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"], weight: ["400"] });
const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin"], weight: ["400"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["400"] });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"], weight: ["400"] });
const raleway = Raleway({ variable: "--font-raleway", subsets: ["latin"], weight: ["400"] });
const rubik = Rubik({ variable: "--font-rubik", subsets: ["latin"], weight: ["400"] });
const workSans = Work_Sans({ variable: "--font-work-sans", subsets: ["latin"], weight: ["400"] });
const ubuntu = Ubuntu({ variable: "--font-ubuntu", subsets: ["latin"], weight: ["400"] });
const mulish = Mulish({ variable: "--font-mulish", subsets: ["latin"], weight: ["400"] });
const karla = Karla({ variable: "--font-karla", subsets: ["latin"], weight: ["400"] });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], weight: ["400"] });
const barlow = Barlow({ variable: "--font-barlow", subsets: ["latin"], weight: ["400"] });

const merriweather = Merriweather({ variable: "--font-merriweather", subsets: ["latin"], weight: ["400"] });
const playfairDisplay = Playfair_Display({ variable: "--font-playfair-display", subsets: ["latin"], weight: ["400"] });
const ptSerif = PT_Serif({ variable: "--font-pt-serif", subsets: ["latin"], weight: ["400"] });
const lora = Lora({ variable: "--font-lora", subsets: ["latin"], weight: ["400"] });
const crimsonText = Crimson_Text({ variable: "--font-crimson-text", subsets: ["latin"], weight: ["400"] });
const libreBaskerville = Libre_Baskerville({ variable: "--font-libre-baskerville", subsets: ["latin"], weight: ["400"] });
const ebGaramond = EB_Garamond({ variable: "--font-eb-garamond", subsets: ["latin"], weight: ["400"] });
const cormorantGaramond = Cormorant_Garamond({ variable: "--font-cormorant-garamond", subsets: ["latin"], weight: ["400"] });
const bitter = Bitter({ variable: "--font-bitter", subsets: ["latin"], weight: ["400"] });
const notoSerif = Noto_Serif({ variable: "--font-noto-serif", subsets: ["latin"], weight: ["400"] });

const oswald = Oswald({ variable: "--font-oswald", subsets: ["latin"], weight: ["400"] });
const bebasNeue = Bebas_Neue({ variable: "--font-bebas-neue", subsets: ["latin"], weight: ["400"] });
const anton = Anton({ variable: "--font-anton", subsets: ["latin"], weight: ["400"] });
const archivoBlack = Archivo_Black({ variable: "--font-archivo-black", subsets: ["latin"], weight: ["400"] });
const righteous = Righteous({ variable: "--font-righteous", subsets: ["latin"], weight: ["400"] });
const fjallaOne = Fjalla_One({ variable: "--font-fjalla-one", subsets: ["latin"], weight: ["400"] });
const bangers = Bangers({ variable: "--font-bangers", subsets: ["latin"], weight: ["400"] });
const lobster = Lobster({ variable: "--font-lobster", subsets: ["latin"], weight: ["400"] });
const abrilFatface = Abril_Fatface({ variable: "--font-abril-fatface", subsets: ["latin"], weight: ["400"] });
const passionOne = Passion_One({ variable: "--font-passion-one", subsets: ["latin"], weight: ["400"] });

const dancingScript = Dancing_Script({ variable: "--font-dancing-script", subsets: ["latin"], weight: ["400"] });
const pacifico = Pacifico({ variable: "--font-pacifico", subsets: ["latin"], weight: ["400"] });
const greatVibes = Great_Vibes({ variable: "--font-great-vibes", subsets: ["latin"], weight: ["400"] });
const sacramento = Sacramento({ variable: "--font-sacramento", subsets: ["latin"], weight: ["400"] });
const satisfy = Satisfy({ variable: "--font-satisfy", subsets: ["latin"], weight: ["400"] });
const indieFlower = Indie_Flower({ variable: "--font-indie-flower", subsets: ["latin"], weight: ["400"] });
const shadowsIntoLight = Shadows_Into_Light({ variable: "--font-shadows-into-light", subsets: ["latin"], weight: ["400"] });
const permanentMarker = Permanent_Marker({ variable: "--font-permanent-marker", subsets: ["latin"], weight: ["400"] });
const kalam = Kalam({ variable: "--font-kalam", subsets: ["latin"], weight: ["400"] });

const robotoMono = Roboto_Mono({ variable: "--font-roboto-mono", subsets: ["latin"], weight: ["400"] });
const spaceMono = Space_Mono({ variable: "--font-space-mono", subsets: ["latin"], weight: ["400"] });
const jetBrainsMono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"], weight: ["400"] });
const ibmPlexMono = IBM_Plex_Mono({ variable: "--font-ibm-plex-mono", subsets: ["latin"], weight: ["400"] });
const courierPrime = Courier_Prime({ variable: "--font-courier-prime", subsets: ["latin"], weight: ["400"] });

const FUENTES_PERSONALIZACION_VARIABLES = [
  roboto,
  openSans,
  lato,
  montserrat,
  poppins,
  inter,
  nunito,
  raleway,
  rubik,
  workSans,
  ubuntu,
  mulish,
  karla,
  manrope,
  barlow,
  merriweather,
  playfairDisplay,
  ptSerif,
  lora,
  crimsonText,
  libreBaskerville,
  ebGaramond,
  cormorantGaramond,
  bitter,
  notoSerif,
  oswald,
  bebasNeue,
  anton,
  archivoBlack,
  righteous,
  fjallaOne,
  bangers,
  lobster,
  abrilFatface,
  passionOne,
  dancingScript,
  pacifico,
  greatVibes,
  sacramento,
  satisfy,
  indieFlower,
  shadowsIntoLight,
  permanentMarker,
  kalam,
  robotoMono,
  spaceMono,
  jetBrainsMono,
  ibmPlexMono,
  courierPrime,
]
  .map((fuente) => fuente.variable)
  .join(" ");

export const metadata: Metadata = {
  title: "Nouttbuk",
  description:
    "Apuntes universitarios en privado, en grupo o abiertos a la comunidad.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nouttbuk",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${dmSans.variable} ${newsreader.variable} ${caveat.variable} ${FUENTES_PERSONALIZACION_VARIABLES} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
        >
          Saltar al contenido
        </a>
        <Toaster>{children}</Toaster>
        <RegistrarServiceWorker />
      </body>
    </html>
  );
}
