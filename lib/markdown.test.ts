import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './markdown';

describe('renderMarkdown', () => {
  it('renders paragraphs, emphasis and lists', () => {
    const html = renderMarkdown('Bonjour **monde**\n\n- un\n- deux');
    expect(html).toContain('<strong>monde</strong>');
    expect(html).toContain('<li>un</li>');
  });
  it('strips scripts, event handlers and javascript: links', () => {
    const html = renderMarkdown('<script>alert(1)</script><img src=x onerror=alert(1)>[x](javascript:alert(1))');
    expect(html).not.toMatch(/<script|onerror|javascript:/i);
  });
  it('makes links safe', () => {
    expect(renderMarkdown('[site](https://example.com)')).toContain('rel="noopener noreferrer nofollow"');
  });
  it('neutralises a standalone javascript: link', () => {
    expect(renderMarkdown('[x](javascript:alert(1))')).not.toContain('javascript:');
  });
  it('demotes h1 to h2', () => {
    expect(renderMarkdown('# Titre')).toContain('<h2>Titre</h2>');
  });
  it('keeps strikethrough', () => {
    expect(renderMarkdown('~~old~~')).toContain('<del>old</del>');
  });
});
