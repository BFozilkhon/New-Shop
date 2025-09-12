import { useEffect } from 'react'
import { Tab, Tabs } from '@heroui/react'
import { useSearchParams } from 'react-router-dom'
import CustomMainBody from '../../components/common/CustomMainBody'
import CategoriesTab from './components/CategoriesTab'
import AttributesTab from './components/AttributesTab'
import CharacteristicsTab from './components/CharacteristicsTab'
import BrandsTab from './components/BrandsTab'
import { useAuth } from '../../store/auth'
import { useTranslation } from 'react-i18next'

// Tab Icons
export const CategoriesIcon = (props: any) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="24"
      role="presentation"
      viewBox="0 0 24 24"
      width="24"
      {...props}
    >
      <path
        d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export const AttributesIcon = (props: any) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="24"
      role="presentation"
      viewBox="0 0 24 24"
      width="24"
      {...props}
    >
      <path
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="8" r="2" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M12 10v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M8 16h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export const CharacteristicsIcon = (props: any) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="24"
      role="presentation"
      viewBox="0 0 24 24"
      width="24"
      {...props}
    >
      <path
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export const BrandsIcon = (props: any) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="24"
      role="presentation"
      viewBox="0 0 24 24"
      width="24"
      {...props}
    >
      <path
        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 21v-7a2 2 0 00-2-2H10a2 2 0 00-2 2v7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function CatalogManagementPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { auth } = useAuth()
  const can = (p: string) => auth.permissions.includes(p)

  // Get current tab from URL params
  const currentTab = searchParams.get('tab') || 'categories'

  // Check if user has access to any catalog management features
  const hasAnyAccess = can('products.categories.access') || can('products.attributes.access') || can('products.characteristics.access') || can('products.brands.access')

  // Determine available tabs based on permissions
  const availableTabs: string[] = []
  if (can('products.categories.access')) availableTabs.push('categories')
  if (can('products.attributes.access')) availableTabs.push('attributes')
  if (can('products.characteristics.access')) availableTabs.push('characteristics')
  if (can('products.brands.access')) availableTabs.push('brands')

  // Set default tab to first available tab if current tab is not accessible
  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.includes(currentTab)) {
      setSearchParams({ tab: availableTabs[0] })
    }
  }, [availableTabs, currentTab, setSearchParams])

  if (!hasAnyAccess) {
    return (
      <CustomMainBody>
        <h1 className="text-xl font-semibold">{t('catalog.header')}</h1>
        <div className="mt-6 text-default-500">{t('catalog.no_access')}</div>
      </CustomMainBody>
    )
  }

  const handleTabChange = (key: string) => {
    setSearchParams({ tab: key })
  }

  return (
    <CustomMainBody>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">{t('catalog.header')}</h1>
      </div>

      <div className="flex w-full flex-col">
        <Tabs 
          aria-label={t('catalog.aria')}
          color="primary" 
          variant="bordered"
          selectedKey={currentTab}
          onSelectionChange={(key) => handleTabChange(key as string)}
          className="w-full"
          classNames={{
            tabList: "w-full h-14",
            tab: "h-12"
          }}
        >
          {can('products.categories.access') && (
            <Tab
              key="categories"
              title={
                <div className="flex items-center space-x-2">
                  <CategoriesIcon />
                  <span>{t('catalog.tabs.categories')}</span>
                </div>
              }
            >
              <div className="mt-6">
                <CategoriesTab />
              </div>
            </Tab>
          )}
          
          {can('products.attributes.access') && (
            <Tab
              key="attributes"
              title={
                <div className="flex items-center space-x-2">
                  <AttributesIcon />
                  <span>{t('catalog.tabs.attributes')}</span>
                </div>
              }
            >
              <div className="mt-6">
                <AttributesTab />
              </div>
            </Tab>
          )}
          
          {can('products.characteristics.access') && (
            <Tab
              key="characteristics"
              title={
                <div className="flex items-center space-x-2">
                  <CharacteristicsIcon />
                  <span>{t('catalog.tabs.characteristics')}</span>
                </div>
              }
            >
              <div className="mt-6">
                <CharacteristicsTab />
              </div>
            </Tab>
          )}
          
          {can('products.brands.access') && (
            <Tab
              key="brands"
              title={
                <div className="flex items-center space-x-2">
                  <BrandsIcon />
                  <span>{t('catalog.tabs.brands')}</span>
                </div>
              }
            >
              <div className="mt-6">
                <BrandsTab />
              </div>
            </Tab>
          )}
        </Tabs>
      </div>
    </CustomMainBody>
  )
} 