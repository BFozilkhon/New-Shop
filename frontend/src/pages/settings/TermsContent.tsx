import { useTranslation } from 'react-i18next'

export default function TermsContent() {
  const { t } = useTranslation()
  return (
    <div className="prose max-w-none text-default-700">
      <nav className="mb-6">
        <strong>{t('profile.terms.contents')}</strong>
        <ul className="mt-2 list-disc list-inside">
          <li><a href="#acceptance" className="text-primary">{t('profile.terms.sections.acceptance')}</a></li>
          <li><a href="#license" className="text-primary">{t('profile.terms.sections.license')}</a></li>
          <li><a href="#billing-terms" className="text-primary">{t('profile.terms.sections.billing')}</a></li>
          <li><a href="#intellectual-property" className="text-primary">{t('profile.terms.sections.ip')}</a></li>
          <li><a href="#warranties" className="text-primary">{t('profile.terms.sections.warranties')}</a></li>
          <li><a href="#liability" className="text-primary">{t('profile.terms.sections.liability')}</a></li>
          <li><a href="#termination" className="text-primary">{t('profile.terms.sections.termination')}</a></li>
          <li><a href="#governing-law" className="text-primary">{t('profile.terms.sections.law')}</a></li>
          <li><a href="#changes" className="text-primary">{t('profile.terms.sections.changes')}</a></li>
          <li><a href="#contact" className="text-primary">{t('profile.terms.sections.contact')}</a></li>
        </ul>
      </nav>

      <section id="acceptance" className="mb-6">
        <h3>{t('profile.terms.sections.acceptance')}</h3>
        <p>{t('profile.terms.text.acceptance')}</p>
      </section>

      <section id="license" className="mb-6">
        <h3>{t('profile.terms.sections.license')}</h3>
        <p>{t('profile.terms.text.license')}</p>
      </section>

      <section id="billing-terms" className="mb-6">
        <h3>{t('profile.terms.sections.billing')}</h3>
        <p>{t('profile.terms.text.billing')}</p>
      </section>

      <section id="intellectual-property" className="mb-6">
        <h3>{t('profile.terms.sections.ip')}</h3>
        <p>{t('profile.terms.text.ip')}</p>
      </section>

      <section id="warranties" className="mb-6">
        <h3>{t('profile.terms.sections.warranties')}</h3>
        <p>{t('profile.terms.text.warranties')}</p>
      </section>

      <section id="liability" className="mb-6">
        <h3>{t('profile.terms.sections.liability')}</h3>
        <p>{t('profile.terms.text.liability')}</p>
      </section>

      <section id="termination" className="mb-6">
        <h3>{t('profile.terms.sections.termination')}</h3>
        <p>{t('profile.terms.text.termination')}</p>
      </section>

      <section id="governing-law" className="mb-6">
        <h3>{t('profile.terms.sections.law')}</h3>
        <p>{t('profile.terms.text.law')}</p>
      </section>

      <section id="changes" className="mb-6">
        <h3>{t('profile.terms.sections.changes')}</h3>
        <p>{t('profile.terms.text.changes')}</p>
      </section>

      <section id="contact" className="mb-6">
        <h3>{t('profile.terms.sections.contact')}</h3>
        <p>{t('profile.terms.text.contact')}</p>
      </section>
    </div>
  )
} 