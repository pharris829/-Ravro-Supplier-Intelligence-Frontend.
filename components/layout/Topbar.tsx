export default function Topbar() {
  return (
    <header className="w-full h-16 border-b flex items-center justify-between px-6 bg-white">
      <input
        type="text"
        placeholder="Search products, suppliers..."
        className="border px-3 py-2 rounded-md w-72"
      />

      <div className="flex items-center gap-3">
        <span className="font-medium">Phillip</span>
        <div className="w-8 h-8 bg-gray-300 rounded-full" />
      </div>
    </header>
  );
}
