export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* suppressHydrationWarning use karne se extensions ke extra attributes error nahi denge */}
      <body suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}
