import React from 'react';
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { 
  Coins, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  RefreshCw,
  Upload,
  Download,
  TrendingUp,
  Clock,
  Copy
} from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { formatCurrency, formatMoby } from "../lib/game-utils";

function randomEthAddress() {
  const chars = '0123456789abcdefABCDEF';
  let addr = '0x';
  for (let i = 0; i < 40; i++) addr += chars[Math.floor(Math.random() * chars.length)];
  return addr;
}
const CRYPTO_ADDRESSES = {
  btc: randomEthAddress(),
  eth: "0x742d35Cc6A3c8a36BBBbBf9C52F1c5e7f53C0e5E",
  usdt: randomEthAddress()
};

export default function Wallet() {
  const [location, setLocation] = useLocation();
  const { user, wallet, isAuthenticated, refreshWallet } = useAuth();
  const { toast } = useToast();

  const [depositAmount, setDepositAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawCurrency, setWithdrawCurrency] = useState("coins");
  const [convertAmount, setConvertAmount] = useState(1);
  const [convertDirection, setConvertDirection] = useState<"moby-to-tokmoby" | "tokmoby-to-moby">("moby-to-tokmoby");
  const [activeAction, setActiveAction] = useState<'convert' | 'withdraw' | 'deposit'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      if (action === 'deposit' || action === 'withdraw' || action === 'convert') {
        return action;
      }
    }
    return 'convert';
  });
  const [convertCoin, setConvertCoin] = useState(5000);
  const [convertMoby, setConvertMoby] = useState(1);
  const [lastEdited, setLastEdited] = useState<'coin' | 'moby'>('coin');
  const [withdrawPlatform, setWithdrawPlatform] = useState('');
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState('');
  const [withdrawAccountName, setWithdrawAccountName] = useState('');
  const [withdrawFormAmount, setWithdrawFormAmount] = useState('');
  const [depositError, setDepositError] = useState('');
  const [depositReceipt, setDepositReceipt] = useState<File | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  const { data: deposits } = useQuery({
    queryKey: ["/api/deposits/" + user?.id],
    enabled: !!user?.id,
  });

  const { data: withdrawals } = useQuery({
    queryKey: ["/api/withdrawals/" + user?.id],
    enabled: !!user?.id,
  });

  const { data: gameHistory } = useQuery({
    queryKey: ["/api/games/history/" + user?.id],
    enabled: !!user?.id,
  });

  let totalWinnings = 0;
  if (Array.isArray(gameHistory)) {
    totalWinnings = gameHistory.reduce((sum, g) => sum + (g.isWin ? (g.payout - g.betAmount) : 0), 0);
  }

  const depositMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/deposits", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Deposit Submitted",
        description: "Your deposit request has been submitted for review",
      });
      setDepositAmount("");
      queryClient.invalidateQueries({ queryKey: ["/api/deposits/" + user?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Deposit Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/withdrawals", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal Submitted",
        description: "Your withdrawal request has been submitted for review",
      });
      setWithdrawAmount("");
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals/" + user?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Withdrawal Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const convertMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/wallet/" + user?.id + "/convert", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Conversion Successful",
        description: "Your tokens have been converted successfully",
      });
      refreshWallet();
    },
    onError: (error: any) => {
      toast({
        title: "Conversion Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!isAuthenticated || !user || !wallet) {
    return null;
  }

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (amount > 0) {
      depositMutation.mutate({
        userId: user.id,
        amount: amount.toString(),
        paymentMethod: depositMethod,
      });
    }
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    const maxAmount = withdrawCurrency === "coins" ? parseFloat(wallet.coins) : parseFloat(wallet.mobyTokens);
    
    if (amount > 0 && amount <= maxAmount) {
      withdrawMutation.mutate({
        userId: user.id,
        amount: amount.toString(),
        currency: withdrawCurrency,
      });
    }
  };

  const handleConvert = () => {
    let amount, direction;
    if (lastEdited === 'coin') {
      amount = convertCoin / 5000;
      direction = 'tokmoby-to-moby';
    } else {
      amount = convertMoby;
      direction = 'moby-to-tokmoby';
    }
      convertMutation.mutate({
      amount,
      direction,
      });
  };

  const stats = {
    balance: parseFloat(wallet.coins),
    moby: parseFloat(wallet.mobyTokens),
    tokMoby: parseFloat(wallet.mobyCoins),
  };

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-display font-bold text-gold-500 mb-2">Wallet</h2>
          <p className="text-gray-300">Manage your coins and $MOBY tokens</p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Casino-style Wallet Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="bg-black/80 border border-white/80 rounded-xl text-center">
              <CardContent className="flex flex-row items-center gap-4 p-6 text-center justify-center">
                <div className="rounded-full bg-black/80 p-1 text-4xl flex items-center justify-center">
                  <img src="/images/coin.png" alt="WhaleX Coin" className="w-12 h-12" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gold-400">{wallet ? parseFloat(wallet.coins).toLocaleString() : "0"}</div>
                  <div className="text-lg text-gray-300 font-semibold mb-2">WhaleX Coin</div>
                  <div className="text-xs text-gray-400 mt-1">Balance: {wallet ? parseFloat(wallet.coins).toLocaleString() : "0"}</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-black/80 border border-white/80 rounded-xl text-center">
              <CardContent className="flex flex-row items-center gap-4 p-6 text-center justify-center">
                <div className="rounded-full bg-black/80 p-1 text-4xl flex items-center justify-center">
                  <img src="/images/$MOBY.png" alt="$MOBY Token" className="w-12 h-12" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-cyan-300">{wallet ? parseFloat(wallet.mobyTokens).toLocaleString() : "0"}</div>
                  <div className="text-lg text-gray-300 font-semibold mb-2">$MOBY Token</div>
                  <div className="text-xs text-gray-400 mt-1">Balance: {wallet ? parseFloat(wallet.mobyTokens).toLocaleString() : "0"}</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-black/80 border border-white/80 rounded-xl text-center">
              <CardContent className="flex flex-row items-center gap-4 p-6 text-center justify-center">
                <div className="rounded-full bg-black/80 p-1 text-4xl flex items-center justify-center">
                  💰
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">{formatCurrency(totalWinnings)}</div>
                  <div className="text-lg text-gray-300 font-semibold mb-2">Total Winnings</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transactions Section Title */}
          <div className="max-w-6xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-6">Transactions</h3>
          </div>

          {/* Transaction Actions UI */}
          <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6 mb-10">
            {/* Action Buttons styled as Card */}
            <div className="bg-black/80 border border-white/80 rounded-xl text-center flex md:flex-col gap-2 md:col-span-1 p-4 h-fit md:max-w-xs md:w-full">
              <Button
                className={`w-full font-bold ${activeAction === 'convert' ? 'bg-yellow-400 text-black' : 'bg-black text-white border border-white/80'} mb-2`}
                style={{ borderRadius: '0.75rem' }}
                onClick={() => setActiveAction('convert')}
              >
                CONVERT
              </Button>
              <Button
                className={`w-full font-bold ${activeAction === 'withdraw' ? 'bg-yellow-400 text-black' : 'bg-black text-white border border-white/80'} mb-2`}
                style={{ borderRadius: '0.75rem' }}
                onClick={() => setActiveAction('withdraw')}
              >
                WITHDRAW
              </Button>
              <Button
                className={`w-full font-bold ${activeAction === 'deposit' ? 'bg-yellow-400 text-black' : 'bg-black text-white border border-white/80'}`}
                style={{ borderRadius: '0.75rem' }}
                onClick={() => setActiveAction('deposit')}
              >
                DEPOSIT
              </Button>
            </div>
            {/* Action Form styled as Card */}
            <div>
              {activeAction === 'convert' && (
                <Card className="bg-black/80 border border-white/80 rounded-xl text-center min-h-[400px]">
                  <CardHeader>
                    <CardTitle className="text-white">Convert</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Token Balances Row */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {/* WhaleX Coin */}
                      <div className="flex flex-col items-center">
                        <img src="/images/coin.png" alt="WhaleX Coin" className="w-12 h-12 mb-2" />
                        <div className="text-lg font-bold text-gold-400">WhaleX Coin</div>
                        <div className="text-white text-sm">{wallet ? parseFloat(wallet.coins).toLocaleString() : "0"}</div>
                      </div>
                      {/* $MOBY Token */}
                      <div className="flex flex-col items-center">
                        <img src="/images/$MOBY.png" alt="$MOBY Token" className="w-12 h-12 mb-2" />
                        <div className="text-lg font-bold text-cyan-300">$MOBY Token</div>
                        <div className="text-white text-sm">{wallet ? parseFloat(wallet.mobyTokens).toLocaleString() : "0"}</div>
                      </div>
                    </div>
                    {/* Two Amount Inputs with '=' between */}
                    <div className="grid grid-cols-5 gap-2 items-end mb-4">
                      <div className="col-span-2">
                        <Label htmlFor="convert-coin-amount">WhaleX Coin</Label>
                        <Input
                          id="convert-coin-amount"
                          type="number"
                          min={0}
                          value={convertCoin}
                          onChange={e => {
                            const value = Number(e.target.value);
                            setConvertCoin(value);
                            setConvertMoby(value / 5000);
                            setLastEdited('coin');
                          }}
                          className="mb-2"
                        />
                      </div>
                      <div className="col-span-1 flex justify-center items-center pb-4">
                        <span className="text-2xl font-bold text-white">=</span>
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="convert-moby-amount">$MOBY Token</Label>
                        <Input
                          id="convert-moby-amount"
                          type="number"
                          min={0}
                          value={convertMoby}
                          onChange={e => {
                            const value = Number(e.target.value);
                            setConvertMoby(value);
                            setConvertCoin(value * 5000);
                            setLastEdited('moby');
                          }}
                          className="mb-2"
                        />
                      </div>
                    </div>
                    {/* Conversion Direction Selector (hidden, direction is based on lastEdited) */}
                    <div className="mb-2">
                      <Button
                        className="w-full"
                        onClick={handleConvert}
                        disabled={convertMutation.isPending}
                      >
                        {lastEdited === 'coin' ? 'Convert to $MOBY Token' : 'Convert to WhaleX Coin'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              {activeAction === 'withdraw' && (
                <Card className="bg-black/80 border border-white/80 rounded-xl text-center min-h-[400px]">
                  <CardHeader>
                    <CardTitle className="text-white">Withdraw WhaleX Coin</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 p-4 border border-white/80 rounded-lg bg-black/80">
                      <div className="mb-2 text-lg">
                        <span className="text-gray-300">Current Balance: </span>
                        <span className="text-green-400 font-bold">{wallet ? parseFloat(wallet.coins).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : "0"} coins</span>
                      </div>
                      <div className="mb-4 text-sm text-gray-400">
                        Available to Withdraw: {wallet ? (parseFloat(wallet.coins)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : "0"} coins
                      </div>
                      <Label>Withdrawal Platform *</Label>
                      <Select value={withdrawPlatform} onValueChange={setWithdrawPlatform}>
                        <SelectTrigger className="w-full mb-2">
                          <SelectValue placeholder="Select withdrawal platform" />
                        </SelectTrigger>
                        <SelectContent className="bg-black">
                          <SelectItem value="gcash" className="text-white">GCash</SelectItem>
                          <SelectItem value="maya" className="text-white">Maya (PayMaya)</SelectItem>
                          <SelectItem value="bank" className="text-white">Bank Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                      <Label>Account Number *</Label>
                      <Input className="mb-2" value={withdrawAccountNumber} onChange={e => setWithdrawAccountNumber(e.target.value)} placeholder="Enter account details" />
                      <Label>Account Name *</Label>
                      <Input className="mb-2" value={withdrawAccountName} onChange={e => setWithdrawAccountName(e.target.value)} placeholder="Enter the full name on the account" />
                      <Label>Withdrawal Amount (Coins)</Label>
                      <Input className="mb-2" value={withdrawFormAmount} onChange={e => setWithdrawFormAmount(e.target.value)} placeholder="Enter amount to withdraw" />
                      <div className="flex gap-2 mb-2">
                        {[0.25, 0.5, 0.75, 1].map(pct => (
                          <Button key={pct} type="button" variant="outline" onClick={() => setWithdrawFormAmount(wallet ? (parseFloat(wallet.coins) * pct).toFixed(2) : "0") }>
                            {pct === 1 ? "Max" : `${pct * 100}%`}
                          </Button>
                        ))}
                      </div>
                      <Button
                        className="w-full bg-yellow-400 text-black font-bold"
                        onClick={() => {
                          const amount = parseFloat(withdrawFormAmount);
                          if (amount > 0 && amount <= parseFloat(wallet.coins)) {
                            // Optimistically update wallet balance
                            // (optional: you can skip this if you want to wait for backend)
                            // Submit withdrawal request
                            withdrawMutation.mutate({
                              userId: user.id,
                              amount: amount.toString(),
                              currency: "coins",
                              platform: withdrawPlatform,
                              accountNumber: withdrawAccountNumber,
                              accountName: withdrawAccountName,
                            });
                          }
                        }}
                        disabled={withdrawMutation.isPending}
                      >
                        Request Withdrawal
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              {activeAction === 'deposit' && (
                <Card className="bg-black/80 border border-white/80 rounded-xl text-center min-h-[400px]">
                  <CardHeader>
                    <CardTitle className="text-white">Deposit PHP</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label>Amount (PHP)</Label>
                        <Input
                          type="number"
                          min={1}
                          value={depositAmount}
                          onChange={e => setDepositAmount(e.target.value)}
                          placeholder="Enter amount in PHP"
                          className="mb-1"
                        />
                        <div className="text-xs text-gray-400">1 PHP = 1 coin</div>
                      </div>
                      <div>
                        <Label>Payment Method</Label>
                        <Select value={depositMethod} onValueChange={setDepositMethod}>
                          <SelectTrigger className="w-full mb-1">
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                          <SelectContent className="bg-black">
                            <SelectItem value="gcash" className="text-white">GCash</SelectItem>
                            <SelectItem value="maya" className="text-white">Maya (PayMaya)</SelectItem>
                            <SelectItem value="bank" className="text-white">Bank Transfer</SelectItem>
                            <SelectItem value="credit" className="text-white">Credit Card</SelectItem>
                            <SelectItem value="btc" className="text-white">Bitcoin (BTC)</SelectItem>
                            <SelectItem value="eth" className="text-white">Ethereum (ETH)</SelectItem>
                            <SelectItem value="usdt" className="text-white">Tether (USDT)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Upload Payment Receipt *</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file && file.size > 5 * 1024 * 1024) {
                              setDepositError("File size must be less than 5MB");
                              setDepositReceipt(null);
                            } else {
                              setDepositError("");
                              setDepositReceipt(file || null);
                            }
                          }}
                          className="mb-1"
                        />
                        <div className="text-xs text-gray-400">Upload screenshot or photo of your payment confirmation (Max 5MB)</div>
                        {depositError && <div className="text-xs text-red-500">{depositError}</div>}
                      </div>
                      <Button
                        className="w-full bg-yellow-400 text-black font-bold"
                        onClick={async () => {
                          if (!depositAmount || !depositMethod) {
                            setDepositError("Amount and payment method are required.");
                            return;
                          }
                          await depositMutation.mutateAsync({
                            userId: user.id,
                            amount: depositAmount,
                            paymentMethod: depositMethod,
                          });
                        }}
                        disabled={depositMutation.isPending}
                      >
                        Submit Deposit Request
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Transaction History */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Deposits */}
            <Card className="glass-card border-gold-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Recent Deposits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(deposits) && deposits.length > 0 ? (
                    deposits.slice(0, 5).map((deposit: any) => (
                      <div key={deposit.id} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                            <ArrowUpCircle className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{deposit.paymentMethod.toUpperCase()}</p>
                            <p className="text-sm text-gray-400">
                              {new Date(deposit.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 font-semibold">
                            +{formatCurrency(deposit.amount)}
                          </p>
                          <Badge
                            variant={deposit.status === "approved" ? "default" : 
                                   deposit.status === "rejected" ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {deposit.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No deposits yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Withdrawals */}
            <Card className="glass-card border-gold-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <ArrowDownCircle className="mr-2 h-5 w-5" />
                  Recent Withdrawals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(withdrawals) && withdrawals.length > 0 ? (
                    [...withdrawals]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .slice(0, 5)
                      .map((withdrawal: any) => (
                      <div key={withdrawal.id} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-b-0">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-black/80">
                              {withdrawal.currency === 'coins' ? (
                                <img src="/images/coin.png" alt="WhaleX Coin" className="w-8 h-8" />
                              ) : (
                            <ArrowDownCircle className="h-4 w-4 text-white" />
                              )}
                          </div>
                          <div>
                            <p className="font-medium text-white">{withdrawal.currency.toUpperCase()}</p>
                            <p className="text-sm text-gray-400">
                              {new Date(withdrawal.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-red-400 font-semibold">
                            -{withdrawal.currency === "coins" ? 
                              formatCurrency(withdrawal.amount) : 
                              formatMoby(withdrawal.amount)
                            }
                          </p>
                          <Badge
                            variant={withdrawal.status === "approved" ? "default" : 
                                   withdrawal.status === "rejected" ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {withdrawal.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No withdrawals yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
