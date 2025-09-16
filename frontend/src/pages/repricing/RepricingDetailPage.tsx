import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import CustomMainBody from '../../components/common/CustomMainBody'
import CustomTable, { CustomColumn } from '../../components/common/CustomTable'
import { repricingsService } from '../../services/repricingsService'
import { productsService } from '../../services/productsService'
import { Button, Input } from '@heroui/react'
import { useNavigate, useParams } from 'react-router-dom'
import { BanknotesIcon, CubeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import ConfirmModal from '../../components/common/ConfirmModal'
import { useTranslation } from 'react-i18next'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Select, SelectItem } from '@heroui/react'

export default function RepricingDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const { t } = useTranslation()

  const { data: doc } = useQuery({ queryKey: ['repricing', id], queryFn: ()=> repricingsService.get(id!), enabled: !!id })

  const [term, setTerm] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [confirm, setConfirm] = useState<{ open: boolean; action?: 'approve'|'reject' }>(()=> ({ open:false }))
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkType, setBulkType] = useState<'supply'|'retail'>('supply')
  const [bulkMode, setBulkMode] = useState<'absolute'|'percent'>('absolute')
  const [bulkValue, setBulkValue] = useState<number>(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(()=> { setItems(doc?.items || []) }, [doc])

  // fetch products for the table, filter by term
  const { data: productPage } = useQuery({ queryKey: ['products-list', term], queryFn: ()=> productsService.list({ page:1, limit:1000, search: term }), placeholderData: (p)=> p })
  const productRows = useMemo(()=> ((productPage?.items||[]) as any[]).map((p:any)=> {
    const inDoc = (items||[]).find((x:any)=> x.product_id === p.id)
    const supply = inDoc?.supply_price ?? p.cost_price ?? 0
    const retail = inDoc?.retail_price ?? p.price ?? 0
    const markup = supply > 0 ? ((retail - supply) / supply) * 100 : 0
    const margin = retail > 0 ? ((retail - supply) / retail) * 100 : 0
    return {
      product_id: p.id,
      product_name: p.name,
      product_sku: p.sku,
      barcode: p.barcode,
      currency: 'UZS',
      old_supply: p.cost_price || 0,
      old_retail: p.price || 0,
      supply_price: supply,
      retail_price: retail,
      qty: p.stock || 0,
      markup,
      margin,
    }
  }), [productPage, items])

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => repricingsService.update(id!, payload),
    onSuccess: async ()=> { await qc.invalidateQueries({ queryKey: ['repricing', id] }); await qc.invalidateQueries({ queryKey: ['repricings'] }) }
  }) as any

  const save = () => {
    const payload = (items||[]).map((it:any)=> {
      const row:any = productRows.find((p:any)=> p.product_id === it.product_id) || {}
      return {
        product_id: it.product_id,
        product_name: row.product_name || it.product_name,
        product_sku: row.product_sku || it.product_sku,
        barcode: row.barcode || it.barcode,
        currency: row.currency || it.currency || 'UZS',
        supply_price: Number((it.supply_price ?? row.supply_price ?? row.old_supply) || 0),
        retail_price: Number((it.retail_price ?? row.retail_price ?? row.old_retail) || 0),
        qty: Number(row.qty ?? it.qty ?? 0),
      }
    })
    updateMutation.mutate({ items: payload })
  }
  const approve = () => setConfirm({ open:true, action:'approve' })
  const reject = () => setConfirm({ open:true, action:'reject' })
  const doConfirm = () => {
    if (confirm.action === 'approve') updateMutation.mutate({ action: 'approve' })
    if (confirm.action === 'reject') updateMutation.mutate({ action: 'reject' })
    setConfirm({ open:false })
  }

  // stats
  const relevantSupply = useMemo(()=> (doc?.type === 'delivery_price_change' ? (items||[]) : []).reduce((s:any, it:any)=> s + Number(it.qty||0) * Number(it.supply_price||0), 0), [items, doc?.type])
  const relevantRetail = useMemo(()=> (doc?.type === 'price_change' ? (items||[]) : []).reduce((s:any, it:any)=> s + Number(it.qty||0) * Number(it.retail_price||0), 0), [items, doc?.type])
  const totalChanged = useMemo(()=> (items||[]).filter((it:any)=> (it.supply_price ?? 0) !== (productRows.find((p:any)=> p.product_id===it.product_id)?.old_supply||0) || (it.retail_price ?? 0) !== (productRows.find((p:any)=> p.product_id===it.product_id)?.old_retail||0)).length, [items, productRows])

  const canEditSupply = doc?.type === 'delivery_price_change'
  const canEditRetail = doc?.type === 'price_change'

  // columns with type-aware labels
  const columns: CustomColumn[] = useMemo(()=> ([
    { uid: 'product_name', name: t('repricing.detail.table.name','Name'), className: 'min-w-[260px]' },
    { uid: 'product_sku', name: t('repricing.detail.table.sku','SKU') },
    { uid: 'barcode', name: t('repricing.detail.table.barcode','Barcode') },
    { uid: 'currency', name: t('repricing.detail.table.currency','Currency') },
    { uid: 'qty', name: t('repricing.detail.table.qty','Stock') },
    { uid: 'old_supply', name: doc?.type==='price_change' ? t('repricing.detail.table.supplier','Supply price') : t('repricing.detail.table.old_supply','Old supply price') },
    { uid: 'old_retail', name: doc?.type==='delivery_price_change' ? t('repricing.detail.table.retail','Retail price') : t('repricing.detail.table.old_retail','Old retail price') },
    { uid: 'supply_price', name: t('repricing.detail.table.new_supply','New supply price') },
    { uid: 'retail_price', name: t('repricing.detail.table.new_retail','New retail price') },
    { uid: 'markup', name: t('repricing.detail.table.markup','Markup') },
    { uid: 'margin', name: t('repricing.detail.table.margin','Margin %') },
  ]), [t, doc?.type])

  const renderCell = (row: any, key: string) => {
    switch (key) {
      case 'product_name':
        return <button className="text-primary underline-offset-2 hover:underline" onClick={()=> navigate(`/products/catalog/${row.product_id}/edit`)}>{row.product_name}</button>
      case 'old_supply':
      case 'old_retail':
      case 'markup':
      case 'margin':
      case 'qty':
        return key==='markup' || key==='margin' ? `${Number(row[key]||0).toFixed(2)} %` : Intl.NumberFormat('ru-RU').format(row[key]||0)
      case 'supply_price':
        return canEditSupply ? (
          <Input key={`sp-${row.product_id}`} type="number" value={String(row.supply_price??0)} onValueChange={(v)=> updateRow(row.product_id, 'supply_price', Number(v||0))} classNames={{ inputWrapper:'h-9' }} />
        ) : <span>{Intl.NumberFormat('ru-RU').format(row.supply_price||0)}</span>
      case 'retail_price':
        return canEditRetail ? (
          <Input key={`rp-${row.product_id}`} type="number" value={String(row.retail_price??0)} onValueChange={(v)=> updateRow(row.product_id, 'retail_price', Number(v||0))} classNames={{ inputWrapper:'h-9' }} />
        ) : <span>{Intl.NumberFormat('ru-RU').format(row.retail_price||0)}</span>
      default:
        return row[key]
    }
  }

  function updateRow(id: string, field: string, value: any) {
    if (doc?.status !== 'NEW') return
    setItems(prev => {
      const idx = prev.findIndex((x:any)=> x.product_id === id)
      if (idx >= 0) {
        if (prev[idx][field] === value) return prev
        const next=[...prev]; next[idx] = { ...next[idx], [field]: value }; return next
      }
      return [...prev, { product_id: id, [field]: value }]
    })
  }

  const rowClass = (row:any) => {
    const orig = productRows.find((p:any)=> p.product_id === row.product_id)
    if (!orig) return undefined
    const changed = (row.supply_price??orig.supply_price) !== orig.old_supply || (row.retail_price??orig.retail_price) !== orig.old_retail
    return changed ? 'bg-green-50' : undefined
  }

  // paginate
  const pagedRows = useMemo(()=> productRows.slice((page-1)*limit, (page-1)*limit + limit), [productRows, page, limit])
  const allowedBulkType: 'supply'|'retail' = (doc?.type === 'delivery_price_change') ? 'supply' : 'retail'

  return (
    <CustomMainBody>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">{doc?.name || t('repricing.header')}</h1>
        <div className="flex items-center gap-2">
          {doc?.status === 'APPROVED' ? (
            <span className="px-2 py-1 rounded text-xs bg-success-100 text-success-700">Finished</span>
          ) : doc?.status === 'REJECTED' ? (
            <span className="px-2 py-1 rounded text-xs bg-danger-100 text-danger-700">Rejected</span>
          ) : null}
          <Button color="primary" startContent={<ArrowLeftIcon className="w-4 h-4" />} onPress={()=> navigate('/products/repricing')}>{t('common.back','Back')}</Button>
          {doc?.status === 'NEW' && (<><Button color="danger" variant="flat" onPress={reject}>{t('repricing.detail.reject','Reject')}</Button><Button color="primary" onPress={approve}>{t('repricing.detail.approve','Finish')}</Button></>)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 mt-4">
        <div className="rounded-2xl bg-gray-900 border border-gray-700 p-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-200">{t('repricing.detail.shop','Shop')}</div>
            <div className="mt-1 text-xl font-semibold tracking-wide"><span className="text-blue-500">{doc?.shop_name || '-'}</span></div>
          </div>
          <div className="h-11 w-11 rounded-full bg-gray-800 flex items-center justify-center"><CubeIcon className="h-6 w-6 text-blue-500" /></div>
        </div>
        <div className="rounded-2xl bg-gray-900 border border-gray-700 p-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-200">{t('repricing.detail.qty_products','Product titles')}</div>
            <div className="mt-1 text-2xl font-semibold tracking-wide"><span className="text-blue-500">{totalChanged}</span></div>
          </div>
          <div className="h-11 w-11 rounded-full bg-gray-800 flex items-center justify-center"><CubeIcon className="h-6 w-6 text-blue-500" /></div>
        </div>
        {doc?.type === 'delivery_price_change' ? (
          <div className="rounded-2xl bg-gray-900 border border-gray-700 p-5 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-200">{t('repricing.detail.amount_supply','Supplier amount')}</div>
              <div className="mt-1 text-2xl font-semibold tracking-wide"><span className="text-blue-500">{Intl.NumberFormat('ru-RU').format(relevantSupply)}</span> <span className="text-gray-300 text-base ml-1">UZS</span></div>
            </div>
            <div className="h-11 w-11 rounded-full bg-gray-800 flex items-center justify-center"><BanknotesIcon className="h-6 w-6 text-blue-500" /></div>
          </div>
        ) : (
          <div className="rounded-2xl bg-gray-900 border border-gray-700 p-5 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-200">{t('repricing.detail.amount_retail','Retail amount')}</div>
              <div className="mt-1 text-2xl font-semibold tracking-wide"><span className="text-blue-500">{Intl.NumberFormat('ru-RU').format(relevantRetail)}</span> <span className="text-gray-300 text-base ml-1">UZS</span></div>
            </div>
            <div className="h-11 w-11 rounded-full bg-gray-800 flex items-center justify-center"><BanknotesIcon className="h-6 w-6 text-blue-500" /></div>
          </div>
        )}
        <div className="rounded-2xl bg-gray-900 border border-gray-700 p-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-200">{t('repricing.detail_texts.type','Repricing type')}</div>
            <div className="mt-1 text-2xl font-semibold tracking-wide">
              <span className="text-blue-500">
                {doc?.type === 'price_change' ? t('repricing.detail_texts.type_price','Change the retail price') : doc?.type === 'delivery_price_change' ? t('repricing.detail_texts.type_delivery','Change the supply price') : t('repricing.detail_texts.type_currency','Change currency')}
              </span>
            </div>
          </div>
          <div className="h-11 w-11 rounded-full bg-gray-800 flex items-center justify-center"><BanknotesIcon className="h-6 w-6 text-blue-500" /></div>
        </div>
      </div>

      <CustomTable
        columns={columns}
        items={pagedRows}
        total={productRows.length}
        page={page}
        limit={limit}
        renderCell={renderCell}
        onPageChange={(p)=> setPage(p)}
        onLimitChange={(l)=> { setLimit(l); setPage(1) }}
        searchValue={term}
        onSearchChange={setTerm}
        onSearchClear={()=> setTerm('')}
        getRowClassName={(r:any)=> rowClass(r)}
        rightAction={doc?.status === 'NEW' ? (<div className="flex gap-2">
          <Button variant="flat" isDisabled={selected.size===0} onPress={()=> setBulkOpen(true)}>Bulk repricing</Button>
          <Button color="primary" variant="flat" onPress={save} isLoading={updateMutation.isPending}>{t('repricing.detail.save','Save')}</Button>
        </div>) : null}
        selectable
        selectedKeys={selected as any}
        onSelectionChange={(k)=> setSelected(k as Set<string>)}
      />

      {/* Bulk repricing modal */}
      <Modal isOpen={bulkOpen} onOpenChange={setBulkOpen} size="2xl">
        <ModalContent>
          {(close)=> (
            <>
              <ModalHeader className="text-base">Bulk repricing</ModalHeader>
              <ModalBody>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select label="Type" isDisabled selectedKeys={new Set([allowedBulkType])}>
                    <SelectItem key="supply">Supply price</SelectItem>
                    <SelectItem key="retail">Retail price</SelectItem>
                  </Select>
                  <Select label="Mode" selectedKeys={new Set([bulkMode])} onSelectionChange={(k)=> setBulkMode(((k as Set<string>).values().next().value) as any)}>
                    <SelectItem key="absolute">Set absolute</SelectItem>
                    <SelectItem key="percent">Change %</SelectItem>
                  </Select>
                  <Input type="number" label={bulkMode==='percent'?'Percent %':'Value'} value={String(bulkValue)} onValueChange={(v)=> setBulkValue(Number(v||0))} />
                </div>
                <div className="text-sm text-default-500">Applies to selected items ({selected.size}).</div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={()=> close()}>Cancel</Button>
                <Button color="primary" onPress={()=>{
                  // apply in-memory changes to current page rows
                  setItems(prev=>{
                    const map = new Map(prev.map((x:any)=> [x.product_id, x]))
                    productRows.filter((r:any)=> (selected as any).has(r.product_id)).forEach((row:any)=>{
                      const current = map.get(row.product_id) || { product_id: row.product_id }
                      if (allowedBulkType==='supply') {
                        const base = current.supply_price ?? row.supply_price ?? row.old_supply ?? 0
                        const next = bulkMode==='absolute' ? bulkValue : Math.round(Number(base)* (1 + bulkValue/100))
                        current.supply_price = next
                      } else {
                        const base = current.retail_price ?? row.retail_price ?? row.old_retail ?? 0
                        const next = bulkMode==='absolute' ? bulkValue : Math.round(Number(base)* (1 + bulkValue/100))
                        current.retail_price = next
                      }
                      map.set(row.product_id, current)
                    })
                    return Array.from(map.values())
                  })
                  close()
                }}>Apply</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <ConfirmModal
        isOpen={confirm.open}
        title={confirm.action==='approve' ? t('repricing.detail.confirm_finish_title','Finish repricing?') : t('repricing.detail.confirm_reject_title','Reject repricing?')}
        description={confirm.action==='approve' ? t('repricing.detail.confirm_finish_desc','This will apply prices to products.') : t('repricing.detail.confirm_reject_desc','This will mark the repricing as rejected.')}
        confirmText={confirm.action==='approve' ? t('repricing.detail.approve','Finish') : t('repricing.detail.reject','Reject')}
        confirmColor={confirm.action==='approve' ? 'primary' : 'danger'}
        onConfirm={doConfirm}
        onClose={()=> setConfirm({ open:false })}
      />
    </CustomMainBody>
  )
} 