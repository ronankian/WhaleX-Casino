import React from "react";
import { Link } from "wouter";
import { Button } from "../components/ui/button";
import { 
  Play, 
  LogIn, 
  Coins, 
  Shield, 
  Zap, 
  TrendingUp, 
  Users, 
  Star,
  ArrowRight,
  Gamepad2,
  Fish,
  Crown,
  Circle
} from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import { apiRequest } from "../lib/queryClient";
import LoginModal from "../components/auth/login-modal";
import RegisterModal from "../components/auth/register-modal";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = React.useState(false);
  const [showRegister, setShowRegister] = React.useState(false);
  const [jackpot, setJackpot] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchJackpot = async () => {
      try {
        const response = await apiRequest("GET", "/api/jackpot");
        const data = await response.json();
        setJackpot(data);
      } catch (error) {
        console.error("Failed to fetch jackpot:", error);
      }
    };

    fetchJackpot();
    // Refresh jackpot every 30 seconds
    const interval = setInterval(fetchJackpot, 30000);
    return () => clearInterval(interval);
  }, []);

  const handlePlayNow = () => {
    if (isAuthenticated) {
      window.location.href = "/dashboard";
    } else {
      setShowRegister(true);
    }
  };

  const features = [
    {
      icon: <img src="/images/coin.png" alt="WhaleX Coin" className="h-12 w-12" />,
      title: "WhaleX Coin",
      description: "Our premium gaming currency for exclusive rewards",
    },
    {
      icon: <img src="/images/$MOBY.png" alt="$MOBY" className="h-12 w-12" />,
      title: "$MOBY Token",
      description: "Earn our exclusive cryptocurrency while you play",
    },
    {
      icon: <Shield className="h-8 w-8 text-white" />,
      title: "Provably Fair",
      description: "Every game is transparent and verifiable",
      gradient: "from-emerald-500 to-emerald-600"
    },
    {
      icon: <Zap className="h-8 w-8 text-white" />,
      title: "Instant Payouts",
      description: "Lightning-fast withdrawals to your wallet",
      gradient: "from-purple-500 to-purple-600"
    }
  ];

  const games = [
    {
      name: "Crash",
      icon: <TrendingUp className="h-6 w-6" />,
      path: "/games/crash",
      description: "Watch the multiplier grow and cash out before it crashes!"
    },
    {
      name: "Slot",
      icon: <Star className="h-6 w-6" />,
      path: "/games/slots",
      description: "Classic slot machine with modern crypto rewards"
    },
    {
      name: "Hi-Lo",
      icon: <ArrowRight className="h-6 w-6" />,
      path: "/games/hilo",
      description: "Predict if the next card will be higher or lower"
    },
    {
      name: "Mines",
      icon: <Shield className="h-6 w-6" />,
      path: "/games/mines",
      description: "Navigate through the minefield and collect gems"
    },
    {
      name: "Lotto",
      icon: <Coins className="h-6 w-6" />,
      path: "/games/lotto",
      description: "Try your luck in our crypto lottery for big prizes!"
    }
  ];

  const updates = [
    {
      title: "Reef Tycoon",
      description: "Our new reef-building game where you can earn $MOBY tokens by managing your own coral empire and growing your underwater fortune.",
      date: "Latest Update",
      icon: <Fish className="h-5 w-5" />
    },
    {
      title: "Enhanced Security",
      description: "Upgraded our security protocols to ensure safer transactions",
      date: "2 days ago",
      icon: <Shield className="h-5 w-5" />
    },
    {
      title: "New Games Added",
      description: "Introducing Plinko and Roulette to our game collection",
      date: "1 week ago",
      icon: <Gamepad2 className="h-5 w-5" />
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
          <div className="mt-24 mb-8">
            <div className="rounded-2xl shadow-neon-gold">
              <div className="flex flex-col items-center justify-center">
                <div className="p-4 mb-4">
                  <img src="/images/chest.png" alt="Jackpot Chest" className="h-32 w-32 treasure-chest-glow" />
                </div>
                <h2 className="text-5xl font-display font-bold mb-4 text-gold-400">
                  Grand Jackpot
                </h2>
                <div className="flex items-center justify-center space-x-4">
                  <p className="text-6xl font-display font-bold text-white tracking-wider">
                    {jackpot ? parseFloat(jackpot.totalPool).toLocaleString(undefined, { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 4 
                    }) : "0.00"}
                  </p>
                  <img src="/images/$MOBY.png" alt="$MOBY Token" className="h-20 w-20 animate-spin-y-slow" />
                </div>
              </div>
            </div>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-display font-bold mb-6 text-gold-400">
            WhaleX Casino
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Dive into the depths of luxury crypto gaming. Where ocean meets
            fortune, and whales make waves.
          </p>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-xl text-center transition-all duration-300 bg-black/70 backdrop-blur-md"
              >
                <div className="flex items-center justify-center h-16 w-16 mx-auto mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Games Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 text-gold-400">
              Our Games
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Experience the thrill of crypto gaming with our diverse collection of provably fair games
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {games.map((game, index) => (
              <Link key={index} href={game.path} className="group">
                <div className="p-6 rounded-xl transition-all duration-300 transform hover:scale-105 bg-black/70 backdrop-blur-md hover:shadow-neon-gold-intense">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-gold-500 to-gold-600 rounded-lg flex items-center justify-center mr-4">
                      <div className="text-white">{game.icon}</div>
                    </div>
                    <h3 className="text-xl font-semibold text-white">{game.name}</h3>
                  </div>
                  <p className="text-gray-300 mb-4">{game.description}</p>
                  <div className="flex items-center text-gold-400 group-hover:text-gold-300 transition-colors">
                    <span className="text-sm font-semibold">Play Now</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </div>
              </Link>
            ))}
            <Link href="/casino" className="group">
              <div className="p-6 rounded-xl transition-all duration-300 transform hover:scale-105 bg-black/70 backdrop-blur-md hover:shadow-neon-gold-intense flex flex-col items-center justify-center h-full">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-gold-500 to-gold-600 rounded-lg mb-4">
                  <ArrowRight className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">View More</h3>
                <p className="text-gray-300 text-center">Explore all our games</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Updates Section */}
      <section className="py-20 px-4 bg-black/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 text-gold-400">
              Latest Updates
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Stay updated with the latest features and improvements
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {updates.map((update, index) => (
              <div
                key={index}
                className="p-6 rounded-xl transition-all duration-300 bg-black/70 backdrop-blur-md"
              >
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-gold-500 to-gold-600 rounded-lg flex items-center justify-center mr-3">
                    <div className="text-white">{update.icon}</div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{update.title}</h3>
                    <p className="text-sm text-gold-400">{update.date}</p>
                  </div>
                </div>
                <p className="text-gray-300">{update.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-8 rounded-xl bg-black/70 backdrop-blur-md">
              <div className="text-4xl font-bold text-gold-400 mb-2">10,000+</div>
              <div className="text-gray-300">Active Players</div>
            </div>
            <div className="p-8 rounded-xl bg-black/70 backdrop-blur-md">
              <div className="text-4xl font-bold text-gold-400 mb-2">$2M+</div>
              <div className="text-gray-300">Total Volume</div>
            </div>
            <div className="p-8 rounded-xl bg-black/70 backdrop-blur-md">
              <div className="text-4xl font-bold text-gold-400 mb-2">99.9%</div>
              <div className="text-gray-300">Uptime</div>
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