import { sanitizeRichText } from './sanitize-html';

describe('sanitizeRichText', () => {
  it('strips script tags', () => {
    expect(sanitizeRichText('<p>hi</p><script>alert(1)</script>')).toBe('<p>hi</p>');
  });

  it('strips event handler attributes', () => {
    expect(sanitizeRichText('<p onclick="alert(1)">hi</p>')).toBe('<p>hi</p>');
  });

  it('strips javascript: image sources', () => {
    expect(sanitizeRichText('<img src="javascript:alert(1)" alt="x">')).not.toContain('javascript:');
  });

  it('keeps allowlisted formatting tags', () => {
    const input = '<p><strong>bold</strong> <em>italic</em></p><ul><li>one</li></ul>';
    expect(sanitizeRichText(input)).toBe(input);
  });

  it('keeps http(s) image sources with alt text', () => {
    const input = '<img src="https://example.com/a.png" alt="photo">';
    expect(sanitizeRichText(input)).toBe('<img src="https://example.com/a.png" alt="photo" />');
  });
});
