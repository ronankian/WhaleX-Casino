import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../../hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../../lib/queryClient";
import GameLayout from "../../components/games/game-layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Slider } from "../../components/ui/slider";
import { Badge } from "../../components/ui/badge";
import { Dices, Shield } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { calculateDiceWinChance, calculateDiceMultiplier, generateClientSeed, formatCurrency, BET_AMOUNTS } from "../../lib/game-utils";

export default function DiceGame() {
  const [, setLocation] = useLocation();
  const { user, wallet, isAuthenticated, refreshWallet } = useAuth();
  const { toast } = useToast();

  const [betAmount, setBetAmount] = useState(10);
  const [target, setTarget] = useState(50);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [clientSeed] = useState(generateClientSeed());
  const [jackpotRefreshSignal, setJackpotRefreshSignal] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  const playGameMutation = useMutation({
    mutationFn: async (gameData: any) => {
      const response = await apiRequest("POST", "/api/games/play", {
        userId: user?.id,
        gameType: "dice",
        betAmount,
        gameData,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setLastRoll(data.result.roll);
      refreshWallet();
      setJackpotRefreshSignal((sig) => sig + 1);
      
      if (data.gameResult.isWin) {
        toast({
          title: "🎉 You Won!",
          description: `Rolled ${data.result.roll}! Won ${formatCurrency(data.gameResult.payout)} coins`,
        });
      } else {
        toast({
          title: "😢 You Lost",
          description: `Rolled ${data.result.roll}. Better luck next time!`,
          variant: "destructive",
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

  if (!isAuthenticated || !user || !wallet) {
    return null;
  }

  const winChance = calculateDiceWinChance(target);
  const multiplier = calculateDiceMultiplier(target);
  const potentialPayout = betAmount * multiplier;
  const canPlay = betAmount <= parseFloat(wallet.coins) && betAmount > 0;

  const handleRoll = () => {
    if (!canPlay) return;
    
    playGameMutation.mutate({
      target,
      clientSeed,
      nonce: Date.now(),
    });
  };

  const handleQuickBet = (amount: number) => {
    setBetAmount(amount);
  };

  const handleBetModifier = (modifier: "half" | "double" | "max") => {
    switch (modifier) {
      case "half":
        setBetAmount(Math.max(1, Math.floor(betAmount / 2)));
        break;
      case "double":
        setBetAmount(Math.min(parseFloat(wallet.coins), betAmount * 2));
        break;
      case "max":
        setBetAmount(parseFloat(wallet.coins));
        break;
    }
  };

  return (
    <GameLayout title="Dice Roll" description="Roll between 1-100 and predict the outcome" jackpotRefreshSignal={jackpotRefreshSignal}>
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Game Display */}
          <Card className="glass-card border-gold-500/20">
            <CardContent className="p-8 text-center">
              <div className="mb-8">
                <div className="w-32 h-32 mx-auto bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center mb-4 animate-float">
                  <Dices className="h-16 w-16 text-white" />
                </div>
                <div className="text-4xl font-bold text-gold-500 mb-2">
                  {lastRoll !== null ? lastRoll : "--"}
                </div>
                <div className="text-gray-400">
                  {lastRoll !== null ? "Last Roll" : "Ready to Roll"}
                </div>
              </div>

              {/* Target Slider */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-white">
                  Roll Under: {target}
                </label>
                <Slider
                  value={[target]}
                  onValueChange={(value) => setTarget(value[0])}
                  min={2}
                  max={98}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-400 mt-1">
                  <span>2</span>
                  <span>98</span>
                </div>
              </div>

              {/* Win Chance & Multiplier */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Card className="glass-card border-ocean-500/20">
                  <CardContent className="p-4 text-center">
                    <div className="text-sm text-gray-400 mb-1">Win Chance</div>
                    <div className="text-lg font-semibold text-emerald-400">{winChance}%</div>
                  </CardContent>
                </Card>
                <Card className="glass-card border-ocean-500/20">
                  <CardContent className="p-4 text-center">
                    <div className="text-sm text-gray-400 mb-1">Multiplier</div>
                    <div className="text-lg font-semibold text-gold-500">{multiplier.toFixed(2)}x</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Betting Panel */}
          <Card className="glass-card border-gold-500/20">
            <CardHeader>
              <CardTitle className="text-white">Place Your Bet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Bet Amount */}
              <div>
                <label className="block text-sm font-medium mb-2 text-white">Bet Amount</label>
                <div className="flex space-x-2 mb-3">
                  <Input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="flex-1 bg-ocean-900/50 border-ocean-700 focus:border-gold-500 text-white"
                    min="0.01"
                    step="0.01"
                  />
                  <Button
                    variant="outline"
                    onClick={() => handleBetModifier("half")}
                    className="px-4 bg-ocean-700 hover:bg-ocean-600 border-ocean-600 text-white"
                  >
                    1/2
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleBetModifier("double")}
                    className="px-4 bg-ocean-700 hover:bg-ocean-600 border-ocean-600 text-white"
                  >
                    2x
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleBetModifier("max")}
                    className="px-4 bg-ocean-700 hover:bg-ocean-600 border-ocean-600 text-white"
                  >
                    Max
                  </Button>
                </div>
                
                {/* Quick Bet Buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {BET_AMOUNTS.slice(0, 8).map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickBet(amount)}
                      className="bg-ocean-800 hover:bg-ocean-700 border-ocean-600 text-white"
                      disabled={amount > parseFloat(wallet.coins)}
                    >
                      {amount}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Potential Payout */}
              <Card className="bg-ocean-900/50 border-ocean-700">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Potential Payout</span>
                    <span className="text-lg font-semibold text-gold-500">
                      {formatCurrency(potentialPayout)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Roll Button */}
              <Button
                onClick={handleRoll}
                disabled={!canPlay || playGameMutation.isPending}
                className="w-full py-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-semibold text-lg transform hover:scale-105 transition-all duration-300"
              >
                {playGameMutation.isPending ? (
                  "Rolling..."
                ) : (
                  <>
                    <Dices className="mr-2 h-5 w-5" />
                    Roll Dice
                  </>
                )}
              </Button>

              {!canPlay && betAmount > parseFloat(wallet.coins) && (
                <p className="text-red-400 text-sm text-center">
                  Insufficient balance
                </p>
              )}

              {/* Provably Fair */}
              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-gray-300"
                >
                  <Shield className="mr-1 h-4 w-4" />
                  Provably Fair
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </GameLayout>
  );
}
