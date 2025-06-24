import React, { ReactNode } from "react";
import { Button } from "../ui/button";
import { ArrowLeft, User } from "lucide-react";
import { Link } from "wouter";
import FloatingJackpot from "../ui/floating-jackpot";

interface GameLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  jackpotRefreshSignal?: any;
  headerBg?: string;
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
    name: "Slot",
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
  {
    name: "Lotto",
    image: "/images/lotto.png",
    players: 0,
    description: "Try your luck in the lottery!",
    link: "/games/lotto",
  },
];

export default function GameLayout({ title, description, children, jackpotRefreshSignal, headerBg }: GameLayoutProps) {

  return (
    <div className="min-h-screen pt-20 pb-8">
      {/* Floating Sticky Jackpot */}
      {title !== "Featured Games" && <FloatingJackpot refreshSignal={jackpotRefreshSignal} />}
      
      <div className="container mx-auto">
        {/* Game Header */}
        {/* Removed Back to Dashboard button */}
      </div>

      {/* Game Title - Full Width */}
      <div className="relative text-center mb-8 w-full">
        {/* Generic Background Image for any game if headerBg is provided */}
        {headerBg && (
          <div 
            className="absolute inset-0 bg-cover bg-bottom bg-no-repeat opacity-40 w-full"
            style={{ backgroundImage: `url(${headerBg})` }}
          />
        )}
        {/* Dark overlay for better text readability */}
        {headerBg && (
          <div className="absolute inset-0 bg-black/60 w-full" />
        )}
        {/* Content */}
        <div className={`relative z-10 ${headerBg ? "py-8 px-6" : ""}`}>
          <h2 className={`text-4xl font-display font-bold mb-2 flex items-center justify-center gap-3 ${headerBg ? "text-white drop-shadow-lg" : "text-gold-500"}`}>
            {title}
          </h2>
          <p className={`${headerBg ? "text-white/90 drop-shadow-md" : "text-gray-300"}`}>{description}</p>
        </div>
      </div>

      <div className="container mx-auto">
        {/* Game Content */}
        {children || (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {games.map((game) => (
              <Link href={game.link} key={game.name}>
                <a className="relative bg-black/80 border border-white/80 rounded-xl flex flex-col justify-end items-start p-6 aspect-[4/3] overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-105 hover:border-white">
                  <img src={game.image} alt={game.name} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                  {/* Gradient overlay for readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent z-10" />
                  <div className="relative z-20 flex flex-col items-start justify-end h-full w-full">
                    <span className="text-3xl font-extrabold uppercase text-gold-400 mb-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">{game.name}</span>
                    <span className="text-base text-white/80 mb-4 font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">{game.description}</span>
                    <div className="flex items-center gap-2 text-green-400 font-semibold mt-auto">
                      <User className="w-5 h-5" />
                      <span>{game.players}</span>
                    </div>
                  </div>
                </a>
              </Link>
            ))}
            {/* New Games Coming Soon card */}
            <div className="relative bg-black/80 border border-white/80 rounded-xl flex flex-col justify-center items-center p-6 aspect-[4/3] overflow-hidden">
              <img src="/images/more.png" alt="More Games" className="absolute inset-0 w-full h-full object-cover opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />
              <div className="relative z-20 flex flex-col items-center justify-center h-full w-full">
                <span className="text-5xl font-extrabold text-white mb-4 drop-shadow-[0_2px_8px_rgba(255,255,255,0.7)]">+</span>
                <span className="text-2xl font-bold text-white mb-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">New Games</span>
                <span className="text-lg text-gold-400 font-semibold drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">Coming Soon</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
