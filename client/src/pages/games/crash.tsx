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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { History, Users } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import {
  generateClientSeed,
  formatCurrency,
} from "../../lib/game-utils";

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
      crash: '/sounds/lose.mp3', // Use lose sound for crash
      jackpot: '/sounds/win.mp3', // Use win sound for jackpot (or create specific one)
      autoCashOut: '/sounds/win.mp3' // Use win sound for auto cash out
    };
    
    Object.entries(soundFiles).forEach(([key, path]) => {
      const audio = new Audio(path);
      audio.volume = 0.5;
      audio.preload = 'auto';
      
      // Handle loading
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
        sound.currentTime = 0; // Reset to start for instant replay
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

const MAX_MULTIPLIER = 2.00;

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
  const [recentCrashes, setRecentCrashes] = useState([
    { multiplier: 1.23, isCrash: true },
    { multiplier: 5.67, isCrash: false },
    { multiplier: 2.89, isCrash: false },
    { multiplier: 12.45, isCrash: false },
    { multiplier: 1.01, isCrash: true },
    { multiplier: 3.45, isCrash: false },
    { multiplier: 2.12, isCrash: false },
    { multiplier: 8.90, isCrash: false }
  ]);
  const [playerBets, setPlayerBets] = useState([
    { username: "Player1", bet: 100, cashout: 2.5 },
    { username: "Player2", bet: 50, cashout: null },
    { username: "Player3", bet: 200, cashout: 1.8 },
  ]);
  
  const [rocketState, setRocketState] = useState<'idle' | 'launching' | 'crashed'>('idle');
  const [frame, setFrame] = useState(0);
  const [effectFrame, setEffectFrame] = useState(0);
  const [showRocket, setShowRocket] = useState(true);
  const [cloudFrame, setCloudFrame] = useState(0);

  const intervalRef = useRef<number | null>(null);
  const gameStartTime = useRef<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) setLocation("/");
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAuthenticated, setLocation]);

  useEffect(() => {
    setFrame(0);
    if (gameActive) {
      setRocketState('launching');
      setShowRocket(true);
    } else if (crashed) {
      setRocketState('crashed');
      setShowRocket(true);
    } else {
      setRocketState('idle');
      setShowRocket(true);
    }
  }, [gameActive, crashed]);

  useEffect(() => {
    let animationInterval: number | undefined;
    let effectInterval: number | undefined;
    let cloudInterval: number | undefined;
    
    // Cloud animation - always running
    cloudInterval = window.setInterval(() => {
      setCloudFrame(prev => (prev + 1) % 3); // Cycle through 3 cloud images
    }, 800) as any; // Change cloud every 0.8 seconds (faster movement)
    
    if (rocketState === 'launching') {
      animationInterval = window.setInterval(() => {
        setFrame(prev => (prev + 1) % 10); // 10 flying frames
      }, 80) as any;
      
      effectInterval = window.setInterval(() => {
        setEffectFrame(prev => (prev + 1) % 2); // Alternate between 2 effect frames
      }, 50) as any; // Faster thruster animation (50ms instead of 100ms)
    } else if (rocketState === 'crashed') {
      setFrame(0);
      const explosionFrames = 9;
      animationInterval = window.setInterval(() => {
        setFrame(prev => {
          if (prev < explosionFrames - 1) {
            return prev + 1;
          } else {
            if (animationInterval) clearInterval(animationInterval);
            window.setTimeout(() => {
              setShowRocket(false);
              setRocketState('idle');
            }, 1000); 
            return explosionFrames - 1;
          }
        });
      }, 100) as any;
    }

    return () => {
      if (animationInterval) clearInterval(animationInterval);
      if (effectInterval) clearInterval(effectInterval);
      if (cloudInterval) clearInterval(cloudInterval);
    };
  }, [rocketState]);

  const getRocketImage = () => {
    switch (rocketState) {
      case 'idle':
        return '/crash/PNG/Props/Missile_01.png';
      case 'launching':
        return `/crash/PNG/Sprites/Missile/Missile_1_Flying_00${frame}.png`;
      case 'crashed':
        return `/crash/PNG/Sprites/Missile/Missile_1_Explosion_00${frame}.png`;
      default:
        return '/crash/PNG/Props/Missile_01.png';
    }
  };

  const getRocketEffectImage = () => {
    return `/crash/PNG/Props/Rocket_Effect_0${effectFrame + 1}.png`;
  };

  const getCloudImage = () => {
    return `/crash/PNG/Props/clouds0${cloudFrame + 1}.png`;
  };

  const cashOutMutation = useMutation({
    mutationFn: async (finalMultiplier: number) => {
      const response = await apiRequest("POST", "/api/games/play", {
        userId: user.id,
        gameType: "crash",
        betAmount: Number(betAmount),
        gameData: {
          clientSeed: String(clientSeed),
          nonce: Number(Date.now()),
          cashOut: Number(finalMultiplier),
        },
      });
      return await response.json();
    },
    onSuccess: (data) => {
      const payout = parseFloat(data.gameResult.payout || "0");
      refreshWallet();
    },
    onError: (error: any) => {
      console.error("Cash out API error:", error);
      refreshWallet(); // Still refresh wallet as transaction likely succeeded
    }
  });

  const crashGameMutation = useMutation({
    mutationFn: async (gameData: any) => {
      const response = await apiRequest("POST", "/api/games/play", {
        userId: user.id,
        gameType: "crash",
        betAmount: Number(betAmount),
        gameData: {
          clientSeed: String(clientSeed),
          nonce: Number(gameData.nonce),
          cashOut: 0, // Game crashed, no cash out
        },
      });
      return await response.json();
    },
    onSuccess: (data) => {
      refreshWallet();
    },
    onError: (error: any) => {
      console.error("Crash game API error:", error);
      refreshWallet();
    },
  });

  const handleCashOut = () => {
    if (hasBet && gameActive && !crashed) {
      // Immediately stop the game and show success
      if (intervalRef.current) clearInterval(intervalRef.current);
      setGameActive(false);
      setHasBet(false);
      
      const cashOutMultiplier = currentMultiplier;
      const payout = betAmount * cashOutMultiplier;
      
      // Add cash out to history
      setRecentCrashes(prev => [{ multiplier: cashOutMultiplier, isCrash: false }, ...prev.slice(0, 7)]);
      
      toast({
        title: "💰 Cashed Out!",
        description: `You won ${formatCurrency(payout)} at ${cashOutMultiplier.toFixed(2)}x!`,
        className: "bg-black/90 border-green-500 text-white",
      });
      
      // Play win sound
      audioManager.play("win");
      
      // Make API call in background to record the result
      cashOutMutation.mutate(cashOutMultiplier);
    }
  };
  
  const canPlay = wallet && betAmount <= parseFloat(wallet.coins) && betAmount > 0 && !gameActive && !hasBet;

  const startGame = () => {
    if (!canPlay) return;
    
    // Generate weighted crash point - higher multipliers are much rarer
    let randomCrash: number;
    const rand = Math.random();
    
    if (rand < 0.4) {
      // 40% chance: 1.01x - 1.20x (most common)
      randomCrash = 1.01 + Math.random() * 0.19;
    } else if (rand < 0.7) {
      // 30% chance: 1.20x - 1.50x (common)
      randomCrash = 1.20 + Math.random() * 0.30;
    } else if (rand < 0.85) {
      // 15% chance: 1.50x - 1.70x (uncommon)
      randomCrash = 1.50 + Math.random() * 0.20;
    } else if (rand < 0.95) {
      // 10% chance: 1.70x - 1.90x (rare)
      randomCrash = 1.70 + Math.random() * 0.20;
    } else if (rand < 0.99) {
      // 4% chance: 1.90x - 1.99x (very rare)
      randomCrash = 1.90 + Math.random() * 0.09;
    } else {
      // 1% chance: 2.00x (JACKPOT!)
      randomCrash = 2.00;
    }
    
    setHasBet(true);
    setGameActive(true);
    setCrashed(false);
    setCrashPoint(null);
    setCurrentMultiplier(1.00);
    gameStartTime.current = Date.now();
    
    intervalRef.current = window.setInterval(() => {
      setCurrentMultiplier(prev => {
        const elapsed = (Date.now() - (gameStartTime.current || 0)) / 1000;
        const newMultiplier = Math.max(1, 1 + 0.1 * Math.pow(elapsed, 1.2));
        
        // Check if we've reached the crash point
        if (newMultiplier >= randomCrash) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          
          // Special jackpot message for 2.00x
          const isJackpot = randomCrash >= 2.00;
          
          // Trigger crash immediately
          setCrashPoint(randomCrash);
          setRecentCrashes(prev => [{ multiplier: randomCrash, isCrash: true }, ...prev.slice(0, 7)]);
          setCrashed(true);
          setGameActive(false);
          setHasBet(false);
          
          toast({
            title: isJackpot ? "🎰 JACKPOT CRASH!" : "💥 Crashed!",
            description: isJackpot 
              ? `RARE 2.00x JACKPOT CRASH! You lost ${formatCurrency(betAmount)}, but that was amazing odds!`
              : `Game crashed at ${randomCrash.toFixed(2)}x. You lost ${formatCurrency(betAmount)}.`,
            className: isJackpot 
              ? "bg-black/90 border-red-500 text-white" 
              : "bg-black/90 border-red-500 text-white",
          });
          
          // Play crash sound (handles both jackpot and regular crash)
          audioManager.play(isJackpot ? "jackpot" : "crash");
          
          // Reset after explosion animation
          window.setTimeout(() => {
            setCrashed(false);
            setCurrentMultiplier(1.00);
            setCrashPoint(null);
          }, 3000);
          
          // Record crash in background
          crashGameMutation.mutate({ nonce: Date.now() });
          
          return randomCrash;
        }
        
        return newMultiplier;
      });
    }, 50) as any;
  };

  // Separate useEffect for auto cash out to avoid stale closure issues
  useEffect(() => {
    if (gameActive && hasBet && !crashed && autoCashOut > 1 && currentMultiplier >= autoCashOut) {
      // Auto cash out triggered
      if (intervalRef.current) clearInterval(intervalRef.current);
      setGameActive(false);
      setHasBet(false);
      
      // Use the exact auto cash out value instead of current multiplier
      const cashOutMultiplier = autoCashOut;
      const payout = betAmount * cashOutMultiplier;
      
      // Add auto cash out to history
      setRecentCrashes(prev => [{ multiplier: cashOutMultiplier, isCrash: false }, ...prev.slice(0, 7)]);
      
      toast({
        title: "🤖 Auto Cashed Out!",
        description: `Auto cash out at ${cashOutMultiplier.toFixed(2)}x! You won ${formatCurrency(payout)}!`,
        className: "bg-black/90 border-green-500 text-white",
      });
      
      // Play win sound for auto cash out
      audioManager.play("win");
      
      // Make API call in background to record the result
      cashOutMutation.mutate(cashOutMultiplier);
    }
  }, [gameActive, hasBet, crashed, currentMultiplier, autoCashOut, betAmount, toast, cashOutMutation]);

  if (!isAuthenticated || !user || !wallet) return null;

  return (
    <GameLayout title="Crash" description="Cash out before the multiplier crashes!">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-black/70 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-gold-400 font-display">Place Your Bet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-white/80 text-sm font-medium block mb-1">Bet Amount</label>
                <div className="relative">
                  <Input 
                    type="number" 
                    value={betAmount || ''} 
                    placeholder="Enter bet amount"
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      if (inputValue === "" || inputValue === "0") {
                        setBetAmount(0.01);
                      } else {
                        const value = parseFloat(inputValue) || 0;
                        const maxBet = wallet ? parseFloat(wallet.coins) : 0;
                        setBetAmount(Math.min(value, maxBet));
                      }
                    }}
                    max={wallet ? parseFloat(wallet.coins) : 0}
                    min={0.01}
                    step={0.01}
                    disabled={gameActive || hasBet} 
                    className={`bg-zinc-900/80 text-white border-zinc-700 pr-12 ${
                      betAmount > parseFloat(wallet?.coins || '0') ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                  />
                  <img 
                    src="/images/coin.png" 
                    alt="Coins" 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 z-10"
                  />
                </div>
                {betAmount > parseFloat(wallet?.coins || '0') && (
                  <p className="text-red-400 text-xs mt-1">
                    Insufficient balance. Maximum bet: {formatCurrency(parseFloat(wallet?.coins || '0'))}
                  </p>
                )}
              </div>
              <div>
                <label className="text-white/80 text-sm font-medium block mb-1">Auto Cash Out</label>
                <Select value={autoCashOut.toString()} onValueChange={(value) => setAutoCashOut(parseFloat(value))} disabled={gameActive || hasBet}>
                  <SelectTrigger className="bg-zinc-900/80 text-white border-zinc-700">
                    <SelectValue placeholder="Select multiplier">
                      {autoCashOut.toFixed(2)}x
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    <SelectItem value="1.05" className="text-white hover:bg-white hover:!text-yellow-600 data-[highlighted]:bg-white data-[highlighted]:text-yellow-600">1.05x</SelectItem>
                    <SelectItem value="1.15" className="text-white hover:bg-white hover:!text-yellow-600 data-[highlighted]:bg-white data-[highlighted]:text-yellow-600">1.15x</SelectItem>
                    <SelectItem value="1.25" className="text-white hover:bg-white hover:!text-yellow-600 data-[highlighted]:bg-white data-[highlighted]:text-yellow-600">1.25x</SelectItem>
                    <SelectItem value="1.50" className="text-white hover:bg-white hover:!text-yellow-600 data-[highlighted]:bg-white data-[highlighted]:text-yellow-600">1.50x</SelectItem>
                    <SelectItem value="1.55" className="text-white hover:bg-white hover:!text-yellow-600 data-[highlighted]:bg-white data-[highlighted]:text-yellow-600">1.55x</SelectItem>
                    <SelectItem value="1.60" className="text-white hover:bg-white hover:!text-yellow-600 data-[highlighted]:bg-white data-[highlighted]:text-yellow-600">1.60x</SelectItem>
                    <SelectItem value="1.65" className="text-white hover:bg-white hover:!text-yellow-600 data-[highlighted]:bg-white data-[highlighted]:text-yellow-600">1.65x</SelectItem>
                    <SelectItem value="1.70" className="text-white hover:bg-white hover:!text-yellow-600 data-[highlighted]:bg-white data-[highlighted]:text-yellow-600">1.70x</SelectItem>
                    <SelectItem value="1.75" className="text-white hover:bg-white hover:!text-yellow-600 data-[highlighted]:bg-white data-[highlighted]:text-yellow-600">1.75x</SelectItem>
                    <SelectItem value="1.80" className="text-white hover:bg-white hover:!text-yellow-600 data-[highlighted]:bg-white data-[highlighted]:text-yellow-600">1.80x</SelectItem>
                    <SelectItem value="1.85" className="text-white hover:bg-white hover:!text-yellow-600 data-[highlighted]:bg-white data-[highlighted]:text-yellow-600">1.85x</SelectItem>
                    <SelectItem value="1.90" className="text-white hover:bg-white hover:!text-yellow-600 data-[highlighted]:bg-white data-[highlighted]:text-yellow-600">1.90x</SelectItem>
                    <SelectItem value="1.95" className="text-white hover:bg-white hover:!text-yellow-600 data-[highlighted]:bg-white data-[highlighted]:text-yellow-600">1.95x</SelectItem>
                    <SelectItem value="2.00" className="text-white hover:bg-white hover:!text-yellow-600 data-[highlighted]:bg-white data-[highlighted]:text-yellow-600">2.00x</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Potential Win Display */}
              <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/80 text-sm font-medium">Potential Win:</span>
                  <span className="text-gold-400 font-bold text-lg">
                    {gameActive ? 
                      formatCurrency(betAmount * currentMultiplier) : 
                      formatCurrency(betAmount * (autoCashOut || 1))
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-white/60 text-xs">
                    {gameActive ? 
                      `${betAmount} × ${currentMultiplier.toFixed(2)}x` : 
                      `${betAmount} × ${(autoCashOut || 1).toFixed(2)}x`
                    }
                  </span>
                  <span className="text-white/60 text-xs">
                    {gameActive ? 'Current' : 'Auto Cash Out'}
                  </span>
                </div>
              </div>
              
              {gameActive && !crashed ? (
                <Button onClick={handleCashOut} disabled={!hasBet || cashOutMutation.isPending || crashed} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-lg h-12 transition-all">
                  Cash Out @ {currentMultiplier.toFixed(2)}x
                  </Button>
                ) : (
                <Button onClick={startGame} disabled={!canPlay || crashGameMutation.isPending} className="w-full bg-gold-600 hover:bg-gold-700 text-black font-bold text-lg h-12">
                  {crashGameMutation.isPending ? "Starting..." : (hasBet ? "Waiting..." : "Place Bet")}
                  </Button>
                )}
                </CardContent>
              </Card>
          <Card className="bg-black/70 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-gold-400 flex items-center font-display"><History className="mr-2 h-5 w-5"/>History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {recentCrashes.map((result, i) => (
                  <Badge key={i} className={`font-mono ${result.isCrash ? "bg-red-500/20 text-red-300 border border-red-500/30" : "bg-green-500/20 text-green-300 border border-green-500/30"}`}>
                    {result.multiplier.toFixed(2)}x
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-[#0d122b] p-4 border-2 border-zinc-800 flex items-center justify-center">
            
            {/* Scattered Clouds Background */}
            <div className="absolute inset-0 z-0">
              {/* Top row clouds - fewer, larger clouds */}
              <img src={getCloudImage()} alt="Cloud" className="absolute w-16 h-auto opacity-70" style={{ top: '8%', left: '15%', animation: gameActive ? 'cloudFallDown1 4s ease-in-out infinite' : 'cloudDrift1 12s ease-in-out infinite' }} />
              <img src={getCloudImage()} alt="Cloud" className="absolute w-20 h-auto opacity-60" style={{ top: '12%', left: '65%', animation: gameActive ? 'cloudFallDown2 5s ease-in-out infinite' : 'cloudDrift2 15s ease-in-out infinite' }} />
              <img src={getCloudImage()} alt="Cloud" className="absolute w-14 h-auto opacity-75" style={{ top: '6%', left: '85%', animation: gameActive ? 'cloudFallDown3 4.5s ease-in-out infinite' : 'cloudDrift3 11s ease-in-out infinite' }} />
              
              {/* Middle row clouds */}
              <img src={getCloudImage()} alt="Cloud" className="absolute w-18 h-auto opacity-55" style={{ top: '28%', left: '8%', animation: gameActive ? 'cloudFallDown2 5.5s ease-in-out infinite' : 'cloudDrift2 13s ease-in-out infinite' }} />
              <img src={getCloudImage()} alt="Cloud" className="absolute w-22 h-auto opacity-50" style={{ top: '25%', left: '75%', animation: gameActive ? 'cloudFallDown1 6s ease-in-out infinite' : 'cloudDrift1 16s ease-in-out infinite' }} />
              
              {/* Lower row clouds */}
              <img src={getCloudImage()} alt="Cloud" className="absolute w-16 h-auto opacity-60" style={{ top: '52%', left: '5%', animation: gameActive ? 'cloudFallDown3 5s ease-in-out infinite' : 'cloudDrift3 14s ease-in-out infinite' }} />
              <img src={getCloudImage()} alt="Cloud" className="absolute w-20 h-auto opacity-55" style={{ top: '48%', left: '78%', animation: gameActive ? 'cloudFallDown1 6.5s ease-in-out infinite' : 'cloudDrift2 15s ease-in-out infinite' }} />
              
              {/* Bottom row clouds */}
              <img src={getCloudImage()} alt="Cloud" className="absolute w-18 h-auto opacity-65" style={{ top: '75%', left: '12%', animation: gameActive ? 'cloudFallDown2 4.5s ease-in-out infinite' : 'cloudDrift1 12s ease-in-out infinite' }} />
              <img src={getCloudImage()} alt="Cloud" className="absolute w-16 h-auto opacity-60" style={{ top: '78%', left: '70%', animation: gameActive ? 'cloudFallDown3 5.5s ease-in-out infinite' : 'cloudDrift3 13s ease-in-out infinite' }} />
            </div>

            <div className="flex items-center justify-center space-x-4 md:space-x-8 relative z-20">
              {showRocket && (
                <div className="relative">
                  <img 
                    src={getRocketImage()} 
                    alt="Rocket" 
                    className={`w-16 h-auto md:w-24 transition-all duration-300 ease-in-out relative z-10 ${
                      rocketState === 'idle' ? 'animate-bounce' : ''
                    }`}
                    style={{
                      transform: gameActive 
                        ? `translateY(-${(currentMultiplier - 1) * 50}px) scale(1.05)` 
                        : rocketState === 'idle' 
                          ? 'translateY(0px) scale(1)' 
                          : 'translateY(0px) scale(1)',
                      transformOrigin: 'bottom center',
                      animation: rocketState === 'idle' ? 'float 3s ease-in-out infinite' : undefined
                    }}
                  />
                  {gameActive && rocketState === 'launching' && (
                    <img 
                      src={getRocketEffectImage()} 
                      alt="Rocket Effect" 
                      className="absolute w-8 h-auto md:w-12 z-0"
                      style={{
                        bottom: '-8px',
                        left: '50%',
                        transform: `translateX(-50%) translateY(${(currentMultiplier - 1) * 50}px)`
                      }}
                    />
                  )}
                </div>
              )}
              <div className="text-center relative z-30">
                <h1 className={`font-mono text-7xl lg:text-9xl font-bold transition-colors ${
                  crashed ? "text-red-500" : "text-white crash-text-shadow"
                }`} style={{
                  textShadow: crashed ? 
                    '2px 2px 4px rgba(0, 0, 0, 0.8), -1px -1px 2px rgba(0, 0, 0, 0.6), 1px -1px 2px rgba(0, 0, 0, 0.6), -1px 1px 2px rgba(0, 0, 0, 0.6), 0 0 8px rgba(255, 0, 0, 0.3)' : 
                    undefined
                }}>
                  {gameActive ? `${currentMultiplier.toFixed(2)}x` : (crashed && crashPoint ? `${crashPoint.toFixed(2)}x` : '1.00x')}
                </h1>
                {crashed && <p className="text-red-500 text-2xl font-bold mt-4" style={{
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8), -1px -1px 2px rgba(0, 0, 0, 0.6), 1px -1px 2px rgba(0, 0, 0, 0.6), -1px 1px 2px rgba(0, 0, 0, 0.6), 0 0 8px rgba(255, 0, 0, 0.3)'
                }}>CRASHED</p>}
                {!gameActive && !crashed && !hasBet && <p className="text-zinc-200 text-lg font-bold mt-4 crash-text-shadow">Waiting for next round...</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <Card className="bg-black/70 border-zinc-700">
            <CardHeader>
            <CardTitle className="text-gold-400 flex items-center font-display"><Users className="mr-2 h-5 w-5"/>Current Bets</CardTitle>
            </CardHeader>
            <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-white">
              <div className="font-bold">Player</div>
              <div className="font-bold text-right">Bet</div>
              <div className="font-bold text-right hidden md:block">Multiplier</div>
              <div className="font-bold text-right">Payout</div>
              {playerBets.map((p, i) => (
                <React.Fragment key={i}>
                  <div>{p.username}</div>
                  <div className="text-right">{formatCurrency(p.bet)}</div>
                  <div className={`text-right hidden md:block ${p.cashout ? "text-green-400" : "text-gray-400"}`}>
                    {p.cashout ? `${p.cashout.toFixed(2)}x` : "-"}
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
    </GameLayout>
  );
}
