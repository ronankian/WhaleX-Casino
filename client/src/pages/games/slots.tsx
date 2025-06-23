import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from "wouter";
import { useAuth } from "../../hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../../lib/queryClient";
import GameLayout from "../../components/games/game-layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { RotateCcw, DollarSign, Zap } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { generateClientSeed, formatCurrency, SLOT_SYMBOLS, BET_AMOUNTS } from "../../lib/game-utils";
import { Badge } from "../../components/ui/badge";

export default function SlotsGame() {
  const [, setLocation] = useLocation();
  const { user, wallet, isAuthenticated, refreshWallet } = useAuth();
  const { toast } = useToast();

  const [betAmount, setBetAmount] = useState(25);
  const [reels, setReels] = useState(["🐟", "👑", "💎", "🚢", "⚓"]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [clientSeed] = useState(generateClientSeed());
  const winAudio = useRef<HTMLAudioElement | null>(null);
  const loseAudio = useRef<HTMLAudioElement | null>(null);
  const [history, setHistory] = useState<{ payout: number, isWin: boolean }[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  useEffect(() => {
    winAudio.current = new window.Audio('/sounds/win.mp3');
    loseAudio.current = new window.Audio('/sounds/lose.mp3');
  }, []);

  // Calculate win chance (3, 4, or 5 of a kind out of all possible outcomes)
  const winChance = 100 * (5 * 4 + 5) / Math.pow(5, 4); // Simplified for 5 reels, 5 symbols
  const maxWin = betAmount * 50;
  const canPlay = wallet && betAmount <= parseFloat(wallet.coins) && betAmount > 0 && !isSpinning;

  console.log('SLOTS FRONTEND DEBUG', { user, userId: user?.id, betAmount });

  const playGameMutation = useMutation({
    mutationFn: async (body) => {
      const response = await apiRequest("POST", "/api/games/play", body);
      return response.json();
    },
    onSuccess: (data) => {
      setReels(data.result.reels.map((symbol: string) => {
        const symbolData = SLOT_SYMBOLS.find(s => s.name === symbol);
        return symbolData?.icon || "⚓";
      }));
      refreshWallet();
      const matches = data.result.matches;
      const payout = parseFloat(data.gameResult.payout);
      const isWin = matches >= 3;
      setHistory(prev => [{ payout, isWin }, ...prev.slice(0, 7)]);
      if (isWin) {
        winAudio.current?.play();
        toast({
          title: "🎉 Big Win!",
          description: `You won ${formatCurrency(data.gameResult.payout)} coins!`,
        });
      } else {
        loseAudio.current?.play();
        toast({
          title: "😢 No Win",
          description: "Better luck next spin!",
          variant: "destructive",
        });
      }
      setIsSpinning(false);
    },
    onError: (error: any) => {
      toast({
        title: "Game Error",
        description: error.message,
        variant: "destructive",
      });
      setIsSpinning(false);
    },
  });

  if (!isAuthenticated || !user || !wallet) {
    return null;
  }

  const handleSpin = () => {
    if (!canPlay) return;
    setIsSpinning(true);
    console.log("SLOTS REQUEST", {
      userId: user?.id,
      gameType: "slots",
      betAmount,
      gameData: {
        clientSeed,
        nonce: Date.now(),
      }
    });
    playGameMutation.mutate({
      userId: user.id,
      gameType: "slots",
      betAmount,
      gameData: {
        clientSeed,
        nonce: Date.now(),
      }
    });
  };

  return (
    <GameLayout title="🎰Slot" description="Classic slot machine with ocean treasures">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Panel: Betting Controls */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-black/70 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-gold-400 font-display">Place Your Bet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-white/80 text-sm font-medium block mb-1">Bet Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    min={25}
                    step="0.01"
                    max={wallet ? parseFloat(wallet.coins) : 1}
                    value={betAmount}
                    placeholder="Enter bet amount"
                    onChange={e => {
                      const maxVal = wallet ? parseFloat(wallet.coins) : 1;
                      const value = Math.max(25, Math.min(maxVal, parseFloat(e.target.value) || 0.01));
                      setBetAmount(value);
                    }}
                    className="w-full px-4 py-2 bg-zinc-900/80 border-zinc-700 rounded-lg text-white text-lg font-semibold focus:outline-none focus:border-gold-500 pr-12"
                    disabled={isSpinning}
                  />
                  <img
                    src="/images/coin.png"
                    alt="Coins"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 z-10"
                  />
                </div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-3 mt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white/80 text-sm font-medium">Win Chance:</span>
                  <span className="text-gold-400 font-bold text-lg">{winChance.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/80 text-sm font-medium">Potential Max Win:</span>
                  <span className="text-gold-400 font-bold text-lg">{formatCurrency(maxWin)}</span>
                </div>
              </div>
              <Button
                onClick={handleSpin}
                disabled={!canPlay}
                className="w-full bg-gold-600 hover:bg-gold-700 text-black font-bold text-lg h-12"
              >
                {isSpinning ? (
                  <>
                    <RotateCcw className="mr-2 h-5 w-5 animate-spin" />
                    SPINNING...
                  </>
                ) : (
                  <>
                    <RotateCcw className="mr-2 h-5 w-5" />
                    SPIN
                  </>
                )}
              </Button>
              {!canPlay && (
                <p className="text-red-400 text-sm mt-2">
                  Insufficient balance or invalid bet
                </p>
              )}
            </CardContent>
          </Card>
          {/* History Card below Place Your Bet */}
          <Card className="bg-black/70 border-zinc-700 mt-4">
            <CardHeader>
              <CardTitle className="text-gold-400 flex items-center font-display">
                <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {history.length === 0 && <span className="text-zinc-400 text-sm">No spins yet.</span>}
                {history.map((h, i) => (
                  <Badge key={i} className={`font-mono ${h.isWin ? "bg-green-500/20 text-green-300 border border-green-500/30" : "bg-red-500/20 text-red-300 border border-red-500/30"}`}>
                    {h.isWin ? `+${formatCurrency(h.payout)}` : "0"}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Right Panel: Slot Machine and Paytable */}
        <div className="lg:col-span-3 flex flex-col gap-8">
          <Card className="bg-black/70 border-zinc-700">
            <CardContent className="p-8 text-center">
              <div>
                {/* Slot Reels */}
                <div className="flex justify-center items-center gap-4 w-full min-w-0">
                  {reels.map((symbol, index) => (
                    <div
                      key={index}
                      className={`slot-reel flex-1 min-w-0 h-48 bg-ocean-900 border-2 border-gold-500 rounded-lg flex items-center justify-center text-6xl ${
                        isSpinning ? "spinning" : ""
                      }`}
                    >
                      {symbol}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Paytable */}
          <Card className="bg-black/70 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-gold-400 font-display">Paytable</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full text-center border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-gold-400">
                      <th className="px-2 py-1">Symbol</th>
                      <th className="px-2 py-1">Name</th>
                      <th className="px-2 py-1">3 of a Kind</th>
                      <th className="px-2 py-1">4 of a Kind</th>
                      <th className="px-2 py-1">5 of a Kind</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-ocean-900/50 rounded-lg">
                      <td className="px-2 py-1 text-2xl flex items-center justify-center gap-2"><span>🐟</span></td>
                      <td className="px-2 py-1 text-sm text-gray-300">Fish</td>
                      <td className="px-2 py-1 text-white-400 font-semibold">0.75x</td>
                      <td className="px-2 py-1 text-white-400 font-semibold">1.5x</td>
                      <td className="px-2 py-1 text-white-400 font-semibold">2.5x</td>
                    </tr>
                    <tr className="bg-ocean-900/50 rounded-lg">
                      <td className="px-2 py-1 text-2xl flex items-center justify-center gap-2"><span>⚓</span></td>
                      <td className="px-2 py-1 text-sm text-gray-300">Anchor</td>
                      <td className="px-2 py-1 text-white-400 font-semibold">1.0x</td>
                      <td className="px-2 py-1 text-white-400 font-semibold">2.0x</td>
                      <td className="px-2 py-1 text-white-400 font-semibold">3.5x</td>
                    </tr>
                    <tr className="bg-ocean-900/50 rounded-lg">
                      <td className="px-2 py-1 text-2xl flex items-center justify-center gap-2"><span>🚢</span></td>
                      <td className="px-2 py-1 text-sm text-gray-300">Ship</td>
                      <td className="px-2 py-1 text-white-400 font-semibold">1.5x</td>
                      <td className="px-2 py-1 text-white-400 font-semibold">3.0x</td>
                      <td className="px-2 py-1 text-white-400 font-semibold">6.0x</td>
                    </tr>
                    <tr className="bg-ocean-900/50 rounded-lg">
                      <td className="px-2 py-1 text-2xl flex items-center justify-center gap-2"><span>👑</span></td>
                      <td className="px-2 py-1 text-sm text-gray-300">Crown</td>
                      <td className="px-2 py-1 text-white-400 font-semibold">2.5x</td>
                      <td className="px-2 py-1 text-white-400 font-semibold">5.0x</td>
                      <td className="px-2 py-1 text-white-400 font-semibold">12.5x</td>
                    </tr>
                    <tr className="bg-ocean-900/50 rounded-lg">
                      <td className="px-2 py-1 text-2xl flex   items-center justify-center gap-2"><span>💎</span></td>
                      <td className="px-2 py-1 text-sm text-gray-300">Diamond</td>
                      <td className="px-2 py-1 text-white-400 font-semibold">4.0x</td>
                      <td className="px-2 py-1 text-white-400 font-semibold">7.5x</td>
                      <td className="px-2 py-1 text-white-400 font-semibold">25.0x</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </GameLayout>
  );
}
