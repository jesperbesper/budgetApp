// Local-first database using IndexedDB for structured data storage
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface BudgetDB extends DBSchema {
  accounts: {
    key: number;
    value: Account;
    indexes: { 'by-active': number };
  };
  categories: {
    key: number;
    value: Category;
    indexes: { 'by-active': number };
  };
  transactions: {
    key: number;
    value: Transaction;
    indexes: { 'by-date': string; 'by-account': number; 'by-category': number };
  };
  recurring_items: {
    key: number;
    value: RecurringItem;
    indexes: { 'by-active': number };
  };
  category_budgets: {
    key: number;
    value: CategoryBudget;
    indexes: { 'by-month': string; 'by-category': number };
  };
  wishlist_items: {
    key: number;
    value: WishlistItem;
    indexes: { 'by-status': string };
  };
  settings: {
    key: string;
    value: string;
  };
}

export interface Account {
  id?: number;
  name: string;
  type: 'checking' | 'savings' | 'cash' | 'credit';
  initial_balance: number;
  created_at: string;
  active: boolean;
}

export interface Category {
  id?: number;
  name: string;
  group_name: string | null;
  is_default: boolean;
  active: boolean;
  created_at: string;
}

export interface Transaction {
  id?: number;
  account_id: number | null;
  date: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  category_id: number | null;
  from_account_id: number | null;
  to_account_id: number | null;
  note: string | null;
  tags: string | null;
  created_at: string;
}

export interface RecurringItem {
  id?: number;
  description: string;
  amount: number;
  category_id: number;
  account_id: number;
  type: 'income' | 'expense';
  day_of_month: number;
  active: boolean;
  created_at: string;
}

export interface CategoryBudget {
  id?: number;
  category_id: number;
  month: string;
  amount: number;
  created_at: string;
}

export interface WishlistItem {
  id?: number;
  name: string;
  target_amount: number;
  saved_amount: number;
  priority: 'low' | 'medium' | 'high';
  deadline: string | null;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  completed_at: string | null;
}

let dbInstance: IDBPDatabase<BudgetDB> | null = null;

export async function getDB() {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<BudgetDB>('budget-app', 1, {
    upgrade(db) {
      // Accounts
      if (!db.objectStoreNames.contains('accounts')) {
        const accountStore = db.createObjectStore('accounts', { keyPath: 'id', autoIncrement: true });
        accountStore.createIndex('by-active', 'active');
      }

      // Categories
      if (!db.objectStoreNames.contains('categories')) {
        const categoryStore = db.createObjectStore('categories', { keyPath: 'id', autoIncrement: true });
        categoryStore.createIndex('by-active', 'active');
      }

      // Transactions
      if (!db.objectStoreNames.contains('transactions')) {
        const transactionStore = db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
        transactionStore.createIndex('by-date', 'date');
        transactionStore.createIndex('by-account', 'account_id');
        transactionStore.createIndex('by-category', 'category_id');
      }

      // Recurring Items
      if (!db.objectStoreNames.contains('recurring_items')) {
        const recurringStore = db.createObjectStore('recurring_items', { keyPath: 'id', autoIncrement: true });
        recurringStore.createIndex('by-active', 'active');
      }

      // Category Budgets
      if (!db.objectStoreNames.contains('category_budgets')) {
        const budgetStore = db.createObjectStore('category_budgets', { keyPath: 'id', autoIncrement: true });
        budgetStore.createIndex('by-month', 'month');
        budgetStore.createIndex('by-category', 'category_id');
      }

      // Wishlist Items
      if (!db.objectStoreNames.contains('wishlist_items')) {
        const wishlistStore = db.createObjectStore('wishlist_items', { keyPath: 'id', autoIncrement: true });
        wishlistStore.createIndex('by-status', 'status');
      }

      // Settings
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
    },
  });

  return dbInstance;
}

// Initialize with default data
export async function initializeDefaultData() {
  const db = await getDB();
  
  // Check if already initialized
  const hasAccounts = (await db.count('accounts')) > 0;
  if (hasAccounts) return;

  // Create default accounts
  const mainAccount: Account = {
    name: 'Main',
    type: 'checking',
    initial_balance: 0,
    created_at: new Date().toISOString(),
    active: true,
  };
  const savingsAccount: Account = {
    name: 'Savings',
    type: 'savings',
    initial_balance: 0,
    created_at: new Date().toISOString(),
    active: true,
  };

  await db.add('accounts', mainAccount);
  await db.add('accounts', savingsAccount);

  // Create default categories
  const defaultCategories: Omit<Category, 'id'>[] = [
    // Essentials
    { name: 'Rent', group_name: 'Essentials', is_default: true, active: true, created_at: new Date().toISOString() },
    { name: 'Groceries', group_name: 'Essentials', is_default: true, active: true, created_at: new Date().toISOString() },
    { name: 'Utilities', group_name: 'Essentials', is_default: true, active: true, created_at: new Date().toISOString() },
    // Lifestyle
    { name: 'Entertainment', group_name: 'Lifestyle', is_default: true, active: true, created_at: new Date().toISOString() },
    { name: 'Eating out', group_name: 'Lifestyle', is_default: true, active: true, created_at: new Date().toISOString() },
    { name: 'Shopping', group_name: 'Lifestyle', is_default: true, active: true, created_at: new Date().toISOString() },
    // Savings
    { name: 'General savings', group_name: 'Savings', is_default: true, active: true, created_at: new Date().toISOString() },
    { name: 'Wishlist purchases', group_name: 'Savings', is_default: true, active: true, created_at: new Date().toISOString() },
  ];

  for (const category of defaultCategories) {
    await db.add('categories', category as Category);
  }
}
