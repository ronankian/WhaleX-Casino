import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Fish, Home, Gamepad2, Wallet, User } from "lucide-react";

export default function Header() {
  const { user, wallet, isAuthenticated } = useAuth();
  const [location] = useLocation();

  if (location === "/") {
    return null; // Don't show header on landing page
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-gold-500/20">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3">
          <div className="w-10 h-10 whale-gradient rounded-full flex items-center justify-center animate-float">
            <Fish className="text-gold-950 text-xl" />
          </div>
          <h1 className="text-2xl font-display font-bold text-gold-500">WhaleX</h1>
        </Link>

        {isAuthenticated && (
          <>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  className={`text-white hover:text-gold-500 transition-colors ${
                    location === "/dashboard" ? "text-gold-500" : ""
                  }`}
                >
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              
              <div className="relative group">
                <Button
                  variant="ghost"
                  className={`text-white hover:text-gold-500 transition-colors ${
                    location.startsWith("/games") ? "text-gold-500" : ""
                  }`}
                >
                  <Gamepad2 className="mr-2 h-4 w-4" />
                  Games
                </Button>
                
                {/* Games dropdown */}
                <div className="absolute top-full left-0 mt-2 w-48 glass-card rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="p-2">
                    <Link href="/games/dice">
                      <Button variant="ghost" className="w-full justify-start text-white hover:text-gold-500">
                        🎲 Dice Roll
                      </Button>
                    </Link>
                    <Link href="/games/slots">
                      <Button variant="ghost" className="w-full justify-start text-white hover:text-gold-500">
                        👑 Slot 777
                      </Button>
                    </Link>
                    <Link href="/games/hilo">
                      <Button variant="ghost" className="w-full justify-start text-white hover:text-gold-500">
                        🃏 Hi-Lo
                      </Button>
                    </Link>
                    <Link href="/games/crash">
                      <Button variant="ghost" className="w-full justify-start text-white hover:text-gold-500">
                        📈 Crash
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
              
              <Link href="/wallet">
                <Button
                  variant="ghost"
                  className={`text-white hover:text-gold-500 transition-colors ${
                    location === "/wallet" ? "text-gold-500" : ""
                  }`}
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Wallet
                </Button>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:block glass-card px-4 py-2 rounded-lg">
                <span className="text-gold-500 font-semibold">
                  {wallet ? parseFloat(wallet.coins).toLocaleString() : "0"}
                </span>
                <span className="text-gray-300 ml-1">Coins</span>
              </div>
              
              <Link href="/profile">
                <Button
                  size="sm"
                  className="w-10 h-10 bg-gradient-to-r from-gold-500 to-gold-600 rounded-full hover:animate-glow"
                >
                  <User className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </>
        )}
      </nav>
    </header>
  );
}
