import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../../hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../../lib/queryClient";
import GameLayout from "../../components/games/game-layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { ArrowUp, ArrowDown, RotateCcw, DollarSign, History, Users } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { generateClientSeed, formatCurrency, CARD_SUITS, getGameId } from "../../lib/game-utils";

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
      streak: '/sounds/win.mp3'
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

export default function HiLoGame() {
  const [, setLocation] = useLocation();
  const { user, wallet, isAuthenticated, refreshWallet } = useAuth();
  const { toast } = useToast();

  const [currentCard, setCurrentCard] = useState<number | null>(null);
  const [nextCard, setNextCard] = useState<number | null>(null);
  const [nextCardRevealed, setNextCardRevealed] = useState(false);
  const [betAmount, setBetAmount] = useState(1);
  const [streak, setStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [gameActive, setGameActive] = useState(false);
  const [hasBet, setHasBet] = useState(false);
  const [awaitingGuess, setAwaitingGuess] = useState(false);
  const [clientSeed] = useState(generateClientSeed());
  const [history, setHistory] = useState<{ payout: number, isWin: boolean, streak: number }[]>([]);
  const [playerBets, setPlayerBets] = useState([
    { username: "Player1", bet: 100, streak: 3, cashout: 2.0 },
    { username: "Player2", bet: 50, streak: 1, cashout: 1.0 },
    { username: "Player3", bet: 200, streak: 0, cashout: null },
  ]);
  const [isFirstRound, setIsFirstRound] = useState(true);
  const [currentSuit, setCurrentSuit] = useState<string | null>(null);
  const [nextSuit, setNextSuit] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  useEffect(() => {
    setMultiplier(1 + (streak * 0.5));
  }, [streak]);

  const playGameMutation = useMutation({
    mutationFn: async (gameData: any) => {
      const response = await apiRequest("POST", "/api/games/play", {
        userId: user?.id,
        gameType: "hilo",
        betAmount: gameData.isFirstRound ? betAmount : 0,
        gameData,
      });
      return response.json();
    },
    onSuccess: (data) => {
      const { currentCard: newCurrent, nextCard: newNext, guess } = data.result;
      
      // Always show the revealed next card
      setNextCard(newNext);
      
      if (data.gameResult.isWin) {
        const newStreak = streak + 1;
        setStreak(newStreak);
        setAwaitingGuess(false);
        audioManager.play(newStreak >= 3 ? "streak" : "win");
        toast({
          title: "🎉 Correct!",
          description: `${formatCard(newNext)} was ${guess}! Streak: ${newStreak} (${(1 + (newStreak * 0.5)).toFixed(1)}x)`,
        });
        // Show both cards for a short delay, then update for next round
        setTimeout(() => {
          setCurrentCard(newNext); // Now update current card for next round
          setNextCard(null);      // Hide next card for next round
          setAwaitingGuess(true); // Allow next guess
        }, 1200);
      } else {
        setStreak(0);
        setAwaitingGuess(false);
        audioManager.play("lose");
        toast({
          title: "😢 Wrong!",
          description: `${formatCard(newNext)} was not ${guess}. Game over!`,
          variant: "destructive",
        });
        // Add loss to history
        setHistory(prev => [{ payout: 0, isWin: false, streak }, ...prev.slice(0, 7)]);
        refreshWallet();
        // Add a delay before resetting the game state so the player can see the card
        setTimeout(() => {
          setGameActive(false);
          setHasBet(false);
          setAwaitingGuess(false);
          // nextCard will be reset on Start
        }, 1200);
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
      setHasBet(false);
      setAwaitingGuess(false);
      setStreak(0);
      refreshWallet();
      
      // Add win to history
      setHistory(prev => [{ payout, isWin: true, streak }, ...prev.slice(0, 7)]);
      
      audioManager.play("cashOut");
      
      toast({
        title: "💰 Cashed Out!",
        description: `You won ${formatCurrency(payout)} at ${multiplier.toFixed(1)}x!`,
      });
    },
  });

  useEffect(() => {
    if ((currentCard === null || currentCard === undefined) && (gameActive || hasBet)) {
      setCurrentCard(Math.floor(Math.random() * 13) + 1);
    }
  }, [currentCard, gameActive, hasBet]);

  if (!isAuthenticated || !user || !wallet) {
    return null;
  }

  const canPlay = betAmount <= parseFloat(wallet.coins) && betAmount >= 1 && !gameActive && !hasBet;
  const canGuess = gameActive && awaitingGuess;
  const potentialPayout = betAmount * multiplier;

  const randomCard = () => Math.floor(Math.random() * 13) + 2; // 2–14 (Ace)

  const handleStart = () => {
    const newCurrent = randomCard();
    const newNext = randomCard();
    setCurrentCard(newCurrent);
    setCurrentSuit(getRandomSuit());
    setNextCard(newNext);
    setNextSuit(getRandomSuit());
    setNextCardRevealed(false);
    setGameActive(true);
    setStreak(0);
    setMultiplier(1);
    setAwaitingGuess(true);
  };

  const handleGuess = (guess: "higher" | "lower") => {
    if (!awaitingGuess || currentCard === null || nextCard === null) return;
    setNextCardRevealed(true);
    setAwaitingGuess(false);
    let isWin = false;
    if (guess === "higher" && currentCard > nextCard) isWin = true;
    if (guess === "lower" && currentCard < nextCard) isWin = true;
    setTimeout(() => {
      if (isWin) {
        const newStreak = streak + 1;
        setStreak(newStreak);
        setCurrentCard(nextCard);
        setCurrentSuit(nextSuit);
        const newNext = randomCard();
        setNextCard(newNext);
        setNextSuit(getRandomSuit());
        setNextCardRevealed(false);
        setAwaitingGuess(true);
        toast({
          title: "🎉 Correct!",
          description: `${formatCard(currentCard)} was ${guess} than ${formatCard(nextCard)}! Streak: ${newStreak} (${(1 + (newStreak * 0.5)).toFixed(1)}x)`,
        });
      } else {
        setGameActive(false);
        setAwaitingGuess(false);
        setHistory(prev => [{ payout: 0, isWin: false, streak }, ...prev.slice(0, 7)]);
        refreshWallet();
        toast({
          title: "😢 Wrong!",
          description: `${formatCard(currentCard)} was not ${guess} than ${formatCard(nextCard)}. Game over!`,
          variant: "destructive",
        });
      }
    }, 1200);
  };

  useEffect(() => {
    if (gameActive && !playGameMutation.isPending && !playGameMutation.isError) {
      setAwaitingGuess(true);
    }
  }, [gameActive, playGameMutation.isPending, playGameMutation.isError]);

  const handleCashOut = () => {
    if (streak > 0) {
      cashOutMutation.mutate();
      setGameActive(false);
      setHasBet(false);
      setAwaitingGuess(false);
    }
  };

  const getRandomSuit = () => CARD_SUITS[Math.floor(Math.random() * CARD_SUITS.length)];

  // Add this handler for manual reset
  const handleManualReset = () => {
    setCurrentCard(null);
    setNextCard(null);
    setNextCardRevealed(false);
    setGameActive(false);
    setStreak(0);
    setMultiplier(1);
    setAwaitingGuess(false);
  };

  return (
    <GameLayout
      title="🃏 Hi-Lo Cards"
      description="Guess if the next card is higher or lower"
      headerBg="/images/hi-lo.png"
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Panel: Betting Controls */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-black/70 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-gold-400 font-display">Place Your Bet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Streak above Bet Amount */}
              <div className="flex justify-between items-center mb-2">
                <span className="text-white/80 text-sm font-medium">Current Streak</span>
                <span className="text-2xl font-bold text-gold-500">{streak}</span>
              </div>
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
                    disabled={gameActive || hasBet}
                  />
                  <img
                    src="/images/coin.png"
                    alt="Coins"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 z-10"
                  />
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
                    {betAmount >= 1 ? `${betAmount} × ${multiplier.toFixed(1)}x` : `0 × ${multiplier.toFixed(1)}x`}
                  </span>
                  <span className="text-white/60 text-xs">
                    Current Multiplier
                  </span>
                </div>
              </div>
              {/* Game Controls */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleGuess("higher")}
                  disabled={!canGuess || playGameMutation.isPending}
                  className="py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold"
                >
                  <ArrowUp className="mr-2 h-4 w-4" />
                  Higher
                </Button>
                <Button
                  onClick={() => handleGuess("lower")}
                  disabled={!canGuess || playGameMutation.isPending}
                  className="py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold"
                >
                  <ArrowDown className="mr-2 h-4 w-4" />
                  Lower
                </Button>
              </div>
              {/* Main Start/Cash Out Button */}
              {!gameActive && !hasBet ? (
                <Button
                  onClick={handleStart}
                  className="w-full py-3 bg-gold-600 hover:bg-gold-700 text-black font-bold text-lg"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Start
                </Button>
              ) : streak > 0 ? (
                <Button
                  onClick={handleCashOut}
                  disabled={cashOutMutation.isPending}
                  className="w-full py-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-semibold text-lg"
                >
                  <DollarSign className="mr-2 h-5 w-5" />
                  Cash Out ({formatCurrency(potentialPayout)})
                </Button>
              ) : null}
              {!canPlay && !gameActive && (
                <p className="text-red-400 text-sm mt-2">
                  Insufficient balance or invalid bet
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
                {/* Game Cards Display */}
                <div className="flex items-center justify-center space-x-8 md:space-x-12 relative z-20">
                  {/* Current Card */}
                  <div className="text-center">
                    <div className="w-24 h-32 md:w-32 md:h-44 mx-auto bg-white rounded-lg flex items-center justify-center mb-4 shadow-lg border-2 border-gold-500">
                      <div className="text-4xl md:text-6xl text-red-600 font-bold">
                        {currentCard !== null ? (
                          <>
                            {formatCard(currentCard)}{currentSuit || ""}
                          </>
                        ) : (
                          <span>?</span>
                        )}
                      </div>
                    </div>
                    <div className="text-white/80 font-semibold">Current Card</div>
                  </div>

                  {/* VS Indicator */}
                  <div className="text-center">
                    <div className="text-6xl md:text-8xl font-bold text-gold-500 mb-4">VS</div>
                    <div className="text-white/60 text-sm">Guess Higher or Lower</div>
                  </div>

                  {/* Next Card Placeholder */}
                  <div className="text-center">
                    <div className="w-24 h-32 md:w-32 md:h-44 mx-auto bg-zinc-900/80 border-2 border-gold-500 border-dashed rounded-lg flex items-center justify-center mb-4">
                      {nextCardRevealed && nextCard !== null ? (
                        <div className="text-4xl md:text-6xl text-white font-bold">
                          {formatCard(nextCard)}{nextSuit || ""}
                        </div>
                      ) : (
                        <div className="text-3xl md:text-5xl text-gold-500 font-bold">?</div>
                      )}
                    </div>
                    <div className="text-white/80 font-semibold">Next Card</div>
                  </div>
                </div>

                {/* Game Status Overlay */}
                {!gameActive && !hasBet && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-lg">
                    Place your bet and make your guess!
                  </div>
                )}

                {/* Reset Button */}
                <div className="absolute top-4 left-4 z-30">
                  <button
                    className={`bg-black/70 hover:bg-black/90 rounded-full p-2 border border-gold-500 shadow-lg ${gameActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={handleManualReset}
                    title="Reset Game"
                    disabled={gameActive}
                  >
                    <RotateCcw className="h-6 w-6 text-gold-500" />
                  </button>
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
                  <div className="font-bold text-right hidden md:block">Streak</div>
                  <div className="font-bold text-right">Payout</div>
                  {playerBets.map((p, i) => (
                    <React.Fragment key={i}>
                      <div>{p.username}</div>
                      <div className="text-right">{formatCurrency(p.bet)}</div>
                      <div className="text-right hidden md:block text-gold-400">
                        {p.streak} ({p.streak > 0 ? (1 + (p.streak * 0.5)).toFixed(1) : 1}x)
                      </div>
                      <div className="text-right text-green-400">
                        {p.cashout ? formatCurrency(p.bet * p.cashout) : "-"}
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </GameLayout>
  );
}

function formatCard(value: number | null | undefined): string {
  if (value === null || value === undefined) return "?";
  if (value === 11) return "J";
  if (value === 12) return "Q";
  if (value === 13) return "K";
  if (value === 14) return "A";
  return value.toString();
}