import { Marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

// Raw HTML in descriptions is dropped outright: every allowed tag is producible from markdown.
const md = new Marked({ gfm: true, renderer: { html: () => '' } });

export function renderMarkdown(source: string): string {
  const raw = md.parse(source, { async: false }) as string;
  return sanitizeHtml(raw, {
    allowedTags: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'h2', 'h3', 'h4', 'blockquote', 'del', 'code', 'pre', 'hr'],
    allowedAttributes: { a: ['href', 'rel', 'target'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      h1: 'h2',
      h5: 'h4',
      h6: 'h4',
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer nofollow', target: '_blank' }),
    },
  });
}
