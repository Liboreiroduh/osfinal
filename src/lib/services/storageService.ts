class StorageService {
  private prefix = 'ledcollor_';

  get(key: string): unknown {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(this.prefix + key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  set(key: string, value: unknown): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch {
      console.error('Error saving to localStorage');
    }
  }

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    if (typeof window === 'undefined') return;
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }
}

export const storageService = new StorageService();
