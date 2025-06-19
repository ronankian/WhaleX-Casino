import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import GameLayout from "@/components/games/game-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateClientSeed, formatCurrency, SLOT_SYMBOLS } from "@/lib/game-utils";

export default function SlotsGame() {
  const [, setLocation] = useLocation();
  const { user, wallet, isAuthenticated, refreshWallet } = useAuth();
  const { toast } = useToast();

  const [betPerLine, setBetPerLine] = useState(1);
  const [lines, setLines] = useState(25);
  const [reels, setReels] = useState(["🐟", "👑", "💎", "🚢", "⚓"]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastWin, setLastWin] = useState(0);
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
        gameType: "slots",
        betAmount: totalBet,
        gameData,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setReels(data.result.reels.map((symbol: string) => {
        const symbolData = SLOT_SYMBOLS.find(s => s.name === symbol);
        return symbolData?.icon || "⚓";
      }));
      setLastWin(parseFloat(data.gameResult.payout));
      refreshWallet();
      
      if (data.gameResult.isWin) {
        toast({
          title: "🎉 Slot Win!",
          description: `${data.result.matches} matching symbols! Won ${formatCurrency(data.gameResult.payout)} coins`,
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

  const totalBet = betPerLine * lines;
  const canPlay = totalBet <= parseFloat(wallet.coins) && totalBet > 0;

  const handleSpin = () => {
    if (!canPlay || isSpinning) return;
    
    setIsSpinning(true);
    setLastWin(0);
    
    playGameMutation.mutate({
      betPerLine,
      lines,
      clientSeed,
      nonce: Date.now(),
    });
  };

  return (
    <GameLayout title="Slot 777" description="Classic slot machine with ocean treasures">
      <div className="max-w-4xl mx-auto">
        {/* Slot Machine */}
        <Card className="glass-card border-gold-500/20 mb-8">
          <CardContent className="p-8 text-center">
            <div className="mb-8">
              {/* Slot Reels */}
              <div className="flex justify-center space-x-4 mb-6">
                {reels.map((symbol, index) => (
                  <div
                    key={index}
                    className={`slot-reel w-20 h-24 bg-ocean-900 border-2 border-gold-500 rounded-lg flex items-center justify-center text-4xl ${
                      isSpinning ? "spinning" : ""
                    }`}
                  >
                    {symbol}
                  </div>
                ))}
              </div>

              {/* Game Info */}
              <div className="text-sm text-gray-400 mb-4">
                Paylines: {lines} | Last Win: 
                <span className="text-gold-500 ml-1">{formatCurrency(lastWin)}</span>
              </div>
            </div>

            {/* Betting Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-white">Bet per Line</label>
                <Select value={betPerLine.toString()} onValueChange={(value) => setBetPerLine(parseFloat(value))}>
                  <SelectTrigger className="bg-ocean-900 border-ocean-700 focus:border-gold-500 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-ocean-900 border-ocean-700">
                    <SelectItem value="0.25">0.25</SelectItem>
                    <SelectItem value="0.5">0.50</SelectItem>
                    <SelectItem value="1">1.00</SelectItem>
                    <SelectItem value="2">2.00</SelectItem>
                    <SelectItem value="5">5.00</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-white">Lines</label>
                <Select value={lines.toString()} onValueChange={(value) => setLines(parseInt(value))}>
                  <SelectTrigger className="bg-ocean-900 border-ocean-700 focus:border-gold-500 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-ocean-900 border-ocean-700">
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-white">Total Bet</label>
                <div className="px-4 py-2 bg-ocean-900/50 border border-ocean-700 rounded-lg text-gold-500 font-semibold h-10 flex items-center">
                  {formatCurrency(totalBet)}
                </div>
              </div>
            </div>

            {/* Spin Button */}
            <Button
              onClick={handleSpin}
              disabled={!canPlay || isSpinning}
              className="px-12 py-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-semibold text-lg transform hover:scale-105 transition-all duration-300 animate-glow"
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

            {!canPlay && totalBet > parseFloat(wallet.coins) && (
              <p className="text-red-400 text-sm mt-2">
                Insufficient balance
              </p>
            )}
          </CardContent>
        </Card>

        {/* Paytable */}
        <Card className="glass-card border-gold-500/20">
          <CardHeader>
            <CardTitle className="text-white">Paytable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {SLOT_SYMBOLS.map((symbol) => (
                <div key={symbol.name} className="text-center p-3 bg-ocean-900/50 rounded-lg">
                  <div className="text-2xl mb-2">{symbol.icon}</div>
                  <div className="text-sm text-gray-400 capitalize">{symbol.name}</div>
                  <div className="text-sm text-gray-400">5x = {symbol.multiplier}x</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </GameLayout>
  );
}
