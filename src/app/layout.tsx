import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Switchkrr",
  description: "Mentor-led job switching workspaces for candidates and mentors.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
