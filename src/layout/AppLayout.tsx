import { useState } from "react";
import { Megaphone, Mic, Leaf, Menu, X } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

export default function AppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menus = [
    { name: "Promosi Kilat", icon: Megaphone, path: "/" },
    { name: "Catat Suara (POS)", icon: Mic, path: "/voice" },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 font-sans flex flex-col md:flex-row">
      <header className="md:hidden bg-white border-b border-slate-100 h-16 flex items-center justify-between px-4 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center">
          <div className="bg-emerald-600 p-2 rounded-lg shadow-sm">
            <Leaf className="text-white h-4 w-4" />
          </div>
          <div className="ml-2.5">
            <h1 className="font-extrabold text-base tracking-tight text-slate-800">
              AgroGenie<span className="text-emerald-600">.ai</span>
            </h1>
          </div>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors focus:outline-none"
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {isMobileMenuOpen && (
        <div
          onClick={closeMobileMenu}
          className="md:hidden fixed inset-0 bg-slate-900/40 z-40 animate-fadeIn"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 h-full md:h-screen w-72 bg-white border-r border-slate-100 flex flex-col shadow-sm md:shadow-none z-50 md:z-30 transition-transform duration-300 md:transform-none ${
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-50 shrink-0">
          <div className="flex items-center">
            <div className="bg-emerald-600 p-2.5 rounded-xl shadow-md shadow-emerald-600/20">
              <Leaf className="text-white h-5 w-5" />
            </div>
            <div className="ml-3">
              <h1 className="font-extrabold text-xl tracking-tight text-slate-800">
                AgroGenie<span className="text-emerald-600">.ai</span>
              </h1>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Smart Agriculture Assistant
              </p>
            </div>
          </div>

          <button
            onClick={closeMobileMenu}
            className="md:hidden p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
          {menus.map((menu) => {
            const Icon = menu.icon;
            return (
              <NavLink
                key={menu.name}
                to={menu.path}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/15 scale-[1.02]"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`
                }
              >
                <Icon size={18} />
                {menu.name}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-50 flex items-center justify-between text-[11px] font-semibold text-slate-400 shrink-0 bg-white">
          <span>v1.0.0</span>
          <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Cloud Online
          </span>
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-12 max-w-7xl w-full mx-auto overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
