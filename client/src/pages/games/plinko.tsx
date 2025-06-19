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
import { Circle, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateClientSeed, formatCurrency, BET_AMOUNTS } from "@/lib/game-utils";

export default function PlinkoGame() {
  const [, setLocation] = useLocation();
  const { user, wallet, isAuthenticated, refreshWallet } = useAuth();
  const { toast } = useToast();

  const [betAmount, setBetAmount] = useState(10);
  const [ballActive, setBallActive] = useState(false);
  const [ballPosition, setBallPosition] = useState(8);
  const [finalMultiplier, setFinalMultiplier] = useState(0);
  const [clientSeed] = useState(generateClientSeed());
  
  const ballRef = useRef<HTMLDivElement>(null);
  const rows = 16;

  const multipliers = [1000, 130, 26, 9, 4, 2, 1.5, 1, 0.5, 1, 1.5, 2, 4, 9, 26, 130, 1000];

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  const playGameMutation = useMutation({
    mutationFn: async (gameData: any) => {
      const response = await apiRequest("POST", "/api/games/play", {
        userId: user?.id,
        gameType: "plinko",
        betAmount,
        gameData,
      });
      return response.json();
    },
    onSuccess: (data) => {
      const { ballPath, finalPosition, multiplier } = data.result;
      
      // Animate ball drop
      animateBall(ballPath, finalPosition);
      setFinalMultiplier(multiplier);
      
      refreshWallet();
      
      if (data.gameResult.isWin) {
        toast({
          title: "🎯 Plinko Hit!",
          description: `Ball landed on ${multiplier}x! Won ${formatCurrency(data.gameResult.payout)} coins`,
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
      setBallActive(false);
    },
  });

  if (!isAuthenticated || !user || !wallet) {
    return null;
  }

  const canPlay = betAmount <= parseFloat(wallet.coins) && betAmount > 0 && !ballActive;

  const animateBall = (ballPath: number[], finalPosition: number) => {
    setBallActive(true);
    let step = 0;
    
    const animate = () => {
      if (step < ballPath.length) {
        setBallPosition(ballPath[step]);
        step++;
        setTimeout(animate, 200);
      } else {
        setBallPosition(finalPosition);
        setTimeout(() => setBallActive(false), 1000);
      }
    };
    
    animate();
  };

  const handleDrop = () => {
    if (!canPlay) return;
    
    playGameMutation.mutate({
      rows,
      clientSeed,
      nonce: Date.now(),
    });
  };

  return (
    <GameLayout title="Plinko" description="Drop the ball and watch it bounce to fortune">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Plinko Board */}
          <div className="lg:col-span-2">
            <Card className="glass-card border-gold-500/20">
              <CardContent className="p-6">
                <div className="relative bg-ocean-900/50 rounded-lg p-4 min-h-96">
                  {/* Drop Zone */}
                  <div className="flex justify-center mb-4">
                    <div className="w-8 h-8 bg-gold-500 rounded-full flex items-center justify-center">
                      <Circle className="h-4 w-4 text-white" />
                    </div>
                  </div>

                  {/* Pegs */}
                  <div className="space-y-4">
                    {Array.from({ length: rows }, (_, row) => (
                      <div key={row} className="flex justify-center space-x-4">
                        {Array.from({ length: row + 1 }, (_, peg) => (
                          <div
                            key={peg}
                            className="w-2 h-2 bg-gray-400 rounded-full"
                          />
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Ball */}
                  {ballActive && (
                    <div
                      ref={ballRef}
                      className="absolute w-6 h-6 bg-gold-500 rounded-full animate-bounce transition-all duration-200"
                      style={{
                        left: `${(ballPosition / multipliers.length) * 100}%`,
                        top: "20%",
                        transform: "translateX(-50%)",
                      }}
                    />
                  )}

                  {/* Multiplier Slots */}
                  <div className="flex justify-center space-x-1 mt-6">
                    {multipliers.map((mult, index) => (
                      <div
                        key={index}
                        className={`w-12 h-8 flex items-center justify-center text-xs font-bold rounded ${
                          mult >= 100
                            ? "bg-red-500 text-white"
                            : mult >= 10
                            ? "bg-orange-500 text-white"
                            : mult >= 2
                            ? "bg-yellow-500 text-black"
                            : mult >= 1
                            ? "bg-green-500 text-white"
                            : "bg-gray-500 text-white"
                        }`}
                      >
                        {mult}x
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <Card className="glass-card border-gold-500/20">
            <CardHeader>
              <CardTitle className="text-white">Drop Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-white">Bet Amount</label>
                <Input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  disabled={ballActive}
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
                      disabled={ballActive || amount > parseFloat(wallet.coins)}
                      className="bg-ocean-800 hover:bg-ocean-700 border-ocean-600 text-white text-xs"
                    >
                      {amount}
                    </Button>
                  ))}
                </div>
              </div>

              {finalMultiplier > 0 && (
                <Card className="bg-ocean-900/50 border-ocean-700">
                  <CardContent className="p-4 text-center">
                    <div className="text-sm text-gray-400 mb-1">Last Result</div>
                    <div className="text-2xl font-bold text-gold-500">{finalMultiplier}x</div>
                    <div className="text-sm text-gray-400">
                      Won: {formatCurrency(betAmount * finalMultiplier)}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button
                onClick={handleDrop}
                disabled={!canPlay || playGameMutation.isPending}
                className="w-full py-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-semibold text-lg transform hover:scale-105 transition-all duration-300"
              >
                {ballActive ? (
                  "Ball Dropping..."
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    Drop Ball
                  </>
                )}
              </Button>

              {!canPlay && betAmount > parseFloat(wallet.coins) && (
                <p className="text-red-400 text-sm text-center">
                  Insufficient balance
                </p>
              )}

              {/* Multiplier Guide */}
              <Card className="bg-ocean-900/50 border-ocean-700">
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-white mb-2">Multiplier Guide</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-red-400">1000x</span>
                      <span className="text-gray-400">Edge slots</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-orange-400">130x</span>
                      <span className="text-gray-400">Rare</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-400">26x</span>
                      <span className="text-gray-400">Uncommon</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-400">1-9x</span>
                      <span className="text-gray-400">Common</span>
                    </div>
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