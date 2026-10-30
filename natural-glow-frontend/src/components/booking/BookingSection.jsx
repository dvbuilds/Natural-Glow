import BookingForm from './BookingForm.jsx';
import LocationCard from './LocationCard.jsx';

// "Appointment & Location" block used on Home and Contact. id="booking" is the target of every "Book" link.
export default function BookingSection({ heading = 'Appointment & Location' }) {
  return (
    <section id="booking" className="section scroll-mt-24">
      <div className="container-x">
        <h2 className="section-title text-center">{heading}</h2>
        <div className="mt-10 grid items-start gap-6 lg:grid-cols-2">
          <BookingForm />
          <LocationCard />
        </div>
      </div>
    </section>
  );
}
