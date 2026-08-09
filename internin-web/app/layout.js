import { Poppins, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/lib/providers/QueryProvider";
import Toaster from "@/components/motion/Toaster";

const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "InternIn — Stages et employabilité",
  description: "Connecter l'Éducation, l'Expérience et les Opportunités.",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png", sizes: "48x48" }],
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="fr"
      className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}
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
      <body className="min-h-full flex flex-col font-sans">
        <QueryProvider>
          {children} <Toaster />{" "}
        </QueryProvider>
      </body>
    </html>
  );
}
