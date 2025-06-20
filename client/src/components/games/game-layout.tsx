import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface GameLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
}

const games = [
  {
    name: "Crash",
    image: "/images/crash.jpg",
    players: 142,
    description: "Cash out before the multiplier crashes!",
    link: "/games/crash",
  },
  {
    name: "Dice",
    image: "/images/dice.jpg",
    players: 189,
    description: "Roll the dice and predict the outcome.",
    link: "/games/dice",
  },
  {
    name: "Slot 777",
    image: "/images/slots.jpg",
    players: 163,
    description: "Classic slot machine with big payouts!",
    link: "/games/slots",
  },
  {
    name: "Hi-Lo",
    image: "/images/hi-lo.png",
    players: 97,
    description: "Guess if the next card is higher or lower.",
    link: "/games/hilo",
  },
  {
    name: "Mines",
    image: "/images/mines.jpg",
    players: 211,
    description: "Avoid the mines and collect rewards!",
    link: "/games/mines",
  },
  {
    name: "Plinko",
    image: "/images/plinko.png",
    players: 76,
    description: "Drop the ball and win big prizes!",
    link: "/games/plinko",
  },
  {
    name: "Roulette",
    image: "/images/roulette.png",
    players: 154,
    description: "Bet on your lucky number and spin the wheel!",
    link: "/games/roulette",
  },
];

export default function GameLayout({ title, description, children }: GameLayoutProps) {
  const { wallet } = useAuth();

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container mx-auto">
        {/* Game Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              className="flex items-center space-x-2 text-gold-500 hover:text-gold-400 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
          </Link>

          <div className="glass-card px-6 py-3 rounded-lg">
            <span className="text-gold-500 font-semibold">
              {wallet ? parseFloat(wallet.coins).toLocaleString() : "0"}
            </span>
            <span className="text-gray-300 ml-1">Coins</span>
          </div>
        </div>

        {/* Game Title */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-display font-bold text-gold-500 mb-2">{title}</h2>
          <p className="text-gray-300">{description}</p>
        </div>

        {/* Game Content */}
        {children || (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {games.map((game) => (
              <Link href={game.link} key={game.name}>
                <a className="relative rounded-xl overflow-hidden shadow-lg group bg-black/40 hover:scale-105 transition-transform duration-200" style={{ minHeight: 220 }}>
                  <img src={game.image} alt={game.name} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-200" />
                  <div className="relative z-10 flex flex-col justify-end h-full p-4">
                    <span className="text-2xl font-bold text-white drop-shadow-lg mb-2">{game.name}</span>
                    <div className="flex items-center gap-2 text-green-400 font-semibold mb-2">
                      <User className="w-5 h-5" />
                      <span>{game.players}</span>
                    </div>
                    <span className="text-sm text-white/80 drop-shadow-md">{game.description}</span>
                  </div>
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-200" />
                </a>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
