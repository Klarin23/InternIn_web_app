import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/lib/providers/QueryProvider";
import Toaster from "@/components/motion/Toaster";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "InternIn — Stages et employabilité",
  description: "Connecter l'Éducation, l'Expérience et les Opportunités.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Applique le thème sauvegardé AVANT l'hydratation React, pour
            éviter un flash du mauvais thème au chargement de la page.
            Doit rester synchronisé avec la clé utilisée par useThemeStore
            ("internin-theme") et le format de stockage de zustand/persist. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var brut = localStorage.getItem("internin-theme");
                  var theme = brut ? JSON.parse(brut).state.theme : "light";
                  if (theme === "dark") {
                    document.documentElement.classList.add("dark");
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        {/* Applique la langue sauvegardée AVANT l'hydratation React, pour
            éviter un flash/mismatch de l'attribut lang au chargement.
            Doit rester synchronisé avec la clé utilisée par useI18nStore
            ("internin-locale") et le format de stockage de zustand/persist. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var brut = localStorage.getItem("internin-locale");
                  var locale = brut ? JSON.parse(brut).state.locale : "fr";
                  document.documentElement.lang = locale;
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          {children} <Toaster />{" "}
        </QueryProvider>
      </body>
    </html>
  );
}
