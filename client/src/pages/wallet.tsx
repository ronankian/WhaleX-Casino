import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Coins, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  RefreshCw,
  Upload,
  Download,
  TrendingUp,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatMoby } from "@/lib/game-utils";

export default function Wallet() {
  const [, setLocation] = useLocation();
  const { user, wallet, isAuthenticated, refreshWallet } = useAuth();
  const { toast } = useToast();

  const [depositAmount, setDepositAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState("gcash");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawCurrency, setWithdrawCurrency] = useState("coins");
  const [convertAmount, setConvertAmount] = useState(1);
  const [convertDirection, setConvertDirection] = useState<"moby-to-tokmoby" | "tokmoby-to-moby">("moby-to-tokmoby");

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
    const maxAmount = convertDirection === "moby-to-tokmoby" ? 
      parseFloat(wallet.mobyTokens) : 
      parseFloat(wallet.tokMoby) / 5000;
    
    if (convertAmount > 0 && convertAmount <= maxAmount) {
      convertMutation.mutate({
        amount: convertAmount,
        direction: convertDirection,
      });
    }
  };

  const stats = {
    balance: parseFloat(wallet.coins),
    moby: parseFloat(wallet.mobyTokens),
    tokMoby: parseFloat(wallet.tokMoby),
  };

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h2 className="text-4xl font-display font-bold text-gold-500 mb-2">Wallet</h2>
          <p className="text-gray-300">Manage your coins and $MOBY tokens</p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Wallet Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="glass-card border-gold-500/20 text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-gold-500 to-gold-600 rounded-full flex items-center justify-center">
                  <Coins className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">Coins</h3>
                <p className="text-3xl font-bold text-gold-500">{formatCurrency(stats.balance)}</p>
                <p className="text-sm text-gray-400">Available Balance</p>
              </CardContent>
            </Card>

            <Card className="glass-card border-gold-500/20 text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-ocean-500 to-ocean-600 rounded-full flex items-center justify-center">
                  <div className="text-2xl">🐋</div>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">$MOBY</h3>
                <p className="text-3xl font-bold text-ocean-400">{formatMoby(stats.moby)}</p>
                <p className="text-sm text-gray-400">Token Balance</p>
              </CardContent>
            </Card>

            <Card className="glass-card border-gold-500/20 text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <RefreshCw className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">TokMOBY</h3>
                <p className="text-3xl font-bold text-emerald-400">{formatCurrency(stats.tokMoby)}</p>
                <p className="text-sm text-gray-400">In-game Currency</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Wallet Actions */}
          <Tabs defaultValue="deposit" className="mb-8">
            <TabsList className="grid grid-cols-3 w-full bg-ocean-900 border-ocean-700">
              <TabsTrigger value="deposit" className="data-[state=active]:bg-gold-500 data-[state=active]:text-white">
                Deposit
              </TabsTrigger>
              <TabsTrigger value="withdraw" className="data-[state=active]:bg-gold-500 data-[state=active]:text-white">
                Withdraw
              </TabsTrigger>
              <TabsTrigger value="convert" className="data-[state=active]:bg-gold-500 data-[state=active]:text-white">
                Convert
              </TabsTrigger>
            </TabsList>

            <TabsContent value="deposit">
              <Card className="glass-card border-gold-500/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <ArrowUpCircle className="mr-2 h-5 w-5" />
                    Deposit Coins
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleDeposit} className="space-y-4">
                    <div>
                      <Label htmlFor="deposit-amount" className="text-white">Amount</Label>
                      <Input
                        id="deposit-amount"
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="bg-ocean-900/50 border-ocean-700 focus:border-gold-500 text-white"
                        placeholder="Enter amount"
                        min="1"
                        step="0.01"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="payment-method" className="text-white">Payment Method</Label>
                      <Select value={depositMethod} onValueChange={setDepositMethod}>
                        <SelectTrigger className="bg-ocean-900/50 border-ocean-700 focus:border-gold-500 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-ocean-900 border-ocean-700">
                          <SelectItem value="gcash">GCash</SelectItem>
                          <SelectItem value="paymaya">PayMaya</SelectItem>
                          <SelectItem value="bank">Bank Transfer</SelectItem>
                          <SelectItem value="crypto">Cryptocurrency</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button
                      type="submit"
                      disabled={depositMutation.isPending}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {depositMutation.isPending ? "Submitting..." : "Submit Deposit"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="withdraw">
              <Card className="glass-card border-gold-500/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <ArrowDownCircle className="mr-2 h-5 w-5" />
                    Withdraw Funds
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleWithdraw} className="space-y-4">
                    <div>
                      <Label htmlFor="withdraw-amount" className="text-white">Amount</Label>
                      <Input
                        id="withdraw-amount"
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="bg-ocean-900/50 border-ocean-700 focus:border-gold-500 text-white"
                        placeholder="Enter amount"
                        min="1"
                        step="0.01"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="withdraw-currency" className="text-white">Currency</Label>
                      <Select value={withdrawCurrency} onValueChange={setWithdrawCurrency}>
                        <SelectTrigger className="bg-ocean-900/50 border-ocean-700 focus:border-gold-500 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-ocean-900 border-ocean-700">
                          <SelectItem value="coins">Coins</SelectItem>
                          <SelectItem value="moby">$MOBY</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="text-sm text-gray-400">
                      Available: {withdrawCurrency === "coins" ? 
                        formatCurrency(stats.balance) : 
                        formatMoby(stats.moby)
                      } {withdrawCurrency === "coins" ? "Coins" : "$MOBY"}
                    </div>
                    
                    <Button
                      type="submit"
                      disabled={withdrawMutation.isPending}
                      className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {withdrawMutation.isPending ? "Submitting..." : "Submit Withdrawal"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="convert">
              <Card className="glass-card border-gold-500/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Convert Tokens
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="bg-ocean-900/50 border-ocean-700">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-ocean-400 mb-2">$MOBY</div>
                          <Input
                            type="number"
                            value={convertDirection === "moby-to-tokmoby" ? convertAmount : convertAmount * 5000}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setConvertAmount(convertDirection === "moby-to-tokmoby" ? val : val / 5000);
                            }}
                            className="text-center bg-transparent text-2xl font-bold border-none focus:ring-0 text-ocean-400"
                            step="0.0001"
                            min="0"
                          />
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-ocean-900/50 border-ocean-700">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-emerald-400 mb-2">TokMOBY</div>
                          <Input
                            type="number"
                            value={convertDirection === "tokmoby-to-moby" ? convertAmount * 5000 : convertAmount * 5000}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setConvertAmount(convertDirection === "tokmoby-to-moby" ? val / 5000 : val / 5000);
                            }}
                            className="text-center bg-transparent text-2xl font-bold border-none focus:ring-0 text-emerald-400"
                            step="1"
                            min="0"
                          />
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="flex justify-center">
                      <Select value={convertDirection} onValueChange={(value: any) => setConvertDirection(value)}>
                        <SelectTrigger className="w-64 bg-ocean-900/50 border-ocean-700 focus:border-gold-500 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-ocean-900 border-ocean-700">
                          <SelectItem value="moby-to-tokmoby">$MOBY → TokMOBY</SelectItem>
                          <SelectItem value="tokmoby-to-moby">TokMOBY → $MOBY</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button
                      onClick={handleConvert}
                      disabled={convertMutation.isPending || convertAmount <= 0}
                      className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-semibold"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      {convertMutation.isPending ? "Converting..." : "Convert"}
                    </Button>
                    
                    <div className="text-center text-sm text-gray-400">
                      Exchange Rate: 1 $MOBY = 5,000 TokMOBY
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

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
                  {deposits && deposits.length > 0 ? (
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
                  {withdrawals && withdrawals.length > 0 ? (
                    withdrawals.slice(0, 5).map((withdrawal: any) => (
                      <div key={withdrawal.id} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
                            <ArrowDownCircle className="h-4 w-4 text-white" />
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
