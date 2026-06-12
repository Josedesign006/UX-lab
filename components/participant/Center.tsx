export default function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid place-items-center p-6 bg-paper">
      {children}
    </div>
  );
}
