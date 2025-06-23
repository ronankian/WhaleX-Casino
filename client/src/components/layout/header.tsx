import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ChevronDown, User as UserIcon, LogOut, Wallet, ArrowDownCircle, ArrowUpCircle, Menu,
  Home, Fish, Info, Dice5, Crown, Bomb, BarChart3, Target, Circle, Gamepad2, TrendingDown, Gem, FerrisWheel, Swords, RefreshCw
} from "lucide-react";
import { useAuth } from "../../hooks/use-auth";

const navItems = [
  { name: "Casino", path: "/casino", icon: <Crown className="w-5 h-5 mr-2" /> },
  { name: "Reef Tycoon", path: "/farm", icon: <Fish className="w-5 h-5 mr-2" /> },
];

const games = [
  { name: "Crash", path: "/games/crash", icon: <TrendingDown className="w-5 h-5 mr-2" /> },
  { name: "Dice", path: "/games/dice", icon: <Dice5 className="w-5 h-5 mr-2" /> },
  { name: "Slot", path: "/games/slots", icon: <Gem className="w-5 h-5 mr-2" /> },
  { name: "Hi-Lo", path: "/games/hilo", icon: <Target className="w-5 h-5 mr-2" /> },
  { name: "Mines", path: "/games/mines", icon: <Bomb className="w-5 h-5 mr-2" /> },
  { name: "Plinko", path: "/games/plinko", icon: <Circle className="w-5 h-5 mr-2" /> },
  { name: "Roulette", path: "/games/roulette", icon: <FerrisWheel className="w-5 h-5 mr-2" /> },
  { name: "Lotto", path: "/games/lotto", icon: <BarChart3 className="w-5 h-5 mr-2" /> },
];

export default function Header() {
  const { user, wallet, logout } = useAuth();
  console.debug('Header wallet state:', wallet);
  const [location, setLocation] = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [gamesOpen, setGamesOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/70 border-b border-gold-500/20 backdrop-blur-md">
      <nav className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left Side: Logo, Nav, & Burger Menu */}
        <div className="flex items-center gap-8">
          <div className="lg:hidden relative">
            <button
              className="text-white p-2 rounded hover:bg-black/30 focus:outline-none"
              aria-label="Open menu"
              onClick={() => setNavOpen((v) => !v)}
            >
              <Menu className="w-7 h-7" />
            </button>
            {navOpen && (
              <div className="absolute left-0 mt-2 w-56 max-h-[80vh] overflow-y-auto bg-black/95 rounded-xl shadow-2xl py-2 z-50 border border-gold-500/20 flex flex-col animate-fade-in">
                {navItems.map((item) => (
                  <Link href={item.path} key={item.name} className={`flex items-center px-4 py-3 text-white hover:bg-gold-500/10 hover:text-gold-400 transition-colors ${location === item.path ? "bg-gold-500/10 text-gold-400" : ""}`} onClick={() => setNavOpen(false)}>
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
                <div className="border-t border-gold-500/20 my-2" />
                {games.map((game) => (
                  <Link href={game.path} key={game.name} className="flex items-center px-4 py-3 text-white hover:bg-gold-500/10 hover:text-gold-400 transition-colors" onClick={() => setNavOpen(false)}>
                    {game.icon}
                    {game.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link href="/home" className="ms-1 flex-shrink-0">
            <img src="/images/brand.png" alt="WhaleX Casino" className="h-10" />
          </Link>
          <div className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                href={item.path}
                key={item.name}
                className={`flex items-center font-semibold text-white hover:text-gold-400 transition-colors ${location === item.path ? "text-gold-400" : ""}`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
            <div className="relative">
              <button
                className="font-semibold text-white hover:text-gold-400 transition-colors flex items-center gap-1 focus:outline-none"
                onClick={() => setGamesOpen((v) => !v)}
                onBlur={() => setTimeout(() => setGamesOpen(false), 150)}
              >
                <Gamepad2 className="w-5 h-5 mr-2" /> Games <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              {gamesOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-black/95 rounded-xl shadow-2xl py-2 z-50 border border-gold-500/20 flex flex-col animate-fade-in">
                  {games.map((game) => (
                    <Link
                      href={game.path}
                      key={game.name}
                      className="flex items-center px-4 py-3 text-white hover:bg-gold-500/10 hover:text-gold-400 transition-colors"
                      onClick={() => setGamesOpen(false)}
                    >
                      {game.icon}
                      {game.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Balances and User */}
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-lg">
            <img src="/images/coin.png" alt="WhaleX Coin" className="w-6 h-6" />
            <span className="text-white font-semibold">{wallet ? parseFloat(wallet.coins).toLocaleString() : "0"}</span>
          </div>
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-lg">
            <img src="/images/$MOBY.png" alt="$MOBY Token" className="w-6 h-6" />
            <span className="text-cyan-300 font-semibold">{wallet ? parseFloat(wallet.mobyTokens).toLocaleString() : "0"}</span>
          </div>
          <div className="relative">
            <button
              className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-lg text-white font-semibold hover:text-gold-400 focus:outline-none"
              onClick={() => setProfileOpen((v) => !v)}
              onBlur={() => setTimeout(() => setProfileOpen(false), 150)}
            >
              <UserIcon className="w-5 h-5" />
              <span>{user?.username || "User"}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-black/90 rounded-lg shadow-lg py-2 z-50 border border-gold-500/20">
                <Link href="/wallet" className="flex items-center gap-2 px-4 py-2 text-white hover:bg-gold-500/10 hover:text-gold-400 transition-colors">
                  <Wallet className="w-4 h-4" /> Wallet
                </Link>
                <Link href="/wallet?action=convert" className="flex items-center gap-2 px-4 py-2 text-white hover:bg-gold-500/10 hover:text-gold-400 transition-colors">
                  <RefreshCw className="w-4 h-4" /> Convert
                </Link>
                <Link href="/wallet?action=deposit" className="flex items-center gap-2 px-4 py-2 text-white hover:bg-gold-500/10 hover:text-gold-400 transition-colors">
                  <ArrowDownCircle className="w-4 h-4" /> Deposit
                </Link>
                <Link href="/wallet?action=withdraw" className="flex items-center gap-2 px-4 py-2 text-white hover:bg-gold-500/10 hover:text-gold-400 transition-colors">
                  <ArrowUpCircle className="w-4 h-4" /> Withdraw
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 w-full text-left text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
