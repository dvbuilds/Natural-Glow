import { useEffect } from 'react';
import { SITE_URL } from '../config/env.js';

const setMeta = (name, content) => {
  let el = document.head.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const setCanonical = (href) => {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!href) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
};

/**
 * Per-page <title>, meta description, canonical URL and robots directive.
 * Note: this runs in the browser. For crawlers that don't execute JavaScript, pre-render the public pages
 * (see README, "SEO").
 */
export function usePageMeta({ title, description, path, noindex = false }) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) setMeta('description', description);
    setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow');
    setCanonical(SITE_URL && path !== undefined && !noindex ? `${SITE_URL}${path}` : '');
  }, [title, description, path, noindex]);
}
