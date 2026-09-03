// Quick Access & Pinned Shortcuts Service for Swarrnim ERP
// Enforces max 3 pinned items per user/workspace, tracks frequency, and ensures RBAC validation

export interface QuickAccessItem {
  id: string; // targetTab / route identifier
  label: string;
  parentLabel?: string;
  icon?: any;
  targetTab: string;
  parentGroupId?: string;
  isPinned?: boolean;
}

interface UserQuickAccessData {
  pinned: string[]; // max 3 tab IDs
  frequency: Record<string, { count: number; lastUsed: number }>;
}

const STORAGE_PREFIX = 'sscit_erp_quick_access_';

class QuickAccessService {
  private getStorageKey(userId: string, role?: string): string {
    const roleKey = role || 'DEFAULT';
    return `${STORAGE_PREFIX}${userId || 'anonymous'}_${roleKey}`;
  }

  private loadData(userId: string, role?: string): UserQuickAccessData {
    try {
      const raw = localStorage.getItem(this.getStorageKey(userId, role));
      if (!raw) return { pinned: [], frequency: {} };
      const parsed = JSON.parse(raw);
      return {
        pinned: Array.isArray(parsed.pinned) ? parsed.pinned.slice(0, 3) : [],
        frequency: typeof parsed.frequency === 'object' && parsed.frequency ? parsed.frequency : {}
      };
    } catch {
      return { pinned: [], frequency: {} };
    }
  }

  private saveData(userId: string, data: UserQuickAccessData, role?: string) {
    try {
      localStorage.setItem(this.getStorageKey(userId, role), JSON.stringify(data));
    } catch (e) {
      console.warn('Unable to persist quick access to localStorage', e);
    }
  }

  public getPinnedIds(userId: string, role?: string): string[] {
    return this.loadData(userId, role).pinned;
  }

  public isPinned(userId: string, targetTab: string, role?: string): boolean {
    const data = this.loadData(userId, role);
    return data.pinned.includes(targetTab);
  }

  /**
   * Toggles pin status for an authorized tab within the active role workspace.
   * Returns: { success: boolean; isPinned: boolean; message?: string }
   */
  public togglePin(userId: string, targetTab: string, role?: string): { success: boolean; isPinned: boolean; message?: string } {
    const data = this.loadData(userId, role);
    const index = data.pinned.indexOf(targetTab);

    if (index >= 0) {
      // Unpin
      data.pinned.splice(index, 1);
      this.saveData(userId, data, role);
      return { success: true, isPinned: false };
    }

    // Check limit (Max 3)
    if (data.pinned.length >= 3) {
      return {
        success: false,
        isPinned: false,
        message: 'Maximum 3 shortcuts can be pinned. Unpin one shortcut to add another.'
      };
    }

    // Pin new item
    data.pinned.push(targetTab);
    this.saveData(userId, data, role);
    return { success: true, isPinned: true };
  }

  /**
   * Track usage of a tab to maintain frequently used suggestions per workspace.
   */
  public recordUsage(userId: string, targetTab: string, role?: string) {
    if (!targetTab || targetTab === 'logout') return;
    const data = this.loadData(userId, role);
    const existing = data.frequency[targetTab] || { count: 0, lastUsed: Date.now() };
    data.frequency[targetTab] = {
      count: existing.count + 1,
      lastUsed: Date.now()
    };
    this.saveData(userId, data, role);
  }

  /**
   * Returns sanitized Quick Access items matching user's current RBAC permissions.
   * Includes up to 3 pinned items + top frequent items (max total 5).
   */
  public getQuickAccessItems(userId: string, authorizedItems: QuickAccessItem[], role?: string): QuickAccessItem[] {
    const data = this.loadData(userId, role);
    const authMap = new Map<string, QuickAccessItem>();
    authorizedItems.forEach(item => authMap.set(item.targetTab, item));

    const result: QuickAccessItem[] = [];
    const addedTabs = new Set<string>();

    // 1. Add Pinned Items (order preserved, max 3)
    for (const pinnedTab of data.pinned) {
      const match = authMap.get(pinnedTab);
      if (match && !addedTabs.has(match.targetTab)) {
        result.push({ ...match, isPinned: true });
        addedTabs.add(match.targetTab);
      }
    }

    // 2. Add Top Frequent Items (fill up to max 5 total if available)
    const sortedFrequent = Object.entries(data.frequency)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([tab]) => tab);

    for (const freqTab of sortedFrequent) {
      if (result.length >= 5) break;
      const match = authMap.get(freqTab);
      if (match && !addedTabs.has(match.targetTab)) {
        result.push({ ...match, isPinned: false });
        addedTabs.add(match.targetTab);
      }
    }

    return result;
  }
}

export const quickAccessService = new QuickAccessService();
