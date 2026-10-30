import { Link } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader.jsx';
import TestimonialsSection from '../components/home/TestimonialsSection.jsx';
import ImageSlot from '../components/ui/ImageSlot.jsx';
import Icon from '../components/ui/Icon.jsx';
import { IMAGES } from '../config/images.js';
import { useServices } from '../context/ServicesContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { label } from '../lib/constants.js';

// Edit this copy freely: it is deliberately generic and contains no claims about years, awards or staff.
const VALUES = [
  { icon: 'user', title: 'Personal attention', text: 'Tell us what you need and we will recommend a service that suits you.' },
  { icon: 'tag', title: 'Clear pricing', text: 'Every service is listed with its price on our Pricing page.' },
  { icon: 'calendar', title: 'Easy booking', text: 'Send a request online or on WhatsApp and our team will confirm the time with you.' },
];

export default function About() {
  const { settings } = useSettings();
  const { categories } = useServices();
  usePageMeta({
    title: `About | ${settings.salonName}`,
    description: `Learn about ${settings.salonName}${settings.address.city ? ` in ${settings.address.city}` : ''}.`,
    path: '/about',
  });

  return (
    <>
      <PageHeader eyebrow="About us" title="Where Beauty Meets Expertise">
        Get to know {settings.salonName}.
      </PageHeader>

      <section className="section">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2">
          <div className="grid grid-cols-5 gap-4">
            <ImageSlot src={IMAGES.aboutMain} alt={`Inside ${settings.salonName}`} label="About image" hint="about-main.jpg · 4:3" className="col-span-3 aspect-[3/4] rounded-3xl shadow-soft" />
            <ImageSlot src={IMAGES.aboutSecondary} alt={`${settings.salonName} team at work`} label="Second image" hint="about-secondary.jpg · 4:5" className="col-span-2 mt-10 aspect-[3/4] rounded-3xl shadow-soft" />
          </div>
          <div>
            <p className="eyebrow">Our story</p>
            <h2 className="section-title mt-3">A calm place to look and feel your best</h2>
            <p className="mt-5 text-base leading-relaxed text-ink/75">
              {settings.salonName} is a beauty parlour{settings.address.city ? ` in ${settings.address.city}` : ''} offering care for hair, skin, makeup and brides.
              Replace this paragraph with your own story: how the salon started, what you care about and what clients can expect when they visit.
            </p>
            {categories.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-medium">What we offer</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <li key={c}><Link to={`/services?category=${c}`} className="chip">{label(c)}</Link></li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/contact#booking" className="btn btn-primary">Book an Appointment</Link>
              <Link to="/services" className="btn btn-outline">Explore Our Services</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-sage-100/70 section">
        <div className="container-x">
          <h2 className="section-title text-center">What You Can Expect</h2>
          <ul className="mt-10 grid gap-5 md:grid-cols-3">
            {VALUES.map((v) => (
              <li key={v.title} className="card p-6">
                <Icon name={v.icon} size={26} className="text-olive-700" strokeWidth={1.4} />
                <h3 className="mt-4 font-serif text-xl">{v.title}</h3>
                <p className="mt-2 text-sm text-ink/70">{v.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <TestimonialsSection />
    </>
  );
}
