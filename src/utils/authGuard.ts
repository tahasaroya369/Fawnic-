import type { Product } from '../types.js';

export interface PendingShoppingAction {
  action: 'add_to_cart' | 'wishlist' | 'buy_now' | 'checkout';
  product?: Product;
  quantity?: number;
  selectedVariants?: Record<string, string>;
  returnRoute?: string;
  returnParam?: any;
}

const STORAGE_KEY = 'fawnic_pending_shopping_action';

export function checkShoppingAuth(
  isAuthenticated: boolean,
  onNavigate: (route: string, param?: any) => void,
  pendingAction: PendingShoppingAction
): boolean {
  if (isAuthenticated) {
    return true;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingAction));
  } catch (e) {
    // Ignore quota issues
  }

  onNavigate('login');
  return false;
}

export function getPendingShoppingAction(): PendingShoppingAction | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearPendingShoppingAction(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}
