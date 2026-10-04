'use client';

import { useCallback, useState } from 'react';
import { MastersCrudPage } from '@/components/masters/masters-crud-page';
import { mastersApi, usersApi } from '@/lib/api';
import toast from 'react-hot-toast';

type Option = { value: string; label: string };

function optionFromText(value?: string | null): Option | null {
  const cleaned = value?.trim();
  if (!cleaned) return null;
  return { value: cleaned, label: cleaned };
}

function uniqueOptions(options: Option[]) {
  const seen = new Set<string>();
  return options.filter((option) => {
    const key = option.value.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isPurchaseUser(user: any) {
  const roleText = [
    typeof user.role === 'string' ? user.role : user.role?.roleCode,
    typeof user.role === 'string' ? '' : user.role?.roleName,
    ...(user.roles || []).map((role: any) => typeof role === 'string' ? role : `${role.roleCode || ''} ${role.roleName || ''}`),
    user.department?.departmentCode,
    user.department?.departmentName,
    user.department?.name,
  ].filter(Boolean).join(' ').toUpperCase();

  return roleText.includes('PURCHASE');
}

function parseUnitSize(unitSize?: string | null): { value: string; unit: string } {
  if (!unitSize) return { value: '', unit: '' };
  const trimmed = unitSize.trim();
  const match = trimmed.match(/^([\d.]+)\s*(.*)$/);
  if (match) {
    const rawUnit = match[2].trim().toLowerCase();
    const unitMap: Record<string, string> = {
      g: 'Gram', gm: 'Gram', gram: 'Gram', grams: 'Gram',
      kg: 'Kilogram', kilogram: 'Kilogram', kilograms: 'Kilogram',
      t: 'Ton', ton: 'Ton', tons: 'Ton', tonne: 'Ton', tonnes: 'Ton',
    };
    return { value: match[1], unit: unitMap[rawUnit] || '' };
  }
  return { value: trimmed, unit: '' };
}

export default function PackingMasterPage() {
  const [uomOptions, setUomOptions] = useState<Option[]>([]);
  const [purchasePersonOptions, setPurchasePersonOptions] = useState<Option[]>([]);

  const loadPackingOptions = useCallback(async () => {
    try {
      const [uomsResponse, usersResponse] = await Promise.all([
        mastersApi.getUoms(),
        usersApi.getUsers({ page: 1, limit: 500, isActive: true }),
      ]);

      const uoms = Array.isArray(uomsResponse.data)
        ? uomsResponse.data
        : uomsResponse.data?.data || [];
      const users = usersResponse.data?.data || [];
      const purchaseUsers = users.filter(isPurchaseUser);
      const selectableUsers = purchaseUsers.length > 0 ? purchaseUsers : users;

      setUomOptions(uniqueOptions(
        uoms
          .map((uom: any) => optionFromText(uom.uomName || uom.uomCode || uom.name))
          .filter(Boolean) as Option[],
      ));
      setPurchasePersonOptions(uniqueOptions(
        selectableUsers
          .map((user: any) => optionFromText(user.name || user.email))
          .filter(Boolean) as Option[],
      ));
    } catch (error) {
      toast.error('Failed to load UOM or purchase person options');
    }
  }, []);

  return (
    <MastersCrudPage
      title="Packing Master"
      singularName="Packing"
      moduleName="packing"
      onBeforeOpenDialog={loadPackingOptions}
      transformItemForEdit={(item) => ({
        ...item,
        unitSizeValue: parseUnitSize(item.unitSize).value,
        unitSizeUnit: parseUnitSize(item.unitSize).unit,
      })}
      transformFormData={(data) => {
        const { unitSizeValue, unitSizeUnit, ...rest } = data as any;
        return {
          ...rest,
          unitSize: unitSizeValue && unitSizeUnit ? `${unitSizeValue} ${unitSizeUnit}` : unitSizeValue || '',
        };
      }}
      columns={[
        { key: 'packingCode', label: 'Code' },
        { key: 'packingName', label: 'Material Name' },
        { key: 'material', label: 'Description' },
        { key: 'unitSize', label: 'Unit Size' },
        { key: 'unitsPerCase', label: 'Pack Size' },
        { key: 'packingType', label: 'Material Type' },
        { key: 'uom', label: 'UOM' },
        { key: 'size', label: 'Size' },
        { key: 'purchasePersonName', label: 'Purchase Person' },
        {
          key: 'isActive',
          label: 'Status',
          render: (value: boolean) => (
            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
              value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {value ? 'Active' : 'Inactive'}
            </span>
          ),
        },
      ]}
      formFields={[
        { name: 'packingName', label: 'Material Name', type: 'text', required: true, placeholder: 'e.g., Printed Pouch' },
        { name: 'material', label: 'Material Description', type: 'text', required: true, placeholder: 'e.g., Printed laminated pouch' },
        { name: 'unitSizeValue', label: 'Unit Size', type: 'number', required: true, placeholder: 'e.g., 200', halfWidth: true },
        {
          name: 'unitSizeUnit',
          label: 'Unit',
          type: 'select',
          required: true,
          halfWidth: true,
          options: [
            { value: 'Gram', label: 'Gram' },
            { value: 'Kilogram', label: 'Kilogram' },
            { value: 'Ton', label: 'Ton' },
          ],
        },
        { name: 'unitsPerCase', label: 'Pack Size', type: 'number', required: true, placeholder: '12' },
        {
          name: 'packingType',
          label: 'Packing Material Type',
          type: 'select',
          required: true,
          options: [
            { value: 'Pouch', label: 'Pouch' },
            { value: 'Jar', label: 'Jar' },
            { value: 'Pre-Printed-Pouch', label: 'Pre-Printed-Pouch' },
            { value: 'Pre-Printed-Box', label: 'Pre-Printed-Box' },
            { value: 'Box', label: 'Box' },
            { value: 'Glass Bottle', label: 'Glass Bottle' },
            { value: 'Tin Pack', label: 'Tin Pack' },
            { value: 'Tray', label: 'Tray' },
            { value: 'Printed Mono Carton', label: 'Printed Mono Carton' },
            { value: 'Carton', label: 'Carton' },
            { value: 'TUB', label: 'TUB' },
            { value: 'PET', label: 'PET' },
            { value: 'HDPE JAR', label: 'HDPE JAR' },
            { value: 'Plastic Box', label: 'Plastic Box' },
            { value: 'Others', label: 'Others' },
          ],
        },
        {
          name: 'uom',
          label: 'UOM',
          type: 'select',
          required: true,
          options: uomOptions,
        },
        {
          name: 'size',
          label: 'Size',
          type: 'select',
          options: [
            { value: 'Small', label: 'Small' },
            { value: 'Medium', label: 'Medium' },
            { value: 'Large', label: 'Large' },
            { value: 'Extra Large', label: 'Extra Large' },
          ],
        },
        {
          name: 'purchasePersonName',
          label: 'Purchase Person Name',
          type: 'select',
          options: purchasePersonOptions,
        },
        { name: 'notes', label: 'Remarks', type: 'textarea', placeholder: 'Remarks' },
      ]}
    />
  );
}
