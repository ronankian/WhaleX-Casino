import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../../hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "../../lib/queryClient";
import GameLayout from "../../components/games/game-layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Bomb, Gem, DollarSign, History, Users } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { generateClientSeed, formatCurrency, BET_AMOUNTS } from "../../lib/game-utils";

// Preloaded Audio System for instant playback
class AudioManager {
  private sounds: { [key: string]: HTMLAudioElement } = {};
  
  constructor() {
    this.preloadSounds();
  }
  
  private preloadSounds() {
    const soundFiles = {
      win: '/sounds/win.mp3',
      lose: '/sounds/lose.mp3',
      cashOut: '/sounds/win.mp3',
      gem: '/sounds/win.mp3'
    };
    
    Object.entries(soundFiles).forEach(([key, path]) => {
      const audio = new Audio(path);
      audio.volume = 0.5;
      audio.preload = 'auto';
      
      audio.addEventListener('canplaythrough', () => {
        console.log(`Audio ${key} preloaded successfully`);
      });
      
      audio.addEventListener('error', (e) => {
        console.warn(`Failed to preload audio ${key}:`, e);
      });
      
      this.sounds[key] = audio;
    });
  }
  
  play(soundName: string) {
    const sound = this.sounds[soundName];
    if (sound) {
      try {
        sound.currentTime = 0;
        sound.play().catch(error => {
          console.log(`Could not play sound ${soundName}:`, error);
        });
      } catch (error) {
        console.log(`Sound error for ${soundName}:`, error);
      }
    } else {
      console.warn(`Sound ${soundName} not found in preloaded sounds`);
    }
  }
  
  setVolume(volume: number) {
    Object.values(this.sounds).forEach(sound => {
      sound.volume = Math.max(0, Math.min(1, volume));
    });
  }
}

// Create global audio manager instance
const audioManager = new AudioManager();

// Mines game multiplier table based on correct guesses
const MINES_MULTIPLIERS = {
  1: 1.20, 2: 1.45, 3: 1.75, 4: 2.10, 5: 2.50,
  6: 3.00, 7: 3.70, 8: 4.50, 9: 5.50, 10: 6.75,
  11: 8.25, 12: 10.0, 13: 12.5, 14: 15.0, 15: 18.0,
  16: 22.0, 17: 27.0, 18: 33.0, 19: 40.0, 20: 50.0
};

// Function to calculate multiplier based on number of revealed cells
const calculateMultiplier = (revealedCount: number): number => {
  return MINES_MULTIPLIERS[revealedCount as keyof typeof MINES_MULTIPLIERS] || 1;
};

function seededRandom(seed: number) {
  // Simple LCG for deterministic random numbers
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getMinePositions(seed: number, mineCount: number, gridSize: number) {
  const positions: number[] = [];
  let i = 0;
  while (positions.length < mineCount) {
    // Use a different seed for each mine
    const rand = seededRandom(seed + i);
    const pos = Math.floor(rand * gridSize);
    if (!positions.includes(pos)) positions.push(pos);
    i++;
  }
  return positions;
}

export default function MinesGame() {
  const [, setLocation] = useLocation();
  const { user, wallet, isAuthenticated, refreshWallet } = useAuth();
  const { toast } = useToast();

  const [betAmount, setBetAmount] = useState(10);
  const [gameActive, setGameActive] = useState(false);
  const [revealedCells, setRevealedCells] = useState<number[]>([]);
  const [multiplier, setMultiplier] = useState(1);
  const [clientSeed] = useState(generateClientSeed());
  const [history, setHistory] = useState<Array<{isWin: boolean, payout: number}>>([]);
  const [mineLocations, setMineLocations] = useState<number[]>([]);

  const gridSize = 25;

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  // Update multiplier when revealed cells change
  useEffect(() => {
    const newMultiplier = calculateMultiplier(revealedCells.length);
    setMultiplier(newMultiplier);
  }, [revealedCells.length]);

  const playGameMutation = useMutation({
    mutationFn: async (gameData: any) => {
      const response = await apiRequest("POST", "/api/games/play", {
        userId: user?.id,
        gameType: "mines",
        betAmount: gameData.isFirstRound ? betAmount : 0,
        gameData,
      });
      return response.json();
    },
    onSuccess: (data) => {
      const { isMine, revealedCells: newRevealed, mineLocations: mines } = data.result;
      
      if (isMine) {
        setMineLocations(mines || []);
        audioManager.play("lose");
        toast({
          title: "💥 Mine Hit!",
          description: "You hit a mine! Game over.",
          variant: "destructive",
        });
        setGameActive(false);
        setRevealedCells([]);
        setMultiplier(1);
        setHistory(prev => [...prev, { isWin: false, payout: 0 }]);
        refreshWallet();
      } else {
        setRevealedCells(newRevealed);
        const newMultiplier = calculateMultiplier(newRevealed.length);
        audioManager.play("gem");
        toast({
          title: "💎 Safe!",
          description: `Found a gem! Multiplier: ${newMultiplier.toFixed(2)}x`,
        });
      }

      if (parseFloat(data.gameResult.mobyReward) > 0) {
        toast({
          title: "🐋 MOBY Bonus!",
          description: `You earned ${data.gameResult.mobyReward} $MOBY tokens!`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Game Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const cashOutMutation = useMutation({
    mutationFn: async () => {
      const payout = betAmount * multiplier;
      const response = await apiRequest("POST", "/api/games/play", {
        userId: user?.id,
        gameType: "mines",
        betAmount: payout,
        gameData: { cashOut: true, multiplier, revealedCells },
      });
      return response.json();
    },
    onSuccess: () => {
      const payout = betAmount * multiplier;
      setGameActive(false);
      setRevealedCells([]);
      setMultiplier(1);
      setHistory(prev => [...prev, { isWin: true, payout }]);
      refreshWallet();
      
      audioManager.play("cashOut");
      
      toast({
        title: "💰 Cashed Out!",
        description: `You won ${formatCurrency(payout)} coins!`,
      });
    },
  });

  if (!isAuthenticated || !user || !wallet) {
    return null;
  }

  const canPlay = betAmount <= parseFloat(wallet.coins) && betAmount > 0;
  const potentialPayout = betAmount * multiplier;

  const handleCellClick = (cellIndex: number) => {
    if (!gameActive) return;
    if (revealedCells.includes(cellIndex)) return;
    playGameMutation.mutate({
      selectedCell: cellIndex,
      revealedCells,
      mineCount: 5,
      gridSize: 5,
      clientSeed,
      nonce: Date.now(),
    });
  };

  const handleCashOut = () => {
    if (gameActive && revealedCells.length > 0) {
      cashOutMutation.mutate();
    }
  };

  const handleStartGame = () => {
    if (!canPlay) return;
    
    // Start the game with first round bet
    playGameMutation.mutate({
      isFirstRound: true,
      selectedCell: -1, // No cell selected yet
      revealedCells: [],
      mineCount: 5,
      gridSize: 5,
      clientSeed,
      nonce: Date.now(),
    });
    
    setGameActive(true);
    setRevealedCells([]);
    setMultiplier(1);
    setMineLocations([]);
  };

  return (
    <GameLayout title="💣 Mines" description="Find gems while avoiding hidden mines">
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
                    min={1}
                    step={1}
                    max={wallet ? parseFloat(wallet.coins) : 1}
                    value={betAmount}
                    placeholder="Enter bet amount"
                    onChange={e => {
                      const maxVal = wallet ? parseFloat(wallet.coins) : 1;
                      const value = Math.max(1, Math.min(maxVal, parseInt(e.target.value) || 1));
                      setBetAmount(value);
                    }}
                    className="w-full px-4 py-2 bg-zinc-900/80 border-zinc-700 rounded-lg text-white text-lg font-semibold focus:outline-none focus:border-gold-500 pr-12"
                    disabled={gameActive}
                  />
                  <img
                    src="/images/coin.png"
                    alt="Coins"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 z-10"
                  />
                </div>
                <div className="grid grid-cols-3 gap-1 mt-2">
                  {BET_AMOUNTS.slice(0, 6).map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => setBetAmount(amount)}
                      disabled={amount > parseFloat(wallet.coins) || gameActive}
                      className="bg-zinc-900/80 hover:bg-zinc-800 border-zinc-700 text-white text-xs"
                    >
                      {amount}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Potential Win Display */}
              <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/80 text-sm font-medium">Potential Win:</span>
                  <span className="text-gold-400 font-bold text-lg">{formatCurrency(potentialPayout)}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-white/60 text-xs">
                    Current Multiplier
                  </span>
                  <span className="text-white/60 text-xs">
                    {betAmount} × {multiplier.toFixed(2)}x
                  </span>
                </div>
              </div>

              {/* Game Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-3 text-center">
                  <div className="text-red-400 text-sm font-medium">Mines</div>
                  <div className="text-xl font-bold text-red-400">5</div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-3 text-center">
                  <div className="text-emerald-400 text-sm font-medium">Found</div>
                  <div className="text-xl font-bold text-emerald-400">{revealedCells.length}</div>
                </div>
              </div>

              {gameActive ? (
                <Button
                  onClick={handleCashOut}
                  disabled={cashOutMutation.isPending || revealedCells.length === 0}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold text-lg"
                >
                  <DollarSign className="mr-2 h-5 w-5" />
                  Cash Out ({formatCurrency(potentialPayout)})
                </Button>
              ) : (
                <Button
                  onClick={handleStartGame}
                  disabled={!canPlay}
                  className="w-full py-4 bg-gold-600 hover:bg-gold-700 text-black font-bold text-lg"
                >
                  Start Game
                </Button>
              )}
              {!canPlay && betAmount > parseFloat(wallet.coins) && (
                <p className="text-red-400 text-sm text-center">
                  Insufficient balance
                </p>
              )}
            </CardContent>
          </Card>

          {/* History Card */}
          <Card className="bg-black/70 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-gold-400 flex items-center font-display">
                <History className="mr-2 h-5 w-5" />
                History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {history.length === 0 && <span className="text-zinc-400 text-sm">No games yet.</span>}
                {history.map((h, i) => (
                  <Badge key={i} className={`font-mono ${h.isWin ? "bg-green-500/20 text-green-300 border border-green-500/30" : "bg-red-500/20 text-red-300 border border-red-500/30"}`}>
                    {h.isWin ? `+${formatCurrency(h.payout)}` : `-${formatCurrency(betAmount)}`}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Game Display */}
        <div className="lg:col-span-3">
          <Card className="bg-black/70 border-zinc-700">
            <CardContent className="p-8">
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg flex items-center justify-center bg-[#0d122b]">
                {/* Game Grid */}
                <div className="w-full h-full max-w-[520px] max-h-[520px] grid grid-cols-5 grid-rows-5 gap-4 place-items-center" style={{flex: 1}}>
                  {Array.from({ length: gridSize }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => handleCellClick(i)}
                      disabled={!gameActive || revealedCells.includes(i) || playGameMutation.isPending}
                      className={`w-full h-full aspect-square rounded-lg border-2 transition-all duration-200 flex items-center justify-center text-3xl sm:text-4xl md:text-5xl lg:text-6xl ${
                        mineLocations.length > 0 && mineLocations.includes(i)
                          ? "bg-red-700 border-red-500 animate-pulse shadow-lg shadow-red-500/80"
                          : revealedCells.includes(i)
                            ? "bg-emerald-500 border-emerald-400 animate-pulse shadow-lg shadow-emerald-500/50"
                            : "bg-zinc-800 border-zinc-600 hover:border-gold-500 hover:bg-zinc-700 hover:shadow-lg hover:shadow-gold-500/20"
                      }`}
                      style={{ minWidth: 0, minHeight: 0 }}
                    >
                      {mineLocations.length > 0 && mineLocations.includes(i) ? (
                        <span className="animate-pulse text-3xl text-white">💣</span>
                      ) : revealedCells.includes(i) ? (
                        <span className="text-3xl">💎</span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Bets Table */}
          <div className="mt-6">
            <Card className="bg-black/70 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-gold-400 flex items-center font-display">
                  <Users className="mr-2 h-5 w-5" />
                  Current Bets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-white">
                  <div className="font-bold">Player</div>
                  <div className="font-bold text-right">Bet</div>
                  <div className="font-bold text-right hidden md:block">Mines</div>
                  <div className="font-bold text-right">Status</div>
                  <div className="text-zinc-400">No active bets</div>
                  <div className="text-right text-zinc-400">-</div>
                  <div className="text-right hidden md:block text-zinc-400">-</div>
                  <div className="text-right text-zinc-400">-</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </GameLayout>
  );
}