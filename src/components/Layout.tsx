import { ReactNode } from 'react';
import { NavLink } from '@/components/NavLink';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Wallet, 
  FolderTree, 
  Repeat, 
  Heart, 
  Settings as SettingsIcon 
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
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-xl font-bold text-primary">Budget App</h1>
            <div className="flex gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  activeClassName="bg-primary text-primary-foreground hover:bg-primary"
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto">{children}</main>
    </div>
  );
}
