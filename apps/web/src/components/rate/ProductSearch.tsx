'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { mastersApi } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Search, Package, Loader2, Star, Clock } from 'lucide-react';

interface Product {
  productId: string;
  productCode: string;
  productName: string;
  categoryName: string;
  brandName: string;
  unitSize: string;
  cbmPerBox: number;
  unitsPerCase: number;
  mrp: number;
  gstPercentage: number;
  image?: string;
  isFavorite?: boolean;
  lastUsed?: Date;
}

interface ProductSearchProps {
  value?: string;
  onChange: (product: Product | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function ProductSearch({
  value,
  onChange,
  placeholder = 'Search product by code or name...',
  disabled = false,
  className,
}: ProductSearchProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ['products-search', search],
    queryFn: async () => {
      if (!search || search.length < 2) return [];
      try {
        const response = await mastersApi.getProducts({ search, limit: 20 });
        return response.data?.data || response.data || [];
      } catch (error) {
        return [];
      }
    },
    enabled: search.length >= 2,
  });

  useEffect(() => {
    if (value && !selectedProduct) {
      const found = products?.find((p: any) => p.productId === value || p.productCode === value);
      if (found) setSelectedProduct(found);
    }
  }, [value, products, selectedProduct]);

  const handleSelect = useCallback((product: Product) => {
    setSelectedProduct(product);
    onChange(product);
    setOpen(false);
    setSearch('');
  }, [onChange]);

  const handleClear = useCallback(() => {
    setSelectedProduct(null);
    onChange(null);
    setSearch('');
  }, [onChange]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
          disabled={disabled}
        >
          {selectedProduct ? (
            <div className="flex items-center gap-2 truncate">
              <Package className="h-4 w-4 text-blue-500" />
              <span className="truncate">{selectedProduct.productCode} - {selectedProduct.productName}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-400">
              <Search className="h-4 w-4" />
              <span>{placeholder}</span>
            </div>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[500px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search by product code or name..." value={search} onValueChange={setSearch} className="h-9" />
          <CommandList>
            <CommandEmpty>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="py-6 text-center text-sm text-gray-500">
                  {search.length < 2 ? 'Type at least 2 characters to search' : 'No products found'}
                </div>
              )}
            </CommandEmpty>
            <CommandGroup heading="Products">
              {products?.map((product: any) => (
                <CommandItem
                  key={product.productId || product.id}
                  value={product.productCode}
                  onSelect={() => handleSelect(product)}
                  className="cursor-pointer"
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                      {product.image ? (
                        <img src={product.image} alt="" className="w-10 h-10 object-cover rounded" />
                      ) : (
                        <Package className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium text-blue-600">{product.productCode}</span>
                        {product.isFavorite && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                      </div>
                      <p className="text-sm truncate">{product.productName}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <Badge variant="outline" className="text-xs">{product.categoryName || 'Uncategorized'}</Badge>
                        {product.brandName && <Badge variant="outline" className="text-xs">{product.brandName}</Badge>}
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-500 flex-shrink-0">
                      <p>MRP: ₹{product.mrp?.toFixed(2) || '0'}</p>
                      <p>GST: {product.gstPercentage || 18}%</p>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default ProductSearch;