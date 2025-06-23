import { useState, useEffect } from 'react';
import { useLocation } from "wouter";
import { useAuth } from "../../hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../../lib/queryClient";
import GameLayout from "../../components/games/game-layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { useToast } from "../../hooks/use-toast";
import { getGameId, formatCurrency, BET_AMOUNTS } from "../../lib/game-utils";
import { Circle, RotateCw } from "lucide-react";

const ROULETTE_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

const getNumberColor = (num: number) => {
  if (num === 0) return 'bg-green-600';
  return RED_NUMBERS.includes(num) ? 'bg-red-600' : 'bg-black';
};

export default function RouletteGame() {
  const [, setLocation] = useLocation();
  const { user, wallet, isAuthenticated, refreshWallet } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [betAmount, setBetAmount] = useState(10);
  const [betType, setBetType] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ number: number; payout: number } | null>(null);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) setLocation("/");
  }, [isAuthenticated, setLocation]);

  const playGameMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/games/play", {
        userId: user?.id,
        gameType: "roulette",
        betAmount,
        gameData: { betType },
      });
      return response.json();
    },
    onSuccess: (data) => {
      const { winningNumber, payout } = data.gameResult;
      const numberIndex = ROULETTE_NUMBERS.indexOf(winningNumber);
      const spins = 4; // full rotations
      const anglePerSegment = 360 / ROULETTE_NUMBERS.length;
      const finalRotation = (spins * 360) + (numberIndex * anglePerSegment) * -1;

      setRotation(finalRotation);
      
      setTimeout(() => {
        setResult({ number: winningNumber, payout });
        setSpinning(false);
      refreshWallet();
        if (payout > 0) {
            toast({ title: "You Won!", description: `The ball landed on ${winningNumber}. You won ${formatCurrency(payout)}!` });
      } else {
            toast({ title: "You Lost", description: `The ball landed on ${winningNumber}.`, variant: "destructive" });
      }
      }, 5000); // Corresponds to the animation duration
    },
    onError: (error: any) => {
      toast({ title: "Game Error", description: error.message, variant: "destructive" });
      setSpinning(false);
    },
  });

  const handlePlaceBet = (type: string) => {
    if (spinning) return;
    setBetType(type);
    setResult(null);
  };

  const handleSpin = () => {
      if (!betType || spinning) return;
      setSpinning(true);
      setRotation(prev => prev + 360 * 2); // Initial spin before result
      playGameMutation.mutate();
  }

  const canPlay = wallet && betAmount <= parseFloat(wallet.coins) && betAmount > 0 && !spinning && !!betType;

  return (
    <GameLayout title="Roulette" description="Place your bet and spin the wheel.">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex items-center justify-center">
                {/* Wheel */}
                <div className="relative w-96 h-96">
                    <div className="absolute inset-0 border-8 border-yellow-700 rounded-full" />
                    <div 
                        className="absolute inset-2 bg-gray-800 rounded-full transition-transform duration-[5000ms] ease-out"
                        style={{ transform: `rotate(${rotation}deg)` }}
                    >
                        {ROULETTE_NUMBERS.map((num, i) => (
                            <div 
                                key={num} 
                                className={`absolute w-1/2 h-1/2 top-0 left-1/4 origin-bottom-center ${getNumberColor(num)}`}
                                style={{ transform: `rotate(${i * (360 / ROULETTE_NUMBERS.length)}deg)`}}
                            >
                                <span className="absolute top-2 left-1/2 -translate-x-1/2 text-white text-sm">{num}</span>
                            </div>
                        ))}
                    </div>
                     <div className="absolute top-1/2 left-1/2 w-16 h-16 -translate-x-1/2 -translate-y-1/2 bg-yellow-800 rounded-full border-4 border-yellow-600"/>
                     <div className="absolute top-[-10px] left-1/2 w-0 h-0 -translate-x-1/2 border-l-8 border-r-8 border-b-16 border-l-transparent border-r-transparent border-b-white"/>
                </div>
            </div>
            <div>
                <Card className="bg-gray-900/50 border-gray-700 text-white">
                    <CardHeader><CardTitle>Place Your Bet</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm">Bet Amount</label>
                            <Input type="number" value={betAmount} onChange={e => setBetAmount(Number(e.target.value))} className="bg-gray-800 border-gray-600" disabled={spinning} />
                    </div>
                        <div className="grid grid-cols-3 gap-2">
                           <Button onClick={() => handlePlaceBet('red')} variant={betType === 'red' ? 'default' : 'outline'} disabled={spinning}>Red</Button>
                           <Button onClick={() => handlePlaceBet('black')} variant={betType === 'black' ? 'default' : 'outline'} disabled={spinning}>Black</Button>
                           <Button onClick={() => handlePlaceBet('even')} variant={betType === 'even' ? 'default' : 'outline'} disabled={spinning}>Even</Button>
                           <Button onClick={() => handlePlaceBet('odd')} variant={betType === 'odd' ? 'default' : 'outline'} disabled={spinning}>Odd</Button>
                           <Button onClick={() => handlePlaceBet('1-18')} variant={betType === '1-18' ? 'default' : 'outline'} disabled={spinning}>1-18</Button>
                           <Button onClick={() => handlePlaceBet('19-36')} variant={betType === '19-36' ? 'default' : 'outline'} disabled={spinning}>19-36</Button>
                    </div>
                         <Button onClick={handleSpin} disabled={!canPlay} className="w-full bg-green-600 hover:bg-green-700">Spin</Button>
                         {result && (
                             <div className="text-center pt-4">
                                 <p>Landed on: <span className={`font-bold ${getNumberColor(result.number)} px-2 rounded`}>{result.number}</span></p>
                                 <p>You {result.payout > 0 ? `won ${formatCurrency(result.payout)}` : 'lost'}</p>
                  </div>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </GameLayout>
  );
}