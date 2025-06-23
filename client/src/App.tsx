import { WagmiProvider } from 'wagmi';
import { config } from './lib/wagmi';
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { AuthProvider } from "./hooks/use-auth";
import Header from "./components/layout/header";
import Landing from "./pages/landing";
import Home from "./pages/home";
import Casino from "./pages/casino";
import Farm from "./pages/farm";
import DiceGame from "./pages/games/dice";
import SlotsGame from "./pages/games/slots";
import HiLoGame from "./pages/games/hilo";
import CrashGame from "./pages/games/crash";
import MinesGame from "./pages/games/mines";
import PlinkoGame from "./pages/games/plinko";
import RouletteGame from "./pages/games/roulette";
import Wallet from "./pages/wallet";
import Profile from "./pages/profile";
import NotFound from "./pages/not-found";
import SignIn from "./pages/signin";
import Login from "./pages/login";
import Register from "./pages/register";

function Router() {
  return (
    <Switch>
      <Route path="/" component={SignIn} />
      <Route path="/home" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/casino" component={Casino} />
      <Route path="/farm" component={Farm} />
      <Route path="/games/dice" component={DiceGame} />
      <Route path="/games/slots" component={SlotsGame} />
      <Route path="/games/hilo" component={HiLoGame} />
      <Route path="/games/crash" component={CrashGame} />
      <Route path="/games/mines" component={MinesGame} />
      <Route path="/games/plinko" component={PlinkoGame} />
      <Route path="/games/roulette" component={RouletteGame} />
      <Route path="/wallet" component={Wallet} />
      <Route path="/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const hideHeader = ["/", "/login", "/register"].includes(location);
  
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <div className="min-h-screen bg-cover bg-center bg-fixed" style={{ backgroundImage: "url('/images/bg.png')" }}>
              {!hideHeader && <Header />}
              <Router />
              <Toaster />
            </div>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
