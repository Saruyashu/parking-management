export const categories = {
  staff: { color: '#7B68EE', label: 'Staff Wages' },
  utilities: { color: '#4ECDC4', label: 'Utilities' },
  maintenance: { color: '#F7B731', label: 'Maintenance' },
  security: { color: '#5A8FBF', label: 'Security' },
  rent: { color: '#A29BFE', label: 'Rent' },
  vendor: { color: '#FD79A8', label: 'Vendor' },
  tax: { color: '#00B894', label: 'Tax' },
  equipment: { color: '#E17055', label: 'Equipment' },
  other: { color: '#636e72', label: 'Other' },
};

export type CategoryKey = keyof typeof categories;