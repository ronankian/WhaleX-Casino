import React from "react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Coins,
  Gamepad2,
  Trophy,
  TrendingUp,
  Dices,
  Crown,
  Spade,
  BarChart3,
  Gem,
  Circle,
  Target,
  ArrowLeftRight
} from "lucide-react";
import { formatCurrency, formatMoby } from "../lib/game-utils";
import GameLayout from "../components/games/game-layout";

export default function Casino() {
  const [, setLocation] = useLocation();
  const { user, wallet, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  const { data: gameHistory } = useQuery({
    queryKey: ["/api/games/history/" + user?.id],
    enabled: !!user?.id,
  });

  if (!isAuthenticated || !user || !wallet) {
    return null;
  }

  const stats = {
    balance: parseFloat(wallet.coins),
    moby: parseFloat(wallet.mobyTokens),
    mobyCoins: parseFloat(wallet.mobyCoins),
    gamesPlayed: Array.isArray(gameHistory) ? gameHistory.length : 0,
    winRate: Array.isArray(gameHistory) && gameHistory.length ?
      Math.round((gameHistory.filter(g => g.isWin).length / gameHistory.length) * 100) : 0
  };

  return (
    <div className="min-h-screen pb-8">
      <div className="container mx-auto px-4">
        {/* Featured Games and Conversion Info */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Game Cards: 3 columns on large screens */}
          <div className="lg:col-span-3 pt-10">
            <GameLayout title="✨Featured Games" description="Try your luck and skill in our most popular casino games!">{null}</GameLayout>
          </div>
          {/* Conversion Info Card: 1 column on the right */}
          <div className="lg:col-span-1 flex flex-col gap-6 pt-20">
            <div className="bg-black/80 border border-white/80 rounded-xl flex flex-col justify-center items-center p-8 text-center" style={{ width: '100%' }}>
              <div className="text-3xl font-bold text-gold-400 mb-2">Conversion Rate</div>
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="rounded-full bg-black/80 p-1 shadow-[0_0_8px_3px_rgba(255,215,0,0.8)]">
                  <img src="/images/coin.png" alt="WhaleX Coin" className="w-12 h-12" />
                </div>
                <ArrowLeftRight className="w-8 h-8 text-gold-400" />
                <div className="rounded-full bg-black/80 p-1 shadow-[0_0_8px_3px_rgba(0,255,255,0.8)]">
                  <img src="/images/$MOBY.png" alt="$MOBY Token" className="w-12 h-12" />
                </div>
        </div>
              <div className="text-2xl font-semibold text-ocean-400 mb-4">5,000 WhaleX Coin = 1 $MOBY Token</div>
              <div className="text-gray-300 text-base mb-2">
                Exchange your WhaleX Coins for $MOBY tokens and join the crypto action! $MOBY tokens can be used for exclusive features, rewards, and more.
              </div>
            </div>
            {/* Top Betters Card */}
            <div className="bg-black/80 border border-white/80 rounded-xl flex flex-col justify-center items-center p-6 text-center" style={{ width: '100%' }}>
                <div className="text-xl font-bold text-gold-400 mb-5 text-center">Top Betters</div>
              <ul className="space-y-2 w-full">
                  <li className="flex justify-between items-center text-white/90">
                    <span className="font-semibold">CryptoWhale99</span>
                  <span className="text-green-400 font-bold">$12,500</span>
                  </li>
                  <li className="flex justify-between items-center text-white/90">
                    <span className="font-semibold">LuckyDiver</span>
                  <span className="text-green-400 font-bold">$9,800</span>
                  </li>
                  <li className="flex justify-between items-center text-white/90">
                    <span className="font-semibold">OceanKing</span>
                  <span className="text-green-400 font-bold">$8,420</span>
                  </li>
                  <li className="flex justify-between items-center text-white/90">
                    <span className="font-semibold">BetMasterX</span>
                  <span className="text-green-400 font-bold">$7,300</span>
                  </li>
                  <li className="flex justify-between items-center text-white/90">
                    <span className="font-semibold">DeepSeaPro</span>
                  <span className="text-green-400 font-bold">$6,750</span>
                  </li>
                  <li className="flex justify-between items-center text-white/90">
                    <span className="font-semibold">SharkByte</span>
                  <span className="text-green-400 font-bold">$6,200</span>
                  </li>
                  <li className="flex justify-between items-center text-white/90">
                    <span className="font-semibold">SpinMaster</span>
                  <span className="text-green-400 font-bold">$5,950</span>
                  </li>
                  <li className="flex justify-between items-center text-white/90">
                    <span className="font-semibold">AquaAce</span>
                  <span className="text-green-400 font-bold">$5,700</span>
                  </li>
                  <li className="flex justify-between items-center text-white/90">
                    <span className="font-semibold">ReelRider</span>
                  <span className="text-green-400 font-bold">$5,420</span>
                  </li>
                  <li className="flex justify-between items-center text-white/90">
                    <span className="font-semibold">LuckySplash</span>
                  <span className="text-green-400 font-bold">$5,100</span>
                  </li>
                </ul>
            </div>
        </div>
        </div>

        {/* Recent Activity */}
        {Array.isArray(gameHistory) && gameHistory.length > 0 && (
          <Card className="glass-card border-gold-500/20">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-white">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(Array.isArray(gameHistory) ? gameHistory.slice(0, 5) : []).map((game) => (
                  <div key={game.id} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        game.isWin ? "bg-gradient-to-r from-green-500 to-green-600" : "bg-gradient-to-r from-red-500 to-red-600"
                      }`}>
                        {game.isWin ? (
                          <Trophy className="h-4 w-4 text-white" />
                        ) : (
                          <TrendingUp className="h-4 w-4 text-white rotate-180" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          Played {game.gameName}
                        </p>
                        <p className="text-sm text-gray-400">
                          {new Date(game.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className={`text-lg font-bold ${
                      game.isWin ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {game.isWin ? '+' : '-'} {formatCurrency(game.payout - game.betAmount)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 