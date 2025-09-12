import { useState } from 'react'
import { Button } from '@heroui/react'
import { CheckIcon } from '@heroicons/react/24/outline'
import AddPaymentModal from './AddPaymentModal'
import { useTranslation } from 'react-i18next'

export default function PricingPlans() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  const plans = [
    {
      key: 'free',
      title: t('profile.billing.plans.free.title'),
      price: t('profile.billing.plans.free.price'),
      subtitle: t('profile.billing.plans.free.subtitle'),
      features: t('profile.billing.plans.free.features', { returnObjects: true }) as string[],
      cta: { label: t('profile.billing.plans.free.cta'), variant: 'flat' as const },
    },
    {
      key: 'pro',
      title: t('profile.billing.plans.pro.title'),
      price: t('profile.billing.plans.pro.price'),
      subtitle: t('profile.billing.plans.pro.subtitle'),
      features: t('profile.billing.plans.pro.features', { returnObjects: true }) as string[],
      cta: { label: t('profile.billing.plans.pro.cta'), variant: 'primary' as const },
      highlighted: true,
    },
    {
      key: 'team',
      title: t('profile.billing.plans.team.title'),
      price: t('profile.billing.plans.team.price'),
      subtitle: t('profile.billing.plans.team.subtitle'),
      features: t('profile.billing.plans.team.features', { returnObjects: true }) as string[],
      cta: { label: t('profile.billing.plans.team.cta'), variant: 'flat' as const },
    },
  ]

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => {
          const isHighlighted = (p as any).highlighted
          return (
            <div
              key={p.key}
              className={`rounded-lg border p-6 flex flex-col justify-between ${
                isHighlighted ? 'border-primary-500 ring-2 ring-primary-100' : 'border-default-200'
              }`}
            >
              <div>
                <div className="text-sm font-medium text-default-500">{p.title}</div>
                <div className="mt-3">
                  <div className="text-4xl font-bold leading-none">
                    <span>{p.price}</span>{' '}
                    {p.subtitle ? <span className="text-lg font-normal text-default-500">{p.subtitle}</span> : null}
                  </div>
                </div>

                <ul className="mt-6 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-default-600">
                      <CheckIcon className="w-5 h-5 text-primary-500 mt-1" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6">
                {(p as any).cta.variant === 'primary' ? (
                  <Button color="primary" onPress={() => setOpen(true)} className="w-full h-11">
                    {(p as any).cta.label}
                  </Button>
                ) : (
                  <Button variant="flat" className="w-full h-11">{(p as any).cta.label}</Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <AddPaymentModal isOpen={open} onOpenChange={(v: boolean) => setOpen(v)} />
    </>
  )
} 