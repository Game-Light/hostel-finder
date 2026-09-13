// Single source of truth for room types, facilities, areas, and durations.
// Previously these were copy-pasted independently in ~7 different files —
// changing a label meant hunting down every copy or risking silent drift.

export const ROOM_TYPE_LABELS: Record<string, string> = {
  self_contain: 'Self-contain',
  single: 'Single Room',
  shared: 'Shared Room',
  mini_flat: 'Mini Flat',
}

export const ROOM_TYPE_LABEL_TO_DB: Record<string, string> = {
  'Self-contain': 'self_contain',
  'Single Room': 'single',
  'Shared Room': 'shared',
  'Mini Flat': 'mini_flat',
}

export const ROOM_TYPE_BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  'Self-contain': { bg: '#DCFCE7', text: '#166534' },
  'Single Room':  { bg: '#DBEAFE', text: '#1E40AF' },
  'Shared Room':  { bg: '#FEF3C7', text: '#92400E' },
  'Mini Flat':    { bg: '#EDE9FE', text: '#5B21B6' },
}

// Used by the public listings page's "room type" filter dropdown
export const ROOM_TYPE_FILTER_OPTIONS = ['All', 'Self-contain', 'Single Room', 'Shared Room', 'Mini Flat']

// Used by agent create/edit listing form <select> dropdowns
export const ROOM_TYPE_FORM_OPTIONS = [
  { value: 'self_contain', label: 'Self-contain' },
  { value: 'single',       label: 'Single Room' },
  { value: 'shared',       label: 'Shared Room' },
  { value: 'mini_flat',    label: 'Mini Flat' },
]

export const FACILITIES = [
  'Running water', 'Electricity', 'Prepaid meter',
  'Security', 'Parking', 'Wi-Fi', 'Fence/gate', 'Borehole',
]

export const FACILITY_ICONS: Record<string, string> = {
  'Running water': '💧', 'Electricity': '⚡', 'Prepaid meter': '🔌',
  'Security': '🔒', 'Parking': '🚗', 'Wi-Fi': '📶',
  'Fence/gate': '🏠', 'Borehole': '🚰',
}

export const DISTANCE_OPTIONS = [
  'Walking distance', '5 mins walk', '10 mins walk', '15+ mins walk',
]

export const FUOYE_AREAS = [
  'Oye Town', 'School Road', 'Behind Campus', 'Ikole Road', 'New Site', 'Other',
]

export const RENT_DURATIONS = [
  { value: '12', label: '12 months (1 year)' },
  { value: '6',  label: '6 months' },
  { value: 'other', label: 'Other' },
]