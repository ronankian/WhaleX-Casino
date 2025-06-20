import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, LogIn, Coins, Shield, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import LoginModal from "@/components/auth/login-modal";
import RegisterModal from "@/components/auth/register-modal";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const handlePlayNow = () => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    } else {
      setShowRegister(true);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
          <div className="animate-float mb-8">
            <div className="w-32 h-32 mx-auto whale-gradient rounded-full flex items-center justify-center mb-6 animate-glow">
              <div className="text-6xl">🐋</div>
            </div>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-display font-bold mb-6 bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 bg-clip-text text-transparent">
            WhaleX
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Dive into the depths of luxury crypto gaming. Where ocean meets fortune, and whales make waves.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button
              onClick={handlePlayNow}
              size="lg"
              className="px-8 py-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-lg font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-gold-500/50"
            >
              <Play className="mr-2 h-5 w-5" />
              Start Playing
            </Button>
            
            <Button
              onClick={() => setShowLogin(true)}
              variant="outline"
              size="lg"
              className="px-8 py-4 glass-card border-gold-500/50 hover:bg-white/20 text-lg font-semibold transition-all duration-300"
            >
              <LogIn className="mr-2 h-5 w-5" />
              Login
            </Button>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="glass-card p-6 rounded-xl text-center hover:bg-white/20 transition-all duration-300">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-gold-500 to-gold-600 rounded-full flex items-center justify-center">
                <Coins className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">$MOBY Token</h3>
              <p className="text-gray-300">Earn our exclusive cryptocurrency while you play</p>
            </div>
            
            <div className="glass-card p-6 rounded-xl text-center hover:bg-white/20 transition-all duration-300">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-ocean-500 to-ocean-600 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Provably Fair</h3>
              <p className="text-gray-300">Every game is transparent and verifiable</p>
            </div>
            
            <div className="glass-card p-6 rounded-xl text-center hover:bg-white/20 transition-all duration-300">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Payouts</h3>
              <p className="text-gray-300">Lightning-fast withdrawals to your wallet</p>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Modals */}
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSwitchToRegister={() => {
          setShowLogin(false);
          setShowRegister(true);
        }}
      />
      
      <RegisterModal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        onSwitchToLogin={() => {
          setShowRegister(false);
          setShowLogin(true);
        }}
      />
    </div>
  );
}
