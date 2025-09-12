export type LaborRateItem = { key: string; name: string; price: number }

export const LABOR_RATES: LaborRateItem[] = [
  { key: 'MECHANICAL', name: 'MECHANICAL (company default)', price: 110 },
  { key: 'ADAPTER_INSTALLATION', name: 'ADAPTER INSTALLATION', price: 1400 },
  { key: 'ALIGNMENT', name: 'ALIGNMENT', price: 299.99 },
  { key: 'BALANCING', name: 'BALANCING', price: 40 },
  { key: 'BODY_SHOP', name: 'Body Shop', price: 125 },
  { key: 'BOLT_CUT_FEE', name: 'Bolt Cut Fee', price: 10 },
  { key: 'COMPUTER_DIAGNOSTIC', name: 'COMPUTER DIAGNOSTIC', price: 100 },
  { key: 'DETAIL', name: 'DETAIL', price: 150 },
  { key: 'DPF_CLEANING', name: 'DPF CLEANING', price: 550 },
  { key: 'EGR_CLEANING', name: 'EGR CLEANING', price: 550 },
  { key: 'ELITE', name: 'ELITE', price: 99 },
  { key: 'IDLE_SHUT_DOWN', name: 'IDLE SHUT DOWN', price: 90 },
  { key: 'INSPECTION', name: 'INSPECTION', price: 90 },
  { key: 'INTERNAL', name: 'Internal', price: 0 },
  { key: 'KENWORTH_DPF_CLEANING', name: 'KENWORTH DPF CLEANING', price: 820 },
  { key: 'PROGRAMMING_EVENT', name: 'PROGRAMMING EVENT', price: 350 },
  { key: 'RECHARGE_AND_RECOVERY', name: 'RECHARGE AND RECOVERY', price: 200 },
  { key: 'REGEN', name: 'REGEN', price: 100 },
  { key: 'ROAD_CALL', name: 'ROAD CALL', price: 165 },
  { key: 'SHOCK_INSTALLATION', name: 'Shock Installation', price: 45 },
  { key: 'SPEED_LIMIT_ADJUSTMENT', name: 'SPEED LIMIT ADJUSTMENT', price: 90 },
  { key: 'STORAGE_PARKING', name: 'STORAGE / PARKING', price: 50 },
  { key: 'TIRE_DISPOSAL_FEE', name: 'TIRE DISPOSAL FEE', price: 10 },
  { key: 'TIRE_INSTALLATION', name: 'Tire Installation', price: 45 },
  { key: 'TIRE_PATCH', name: 'TIRE PATCH', price: 70 },
  { key: 'TIRE_ROTATION', name: 'TIRE ROTATION', price: 20 },
  { key: 'TRAILER_ALIGNMENT', name: 'TRAILER ALIGNMENT', price: 199.99 },
  { key: 'TRANSMISSION_CALIBRATION', name: 'TRANSMISSION CALIBRATION', price: 125 },
  { key: 'TRUCK_WASH', name: 'TRUCK WASH', price: 100 },
  { key: 'TRUCK_WASH_WITH_DETAIL', name: 'TRUCK WASH W/ DETAIL', price: 250 },
  { key: 'VOLVO_UPDATE', name: 'VOLVO UPDATE', price: 150 },
  { key: 'WINDSHIELD_REPLACEMENT', name: 'WINDSHIELD REPLACEMENT', price: 100 },
]

export function formatLaborRateLabel(item: LaborRateItem) {
  const priceStr = new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(item.price)
  return `${item.name} — $${priceStr}`
} 