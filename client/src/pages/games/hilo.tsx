import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../../hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../../lib/queryClient";
import GameLayout from "../../components/games/game-layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { ArrowUp, ArrowDown, RotateCcw, DollarSign } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { generateClientSeed, formatCurrency, formatCard, getCardValue, CARD_SUITS, getGameId } from "../../lib/game-utils";

export default function HiLoGame() {
  const [, setLocation] = useLocation();
  const { user, wallet, isAuthenticated, refreshWallet } = useAuth();
  const { toast } = useToast();

  const [betAmount, setBetAmount] = useState(10);
  const [currentCard, setCurrentCard] = useState(7);
  const [nextCard, setNextCard] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [gameActive, setGameActive] = useState(false);
  const [clientSeed] = useState(generateClientSeed());

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  const playGameMutation = useMutation({
    mutationFn: async (gameData: any) => {
      const response = await apiRequest("POST", "/api/games/play", {
        userId: user?.id,
        gameType: "hilo",
        betAmount: gameActive ? 0 : betAmount, // Only bet on first round
        gameData,
      });
      return response.json();
    },
    onSuccess: (data) => {
      const { currentCard: newCurrent, nextCard: newNext, guess } = data.result;
      
      setCurrentCard(newNext);
      setNextCard(null);
      
      if (data.gameResult.isWin) {
        const newStreak = streak + 1;
        setStreak(newStreak);
        setMultiplier(newStreak * 2);
        
        if (newStreak > bestStreak) {
          setBestStreak(newStreak);
        }
        
        toast({
          title: "🎉 Correct!",
          description: `${formatCard(newNext)} was ${guess}! Streak: ${newStreak}`,
        });
      } else {
        setStreak(0);
        setMultiplier(1);
        setGameActive(false);
        refreshWallet();
        
        toast({
          title: "😢 Wrong!",
          description: `${formatCard(newNext)} was not ${guess}. Game over!`,
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

  const cashOutMutation = useMutation({
    mutationFn: async () => {
      const payout = betAmount * multiplier;
      const response = await apiRequest("POST", "/api/games/play", {
        userId: user?.id,
        gameType: "hilo",
        betAmount: -payout, // Negative to indicate cashout
        gameData: { cashOut: true, streak },
      });
      return response.json();
    },
    onSuccess: (data) => {
      const payout = betAmount * multiplier;
      setGameActive(false);
      setStreak(0);
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

  const handleGuess = (guess: "higher" | "lower") => {
    if (!gameActive) {
      setGameActive(true);
    }

    playGameMutation.mutate({
      currentCard,
      guess,
      streak,
      clientSeed,
      nonce: Date.now(),
    });
  };

  const handleCashOut = () => {
    if (streak > 0) {
      cashOutMutation.mutate();
    }
  };

  const handleNewGame = () => {
    setGameActive(false);
    setStreak(0);
    setMultiplier(1);
    setCurrentCard(Math.floor(Math.random() * 13) + 1);
    setNextCard(null);
  };

  const getRandomSuit = () => CARD_SUITS[Math.floor(Math.random() * CARD_SUITS.length)];

  return (
    <GameLayout title="Hi-Lo Cards" description="Guess if the next card is higher or lower">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Game Display */}
          <Card className="glass-card border-gold-500/20">
            <CardContent className="p-8 text-center">
              {/* Current Card */}
              <div className="mb-8">
                <div className="w-32 h-44 mx-auto bg-white rounded-lg flex items-center justify-center mb-4 shadow-lg">
                  <div className="text-6xl text-red-600">
                    {formatCard(currentCard)}{getRandomSuit()}
                  </div>
                </div>
                <div className="text-gray-400">Current Card</div>
              </div>

              {/* Next Card Placeholder */}
              <div className="mb-6">
                <div className="w-32 h-44 mx-auto bg-ocean-800 border-2 border-gold-500 border-dashed rounded-lg flex items-center justify-center mb-4">
                  {nextCard !== null ? (
                    <div className="text-6xl text-white">
                      {formatCard(nextCard)}{getRandomSuit()}
                    </div>
                  ) : (
                    <div className="text-4xl text-gold-500">?</div>
                  )}
                </div>
                <div className="text-gray-400">Next Card</div>
              </div>

              {/* Game Controls */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => handleGuess("higher")}
                  disabled={playGameMutation.isPending || (!gameActive && !canPlay)}
                  className="py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold"
                >
                  <ArrowUp className="mr-2 h-5 w-5" />
                  Higher
                </Button>
                <Button
                  onClick={() => handleGuess("lower")}
                  disabled={playGameMutation.isPending || (!gameActive && !canPlay)}
                  className="py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold"
                >
                  <ArrowDown className="mr-2 h-5 w-5" />
                  Lower
                </Button>
              </div>

              {!canPlay && !gameActive && (
                <p className="text-red-400 text-sm mt-2">
                  Insufficient balance
                </p>
              )}
            </CardContent>
          </Card>

          {/* Betting & Stats */}
          <Card className="glass-card border-gold-500/20">
            <CardHeader>
              <CardTitle className="text-white">Game Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Streak */}
              <Card className="bg-ocean-900/50 border-ocean-700">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Current Streak</span>
                    <span className="text-2xl font-bold text-gold-500">{streak}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Best Streak</span>
                    <span className="text-lg font-semibold text-emerald-400">{bestStreak}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Bet Amount */}
              {!gameActive && (
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
                </div>
              )}

              {/* Multiplier */}
              <Card className="bg-ocean-900/50 border-ocean-700">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Current Multiplier</span>
                    <span className="text-xl font-bold text-gold-500">{multiplier.toFixed(2)}x</span>
                  </div>
                </CardContent>
              </Card>

              {/* Cash Out / New Game */}
              {gameActive && streak > 0 ? (
                <Button
                  onClick={handleCashOut}
                  disabled={cashOutMutation.isPending}
                  className="w-full py-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-semibold text-lg"
                >
                  <DollarSign className="mr-2 h-5 w-5" />
                  Cash Out ({formatCurrency(potentialPayout)})
                </Button>
              ) : (
                <Button
                  onClick={handleNewGame}
                  className="w-full py-3 bg-ocean-700 hover:bg-ocean-600 text-white font-semibold"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  New Game
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </GameLayout>
  );
}
