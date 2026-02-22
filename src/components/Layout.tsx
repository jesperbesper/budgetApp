import { ReactNode } from 'react';
import { NavLink } from '@/components/NavLink';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/db';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Wallet, 
  FolderTree, 
  Repeat, 
  Heart, 
  Settings as SettingsIcon,
  LogOut
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
    { to: '/accounts', icon: Wallet, label: 'Accounts' },
    { to: '/categories', icon: FolderTree, label: 'Categories' },
    { to: '/recurring', icon: Repeat, label: 'Recurring' },
    { to: '/wishlist', icon: Heart, label: 'Wishlist' },
    { to: '/settings', icon: SettingsIcon, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Desktop Navigation - Top Bar */}
      <nav className="hidden md:block border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-xl font-bold text-primary">Budget App</h1>
            <div className="flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  activeClassName="bg-primary text-primary-foreground hover:bg-primary"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive ml-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Header - Top */}
      <header className="md:hidden border-b border-border bg-card sticky top-0 z-50">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="w-10" />
          <h1 className="text-lg font-bold text-primary">Budget App</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => signOut()}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto">{children}</main>

      {/* Mobile Navigation - Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card z-50 safe-area-inset-bottom">
        <div className="grid grid-cols-7 gap-1 px-2 py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-md text-xs font-medium text-foreground hover:bg-muted transition-colors min-h-[60px]"
              activeClassName="bg-primary text-primary-foreground hover:bg-primary"
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] leading-tight text-center">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
