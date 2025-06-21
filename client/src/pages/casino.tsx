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
  Target
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
    <div className="min-h-screen pt-20 pb-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h2 className="text-4xl font-display font-bold text-gold-500 mb-2">
            Welcome Back, {user.username}
          </h2>
          <p className="text-gray-300">Ready to make some waves?</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="glass-card border-gold-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Balance</CardTitle>
              <Coins className="h-4 w-4 text-gold-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gold-500">
                {formatCurrency(stats.balance)}
              </div>
              <p className="text-xs text-gray-400">Coins</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-gold-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">$MOBY</CardTitle>
              <div className="text-ocean-400">🐋</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-ocean-400">
                {formatMoby(stats.moby)}
              </div>
              <p className="text-xs text-gray-400">
                ≈ {formatCurrency(stats.moby * 5000)} Coins
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-gold-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Games Played</CardTitle>
              <Gamepad2 className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">{stats.gamesPlayed}</div>
              <p className="text-xs text-gray-400">Total</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-gold-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Win Rate</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{stats.winRate}%</div>
              <p className="text-xs text-gray-400">All time</p>
            </CardContent>
          </Card>
        </div>

        {/* Featured Games */}
        <div className="mb-12">
          <h3 className="text-2xl font-display font-bold text-white mb-6">Featured Games</h3>
          <GameLayout />
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