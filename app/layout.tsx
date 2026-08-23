import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-mono-stack", subsets: ["latin"] });
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Unspun — search without the sales pitch",
  description:
    "Strips affiliate listicles out of product search, then ranks what the community actually recommends against live pricing.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// Runs before first paint so a stored theme never flashes the wrong palette.
// Dark is the default; only an explicit "light" needs marking. Sets both the
// legacy [data-theme] attribute and the .light-mode class the UI reads.
const THEME_SCRIPT = `(function(){try{if(localStorage.getItem("theme")==="light"){document.documentElement.setAttribute("data-theme","light")}}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${mono.variable} ${playfair.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body id="root" className="min-h-full font-sans antialiased">
        <div className="bg-grid pointer-events-none fixed inset-0 z-[-1]" />
        {children}
      </body>
    </html>
  );
}
