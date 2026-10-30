import PageHeader from '../components/layout/PageHeader.jsx';
import BookingForm from '../components/booking/BookingForm.jsx';
import EnquiryForm from '../components/booking/EnquiryForm.jsx';
import LocationCard from '../components/booking/LocationCard.jsx';
import Icon from '../components/ui/Icon.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { usePageMeta } from '../hooks/usePageMeta.js';

export default function Contact() {
  const { settings, whatsapp } = useSettings();
  usePageMeta({
    title: `Contact & Booking | ${settings.salonName}`,
    description: `Book an appointment or contact ${settings.salonName}${settings.address.city ? ` in ${settings.address.city}` : ''}.`,
    path: '/contact',
  });
  const waHref = whatsapp(`Hello ${settings.salonName}, I would like to book an appointment.`);

  return (
    <>
      <PageHeader eyebrow="Get in touch" title="Contact & Booking">
        Request an appointment, or send us a message. We will get back to you.
      </PageHeader>

      <section id="booking" className="section scroll-mt-24 pt-4">
        <div className="container-x grid items-start gap-6 lg:grid-cols-2">
          <BookingForm />
          <div className="space-y-6">
            {waHref && (
              <a href={waHref} target="_blank" rel="noopener noreferrer" className="card flex items-center gap-4 p-5 transition hover:bg-cream-200">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1f8f4f] text-white"><Icon name="whatsapp" size={24} /></span>
                <span>
                  <span className="block font-medium">Prefer WhatsApp?</span>
                  <span className="block text-sm text-ink/65">Message us directly to book or ask a question.</span>
                </span>
                <Icon name="arrow-right" size={18} className="ml-auto text-olive-700" />
              </a>
            )}
            <LocationCard />
          </div>
        </div>
      </section>

      <section id="enquiry" className="bg-sage-100/70 section scroll-mt-24">
        <div className="container-x mx-auto max-w-3xl">
          <EnquiryForm />
        </div>
      </section>
    </>
  );
}
