'use client';

import { useState, useCallback } from 'react';
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
import { Search, Building2, User, Loader2, Globe, MapPin } from 'lucide-react';

interface Customer {
  customerId: string;
  customerName: string;
  buyerCode?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  country?: string;
  state?: string;
  city?: string;
  pod?: string;
  paymentTerms?: string;
  currency?: string;
  creditLimit?: number;
  gstin?: string;
}

interface CustomerSearchProps {
  value?: string;
  onChange: (customer: Customer | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showDetails?: boolean;
}

export function CustomerSearch({
  value,
  onChange,
  placeholder = 'Search customer by name, code, GSTIN...',
  disabled = false,
  className,
  showDetails = true,
}: CustomerSearchProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers-search', search],
    queryFn: async () => {
      if (!search || search.length < 2) return [];
      try {
        const response = await mastersApi.getCustomers({ search, limit: 20 });
        return response.data?.data || response.data || [];
      } catch (error) {
        return [];
      }
    },
    enabled: search.length >= 2,
  });

  const handleSelect = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    onChange(customer);
    setOpen(false);
    setSearch('');
  }, [onChange]);

  const handleClear = useCallback(() => {
    setSelectedCustomer(null);
    onChange(null);
    setSearch('');
  }, [onChange]);

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn('w-full justify-between', className)}
            disabled={disabled}
          >
            {selectedCustomer ? (
              <div className="flex items-center gap-2 truncate">
                <Building2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span className="truncate">
                  {selectedCustomer.customerName}
                  {selectedCustomer.buyerCode && (
                    <span className="text-gray-400 ml-1">({selectedCustomer.buyerCode})</span>
                  )}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-400">
                <Search className="h-4 w-4" />
                <span>{placeholder}</span>
              </div>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[600px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search by name, buyer code, GSTIN, email..." value={search} onValueChange={setSearch} className="h-9" />
            <CommandList>
              <CommandEmpty>
                {isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <div className="py-6 text-center text-sm text-gray-500">
                    {search.length < 2 ? 'Type at least 2 characters to search' : 'No customers found'}
                  </div>
                )}
              </CommandEmpty>

              <CommandGroup heading="Customers">
                {customers?.map((customer: any) => (
                  <CommandItem
                    key={customer.customerId || customer.id}
                    value={customer.customerName}
                    onSelect={() => handleSelect(customer)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-start gap-3 w-full py-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{customer.customerName}</span>
                          {customer.buyerCode && (
                            <Badge className="bg-blue-100 text-blue-700 text-xs">{customer.buyerCode}</Badge>
                          )}
                        </div>
                        {customer.contactPerson && (
                          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                            <User className="h-3 w-3" />
                            {customer.contactPerson}
                          </div>
                        )}
                        {showDetails && (
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {customer.country && (
                              <Badge variant="outline" className="text-xs">
                                <Globe className="h-3 w-3 mr-1" />
                                {customer.country}
                              </Badge>
                            )}
                            {customer.city && (
                              <Badge variant="outline" className="text-xs">
                                <MapPin className="h-3 w-3 mr-1" />
                                {customer.city}
                              </Badge>
                            )}
                            {customer.paymentTerms && (
                              <Badge variant="outline" className="text-xs">{customer.paymentTerms}</Badge>
                            )}
                            {customer.currency && (
                              <Badge variant="outline" className="text-xs">{customer.currency}</Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right text-xs text-gray-500 flex-shrink-0">
                        {customer.email && <p className="truncate max-w-[150px]">{customer.email}</p>}
                        {customer.phone && <p>{customer.phone}</p>}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedCustomer && showDetails && (
        <div className="grid grid-cols-4 gap-2 p-3 bg-gray-50 rounded-lg text-sm">
          <div>
            <p className="text-xs text-gray-500">Buyer Code</p>
            <p className="font-mono font-medium">{selectedCustomer.buyerCode || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Country</p>
            <p className="font-medium">{selectedCustomer.country || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">POD</p>
            <p className="font-medium">{selectedCustomer.pod || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Payment Terms</p>
            <p className="font-medium">{selectedCustomer.paymentTerms || '-'}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerSearch;