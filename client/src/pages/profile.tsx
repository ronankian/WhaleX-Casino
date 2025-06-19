import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Settings, 
  Shield, 
  LogOut,
  Edit,
  Save,
  Calendar,
  Trophy,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatMoby } from "@/lib/game-utils";

export default function Profile() {
  const [, setLocation] = useLocation();
  const { user, wallet, isAuthenticated, logout } = useAuth();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.username);
      setEmail(user.email);
    }
  }, [user]);

  if (!isAuthenticated || !user || !wallet) {
    return null;
  }

  const handleSave = () => {
    // In a real app, this would make an API call to update user info
    toast({
      title: "Profile Updated",
      description: "Your profile information has been updated successfully",
    });
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    setLocation("/");
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
  };

  const getUserLevel = (coins: number): { level: number; title: string; progress: number } => {
    const levels = [
      { min: 0, level: 1, title: "Guppy" },
      { min: 1000, level: 2, title: "Angelfish" },
      { min: 5000, level: 3, title: "Barracuda" },
      { min: 15000, level: 4, title: "Shark" },
      { min: 50000, level: 5, title: "Whale" },
      { min: 100000, level: 6, title: "Kraken" },
    ];

    for (let i = levels.length - 1; i >= 0; i--) {
      if (coins >= levels[i].min) {
        const nextLevel = levels[i + 1];
        const progress = nextLevel ? 
          ((coins - levels[i].min) / (nextLevel.min - levels[i].min)) * 100 : 100;
        return { 
          level: levels[i].level, 
          title: levels[i].title, 
          progress: Math.min(100, progress) 
        };
      }
    }
    
    return { level: 1, title: "Guppy", progress: (coins / 1000) * 100 };
  };

  const stats = {
    balance: parseFloat(wallet.coins),
    moby: parseFloat(wallet.mobyTokens),
    tokMoby: parseFloat(wallet.mobyCoins),
  };

  const userLevel = getUserLevel(stats.balance);
  const memberSince = new Date(user.joinDate).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  });

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h2 className="text-4xl font-display font-bold text-gold-500 mb-2">Profile</h2>
          <p className="text-gray-300">Manage your account settings and view your progress</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Profile Overview */}
          <Card className="glass-card border-gold-500/20">
            <CardContent className="p-8 text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-gold-500 to-gold-600 rounded-full flex items-center justify-center">
                <User className="h-12 w-12 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">{user.username}</h3>
              <p className="text-gray-400 mb-4">{user.email}</p>
              
              <div className="flex justify-center items-center space-x-6 text-sm">
                <div className="text-center">
                  <Badge variant="outline" className="bg-gold-500/20 text-gold-500 border-gold-500 mb-1">
                    Level {userLevel.level}
                  </Badge>
                  <div className="text-gray-400">{userLevel.title}</div>
                </div>
                <div className="text-center">
                  <div className="text-emerald-400 font-semibold flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {memberSince}
                  </div>
                  <div className="text-gray-400">Member Since</div>
                </div>
              </div>

              {/* Level Progress */}
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Progress to Next Level</span>
                  <span className="text-gold-500">{userLevel.progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-ocean-900 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-gold-500 to-gold-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${userLevel.progress}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass-card border-gold-500/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Total Balance</CardTitle>
                <Trophy className="h-4 w-4 text-gold-500" />
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
                <CardTitle className="text-sm font-medium text-gray-300">$MOBY Earned</CardTitle>
                <div className="text-ocean-400">🐋</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-ocean-400">
                  {formatMoby(stats.moby)}
                </div>
                <p className="text-xs text-gray-400">Total Tokens</p>
              </CardContent>
            </Card>

            <Card className="glass-card border-gold-500/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">User Level</CardTitle>
                <Badge variant="outline" className="bg-gold-500/20 text-gold-500 border-gold-500">
                  {userLevel.level}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gold-500">
                  {userLevel.title}
                </div>
                <p className="text-xs text-gray-400">Current Rank</p>
              </CardContent>
            </Card>
          </div>

          {/* Account Settings */}
          <Card className="glass-card border-gold-500/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="display-name" className="text-white">Display Name</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="display-name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      disabled={!isEditing}
                      className="bg-ocean-900/50 border-ocean-700 focus:border-gold-500 text-white"
                    />
                    {!isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="bg-ocean-700 hover:bg-ocean-600 border-ocean-600 text-white"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!isEditing}
                    className="bg-ocean-900/50 border-ocean-700 focus:border-gold-500 text-white"
                  />
                </div>
                
                {isEditing && (
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleSave}
                      className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setDisplayName(user.username);
                        setEmail(user.email);
                      }}
                      className="bg-ocean-700 hover:bg-ocean-600 border-ocean-600 text-white"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="glass-card border-gold-500/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  className="w-full justify-between p-4 bg-ocean-900/50 hover:bg-ocean-800/50 text-white"
                >
                  <div className="text-left">
                    <p className="font-medium">Change Password</p>
                    <p className="text-sm text-gray-400">Update your account password</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full justify-between p-4 bg-ocean-900/50 hover:bg-ocean-800/50 text-white"
                >
                  <div className="text-left">
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-400">Add extra security to your account</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="destructive" className="text-xs">
                      Disabled
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Logout */}
          <div className="text-center">
            <Button
              onClick={handleLogout}
              variant="destructive"
              size="lg"
              className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold"
            >
              <LogOut className="mr-2 h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
