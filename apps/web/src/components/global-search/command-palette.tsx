'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Search,
  Package,
  Users,
  ShoppingCart,
  Truck,
  FileText,
  BarChart3,
  Settings,
  Building2,
  ArrowRight,
  X,
  Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface SearchResult {
  module: string;
  moduleLabel: string;
  id: string;
  title: string;
  subtitle?: string;
  metadata?: Record<string, any>;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const moduleIcons: Record<string, React.ElementType> = {
  products: Package,
  customers: Users,
  categories: FileText,
  brands: Building2,
  audit: BarChart3,
  default: Search,
};

const moduleRoutes: Record<string, string> = {
  products: '/dashboard/masters/products',
  customers: '/dashboard/masters/customers',
  categories: '/dashboard/masters/categories',
  brands: '/dashboard/masters/brands',
  audit: '/dashboard/reports/audit',
};

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get('/search', {
        params: { q: searchQuery, limit: 10 },
      });
      setResults(response.data.results || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, performSearch]);

  // Reset on open/close
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      } else if (e.key === 'Escape') {
        onOpenChange(false);
      }
    },
    [results, selectedIndex, onOpenChange]
  );

  const handleSelect = (result: SearchResult) => {
    const route = moduleRoutes[result.module] || `/dashboard/masters/${result.module}`;
    router.push(`${route}/${result.id}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden gap-0 max-w-2xl">
        {/* Search Input */}
        <div className="flex items-center border-b border-gray-200 px-4">
          <Search className="h-5 w-5 text-slate-400 flex-shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search products, customers..."
            className="border-0 shadow-none focus-visible:ring-0 text-base h-14 pl-3"
          />
          {isLoading && <Loader2 className="h-5 w-5 text-slate-400 animate-spin flex-shrink-0" />}
          {query && !isLoading && (
            <button
              onClick={() => setQuery('')}
              title="Clear search query"
              aria-label="Clear search query"
              className="p-1 rounded hover:bg-slate-100 flex-shrink-0"
            >
              <X className="h-4 w-4 text-slate-400" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {query.length < 2 && (
            <div className="px-4 py-8 text-center text-slate-500">
              <Search className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p>Type at least 2 characters to search</p>
            </div>
          )}

          {query.length >= 2 && results.length === 0 && !isLoading && (
            <div className="px-4 py-8 text-center text-slate-500">
              <p>No results found for "{query}"</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="py-2">
              {results.map((result, index) => {
                const Icon = moduleIcons[result.module] || moduleIcons.default;
                return (
                  <button
                    key={`${result.module}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors',
                      index === selectedIndex && 'bg-slate-100'
                    )}
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {result.title}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {result.subtitle}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {result.moduleLabel}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-slate-50 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-300 text-slate-600">
                ↑↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-300 text-slate-600">
                ↵
              </kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-300 text-slate-600">
                Esc
              </kbd>
              Close
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to manage command palette globally
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { isOpen, setIsOpen };
}
