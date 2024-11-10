
import { TopNav } from "./_components/topnav";


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid corrected-h-screen grid-rows-[auto,1fr]">
      <TopNav />
      <div className="overflow-y-scroll">{children}</div>
    </div>
  );
}
