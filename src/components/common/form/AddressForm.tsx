// ==============================================================================
// SWARRNIM UNIVERSITY ERP — STANDARDIZED ADDRESS FORM COMPONENT
// ==============================================================================

import React, { useState } from 'react';
import { MapPin, Copy, Check } from 'lucide-react';
import { TextInput } from './TextInput';
import { SelectInput } from './SelectInput';
import { Checkbox } from './Checkbox';

export interface AddressData {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  district?: string;
  state: string;
  country?: string;
  pincode: string;
}

export interface AddressFormProps {
  currentAddress: AddressData;
  onCurrentAddressChange: (data: AddressData) => void;
  permanentAddress?: AddressData;
  onPermanentAddressChange?: (data: AddressData) => void;
  showPermanentAddress?: boolean;
  required?: boolean;
  disabled?: boolean;
}

const INDIAN_STATES = [
  'Gujarat', 'Maharashtra', 'Rajasthan', 'Madhya Pradesh', 'Delhi', 
  'Karnataka', 'Tamil Nadu', 'Uttar Pradesh', 'Punjab', 'Haryana', 
  'Bihar', 'West Bengal', 'Kerala', 'Telangana', 'Andhra Pradesh', 
  'Odisha', 'Assam', 'Goa', 'Jharkhand', 'Chhattisgarh', 'Other'
];

export const AddressForm: React.FC<AddressFormProps> = ({
  currentAddress,
  onCurrentAddressChange,
  permanentAddress,
  onPermanentAddressChange,
  showPermanentAddress = true,
  required = true,
  disabled = false
}) => {
  const [sameAsCurrent, setSameAsCurrent] = useState(false);

  const handleCurrentChange = (field: keyof AddressData, value: string) => {
    const updated = { ...currentAddress, [field]: value };
    onCurrentAddressChange(updated);
    if (sameAsCurrent && onPermanentAddressChange) {
      onPermanentAddressChange(updated);
    }
  };

  const handlePermanentChange = (field: keyof AddressData, value: string) => {
    if (!onPermanentAddressChange) return;
    onPermanentAddressChange({
      ...permanentAddress,
      [field]: value
    } as AddressData);
  };

  const handleToggleSame = (checked: boolean) => {
    setSameAsCurrent(checked);
    if (checked && onPermanentAddressChange) {
      onPermanentAddressChange({ ...currentAddress });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Current Address Section */}
      <div>
        <h4 style={{
          fontSize: '0.875rem',
          fontWeight: 800,
          color: 'var(--brand-navy, #0B192C)',
          marginBottom: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <MapPin size={16} color="var(--brand-orange, #F37023)" /> Current Address
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <TextInput
              label="Address Line 1"
              value={currentAddress.addressLine1}
              onValueChange={(val) => handleCurrentChange('addressLine1', val)}
              placeholder="Flat/House No., Building, Street Name"
              required={required}
              disabled={disabled}
            />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <TextInput
              label="Address Line 2 (Optional)"
              value={currentAddress.addressLine2 || ''}
              onValueChange={(val) => handleCurrentChange('addressLine2', val)}
              placeholder="Landmark, Area, Sector"
              requirement="OPTIONAL"
              disabled={disabled}
            />
          </div>

          <TextInput
            label="City / Village"
            value={currentAddress.city}
            onValueChange={(val) => handleCurrentChange('city', val)}
            placeholder="e.g. Gandhinagar"
            required={required}
            disabled={disabled}
          />

          <TextInput
            label="District"
            value={currentAddress.district || ''}
            onValueChange={(val) => handleCurrentChange('district', val)}
            placeholder="e.g. Gandhinagar"
            requirement="OPTIONAL"
            disabled={disabled}
          />

          <SelectInput
            label="State"
            value={currentAddress.state || 'Gujarat'}
            onValueChange={(val) => handleCurrentChange('state', val)}
            options={INDIAN_STATES}
            required={required}
            disabled={disabled}
          />

          <TextInput
            label="Pincode"
            value={currentAddress.pincode}
            onValueChange={(val) => handleCurrentChange('pincode', val)}
            placeholder="6-digit Pincode (e.g. 382421)"
            maxLength={6}
            required={required}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Permanent Address Section */}
      {showPermanentAddress && onPermanentAddressChange && (
        <div style={{ borderTop: '1px solid var(--border-color, #E2E8F0)', paddingTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h4 style={{
              fontSize: '0.875rem',
              fontWeight: 800,
              color: 'var(--brand-navy, #0B192C)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <MapPin size={16} color="var(--brand-orange, #F37023)" /> Permanent Address
            </h4>

            <Checkbox
              label="Permanent same as Current Address"
              checked={sameAsCurrent}
              onCheckedChange={handleToggleSame}
              disabled={disabled}
            />
          </div>

          {!sameAsCurrent && permanentAddress && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <TextInput
                  label="Address Line 1"
                  value={permanentAddress.addressLine1}
                  onValueChange={(val) => handlePermanentChange('addressLine1', val)}
                  placeholder="Flat/House No., Building, Street Name"
                  required={required}
                  disabled={disabled}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <TextInput
                  label="Address Line 2 (Optional)"
                  value={permanentAddress.addressLine2 || ''}
                  onValueChange={(val) => handlePermanentChange('addressLine2', val)}
                  placeholder="Landmark, Area, Sector"
                  requirement="OPTIONAL"
                  disabled={disabled}
                />
              </div>

              <TextInput
                label="City / Village"
                value={permanentAddress.city}
                onValueChange={(val) => handlePermanentChange('city', val)}
                placeholder="e.g. Ahmedabad"
                required={required}
                disabled={disabled}
              />

              <TextInput
                label="District"
                value={permanentAddress.district || ''}
                onValueChange={(val) => handlePermanentChange('district', val)}
                placeholder="e.g. Ahmedabad"
                requirement="OPTIONAL"
                disabled={disabled}
              />

              <SelectInput
                label="State"
                value={permanentAddress.state || 'Gujarat'}
                onValueChange={(val) => handlePermanentChange('state', val)}
                options={INDIAN_STATES}
                required={required}
                disabled={disabled}
              />

              <TextInput
                label="Pincode"
                value={permanentAddress.pincode}
                onValueChange={(val) => handlePermanentChange('pincode', val)}
                placeholder="6-digit Pincode"
                maxLength={6}
                required={required}
                disabled={disabled}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
