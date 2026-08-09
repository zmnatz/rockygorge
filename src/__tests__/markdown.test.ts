import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { markdownToHtml, markdownToReact } from '@/utils/markdown';

describe('markdownToHtml', () => {
  it('converts simple markdown to HTML', async () => {
    const result = await markdownToHtml('Hello, world!');
    expect(result).toContain('<p>Hello, world!</p>');
  });

  it('converts headings', async () => {
    const result = await markdownToHtml('# Title');
    expect(result).toContain('<h1>Title</h1>');
  });

  it('converts bold text', async () => {
    const result = await markdownToHtml('**bold**');
    expect(result).toContain('<strong>bold</strong>');
  });

  it('converts italic text', async () => {
    const result = await markdownToHtml('*italic*');
    expect(result).toContain('<em>italic</em>');
  });

  it('converts links', async () => {
    const result = await markdownToHtml('[link](https://example.com)');
    expect(result).toContain('<a href="https://example.com">link</a>');
  });

  it('converts lists', async () => {
    const md = `- Item 1
- Item 2
- Item 3`;
    const result = await markdownToHtml(md);
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>Item 1</li>');
    expect(result).toContain('<li>Item 2</li>');
    expect(result).toContain('<li>Item 3</li>');
  });

  it('handles empty string', async () => {
    const result = await markdownToHtml('');
    expect(result).toBeDefined();
  });
});

describe('markdownToReact', () => {
  it('returns a React element tree, not an HTML string', () => {
    const result = markdownToReact('Hello, world!');
    expect(result).not.toBe('');
    expect(typeof result).not.toBe('string');
  });

  it('renders paragraphs as MUI Typography', () => {
    const html = renderToStaticMarkup(markdownToReact('Hello, world!'));
    expect(html).toContain('>Hello, world!</p>');
    expect(html).toContain('MuiTypography-root');
  });

  it('renders headings as Typography with the heading element', () => {
    const html = renderToStaticMarkup(markdownToReact('# Title'));
    expect(html).toContain('<h1');
    expect(html).toContain('MuiTypography-root');
  });

  it('renders sub-headings with their element tag', () => {
    const html = renderToStaticMarkup(markdownToReact('#### When: June 20'));
    expect(html).toContain('<h4');
  });

  it('renders external links as MUI Link with target blank', () => {
    const html = renderToStaticMarkup(markdownToReact('[link](https://example.com)'));
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('renders internal links with the local path', () => {
    const html = renderToStaticMarkup(markdownToReact('[form](/forms/banquet)'));
    expect(html).toContain('href="/forms/banquet"');
  });

  it('renders bold text', () => {
    const html = renderToStaticMarkup(markdownToReact('**bold**'));
    expect(html).toContain('<strong>bold</strong>');
  });

  it('renders lists', () => {
    const html = renderToStaticMarkup(markdownToReact('- Item 1\n- Item 2'));
    expect(html).toContain('<li>Item 1</li>');
    expect(html).toContain('<li>Item 2</li>');
  });
});
