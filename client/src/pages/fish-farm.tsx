import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Fish, Coins, Zap, TrendingUp } from "lucide-react";

export default function FishFarm() {
  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gold-500 to-gold-600 bg-clip-text text-transparent">
          Fish Farm
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Dive into our underwater world and collect rare fish to earn WhaleX Coins and $MOBY tokens
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        <Card className="glass-card border-gold-500/20">
          <CardHeader>
            <CardTitle className="flex items-center text-gold-400">
              <Fish className="mr-2 h-5 w-5" />
              Fishing Rod
            </CardTitle>
            <CardDescription>Basic fishing equipment to start your collection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl font-bold text-white">100</span>
              <img src="/images/coin.png" alt="WhaleX Coin" className="w-6 h-6" />
            </div>
            <Button className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700">
              Purchase
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card border-gold-500/20">
          <CardHeader>
            <CardTitle className="flex items-center text-gold-400">
              <Zap className="mr-2 h-5 w-5" />
              Advanced Bait
            </CardTitle>
            <CardDescription>Attract rare and legendary fish</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl font-bold text-white">500</span>
              <img src="/images/coin.png" alt="WhaleX Coin" className="w-6 h-6" />
            </div>
            <Button className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700">
              Purchase
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card border-gold-500/20">
          <CardHeader>
            <CardTitle className="flex items-center text-gold-400">
              <TrendingUp className="mr-2 h-5 w-5" />
              Premium Net
            </CardTitle>
            <CardDescription>Catch multiple fish at once</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl font-bold text-white">1000</span>
              <img src="/images/coin.png" alt="WhaleX Coin" className="w-6 h-6" />
            </div>
            <Button className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700">
              Purchase
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <h2 className="text-3xl font-bold mb-6 text-white">Coming Soon</h2>
        <p className="text-gray-300 mb-8">
          The Fish Farm feature is currently under development. Stay tuned for updates!
        </p>
        <Button 
          onClick={() => window.location.href = "/dashboard"}
          className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700"
        >
          Back to Casino
        </Button>
      </div>
    </div>
  );
} 