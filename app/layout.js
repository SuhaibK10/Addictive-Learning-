import "./globals.css";

export const metadata = {
  title: "Addictive Learning",
  description:
    "Live 1-on-1 quiz matches. Challenge a friend and learn together.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
