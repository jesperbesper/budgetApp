import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);


export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}

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

export interface ReceiptItem {
  id?: string;
  receipt_id: string;
  raw_name: string;
  price: number;
}

export interface Receipt {
  id: string;
  receipt_id?: string;
  store_name: string | null;
  total: number | null;
  created_at?: string;
  receipt_items?: ReceiptItem[];
}

// ==================== ACCOUNTS ====================

export async function getAccounts(): Promise<Account[]> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', user?.id)
    .order('id', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getAccountById(id: number): Promise<Account | null> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', id)
    .eq('user_id', user?.id)
    .single();

  if (error) throw error;
  return data;
}

export async function createAccount(account: Omit<Account, 'id'>): Promise<Account> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('accounts')
    .insert({
      ...account,
      user_id: user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAccount(id: number, updates: Partial<Account>): Promise<Account> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('accounts')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user?.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAccount(id: number): Promise<void> {
  const user = await getCurrentUser();
  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', id)
    .eq('user_id', user?.id);

  if (error) throw error;
}

// ==================== CATEGORIES ====================

export async function getCategories(): Promise<Category[]> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user?.id)
    .order('group_name', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getCategoryById(id: number): Promise<Category | null> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .eq('user_id', user?.id)
    .single();

  if (error) throw error;
  return data;
}

export async function createCategory(category: Omit<Category, 'id'>): Promise<Category> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('categories')
    .insert({
      ...category,
      user_id: user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCategory(id: number, updates: Partial<Category>): Promise<Category> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user?.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCategory(id: number): Promise<void> {
  const user = await getCurrentUser();
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', user?.id);

  if (error) throw error;
}

// ==================== TRANSACTIONS ====================

export async function getTransactions(): Promise<Transaction[]> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user?.id)
    .order('date', { ascending: false })
    .order('id', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getTransactionById(id: number): Promise<Transaction | null> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user?.id)
    .single();

  if (error) throw error;
  return data;
}

export async function getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user?.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      ...transaction,
      user_id: user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTransaction(id: number, updates: Partial<Transaction>): Promise<Transaction> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user?.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTransaction(id: number): Promise<void> {
  const user = await getCurrentUser();
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user?.id);

  if (error) throw error;
}

// ==================== RECURRING ITEMS ====================

export async function getRecurringItems(): Promise<RecurringItem[]> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('recurring_items')
    .select('*')
    .eq('user_id', user?.id)
    .order('day_of_month', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getRecurringItemById(id: number): Promise<RecurringItem | null> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('recurring_items')
    .select('*')
    .eq('id', id)
    .eq('user_id', user?.id)
    .single();

  if (error) throw error;
  return data;
}

export async function createRecurringItem(item: Omit<RecurringItem, 'id'>): Promise<RecurringItem> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('recurring_items')
    .insert({
      ...item,
      user_id: user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateRecurringItem(id: number, updates: Partial<RecurringItem>): Promise<RecurringItem> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('recurring_items')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user?.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRecurringItem(id: number): Promise<void> {
  const user = await getCurrentUser();
  const { error } = await supabase
    .from('recurring_items')
    .delete()
    .eq('id', id)
    .eq('user_id', user?.id);

  if (error) throw error;
}

// ==================== CATEGORY BUDGETS ====================

export async function getCategoryBudgets(month?: string): Promise<CategoryBudget[]> {
  const user = await getCurrentUser();
  let query = supabase
    .from('category_budgets')
    .select('*')
    .eq('user_id', user?.id);

  if (month) {
    query = query.eq('month', month);
  }

  const { data, error } = await query.order('id', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getCategoryBudgetById(id: number): Promise<CategoryBudget | null> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('category_budgets')
    .select('*')
    .eq('id', id)
    .eq('user_id', user?.id)
    .single();

  if (error) throw error;
  return data;
}

export async function createCategoryBudget(budget: Omit<CategoryBudget, 'id'>): Promise<CategoryBudget> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('category_budgets')
    .insert({
      ...budget,
      user_id: user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCategoryBudget(id: number, updates: Partial<CategoryBudget>): Promise<CategoryBudget> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('category_budgets')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user?.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCategoryBudget(id: number): Promise<void> {
  const user = await getCurrentUser();
  const { error } = await supabase
    .from('category_budgets')
    .delete()
    .eq('id', id)
    .eq('user_id', user?.id);

  if (error) throw error;
}

// ==================== WISHLIST ITEMS ====================

export async function getWishlistItems(): Promise<WishlistItem[]> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('user_id', user?.id)
    .order('priority', { ascending: false })
    .order('id', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getWishlistItemById(id: number): Promise<WishlistItem | null> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('id', id)
    .eq('user_id', user?.id)
    .single();

  if (error) throw error;
  return data;
}

export async function createWishlistItem(item: Omit<WishlistItem, 'id'>): Promise<WishlistItem> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('wishlist_items')
    .insert({
      ...item,
      user_id: user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateWishlistItem(id: number, updates: Partial<WishlistItem>): Promise<WishlistItem> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('wishlist_items')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user?.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteWishlistItem(id: number): Promise<void> {
  const user = await getCurrentUser();
  const { error } = await supabase
    .from('wishlist_items')
    .delete()
    .eq('id', id)
    .eq('user_id', user?.id);

  if (error) throw error;
}

// ==================== RECEIPTS ====================

export interface ReceiptAnalysisItem {
  id: string;
  raw_name: string;
  price: number;
  quantity: number | null;
  products: {
    id: string;
    canonical_name: string;
    product_categories: { id: string; name: string } | null;
  } | null;
}

export interface ReceiptAnalysisRow {
  id: string;
  store_name: string | null;
  total: number | null;
  created_at: string;
  receipt_items: ReceiptAnalysisItem[];
}

export async function getReceiptAnalysis(month: string): Promise<ReceiptAnalysisRow[]> {
  const start = `${month}-01`;
  const [year, mon] = month.split('-').map(Number);
  const nextMonth = mon === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(mon + 1).padStart(2, '0')}-01`;

  const { data, error } = await supabase
    .from('receipts')
    .select(`
      id, store_name, total, created_at,
      receipt_items (
        id, raw_name, price, quantity,
        products (
          id, canonical_name,
          product_categories ( id, name )
        )
      )
    `)
    .gte('created_at', start)
    .lt('created_at', nextMonth)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as ReceiptAnalysisRow[];
}

export async function getReceiptWithItems(id: string): Promise<Receipt | null> {
  const { data, error } = await supabase
    .from('receipts')
    .select('*, receipt_items(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function insertReceiptWithItems(
  storeName: string | null,
  total: number,
  items: Array<{ name: string; price: number; quantity: number }>
): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not logged in');

  // Insert receipt row
  const { data: receipt, error: receiptError } = await supabase
    .from('receipts')
    .insert({ user_id: user.id, store_name: storeName, total })
    .select('id')
    .single();

  if (receiptError) throw receiptError;
  const receipt_id: string = receipt.id;

  // Insert receipt items
  if (items.length > 0) {
    const { error: itemsError } = await supabase
      .from('receipt_items')
      .insert(
        items.map((item) => ({
          receipt_id,
          raw_name: item.name,
          price: item.price,
          quantity: item.quantity,
        }))
      );
    if (itemsError) throw itemsError;
  }

  return receipt_id;
}

export async function updateReceiptWithItems(
  id: string,
  storeName: string | null,
  total: number,
  items: Array<{ name: string; price: number }>
): Promise<void> {
  // Update receipt metadata

  console.log("CONFIRM CALLED", new Date().toISOString());
  console.trace();
  const { error: receiptError } = await supabase
    .from('receipts')
    .update({ store_name: storeName, total })
    .eq('id', id);

  if (receiptError) throw receiptError;

  // Replace all items: delete existing, insert new
  const { error: deleteError } = await supabase
    .from('receipt_items')
    .delete()
    .eq('receipt_id', id);

  if (deleteError) throw deleteError;

  if (items.length > 0) {
    const newItems = items.map((item) => ({
      receipt_id: id,
      raw_name: item.name,
      price: item.price,
    }));

    const { error: insertError } = await supabase
      .from('receipt_items')
      .insert(newItems);

    if (insertError) throw insertError;
  }
}

// ==================== INITIALIZATION ====================

// In-flight lock: prevents concurrent calls within the same JS session.
const _initPromises = new Map<string, Promise<void>>();

// localStorage key for a given user — survives page reloads and HMR resets.
const _lsKey = (userId: string) => `budget_initialized_v1_${userId}`;

export function initializeDefaultData(): Promise<void> {
  return getCurrentUser().then((user) => {
    if (!user) return;

    // Fast path: already marked as done in localStorage (survives reloads).
    if (localStorage.getItem(_lsKey(user.id))) return;

    // In-flight lock: if this session already started the work, share it.
    if (_initPromises.has(user.id)) return _initPromises.get(user.id)!;

    const promise = _doInitialize(user.id);
    _initPromises.set(user.id, promise);
    return promise;
  });
}

async function _doInitialize(userId: string): Promise<void> {
  try {
    // Double-check the DB in case another device/session already initialized.
    const { data: existingAccounts } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (existingAccounts && existingAccounts.length > 0) {
      // Data exists — record in localStorage so we never hit the DB again.
      localStorage.setItem(_lsKey(userId), '1');
      return;
    }

    // Batch-insert all default accounts in a single round-trip.
    // This collapses what was 18 sequential async operations (each with its own
    // getCurrentUser() call) into 2 operations, dramatically shrinking the race
    // window that could cause duplicates when two tabs open simultaneously.
    const { error: accountsError } = await supabase
      .from('accounts')
      .insert([
        { name: 'Checking', type: 'checking', initial_balance: 0, active: true, user_id: userId },
        { name: 'Savings', type: 'savings', initial_balance: 0, active: true, user_id: userId },
      ]);

    if (accountsError) throw accountsError;

    // Batch-insert all default categories in a single round-trip.
    const { error: categoriesError } = await supabase
      .from('categories')
      .insert([
        { name: 'Salary', group_name: 'Income', is_default: true, active: true, user_id: userId },
        { name: 'Freelance', group_name: 'Income', is_default: true, active: true, user_id: userId },
        { name: 'Other Income', group_name: 'Income', is_default: true, active: true, user_id: userId },
        { name: 'Groceries', group_name: 'Food & Dining', is_default: true, active: true, user_id: userId },
        { name: 'Restaurants', group_name: 'Food & Dining', is_default: true, active: true, user_id: userId },
        { name: 'Rent/Mortgage', group_name: 'Housing', is_default: true, active: true, user_id: userId },
        { name: 'Utilities', group_name: 'Housing', is_default: true, active: true, user_id: userId },
        { name: 'Gas', group_name: 'Transportation', is_default: true, active: true, user_id: userId },
        { name: 'Public Transit', group_name: 'Transportation', is_default: true, active: true, user_id: userId },
        { name: 'Movies & Entertainment', group_name: 'Entertainment', is_default: true, active: true, user_id: userId },
        { name: 'Hobbies', group_name: 'Entertainment', is_default: true, active: true, user_id: userId },
        { name: 'Clothing', group_name: 'Shopping', is_default: true, active: true, user_id: userId },
        { name: 'Electronics', group_name: 'Shopping', is_default: true, active: true, user_id: userId },
        { name: 'Doctor', group_name: 'Healthcare', is_default: true, active: true, user_id: userId },
        { name: 'Pharmacy', group_name: 'Healthcare', is_default: true, active: true, user_id: userId },
        { name: 'Other', group_name: 'Other', is_default: true, active: true, user_id: userId },
      ]);

    if (categoriesError) throw categoriesError;

    // Mark as done — prevents any future call from re-running the inserts.
    localStorage.setItem(_lsKey(userId), '1');
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