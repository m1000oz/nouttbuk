import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { RegistrarServiceWorker } from "@/components/pwa/registrar-service-worker";
import { Toaster } from "@/components/ui/toast";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

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
    <html lang="es" className={`${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Toaster>{children}</Toaster>
        <RegistrarServiceWorker />
      </body>
    </html>
  );
}
