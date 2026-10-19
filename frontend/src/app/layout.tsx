import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AfriLaunch — Des opportunités à la hauteur de vos idées",
  description: "La plateforme qui aide les porteurs de projets africains à passer de l'idée à l'opportunité.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body className={manrope.variable}>{children}</body></html>;
}
