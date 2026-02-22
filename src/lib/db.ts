import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qncbeobhcqantygexhup.supabase.co',
  'sb_publishable_NBoQkjQ6AH17bYk3Nrmj4w_RwkKhgC0'
);

// Interfaces
export interface Account {
  id?: number;
  name: string;
  type: 'checking' | 'savings' | 'cash' | 'credit';
  initial_balance: number;
  active: boolean;
}

export interface Category {
  id?: number;
  name: string;
  group_name: string | null;
  is_default: boolean;
  active: boolean;
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
}

export interface CategoryBudget {
  id?: number;
  category_id: number;
  month: string;
  amount: number;
}

export interface WishlistItem {
  id?: number;
  name: string;
  target_amount: number;
  saved_amount: number;
  priority: 'low' | 'medium' | 'high';
  deadline: string | null;
  status: 'active' | 'completed' | 'cancelled';
  completed_at: string | null;
}

// ==================== ACCOUNTS ====================

export async function getAccounts(): Promise<Account[]> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .order('id', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getAccountById(id: number): Promise<Account | null> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createAccount(account: Omit<Account, 'id'>): Promise<Account> {
  const { data, error } = await supabase
    .from('accounts')
    .insert({
      ...account
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAccount(id: number, updates: Partial<Account>): Promise<Account> {
  const { data, error } = await supabase
    .from('accounts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAccount(id: number): Promise<void> {
  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ==================== CATEGORIES ====================

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('group_name', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getCategoryById(id: number): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createCategory(category: Omit<Category, 'id'>): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert({
      ...category
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCategory(id: number, updates: Partial<Category>): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCategory(id: number): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ==================== TRANSACTIONS ====================

export async function getTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false })
    .order('id', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getTransactionById(id: number): Promise<Transaction | null> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      ...transaction
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTransaction(id: number, updates: Partial<Transaction>): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTransaction(id: number): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ==================== RECURRING ITEMS ====================

export async function getRecurringItems(): Promise<RecurringItem[]> {
  const { data, error } = await supabase
    .from('recurring_items')
    .select('*')
    .order('day_of_month', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getRecurringItemById(id: number): Promise<RecurringItem | null> {
  const { data, error } = await supabase
    .from('recurring_items')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createRecurringItem(item: Omit<RecurringItem, 'id'>): Promise<RecurringItem> {
  const { data, error } = await supabase
    .from('recurring_items')
    .insert({
      ...item
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateRecurringItem(id: number, updates: Partial<RecurringItem>): Promise<RecurringItem> {
  const { data, error } = await supabase
    .from('recurring_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRecurringItem(id: number): Promise<void> {
  const { error } = await supabase
    .from('recurring_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ==================== CATEGORY BUDGETS ====================

export async function getCategoryBudgets(month?: string): Promise<CategoryBudget[]> {
  let query = supabase
    .from('category_budgets')
    .select('*');

  if (month) {
    query = query.eq('month', month);
  }

  const { data, error } = await query.order('id', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getCategoryBudgetById(id: number): Promise<CategoryBudget | null> {
  const { data, error } = await supabase
    .from('category_budgets')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createCategoryBudget(budget: Omit<CategoryBudget, 'id'>): Promise<CategoryBudget> {
  const { data, error } = await supabase
    .from('category_budgets')
    .insert({
      ...budget
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCategoryBudget(id: number, updates: Partial<CategoryBudget>): Promise<CategoryBudget> {
  const { data, error } = await supabase
    .from('category_budgets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCategoryBudget(id: number): Promise<void> {
  const { error } = await supabase
    .from('category_budgets')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ==================== WISHLIST ITEMS ====================

export async function getWishlistItems(): Promise<WishlistItem[]> {
  const { data, error } = await supabase
    .from('wishlist_items')
    .select('*')
    .order('priority', { ascending: false })
    .order('id', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getWishlistItemById(id: number): Promise<WishlistItem | null> {
  const { data, error } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createWishlistItem(item: Omit<WishlistItem, 'id'>): Promise<WishlistItem> {
  const { data, error } = await supabase
    .from('wishlist_items')
    .insert({
      ...item
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateWishlistItem(id: number, updates: Partial<WishlistItem>): Promise<WishlistItem> {
  const { data, error } = await supabase
    .from('wishlist_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteWishlistItem(id: number): Promise<void> {
  const { error } = await supabase
    .from('wishlist_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ==================== INITIALIZATION ====================

export async function initializeDefaultData(): Promise<void> {
  try {
    // Check if data already exists
    const { data: existingAccounts } = await supabase
      .from('accounts')
      .select('id')
      .limit(1);

    if (existingAccounts && existingAccounts.length > 0) {
      return; // Data already initialized
    }

    // Create default accounts
    const defaultAccounts = [
      { name: 'Checking', type: 'checking' as const, initial_balance: 0, active: true },
      { name: 'Savings', type: 'savings' as const, initial_balance: 0, active: true },
    ];

    for (const account of defaultAccounts) {
      await createAccount(account);
    }

    // Create default categories
    const defaultCategories = [
      { name: 'Salary', group_name: 'Income', is_default: true, active: true },
      { name: 'Freelance', group_name: 'Income', is_default: true, active: true },
      { name: 'Other Income', group_name: 'Income', is_default: true, active: true },

      { name: 'Groceries', group_name: 'Food & Dining', is_default: true, active: true },
      { name: 'Restaurants', group_name: 'Food & Dining', is_default: true, active: true },

      { name: 'Rent/Mortgage', group_name: 'Housing', is_default: true, active: true },
      { name: 'Utilities', group_name: 'Housing', is_default: true, active: true },

      { name: 'Gas', group_name: 'Transportation', is_default: true, active: true },
      { name: 'Public Transit', group_name: 'Transportation', is_default: true, active: true },

      { name: 'Movies & Entertainment', group_name: 'Entertainment', is_default: true, active: true },
      { name: 'Hobbies', group_name: 'Entertainment', is_default: true, active: true },

      { name: 'Clothing', group_name: 'Shopping', is_default: true, active: true },
      { name: 'Electronics', group_name: 'Shopping', is_default: true, active: true },

      { name: 'Doctor', group_name: 'Healthcare', is_default: true, active: true },
      { name: 'Pharmacy', group_name: 'Healthcare', is_default: true, active: true },

      { name: 'Other', group_name: 'Other', is_default: true, active: true },
    ];

    for (const category of defaultCategories) {
      await createCategory(category);
    }

    console.log('Default data initialized successfully');
  } catch (error) {
    console.error('Error initializing default data:', error);
    throw error;
  }
}

// Export supabase client for direct access if needed
export function getDB() {
  return supabase;
}

// Export supabase client for direct access if needed
export { supabase };