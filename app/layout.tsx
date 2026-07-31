import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PWARegister } from "@/components/PWARegister";

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
    <html lang="vi">
      <body>
        {children}
        <PWARegister />
      </body>
    </html>
  );
}
