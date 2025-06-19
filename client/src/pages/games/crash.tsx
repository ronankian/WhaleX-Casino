import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import GameLayout from "@/components/games/game-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Rocket, DollarSign, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateClientSeed, formatCurrency, BET_AMOUNTS } from "@/lib/game-utils";

export default function CrashGame() {
  const [, setLocation] = useLocation();
  const { user, wallet, isAuthenticated, refreshWallet } = useAuth();
  const { toast } = useToast();

  const [betAmount, setBetAmount] = useState(10);
  const [autoCashOut, setAutoCashOut] = useState(2.0);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [gameActive, setGameActive] = useState(false);
  const [hasBet, setHasBet] = useState(false);
  const [crashed, setCrashed] = useState(false);
  const [crashPoint, setCrashPoint] = useState<number | null>(null);
  const [clientSeed] = useState(generateClientSeed());
  const [recentCrashes, setRecentCrashes] = useState([1.23, 5.67, 2.89, 12.45, 1.01, 3.33]);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const gameStartTime = useRef<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  useEffect(() => {
    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const playGameMutation = useMutation({
    mutationFn: async (gameData: any) => {
      const response = await apiRequest("POST", "/api/games/play", {
        userId: user?.id,
        gameType: "crash",
        betAmount,
        gameData,
      });
      return response.json();
    },
    onSuccess: (data) => {
      const crashPoint = data.result.crashPoint;
      const cashOut = data.result.cashOut;
      
      setCrashPoint(crashPoint);
      setRecentCrashes(prev => [crashPoint, ...prev.slice(0, 5)]);
      
      if (data.gameResult.isWin) {
        const payout = parseFloat(data.gameResult.payout);
        toast({
          title: "🚀 Successful Cash Out!",
          description: `Cashed out at ${cashOut.toFixed(2)}x! Won ${formatCurrency(payout)} coins`,
        });
      } else {
        toast({
          title: "💥 Crashed!",
          description: `Game crashed at ${crashPoint.toFixed(2)}x before you could cash out`,
          variant: "destructive",
        });
      }

      if (parseFloat(data.gameResult.mobyReward) > 0) {
        toast({
          title: "🐋 MOBY Bonus!",
          description: `You earned ${data.gameResult.mobyReward} $MOBY tokens!`,
        });
      }

      setGameActive(false);
      setHasBet(false);
      setCrashed(true);
      refreshWallet();

      // Reset for next game after 3 seconds
      setTimeout(() => {
        setCrashed(false);
        setCurrentMultiplier(1.0);
        setCrashPoint(null);
      }, 3000);
    },
    onError: (error: any) => {
      toast({
        title: "Game Error",
        description: error.message,
        variant: "destructive",
      });
      setGameActive(false);
      setHasBet(false);
    },
  });

  const cashOutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/games/play", {
        userId: user?.id,
        gameType: "crash",
        betAmount,
        gameData: {
          cashOut: currentMultiplier,
          clientSeed,
          nonce: Date.now(),
        },
      });
      return response.json();
    },
    onSuccess: (data) => {
      setHasBet(false);
      const payout = parseFloat(data.gameResult.payout);
      toast({
        title: "💰 Cashed Out!",
        description: `Cashed out at ${currentMultiplier.toFixed(2)}x! Won ${formatCurrency(payout)} coins`,
      });
      refreshWallet();
    },
  });

  if (!isAuthenticated || !user || !wallet) {
    return null;
  }

  const canPlay = betAmount <= parseFloat(wallet.coins) && betAmount > 0 && !gameActive;
  const potentialPayout = betAmount * currentMultiplier;

  const startGame = () => {
    if (!canPlay) return;
    
    setGameActive(true);
    setHasBet(true);
    setCrashed(false);
    gameStartTime.current = Date.now();
    
    // Simulate multiplier increase
    intervalRef.current = setInterval(() => {
      setCurrentMultiplier(prev => {
        const elapsed = Date.now() - (gameStartTime.current || 0);
        const newMultiplier = 1 + (elapsed / 1000) * 0.2; // Increase by 0.2 every second
        
        // Auto cash out check
        if (newMultiplier >= autoCashOut && hasBet) {
          cashOutMutation.mutate();
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          return newMultiplier;
        }
        
        return newMultiplier;
      });
    }, 100);

    // Simulate random crash after some time
    const crashTime = Math.random() * 10000 + 2000; // 2-12 seconds
    setTimeout(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      if (hasBet) {
        playGameMutation.mutate({
          cashOut: 0, // Didn't cash out in time
          clientSeed,
          nonce: Date.now(),
        });
      }
    }, crashTime);
  };

  const handleCashOut = () => {
    if (hasBet && gameActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      cashOutMutation.mutate();
    }
  };

  const handleQuickBet = (amount: number) => {
    setBetAmount(amount);
  };

  return (
    <GameLayout title="Crash" description="Cash out before the multiplier crashes">
      <div className="max-w-6xl mx-auto">
        {/* Crash Chart */}
        <Card className="glass-card border-gold-500/20 mb-8">
          <CardContent className="p-8">
            <div className="relative h-80 bg-ocean-900/50 rounded-lg mb-6 flex items-center justify-center">
              {/* Chart visualization */}
              <div className="text-center">
                <div className={`text-6xl font-bold mb-2 animate-float ${
                  crashed ? "text-red-500" : gameActive ? "text-gold-500" : "text-gray-400"
                }`}>
                  {crashed && crashPoint ? `${crashPoint.toFixed(2)}x` : `${currentMultiplier.toFixed(2)}x`}
                </div>
                <div className="text-gray-400">
                  {crashed ? "CRASHED!" : gameActive ? "Current Multiplier" : "Waiting for next round..."}
                </div>
              </div>
              
              {/* Crash indicator */}
              {crashed && (
                <div className="absolute top-4 right-4">
                  <Badge variant="destructive" className="text-lg font-bold animate-pulse">
                    💥 CRASHED!
                  </Badge>
                </div>
              )}
            </div>

            {/* Game Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-white">Bet Amount</label>
                <Input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  disabled={gameActive}
                  className="bg-ocean-900/50 border-ocean-700 focus:border-gold-500 text-white"
                  min="0.01"
                  step="0.01"
                />
                <div className="grid grid-cols-4 gap-1 mt-2">
                  {BET_AMOUNTS.slice(0, 4).map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickBet(amount)}
                      disabled={gameActive || amount > parseFloat(wallet.coins)}
                      className="bg-ocean-800 hover:bg-ocean-700 border-ocean-600 text-white text-xs"
                    >
                      {amount}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-white">Auto Cash Out</label>
                <Input
                  type="number"
                  value={autoCashOut}
                  onChange={(e) => setAutoCashOut(Math.max(1.01, parseFloat(e.target.value) || 1.01))}
                  disabled={gameActive}
                  className="bg-ocean-900/50 border-ocean-700 focus:border-gold-500 text-white"
                  min="1.01"
                  step="0.01"
                />
              </div>
              
              <div className="flex flex-col justify-end">
                {!gameActive ? (
                  <Button
                    onClick={startGame}
                    disabled={!canPlay || playGameMutation.isPending}
                    className="py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold"
                  >
                    <Rocket className="mr-2 h-4 w-4" />
                    {playGameMutation.isPending ? "Starting..." : "Place Bet"}
                  </Button>
                ) : (
                  <Button
                    onClick={handleCashOut}
                    disabled={!hasBet || cashOutMutation.isPending}
                    className="py-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-semibold animate-glow"
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    {cashOutMutation.isPending ? "Cashing Out..." : "Cash Out"}
                  </Button>
                )}
                
                {!canPlay && betAmount > parseFloat(wallet.coins) && (
                  <p className="text-red-400 text-xs mt-1">
                    Insufficient balance
                  </p>
                )}
              </div>
            </div>

            {/* Potential Payout */}
            {hasBet && gameActive && (
              <Card className="bg-ocean-900/50 border-ocean-700">
                <CardContent className="p-4 text-center">
                  <div className="text-gray-400 mb-1">Potential Payout</div>
                  <div className="text-2xl font-bold text-gold-500">
                    {formatCurrency(potentialPayout)}
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Recent Crashes & Active Players */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Recent Crashes */}
          <Card className="glass-card border-gold-500/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                Recent Crashes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {recentCrashes.map((crash, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className={`px-3 py-2 text-sm font-semibold ${
                      crash >= 2 ? "bg-green-500/20 text-green-400 border-green-500" :
                      crash >= 1.5 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500" :
                      "bg-red-500/20 text-red-400 border-red-500"
                    }`}
                  >
                    {crash.toFixed(2)}x
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card className="glass-card border-gold-500/20">
            <CardHeader>
              <CardTitle className="text-white">Game Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Games Played</span>
                  <span className="text-white font-semibold">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Wagered</span>
                  <span className="text-white font-semibold">{formatCurrency(0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Biggest Win</span>
                  <span className="text-green-400 font-semibold">{formatCurrency(0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Highest Multiplier</span>
                  <span className="text-gold-500 font-semibold">0.00x</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </GameLayout>
  );
}
