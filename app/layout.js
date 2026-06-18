import "./globals.css";

export const metadata = {
  title: "P.A.S.T Portal - Game Tương Tác Phòng Chống Ma Túy",
  description: "Game tương tác tuyên truyền phòng chống ma túy của CLB P.A.S.T - CLB Tình nguyện Vì Bình Yên Thành Phố.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className="h-full antialiased">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-800 font-body relative overflow-x-hidden">
        {/* Background Layer */}
        <div className="cyber-grid"></div>
        <div className="ambient-glow-1"></div>
        <div className="ambient-glow-2"></div>
        {children}
      </body>
    </html>
  );
}
