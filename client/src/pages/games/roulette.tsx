import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import GameLayout from "@/components/games/game-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateClientSeed, formatCurrency, BET_AMOUNTS } from "@/lib/game-utils";

export default function RouletteGame() {
  const [, setLocation] = useLocation();
  const { user, wallet, isAuthenticated, refreshWallet } = useAuth();
  const { toast } = useToast();

  const [betAmount, setBetAmount] = useState(10);
  const [selectedBetType, setSelectedBetType] = useState<string>("red");
  const [selectedNumber, setSelectedNumber] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [lastWin, setLastWin] = useState(0);
  const [clientSeed] = useState(generateClientSeed());

  const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
  const blackNumbers = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  const playGameMutation = useMutation({
    mutationFn: async (gameData: any) => {
      const response = await apiRequest("POST", "/api/games/play", {
        userId: user?.id,
        gameType: "roulette",
        betAmount,
        gameData,
      });
      return response.json();
    },
    onSuccess: (data) => {
      const { winningNumber: winner, betType, betValue } = data.result;
      
      setWinningNumber(winner);
      setLastWin(parseFloat(data.gameResult.payout));
      refreshWallet();
      
      if (data.gameResult.isWin) {
        toast({
          title: "🎉 Roulette Win!",
          description: `Number ${winner}! Won ${formatCurrency(data.gameResult.payout)} coins`,
        });
      } else {
        toast({
          title: "😢 No Win",
          description: `Number ${winner}. Better luck next time!`,
          variant: "destructive",
        });
      }

      if (parseFloat(data.gameResult.mobyReward) > 0) {
        toast({
          title: "🐋 MOBY Bonus!",
          description: `You earned ${data.gameResult.mobyReward} $MOBY tokens!`,
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

  const canPlay = betAmount <= parseFloat(wallet.coins) && betAmount > 0;

  const handleSpin = () => {
    if (!canPlay || isSpinning) return;
    
    setIsSpinning(true);
    setLastWin(0);
    
    const gameData = {
      betType: selectedBetType,
      betValue: selectedBetType === "number" ? selectedNumber : null,
      clientSeed,
      nonce: Date.now(),
    };
    
    playGameMutation.mutate(gameData);
  };

  const getNumberColor = (num: number) => {
    if (num === 0) return "text-green-400";
    if (redNumbers.includes(num)) return "text-red-400";
    if (blackNumbers.includes(num)) return "text-gray-300";
    return "text-white";
  };

  const getMultiplier = () => {
    switch (selectedBetType) {
      case "number": return "35x";
      case "red":
      case "black":
      case "even":
      case "odd": return "2x";
      default: return "2x";
    }
  };

  return (
    <GameLayout title="Roulette" description="Place your bets and spin the wheel of fortune">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Roulette Wheel */}
          <Card className="glass-card border-gold-500/20">
            <CardContent className="p-8 text-center">
              <div className="mb-8">
                <div className={`w-64 h-64 mx-auto border-8 border-gold-500 rounded-full flex items-center justify-center mb-4 ${
                  isSpinning ? "animate-spin-slow" : ""
                }`}>
                  <div className="w-48 h-48 bg-gradient-to-r from-red-600 via-black to-red-600 rounded-full flex items-center justify-center">
                    <div className="text-6xl font-bold text-gold-500">
                      {winningNumber !== null ? winningNumber : "🎯"}
                    </div>
                  </div>
                </div>
                
                {winningNumber !== null && (
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getNumberColor(winningNumber)}`}>
                      {winningNumber}
                    </div>
                    <div className="text-gray-400">
                      {winningNumber === 0 ? "Green" :
                       redNumbers.includes(winningNumber) ? "Red" : "Black"}
                    </div>
                  </div>
                )}
              </div>

              {/* Number Grid */}
              <div className="grid grid-cols-3 gap-1 mb-4">
                <Button
                  onClick={() => setSelectedNumber(0)}
                  className={`h-12 bg-green-600 hover:bg-green-500 text-white font-bold ${
                    selectedBetType === "number" && selectedNumber === 0 ? "ring-2 ring-gold-500" : ""
                  }`}
                >
                  0
                </Button>
                <div className="col-span-2"></div>
                
                {Array.from({ length: 36 }, (_, i) => i + 1).map((num) => (
                  <Button
                    key={num}
                    onClick={() => {
                      setSelectedBetType("number");
                      setSelectedNumber(num);
                    }}
                    className={`h-12 font-bold ${
                      redNumbers.includes(num) 
                        ? "bg-red-600 hover:bg-red-500" 
                        : "bg-gray-800 hover:bg-gray-700"
                    } text-white ${
                      selectedBetType === "number" && selectedNumber === num ? "ring-2 ring-gold-500" : ""
                    }`}
                  >
                    {num}
                  </Button>
                ))}
              </div>

              {/* Outside Bets */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => setSelectedBetType("red")}
                  className={`py-3 bg-red-600 hover:bg-red-500 text-white font-semibold ${
                    selectedBetType === "red" ? "ring-2 ring-gold-500" : ""
                  }`}
                >
                  Red (2x)
                </Button>
                <Button
                  onClick={() => setSelectedBetType("black")}
                  className={`py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold ${
                    selectedBetType === "black" ? "ring-2 ring-gold-500" : ""
                  }`}
                >
                  Black (2x)
                </Button>
                <Button
                  onClick={() => setSelectedBetType("even")}
                  className={`py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold ${
                    selectedBetType === "even" ? "ring-2 ring-gold-500" : ""
                  }`}
                >
                  Even (2x)
                </Button>
                <Button
                  onClick={() => setSelectedBetType("odd")}
                  className={`py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold ${
                    selectedBetType === "odd" ? "ring-2 ring-gold-500" : ""
                  }`}
                >
                  Odd (2x)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Betting Panel */}
          <Card className="glass-card border-gold-500/20">
            <CardHeader>
              <CardTitle className="text-white">Place Your Bet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Bet Display */}
              <Card className="bg-ocean-900/50 border-ocean-700">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Current Bet</span>
                    <span className="text-white font-semibold">
                      {selectedBetType === "number" 
                        ? `Number ${selectedNumber}` 
                        : selectedBetType.charAt(0).toUpperCase() + selectedBetType.slice(1)
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Multiplier</span>
                    <span className="text-gold-500 font-semibold">{getMultiplier()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Bet Amount */}
              <div>
                <label className="block text-sm font-medium mb-2 text-white">Bet Amount</label>
                <Input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  disabled={isSpinning}
                  className="bg-ocean-900/50 border-ocean-700 focus:border-gold-500 text-white"
                  min="0.01"
                  step="0.01"
                />
                <div className="grid grid-cols-4 gap-1 mt-2">
                  {BET_AMOUNTS.slice(0, 8).map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => setBetAmount(amount)}
                      disabled={isSpinning || amount > parseFloat(wallet.coins)}
                      className="bg-ocean-800 hover:bg-ocean-700 border-ocean-600 text-white text-xs"
                    >
                      {amount}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Last Win Display */}
              {lastWin > 0 && (
                <Card className="bg-green-500/20 border-green-500">
                  <CardContent className="p-4 text-center">
                    <div className="text-sm text-gray-400 mb-1">Last Win</div>
                    <div className="text-2xl font-bold text-green-400">
                      {formatCurrency(lastWin)}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Spin Button */}
              <Button
                onClick={handleSpin}
                disabled={!canPlay || isSpinning}
                className="w-full py-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-semibold text-lg transform hover:scale-105 transition-all duration-300 animate-glow"
              >
                {isSpinning ? (
                  <>
                    <RotateCcw className="mr-2 h-5 w-5 animate-spin" />
                    SPINNING...
                  </>
                ) : (
                  <>
                    <Target className="mr-2 h-5 w-5" />
                    SPIN WHEEL
                  </>
                )}
              </Button>

              {!canPlay && betAmount > parseFloat(wallet.coins) && (
                <p className="text-red-400 text-sm text-center">
                  Insufficient balance
                </p>
              )}

              {/* Recent Numbers */}
              <Card className="bg-ocean-900/50 border-ocean-700">
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-white mb-2">Recent Numbers</div>
                  <div className="flex space-x-2">
                    {winningNumber !== null && (
                      <Badge 
                        variant="outline" 
                        className={`${getNumberColor(winningNumber)} border-current`}
                      >
                        {winningNumber}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      </div>
    </GameLayout>
  );
}