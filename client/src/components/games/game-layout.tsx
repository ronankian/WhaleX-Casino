import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface GameLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
}

export default function GameLayout({ title, description, children }: GameLayoutProps) {
  const { wallet } = useAuth();

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container mx-auto px-4">
        {/* Game Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              className="flex items-center space-x-2 text-gold-500 hover:text-gold-400 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
          </Link>

          <div className="glass-card px-6 py-3 rounded-lg">
            <span className="text-gold-500 font-semibold">
              {wallet ? parseFloat(wallet.coins).toLocaleString() : "0"}
            </span>
            <span className="text-gray-300 ml-1">Coins</span>
          </div>
        </div>

        {/* Game Title */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-display font-bold text-gold-500 mb-2">{title}</h2>
          <p className="text-gray-300">{description}</p>
        </div>

        {/* Game Content */}
        {children}
      </div>
    </div>
  );
}
