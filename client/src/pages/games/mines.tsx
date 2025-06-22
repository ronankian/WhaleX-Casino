import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../../hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "../../lib/queryClient";
import GameLayout from "../../components/games/game-layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Bomb, Gem, DollarSign } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { generateClientSeed, formatCurrency, BET_AMOUNTS } from "../../lib/game-utils";

export default function MinesGame() {
  const [, setLocation] = useLocation();
  const { user, wallet, isAuthenticated, refreshWallet } = useAuth();
  const { toast } = useToast();

  const [betAmount, setBetAmount] = useState(10);
  const [mineCount, setMineCount] = useState(5);
  const [gameActive, setGameActive] = useState(false);
  const [revealedCells, setRevealedCells] = useState<number[]>([]);
  const [multiplier, setMultiplier] = useState(1);
  const [clientSeed] = useState(generateClientSeed());

  const gridSize = 25;

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  const playGameMutation = useMutation({
    mutationFn: async (gameData: any) => {
      const response = await apiRequest("POST", "/api/games/play", {
        userId: user?.id,
        gameType: "mines",
        betAmount: gameActive ? 0 : betAmount,
        gameData,
      });
      return response.json();
    },
    onSuccess: (data) => {
      const { isMine, revealedCells: newRevealed } = data.result;
      
      if (isMine) {
        toast({
          title: "💥 Mine Hit!",
          description: "You hit a mine! Game over.",
          variant: "destructive",
        });
        setGameActive(false);
        setRevealedCells([]);
        setMultiplier(1);
        refreshWallet();
      } else {
        setRevealedCells(newRevealed);
        setMultiplier(parseFloat(data.gameResult.multiplier));
        toast({
          title: "💎 Safe!",
          description: `Found a gem! Multiplier: ${parseFloat(data.gameResult.multiplier).toFixed(2)}x`,
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
        gameData: { cashOut: true, revealedCells },
      });
      return response.json();
    },
    onSuccess: () => {
      const payout = betAmount * multiplier;
      setGameActive(false);
      setRevealedCells([]);
      setMultiplier(1);
      refreshWallet();
      
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
    if (revealedCells.includes(cellIndex)) return;
    
    if (!gameActive) {
        if(!canPlay) return;
      setGameActive(true);
    }

    playGameMutation.mutate({
      selectedCell: cellIndex,
      revealedCells,
      mineCount,
      gridSize,
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
    setGameActive(false);
    setRevealedCells([]);
    setMultiplier(1);
  };

  return (
    <GameLayout title="Mines" description="Find gems while avoiding hidden mines">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Game Grid */}
          <div className="lg:col-span-2">
            <Card className="glass-card border-gold-500/20">
              <CardContent className="p-6">
                <div className="grid grid-cols-5 gap-2 mb-6">
                  {Array.from({ length: gridSize }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => handleCellClick(i)}
                      disabled={ (gameActive && revealedCells.includes(i)) || playGameMutation.isPending}
                      className={`aspect-square rounded-lg border-2 transition-all duration-200 flex items-center justify-center text-2xl ${
                        revealedCells.includes(i)
                          ? "bg-emerald-500 border-emerald-400 animate-glow"
                          : "bg-ocean-800 border-ocean-600 hover:border-gold-500 hover:bg-ocean-700"
                      }`}
                    >
                      {revealedCells.includes(i) && <Gem className="h-6 w-6 text-white" />}
                    </button>
                  ))}
                </div>

                <div className="flex justify-center space-x-4">
                  <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500">
                    <Bomb className="h-4 w-4 mr-1" />
                    {mineCount} Mines
                  </Badge>
                  <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500">
                    <Gem className="h-4 w-4 mr-1" />
                    {revealedCells.length} Found
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <Card className="glass-card border-gold-500/20">
            <CardHeader>
              <CardTitle className="text-white">Game Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!gameActive && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">Bet Amount</label>
                    <Input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="bg-ocean-900/50 border-ocean-700 focus:border-gold-500 text-white"
                      min="0.01"
                      step="0.01"
                    />
                    <div className="grid grid-cols-3 gap-1 mt-2">
                      {BET_AMOUNTS.slice(0, 6).map((amount) => (
                        <Button
                          key={amount}
                          variant="outline"
                          size="sm"
                          onClick={() => setBetAmount(amount)}
                          disabled={amount > parseFloat(wallet.coins)}
                          className="bg-ocean-800 hover:bg-ocean-700 border-ocean-600 text-white text-xs"
                        >
                          {amount}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">Number of Mines</label>
                    <Input
                      type="number"
                      value={mineCount}
                      onChange={(e) => setMineCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))}
                      className="bg-ocean-900/50 border-ocean-700 focus:border-gold-500 text-white"
                      min="1"
                      max="20"
                    />
                  </div>
                </>
              )}

              <Card className="bg-ocean-900/50 border-ocean-700">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Current Multiplier</span>
                    <span className="text-xl font-bold text-gold-500">{multiplier.toFixed(2)}x</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Potential Payout</span>
                    <span className="text-lg font-semibold text-gold-500">
                      {formatCurrency(potentialPayout)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {gameActive ? (
                <Button
                  onClick={handleCashOut}
                  disabled={cashOutMutation.isPending || revealedCells.length === 0}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold text-lg animate-glow"
                >
                  <DollarSign className="mr-2 h-5 w-5" />
                  Cash Out ({formatCurrency(potentialPayout)})
                </Button>
              ) : (
                <Button
                  onClick={handleStartGame}
                  disabled={!canPlay}
                  className="w-full py-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-semibold text-lg"
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
        </div>
      </div>
    </GameLayout>
  );
}