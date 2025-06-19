import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Fish } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

export default function LoginModal({ isOpen, onClose, onSwitchToRegister }: LoginModalProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(username, password);
      onClose();
      toast({
        title: "Welcome back!",
        description: "Successfully logged in to WhaleX",
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-gold-500/20 max-w-md">
        <DialogHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 whale-gradient rounded-full flex items-center justify-center">
            <Fish className="text-2xl text-gold-500" />
          </div>
          <DialogTitle className="text-2xl font-display font-bold text-gold-500">
            Welcome Back
          </DialogTitle>
          <p className="text-gray-300">Sign in to continue your adventure</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username" className="text-white">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-ocean-900/50 border-ocean-700 focus:border-gold-500 text-white"
              placeholder="Enter username"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="password" className="text-white">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-ocean-900/50 border-ocean-700 focus:border-gold-500 text-white"
              placeholder="Enter password"
              required
            />
          </div>
          
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-semibold"
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </Button>
        </form>

        <div className="text-center mt-6">
          <p className="text-gray-300">
            Don't have an account?{" "}
            <button
              onClick={onSwitchToRegister}
              className="text-gold-500 hover:text-gold-400 font-medium"
            >
              Sign up
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
