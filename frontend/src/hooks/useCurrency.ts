export type SupportedCurrency = 'UZS' | 'USD'

import { useMemo, useCallback } from 'react'
import { usePreferences } from '../store/prefs'
import { ratesService } from '../services/ratesService'

export default function useCurrency() {
  const { prefs } = usePreferences()
  const currency: SupportedCurrency = (prefs.currency as SupportedCurrency) || 'UZS'
  const rate = Math.max(1, Math.round(Number(prefs.exchangeRate || 12000))) // UZS per 1 USD

  const nfUZS = useMemo(()=> new Intl.NumberFormat('en-US'), [])
  const nfUSD = useMemo(()=> new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), [])

  const toUSD = (amountUZS: number, r:number=rate) => r > 0 ? (amountUZS / r) : amountUZS
  const toUZS = (amountUSD: number, r:number=rate) => amountUSD * r

  const format = (amountUZS: number) => {
    const amt = Number(amountUZS || 0)
    if (currency === 'USD') {
      return nfUSD.format(toUSD(amt)) + ' USD'
    }
    return nfUZS.format(amt) + ' UZS'
  }

  const toDisplay = (amountUZS: number) => (currency === 'USD' ? toUSD(amountUZS) : amountUZS)
  const toBaseUZS = (amountDisplay: number) => (currency === 'USD' ? toUZS(amountDisplay) : Number(amountDisplay || 0))
  const getSymbol = () => currency

  // Historical formatting by ISO timestamp/date
  const getRateAt = useCallback(async (isoDate: string): Promise<number> => {
    try {
      const rateAt = await ratesService.getAt(isoDate)
      return Math.max(1, Math.round(Number(rateAt?.rate || rate)))
    } catch {
      return rate
    }
  }, [rate])

  const formatAt = useCallback(async (amountUZS: number, isoDate: string): Promise<string> => {
    const r = await getRateAt(isoDate)
    if (currency === 'USD') {
      return nfUSD.format(toUSD(Number(amountUZS||0), r)) + ' USD'
    }
    return nfUZS.format(Number(amountUZS||0)) + ' UZS'
  }, [currency, nfUSD, nfUZS, getRateAt])

  return { currency, rate, format, toDisplay, toBaseUZS, getSymbol, getRateAt, formatAt }
} 