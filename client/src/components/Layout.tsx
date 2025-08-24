import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth?action=logout"),
    onSuccess: () => {
      queryClient.clear();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      // Redirect to login page
      setLocation("/login");
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-valorant-navy overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 hexagon-pattern opacity-30 pointer-events-none"></div>
      <div className="fixed inset-0 bg-gradient-to-br from-valorant-navy via-valorant-charcoal to-valorant-navy pointer-events-none"></div>
      
      {/* Navigation */}
      <nav className="nav-glass fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-valorant-red rounded-lg flex items-center justify-center">
                <i className="fas fa-gamepad text-white text-xl"></i>
              </div>
              <div>
                <h1 className="font-teko text-2xl font-bold text-valorant-red">NYXXUS E-SPORTS</h1>
                <p className="text-xs text-valorant-mint">Tournament Portal</p>
              </div>
            </Link>
            
            <div className="hidden md:flex items-center space-x-6">
              <Link 
                href="/" 
                className={`hover:text-valorant-red transition-colors ${location === '/' ? 'text-valorant-red' : ''}`}
              >
                Home
              </Link>
              <Link 
                href="/register" 
                className={`hover:text-valorant-red transition-colors ${location === '/register' ? 'text-valorant-red' : ''}`}
              >
                Register Team
              </Link>
              <Link 
                href="/rules" 
                className={`hover:text-valorant-red transition-colors ${location === '/rules' ? 'text-valorant-red' : ''}`}
              >
                Rules
              </Link>
              <Link 
                href="/profile" 
                className={`hover:text-valorant-red transition-colors ${location === '/profile' ? 'text-valorant-red' : ''}`}
              >
                Profile
              </Link>
              <a 
                href="https://discord.gg/BtNqdht2Jd" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-valorant-mint transition-colors flex items-center space-x-1"
                data-testid="link-discord-support"
              >
                <i className="fab fa-discord"></i>
                <span>Support</span>
              </a>
            </div>
            
            {user && (
              <div className="flex items-center space-x-4">
                <div className="hidden md:block">
                  <span className="text-sm" data-testid="user-name">{user.name}</span>
                  <span className="text-xs text-valorant-mint block" data-testid="user-discord">{user.discordId}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="glass-morphism px-4 py-2 rounded-lg hover:bg-valorant-red transition-colors"
                  data-testid="button-logout"
                  disabled={logoutMutation.isPending}
                >
                  <i className="fas fa-sign-out-alt"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-20 relative z-10">
        {children}
      </div>

      {/* Footer */}
      <footer className="bg-valorant-navy border-t border-valorant-red/20 py-12 relative z-10">
        <div className="container mx-auto px-6 text-center">
          <div className="mb-6">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-valorant-red rounded-lg flex items-center justify-center">
                <i className="fas fa-gamepad text-white text-xl"></i>
              </div>
              <div>
                <h3 className="font-teko text-3xl font-bold text-valorant-red">NYXXUS E-SPORTS</h3>
                <p className="text-valorant-mint">Tournament Portal</p>
              </div>
            </div>
            <p className="text-xl font-bold text-valorant-off-white">Official Tournament Portal by Nyxxus E-Sports</p>
          </div>
          
          <div className="flex justify-center items-center space-x-6 mb-6">
            <div className="flex flex-col items-center">
              <a 
                href="https://discord.gg/BtNqdht2Jd" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-valorant-mint hover:text-white transition-colors flex items-center space-x-2 mb-2"
                data-testid="link-discord-main"
              >
                <i className="fab fa-discord text-3xl"></i>
                <span className="font-bold">Join Discord</span>
              </a>
              <span className="text-xs text-valorant-mint/70">For Support & Updates</span>
            </div>
            
            <div className="h-10 w-px bg-valorant-red/30"></div>
            
            <div className="flex space-x-4">
              <a href="#" className="text-valorant-mint/60 hover:text-valorant-mint transition-colors">
                <i className="fab fa-twitter text-2xl"></i>
              </a>
              <a href="#" className="text-valorant-mint/60 hover:text-valorant-mint transition-colors">
                <i className="fab fa-instagram text-2xl"></i>
              </a>
              <a href="#" className="text-valorant-mint/60 hover:text-valorant-mint transition-colors">
                <i className="fab fa-youtube text-2xl"></i>
              </a>
            </div>
          </div>
          
          <div className="border-t border-valorant-red/20 pt-6">
            <p className="text-valorant-off-white/70">© 2024 Nyxxus E-Sports. All rights reserved. | Spike Rush Cup 2.0</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
