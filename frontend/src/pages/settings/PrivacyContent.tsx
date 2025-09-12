import { useTranslation } from 'react-i18next'

export default function PrivacyContent() {
  const { t } = useTranslation()
  return (
    <div className="prose max-w-none text-default-700">
      <nav className="mb-6">
        <strong>{t('profile.privacy.contents')}</strong>
        <ul className="mt-2 list-disc list-inside">
          <li><a href="#overview" className="text-primary">{t('profile.privacy.sections.overview')}</a></li>
          <li><a href="#collected-information" className="text-primary">{t('profile.privacy.sections.collected')}</a></li>
          <li><a href="#how-we-use-data" className="text-primary">{t('profile.privacy.sections.use')}</a></li>
          <li><a href="#sharing-and-disclosure" className="text-primary">{t('profile.privacy.sections.sharing')}</a></li>
          <li><a href="#data-retention" className="text-primary">{t('profile.privacy.sections.retention')}</a></li>
          <li><a href="#security" className="text-primary">{t('profile.privacy.sections.security')}</a></li>
          <li><a href="#payment-data" className="text-primary">{t('profile.privacy.sections.payment')}</a></li>
          <li><a href="#international-transfers" className="text-primary">{t('profile.privacy.sections.transfers')}</a></li>
          <li><a href="#your-choices" className="text-primary">{t('profile.privacy.sections.choices')}</a></li>
          <li><a href="#contact" className="text-primary">{t('profile.privacy.sections.contact')}</a></li>
        </ul>
      </nav>

      <section id="overview" className="mb-6">
        <h3>{t('profile.privacy.sections.overview')}</h3>
        <p>{t('profile.privacy.text.overview')}</p>
      </section>

      <section id="collected-information" className="mb-6">
        <h3>{t('profile.privacy.sections.collected')}</h3>
        <p>{t('profile.privacy.text.collected')}</p>
      </section>

      <section id="how-we-use-data" className="mb-6">
        <h3>{t('profile.privacy.sections.use')}</h3>
        <p>{t('profile.privacy.text.use.p1')}</p>
        <ul className="list-disc list-inside">
          <li>{t('profile.privacy.text.use.li1')}</li>
          <li>{t('profile.privacy.text.use.li2')}</li>
          <li>{t('profile.privacy.text.use.li3')}</li>
          <li>{t('profile.privacy.text.use.li4')}</li>
        </ul>
      </section>

      <section id="sharing-and-disclosure" className="mb-6">
        <h3>{t('profile.privacy.sections.sharing')}</h3>
        <p>{t('profile.privacy.text.sharing')}</p>
      </section>

      <section id="data-retention" className="mb-6">
        <h3>{t('profile.privacy.sections.retention')}</h3>
        <p>{t('profile.privacy.text.retention')}</p>
      </section>

      <section id="security" className="mb-6">
        <h3>{t('profile.privacy.sections.security')}</h3>
        <p>{t('profile.privacy.text.security')}</p>
      </section>

      <section id="payment-data" className="mb-6">
        <h3>{t('profile.privacy.sections.payment')}</h3>
        <p>{t('profile.privacy.text.payment')}</p>
      </section>

      <section id="international-transfers" className="mb-6">
        <h3>{t('profile.privacy.sections.transfers')}</h3>
        <p>{t('profile.privacy.text.transfers')}</p>
      </section>

      <section id="your-choices" className="mb-6">
        <h3>{t('profile.privacy.sections.choices')}</h3>
        <p>{t('profile.privacy.text.choices')}</p>
      </section>

      <section id="contact" className="mb-6">
        <h3>{t('profile.privacy.sections.contact')}</h3>
        <p>{t('profile.privacy.text.contact')}</p>
      </section>
    </div>
  )
} 