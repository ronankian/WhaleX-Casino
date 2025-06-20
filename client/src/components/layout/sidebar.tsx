import { Link, useLocation } from "wouter";
import { Home, Gamepad2, Wallet, Star } from "lucide-react";

const navItems = [
  { name: "Dashboard", icon: <Home />, href: "/dashboard" },
  { name: "Games", icon: <Gamepad2 />, href: "/games" },
  { name: "Wallet", icon: <Wallet />, href: "/wallet" },
  { name: "Jackpot", icon: <Star />, href: "/jackpot" },
];

export default function Sidebar() {
  const [location] = useLocation();
  return (
    <aside className="fixed top-0 left-0 h-full w-20 bg-black/80 border-r border-gold-500/20 flex flex-col items-center py-6 z-40">
      <img src="/images/coin.png" alt="WhaleX Coin" className="w-12 h-12 mb-8" />
      <nav className="flex flex-col gap-8 flex-1">
        {navItems.map((item) => (
          <Link href={item.href} key={item.name}>
            <div
              className={`flex flex-col items-center cursor-pointer group ${
                location.startsWith(item.href) ? "text-gold-500" : "text-white/70 hover:text-gold-400"
              }`}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.name}</span>
            </div>
          </Link>
        ))}
      </nav>
    </aside>
  );
} 