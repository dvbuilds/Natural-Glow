import { Link } from 'react-router-dom';
import { label } from '../../lib/constants.js';
import { formatPrice, optimizeImage } from '../../lib/format.js';
import ImageSlot from '../ui/ImageSlot.jsx';
import Icon from '../ui/Icon.jsx';

// `service` is a public Service document. The image comes from service.imageUrl (set in the admin panel);
// until then a placeholder shows.
export default function ServiceCard({ service, showPrice = true }) {
  return (
    <article className="card flex h-full flex-col overflow-hidden">
      <ImageSlot
        src={optimizeImage(service.imageUrl, 'f_auto,q_auto,w_700,c_fill,ar_4:3')}
        alt={service.name}
        label={service.name}
        hint="Add imageUrl in Admin → Services"
        className="aspect-[4/3]"
      />
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] font-medium uppercase tracking-wider text-olive-600">{label(service.category)}</p>
        <h3 className="mt-1 font-serif text-xl leading-snug">{service.name}</h3>
        {service.description && <p className="mt-2 line-clamp-3 text-sm text-ink/70">{service.description}</p>}
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div className="text-sm">
            {showPrice && <p className="font-medium text-olive-900">{formatPrice(service.price, service.priceType)}</p>}
            {service.durationMinutes && (
              <p className="flex items-center gap-1 text-xs text-ink/55">
                <Icon name="clock" size={12} /> {service.durationMinutes} min
              </p>
            )}
          </div>
          <Link
            to={`/contact?service=${service._id}#booking`}
            className="inline-flex items-center gap-1 text-sm font-medium text-olive-800 hover:text-olive-900"
          >
            Book <Icon name="arrow-right" size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}
