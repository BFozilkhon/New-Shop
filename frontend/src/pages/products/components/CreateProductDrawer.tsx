import CustomDrawer from '../../../components/common/CustomDrawer'
import ProductCreatePage from '../../products/ProductCreatePage'

export default function CreateProductDrawer({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (v:boolean)=>void }) {
  return (
    <CustomDrawer isOpen={isOpen} onOpenChange={onOpenChange} title={'Create product'} widthClass="w-full">
      <div className="p-4">
        <ProductCreatePage embedded onClose={() => onOpenChange(false)} />
      </div>
    </CustomDrawer>
  )
} 