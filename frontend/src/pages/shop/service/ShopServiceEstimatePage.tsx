import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { shopServicesService } from '../../../services/shopServicesService'
import { shopCustomersService } from '../../../services/shopCustomersService'

export default function ShopServiceEstimatePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const svc = useQuery({ queryKey: ['shop_service_estimate', id], enabled: !!id, queryFn: ()=> shopServicesService.get(id!) })
  const cust = useQuery({ queryKey: ['shop_customer_for_est', svc.data?.customer_id], enabled: !!svc.data?.customer_id, queryFn: ()=> shopCustomersService.get(svc.data!.customer_id) })
  const contact = useQuery({ queryKey: ['shop_contact_for_est', svc.data?.contact_id], enabled: !!svc.data?.contact_id, queryFn: ()=> shopCustomersService.getContact(svc.data!.contact_id) })
  const unit = useQuery({ queryKey: ['shop_unit_for_est', svc.data?.unit_id], enabled: !!svc.data?.unit_id, queryFn: ()=> shopCustomersService.getUnit(svc.data!.unit_id) })

  const handlePrint = () => { window.print() }
  const handleDownload = () => { window.print() }

  const serviceGroups = useMemo(()=> (svc.data?.items||[]).map(it=>({
    title: it.title,
    qty: it.labor_hours||0,
    rate: it.labor_rate||0,
    amount: (it.labor_hours||0)*(it.labor_rate||0),
    parts: (it.parts||[]).map(p=>({ name: p.name, qty: p.quantity, rate: p.price, amount: (p.quantity||0)*(p.price||0) }))
  })), [svc.data])

  const extras = svc.data?.extras||[]

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b print:hidden">
        <div className="mx-auto max-w-[900px] px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-semibold">Estimate #{svc.data?.estimate_number || ''}</h1>
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded-md border text-foreground hover:bg-foreground/5" onClick={()=> navigate(-1)}>Back</button>
            <button className="px-3 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90" onClick={handlePrint}>Print</button>
            <button className="px-3 py-2 rounded-md border text-foreground hover:bg-foreground/5" onClick={handleDownload}>Download PDF</button>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-[900px] px-6 py-6 print:px-0 print:mx-0">
        <div className="hidden print:block mb-4">
          <h1 className="text-2xl font-bold">Estimate #{svc.data?.estimate_number || ''}</h1>
          <div className="text-sm">{new Date().toLocaleDateString()}</div>
        </div>
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-1 text-sm">
            <div className="font-semibold">{cust.data?.company_name || '-'}</div>
            <div>{contact.data ? `${contact.data.first_name}${contact.data.last_name? ' '+contact.data.last_name:''}` : '-'}</div>
            <div>{contact.data?.phone || contact.data?.cell_phone || '-'}</div>
            <div>{contact.data?.email || '-'}</div>
          </div>
          <div className="text-right text-sm">
            <div className="font-semibold">Unit</div>
            <div>#{unit.data?.unit_number || unit.data?.vin || '-'}</div>
            <div>{[unit.data?.year, unit.data?.make, unit.data?.model].filter(Boolean).join(' ')}</div>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-y">
              <th className="text-left py-2 w-[50%]">Description</th>
              <th className="text-right py-2 w-[15%]">Quantity</th>
              <th className="text-right py-2 w-[15%]">Rate</th>
              <th className="text-right py-2 w-[20%]">Amount</th>
            </tr>
          </thead>
          <tbody>
            {serviceGroups.map((g, i)=> (
              <>
                <tr key={`svc-${i}`} className="border-b">
                  <td className="py-2 font-semibold">{g.title || '-'}</td>
                  <td className="text-right py-2">{g.qty}</td>
                  <td className="text-right py-2">{g.rate}</td>
                  <td className="text-right py-2">{g.amount.toFixed(2)}</td>
                </tr>
                {g.parts.map((p, j)=> (
                  <tr key={`svc-${i}-p-${j}`} className="">
                    <td className="py-2 pl-6 text-foreground/90">{p.name}</td>
                    <td className="text-right py-2">{p.qty}</td>
                    <td className="text-right py-2">{p.rate}</td>
                    <td className="text-right py-2">{p.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </>
            ))}
            {extras.length>0 && (
              <tr className="border-t">
                <td className="py-2 font-medium">Misc</td>
                <td></td><td></td><td></td>
              </tr>
            )}
            {extras.map((e, idx)=> (
              <tr key={`ex-${idx}`}>
                <td className="py-2 pl-6">{e.name}</td>
                <td className="text-right py-2">—</td>
                <td className="text-right py-2">—</td>
                <td className="text-right py-2">{(e.amount||0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="grid grid-cols-2 mt-6">
          <div></div>
          <div className="text-sm space-y-1">
            <div className="flex justify-between"><span>Shop Supplies</span><span>${(svc.data?.shop_supplies||0).toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Labor</span><span>${(svc.data?.labor_total||0).toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Parts</span><span>${(svc.data?.parts_total||0).toFixed(2)}</span></div>
            {extras.length>0 && <div className="flex justify-between"><span>Misc</span><span>${(svc.data?.extras_total||0).toFixed(2)}</span></div>}
            <div className="flex justify-between font-medium border-t pt-1"><span>Subtotal</span><span>${(svc.data?.subtotal||0).toFixed(2)}</span></div>
            <div className="flex justify-between"><span>{svc.data?.tax_location==='LOCAL'?'Local 7.5%':'Exempt 0%'}</span><span>${(svc.data?.tax_amount||0).toFixed(2)}</span></div>
            <div className="flex justify-between font-semibold text-base mt-1"><span>Total</span><span>${(svc.data?.total||0).toFixed(2)}</span></div>
          </div>
        </div>

        <style>{`@media print { @page { size: A4; margin: 12mm; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .border-b, .border-t, .border-y { border-color: #000 !important } }`}</style>
      </div>
    </div>
  )
} 