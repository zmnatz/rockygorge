import { describe, it, expect } from 'vitest';
import { markdownToHtml } from '@/utils/markdown';

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
