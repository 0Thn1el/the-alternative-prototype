import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Camera, Shirt, Package, Search, Home, User, ShoppingBag, Menu, Settings as SettingsIcon, LogOut, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from '../hooks/useAuth';

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  cartCount?: number;
}

export function Sidebar({ currentPage, setCurrentPage, cartCount }: SidebarProps) {
  const { logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isAccountExpanded, setIsAccountExpanded] = useState(false);

  const navItems = [
    { id: 'home', label: 'Shop', icon: Home },
    { id: 'discover', label: 'Discover', icon: Search },
    { id: 'analyze', label: 'Analyze', icon: Camera },
    { id: 'outfits', label: 'Outfits', icon: Shirt },
    { id: 'wardrobe', label: 'Wardrobe', icon: Package },
  ];

  const handleNavigation = (page: string) => {
    setCurrentPage(page);
    setIsMobileOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo Section */}
      <div className="flex items-center gap-3 px-6 py-8 border-b border-sidebar-border/50">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="ghost"
            onClick={() => handleNavigation('home')}
            className="flex items-center gap-2 p-0 h-auto hover:bg-transparent"
          >
            <div className="text-left">
              <h1 className="text-xl">The Alternative</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Sustainable Fashion</p>
            </div>
          </Button>
        </motion.div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6">
        <div className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <motion.div
                key={item.id}
                whileHover={{ x: 6 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => handleNavigation(item.id)}
                  className="w-full justify-start gap-4 text-left transition-all duration-200 h-12 px-4 rounded-xl"
                >
                  <motion.div whileTap={{ scale: 0.92 }}>
                    <Icon className="w-5 h-5" />
                  </motion.div>
                  <span className="text-[15px]">{item.label}</span>
                </Button>
              </motion.div>
            );
          })}
        </div>
      </nav>

      {/* User Actions */}
      <div className="px-3 py-6 border-t border-sidebar-border/50 space-y-1.5 bg-muted/30">
        <motion.div whileHover={{ x: 6 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant={currentPage === 'cart' ? "default" : "ghost"}
            onClick={() => handleNavigation('cart')}
            className="w-full justify-start gap-4 relative transition-all duration-200 h-12 px-4 rounded-xl"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[15px]">Cart</span>
            <Badge 
              variant="destructive" 
              className="ml-auto h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {cartCount || 0}
            </Badge>
          </Button>
        </motion.div>
        
        <div>
          <Button
            variant="ghost"
            onClick={() => setIsAccountExpanded(!isAccountExpanded)}
            className="w-full justify-start gap-4 transition-all duration-200 h-12 px-4 rounded-xl"
          >
            <User className="w-5 h-5" />
            <span className="text-[15px]">Account</span>
            {isAccountExpanded ? (
              <ChevronUp className="w-4 h-4 ml-auto" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-auto" />
            )}
          </Button>
          
          {isAccountExpanded && (
            <div className="ml-4 mt-1 space-y-1">
              <Button
                variant={currentPage === 'profile' ? "default" : "ghost"}
                onClick={() => handleNavigation('profile')}
                className="w-full justify-start gap-3 transition-all duration-200 h-10 px-3 rounded-lg text-sm"
              >
                <User className="w-4 h-4" />
                Profile
              </Button>
              <Button
                variant="ghost"
                onClick={logout}
                className="w-full justify-start gap-3 transition-all duration-200 h-10 px-3 rounded-lg text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          )}
        </div>

        <motion.div whileHover={{ x: 6 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant={currentPage === 'settings' ? "default" : "ghost"}
            onClick={() => handleNavigation('settings')}
            className="w-full justify-start gap-4 transition-all duration-200 h-12 px-4 rounded-xl"
          >
            <motion.div whileTap={{ rotate: 90 }} transition={{ duration: 0.15 }}>
              <SettingsIcon className="w-5 h-5" />
            </motion.div>
            <span className="text-[15px]">Settings</span>
          </Button>
        </motion.div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-sidebar border-r border-sidebar-border fixed left-0 top-0 h-screen z-50">
        <SidebarContent />
      </aside>

      {/* Mobile Header with Menu */}
      <header className="lg:hidden bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b">
        <div className="flex h-16 items-center justify-between px-4">
          <Button
            variant="ghost"
            onClick={() => handleNavigation('home')}
            className="flex items-center gap-2 p-0 h-auto"
          >
            <h1 className="text-xl">The Alternative</h1>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="relative"
              onClick={() => handleNavigation('cart')}
            >
              <ShoppingBag className="w-5 h-5" />
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {cartCount || 0}
              </Badge>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                >
                  <User className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => handleNavigation('profile')}>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 bg-sidebar">
                <SidebarContent />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  );
}