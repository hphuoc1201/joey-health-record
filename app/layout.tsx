import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { PWARegister } from "@/components/PWARegister";

// MD3's system typeface. Vietnamese subset so diacritics render correctly.
const roboto = Roboto({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hồ sơ sức khỏe",
  description: "Lưu trữ hồ sơ khám bệnh của gia đình một cách an toàn.",
  applicationName: "Hồ sơ sức khỏe",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Hồ sơ sức khỏe",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={roboto.variable}>
      <body>
        {children}
        <PWARegister />
      </body>
    </html>
  );
}
