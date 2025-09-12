import CustomBreadcrumbs from '../../components/common/CustomBreadcrumbs'

export default function CustomPlaceholder() {
  return (
    <div className="space-y-4">
      <CustomBreadcrumbs />
      <div className="text-2xl font-semibold">Coming soon</div>
      <p className="text-default-500">This page is under construction.</p>
    </div>
  )
} 