export default function Sidebar() {
  return (
    <aside className="w-64 bg-[#111] text-white p-6 flex flex-col gap-6">
      <div className="text-2xl font-bold tracking-wide">
        Ravro<span className="text-maroon-500">.</span>
      </div>

      <nav className="flex flex-col gap-4">
        <a href="/" className="hover:text-maroon-400">Dashboard</a>
        <a href="/products/1" className="hover:text-maroon-400">Products</a>
        <a href="/suppliers/1" className="hover:text-maroon-400">Suppliers</a>
        <a href="/categories/1" className="hover:text-maroon-400">Categories</a>
      </nav>
    </aside>
  );
}
