import { useEffect, useMemo, useState } from 'react'
import CustomMainBody from '../../components/common/CustomMainBody'
import CustomTable, { CustomColumn } from '../../components/common/CustomTable'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { productsImportService } from '../../services/productsImportService'
import { useTranslation } from 'react-i18next'
import { ArchiveBoxArrowDownIcon, CubeIcon, BuildingStorefrontIcon, TagIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

function StatCard({ icon: Icon, title, value, suffix }: { icon: any; title: string; value: string | number; suffix?: string }) {
  return (
    <div className="rounded-2xl bg-gray-900 border border-gray-700 p-5 flex items-center justify-between">
      <div>
        <div className="text-sm text-gray-200">{title}</div>
        <div className="mt-2 text-2xl font-semibold tracking-wide"><span className="text-blue-500">{value}</span>{suffix ? <span className="text-gray-300 text-base ml-1">{suffix}</span> : null}</div>
      </div>
      <div className="h-11 w-11 rounded-full bg-gray-800 flex items-center justify-center"><Icon className="h-6 w-6 text-blue-500" /></div>
    </div>
  )
}

export default function ImportDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [imp, setImp] = useState<any>(null)

  useEffect(()=>{ (async()=>{ if (!id) return; try { const res = await productsImportService.get(id); setImp(res) } catch { setImp(null) } })() }, [id])

  const columns: CustomColumn[] = useMemo(()=> [
    { uid:'name', name: t('products.form.product_name') },
    { uid:'sku', name: 'SKU' },
    { uid:'barcode', name: t('products.form.barcode') },
    { uid:'qty', name: t('importPage.quantity') },
    { uid:'unit', name: t('products.form.unit') },
  ], [t])

  const items = useMemo(()=> (imp?.items||[]).map((it:any, i:number)=> ({ id: i+1, name: it.product_name, sku: it.product_sku, barcode: it.barcode, qty: it.qty, unit: it.unit, product_id: it.product_id })), [imp])

  const totals = useMemo(()=> ({
    titles: (imp?.items?.length || 0),
    units: (imp?.items || []).reduce((sum:number, it:any)=> sum + (Number(it?.qty||0)), 0),
  }), [imp])

  const renderCell = (item:any, key:string) => {
    if (key === 'name' && item.product_id) {
      return <Link to={`/products/catalog/${item.product_id}/edit`} className="text-primary hover:underline">{item.name}</Link>
    }
    return item[key]
  }

  const headerTitle = useMemo(()=> {
    const num = imp?.external_id ? String(imp.external_id) : (imp?.id ? String(imp.id) : '')
    const name = imp?.file_name || 'Import'
    return `Import ${num ? num : ''}${num ? ' — ' : ''}${name}`
  }, [imp])

  return (
    <CustomMainBody>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">{headerTitle}</h1>
        <button className="px-4 h-10 rounded-md bg-primary text-white inline-flex items-center gap-2" onClick={()=> navigate(-1)}>
          <ArrowLeftIcon className="w-4 h-4" />
          {t('products.form.back')}
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard icon={CubeIcon} title="Product titles" value={totals.titles} />
        <StatCard icon={ArchiveBoxArrowDownIcon} title="Product units" value={totals.units} />
        <StatCard icon={BuildingStorefrontIcon} title="Store" value={imp?.store_name || '-'} suffix="" />
        <StatCard icon={TagIcon} title="Type" value={imp?.import_type || 'EXPORT'} suffix="" />
      </div>

      <CustomTable columns={columns} items={items} total={items.length} page={1} limit={items.length||10} onPageChange={()=>{}} onLimitChange={()=>{}} searchValue={''} onSearchChange={()=>{}} onSearchClear={()=>{}} renderCell={renderCell} />
    </CustomMainBody>
  )
} 