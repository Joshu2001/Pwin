import { getBackendBaseUrl } from '../config.js';

const getBackendBase = () => {
  try {
    const base = getBackendBaseUrl();
    return base ? String(base).replace(/\/$/, '') : '';
  } catch {
    return '';
  }
};

export const resolveMediaUrl = (input) => {
  if (!input) return '';
  const raw = String(input).trim();
  if (!raw) return '';
  // blob: and data: URLs are temporary (browser-session only) — never persist or display them
  if (raw.startsWith('blob:') || raw.startsWith('data:')) return '';

  const backend = getBackendBase();

  if (raw.startsWith('uploaded:')) {
    const filename = raw.split(':')[1] || raw.slice('uploaded:'.length);
    if (!backend) return raw;
    return `${backend}/uploads/${filename}`;
  }

  try {
    if (/^https?:\/\//i.test(raw)) {
      if (raw.startsWith('http://')) {
        try {
          const backendUrl = backend ? new URL(backend) : null;
          const mediaUrl = new URL(raw);
          if (backendUrl && mediaUrl.hostname === backendUrl.hostname) {
            mediaUrl.protocol = backendUrl.protocol;
            return mediaUrl.toString();
          }
          if (backendUrl && backendUrl.protocol === 'https:' && /onrender\.com$/i.test(mediaUrl.hostname)) {
            mediaUrl.protocol = 'https:';
            return mediaUrl.toString();
          }
        } catch {
          // fall through
        }
      }
      return raw;
    }

    if (raw.startsWith('/')) {
      return backend ? `${backend}${raw}` : raw;
    }

    if (backend) {
      const url = new URL(raw, `${backend}/`);
      return url.toString();
    }
  } catch {
    return raw;
  }

  return raw;
};

export default resolveMediaUrl;
