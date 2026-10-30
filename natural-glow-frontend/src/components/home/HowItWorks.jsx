import Icon from '../ui/Icon.jsx';

// Describes the real booking flow: a request first, confirmation by the salon afterwards.
const STEPS = [
  { icon: 'calendar', title: 'Request Your Appointment', text: 'Choose a service, date and time.' },
  { icon: 'message', title: 'We Confirm With You', text: 'Our team contacts you to confirm or suggest another time.' },
  { icon: 'sparkle', title: 'Enjoy Your Session', text: 'Relax while our professionals take care of you.' },
  { icon: 'star', title: 'Feel Amazing', text: 'Leave refreshed and radiant.' },
];

export default function HowItWorks() {
  return (
    <section className="section">
      <div className="container-x">
        <h2 className="section-title text-center">How It Works</h2>
        <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <Icon name={s.icon} size={30} className="text-olive-700" strokeWidth={1.3} />
              <div className="mt-3 flex items-center gap-3">
                <span className="font-serif text-4xl text-olive-900">{String(i + 1).padStart(2, '0')}</span>
                <span className="h-px flex-1 bg-gold-400/70" aria-hidden="true" />
              </div>
              <h3 className="mt-2 font-sans text-base font-medium">{s.title}</h3>
              <p className="mt-1 text-sm text-ink/65">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
