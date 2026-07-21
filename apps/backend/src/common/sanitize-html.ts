import sanitizeHtml from 'sanitize-html';

const ALLOWED_TAGS = ['p', 'strong', 'em', 'u', 's', 'ul', 'ol', 'li', 'br', 'h2', 'h3', 'blockquote', 'img'];

export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      img: ['src', 'alt'],
    },
    allowedSchemesByTag: {
      img: ['http', 'https'],
    },
  });
}
