import { useEffect, useState } from 'react'
import useCurrency from '../../hooks/useCurrency'

export default function MoneyAt({ amount, date, className }: { amount: number; date?: string; className?: string }) {
  const { currency, format, formatAt } = useCurrency()
  const [text, setText] = useState<string>(() => format(Number(amount||0)))

  useEffect(() => {
    let mounted = true
    const run = async () => {
      try {
        if (date) {
          const s = await formatAt(Number(amount||0), date)
          if (mounted) setText(s)
        } else {
          const s = format(Number(amount||0))
          if (mounted) setText(s)
        }
      } catch {
        if (mounted) setText(format(Number(amount||0)))
      }
    }
    run()
    return () => { mounted = false }
  }, [amount, date, currency])

  return <span className={className}>{text}</span>
} 