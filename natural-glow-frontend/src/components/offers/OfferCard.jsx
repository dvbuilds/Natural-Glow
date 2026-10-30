import { Link } from 'react-router-dom';
import { label } from '../../lib/constants.js';
import { formatDate, formatPrice, optimizeImage } from '../../lib/format.js';
import ImageSlot from '../ui/ImageSlot.jsx';
import Icon from '../ui/Icon.jsx';

export default function OfferCard({ offer }) {
  const firstService = offer.applicableServices?.[0];
  return (
    <article className="card flex h-full flex-col overflow-hidden">
      {offer.imageUrl && (
        <ImageSlot src={optimizeImage(offer.imageUrl, 'f_auto,q_auto,w_700,c_fill,ar_16:9')} alt={offer.title} label={offer.title} className="aspect-[16/9]" />
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2">
          <span className="chip pointer-events-none">{label(offer.type)}</span>
          {offer.discountPercent > 0 && (
            <span className="rounded-full bg-olive-700 px-2.5 py-1 text-xs font-medium text-cream-50">{offer.discountPercent}% off</span>
          )}
        </div>
        <h3 className="mt-3 font-serif text-xl">{offer.title}</h3>
        {offer.description && <p className="mt-2 text-sm text-ink/70">{offer.description}</p>}
        {offer.inclusions?.length > 0 && (
          <ul className="mt-3 space-y-1.5 text-sm text-ink/80">
            {offer.inclusions.map((inc) => (
              <li key={inc} className="flex gap-2">
                <Icon name="check" size={16} className="mt-0.5 text-olive-600" /> {inc}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto pt-5">
          <p className="flex items-baseline gap-2">
            <span className="font-serif text-2xl text-olive-900">{formatPrice(offer.offerPrice)}</span>
            {offer.originalPrice > offer.offerPrice && <span className="text-sm text-ink/45 line-through">{formatPrice(offer.originalPrice)}</span>}
          </p>
          {offer.validUntil && <p className="mt-1 text-xs text-ink/55">Valid until {formatDate(offer.validUntil)}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to={`/contact?subject=${encodeURIComponent(`Enquiry: ${offer.title}`)}#enquiry`} className="btn btn-primary btn-sm">
              Enquire
            </Link>
            {firstService && (
              <Link to={`/contact?service=${firstService}#booking`} className="btn btn-outline btn-sm">
                Book
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
