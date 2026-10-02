import DOMPurify from 'dompurify';

/**
 * Safely sanitizes HTML for product descriptions.
 * Allows headings, paragraphs, lists, tables, links, bold, italics, line breaks, etc.
 * Strips script tags, event handlers (onclick, onerror), iframes, objects, embeds, and unsafe URIs.
 */
export function sanitizeProductHtml(rawHtml: string): string {
  if (!rawHtml) return '';

  if (typeof window === 'undefined') {
    return rawHtml;
  }

  const purify = typeof (DOMPurify as any).sanitize === 'function'
    ? DOMPurify
    : typeof DOMPurify === 'function'
      ? (DOMPurify as any)(window)
      : DOMPurify;

  return purify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'sub', 'sup',
      'ul', 'ol', 'li',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
      'blockquote', 'code', 'pre',
      'span', 'div',
      'a'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'title', 'class', 'style',
      'align', 'valign', 'border', 'cellpadding', 'cellspacing', 'colspan', 'rowspan', 'width'
    ],
    ADD_ATTR: ['target', 'rel'],
  });
}
