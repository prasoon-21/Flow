import type { gmail_v1 } from 'googleapis';
import sanitizeHtml, { type IFrame } from 'sanitize-html';

const QUOTE_HEADER_REGEX = /^On .+wrote:$/i;
const QUOTE_SEPARATOR_REGEXES = [
  /^-{2,}\s*Original Message\s*-{2,}$/i,
  /^Begin forwarded message:?$/i,
];
const HEADER_LINE_REGEXES = [/^From:/i, /^Sent:/i, /^To:/i, /^Subject:/i, /^Cc:/i, /^Bcc:/i];

const RICH_HTML_PATTERN = /<(table|tr|td|th|tbody|thead|tfoot|img|style|svg|canvas|section|article|header|footer|nav|figure|figcaption)[\s>]/i;

const ALLOWED_TAGS = [
  'a',
  'abbr',
  'b',
  'blockquote',
  'br',
  'code',
  'div',
  'span',
  'p',
  'pre',
  'img',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'td',
  'th',
  'ul',
  'ol',
  'li',
  'strong',
  'em',
  'hr',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'section',
  'article',
  'header',
  'footer',
];

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions['allowedAttributes'] = {
  a: ['href', 'name', 'target', 'rel', 'title'],
  img: ['src', 'alt', 'title', 'width', 'height', 'style'],
  table: ['align', 'cellpadding', 'cellspacing', 'border', 'width', 'height', 'style'],
  tr: ['align', 'valign', 'style'],
  td: ['align', 'valign', 'colspan', 'rowspan', 'width', 'height', 'style'],
  th: ['align', 'valign', 'colspan', 'rowspan', 'width', 'height', 'style'],
  '*': ['style', 'class', 'align', 'dir'],
};

const ALLOWED_STYLES: Required<sanitizeHtml.IOptions>['allowedStyles'] = {
  '*': {
    color: [/^[#a-z0-9(),.\s%-]+$/i],
    'background-color': [/^[#a-z0-9(),.\s%-]+$/i],
    'font-size': [/^[0-9.]+(px|em|rem|%)$/i],
    'font-weight': [/^(normal|bold|bolder|lighter|[1-9]00)$/i],
    'font-family': [/^[^;"]+$/],
    'text-align': [/^(left|right|center|justify)$/i],
    'line-height': [/^[0-9.]+(px|em|rem|%)?$/i],
    'letter-spacing': [/^[0-9.]+(px|em|rem|%)?$/i],
    margin: [/^[0-9.\s-]+(px|em|rem|%)?$/i],
    'margin-top': [/^[0-9.\s-]+(px|em|rem|%)?$/i],
    'margin-bottom': [/^[0-9.\s-]+(px|em|rem|%)?$/i],
    'margin-left': [/^[0-9.\s-]+(px|em|rem|%)?$/i],
    'margin-right': [/^[0-9.\s-]+(px|em|rem|%)?$/i],
    padding: [/^[0-9.\s-]+(px|em|rem|%)?$/i],
    'padding-top': [/^[0-9.\s-]+(px|em|rem|%)?$/i],
    'padding-bottom': [/^[0-9.\s-]+(px|em|rem|%)?$/i],
    'padding-left': [/^[0-9.\s-]+(px|em|rem|%)?$/i],
    'padding-right': [/^[0-9.\s-]+(px|em|rem|%)?$/i],
    border: [/^[^;]+$/],
    'border-top': [/^[^;]+$/],
    'border-bottom': [/^[^;]+$/],
    'border-left': [/^[^;]+$/],
    'border-right': [/^[^;]+$/],
    'border-radius': [/^[0-9.\s-]+(px|%)?$/i],
    width: [/^[0-9.\s-]+(px|%)?$/i],
    'max-width': [/^[0-9.\s-]+(px|%)?$/i],
    height: [/^[0-9.\s-]+(px|%)?$/i],
    'max-height': [/^[0-9.\s-]+(px|%)?$/i],
    display: [/^(block|inline|inline-block|flex|table|table-row|table-cell|none)$/i],
    'vertical-align': [/^(baseline|bottom|middle|top|text-top|text-bottom)$/i],
  },
};

const ALLOWED_SCHEMES = ['http', 'https', 'mailto', 'tel'];

export type EmailBodyFormat = 'text' | 'html';

export function decodeBody(body: string): string {
  return Buffer.from(body.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
}

export function extractPlainTextBody(part?: gmail_v1.Schema$MessagePart): string | null {
  if (!part) return null;

  if (part.mimeType === 'text/plain' && part.body?.data) {
    return decodeBody(part.body.data);
  }

  if (part.parts && part.parts.length > 0) {
    for (const child of part.parts) {
      const result = extractPlainTextBody(child);
      if (result) return result;
    }
  }

  return null;
}

export function extractHtmlBody(part?: gmail_v1.Schema$MessagePart): string | null {
  if (!part) return null;

  if (part.mimeType === 'text/html' && part.body?.data) {
    return decodeBody(part.body.data);
  }

  if (part.parts && part.parts.length > 0) {
    for (const child of part.parts) {
      const result = extractHtmlBody(child);
      if (result) return result;
    }
  }

  return null;
}

export function sanitizeEmailHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedStyles: ALLOWED_STYLES,
    allowedSchemes: ALLOWED_SCHEMES,
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noreferrer noopener' }, true),
    },
    exclusiveFilter(frame) {
      return shouldStripFrame(frame);
    },
  }).trim();
}

export function htmlToPlainText(html: string): string {
  const withLineBreaks = html
    .replace(/<\/(p|div|br|li|tr)>/gi, '\n')
    .replace(/<li>/gi, '- ')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<table[^>]*>/gi, '\n')
    .replace(/<\/table>/gi, '\n');

  const withoutTags = withLineBreaks.replace(/<[^>]+>/g, '');

  return decodeEntities(withoutTags)
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function stripQuotedPlainText(value: string): { text: string; wasTrimmed: boolean } {
  const lines = value.split(/\r?\n/);
  let cutoff = lines.length;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    if (QUOTE_HEADER_REGEX.test(trimmed)) {
      cutoff = index;
      break;
    }

    if (QUOTE_SEPARATOR_REGEXES.some((regex) => regex.test(trimmed))) {
      cutoff = index;
      break;
    }

    if (trimmed.startsWith('>')) {
      const blockLength = countQuotedBlock(lines, index);
      if (blockLength >= 3) {
        cutoff = index;
        break;
      }
    }

    if (looksLikeForwardHeader(lines, index)) {
      cutoff = index;
      break;
    }
  }

  const sliced = lines.slice(0, cutoff);
  while (sliced.length && !sliced[sliced.length - 1].trim()) {
    sliced.pop();
  }

  const trimmed = sliced.join('\n').trim();
  if (!trimmed) {
    return { text: value.trim(), wasTrimmed: cutoff < lines.length };
  }
  return { text: trimmed, wasTrimmed: cutoff < lines.length };
}

export function shouldPreferHtml(html: string): boolean {
  return RICH_HTML_PATTERN.test(html);
}

function shouldStripFrame(frame: IFrame): boolean {
  const className = (frame.attribs?.class ?? '').toLowerCase();
  const dataSmartmail = frame.attribs?.['data-smartmail'] ?? '';
  if (className.includes('gmail_quote') || className.includes('gmail_signature') || className.includes('yahoo_quoted')) {
    return true;
  }
  if (typeof dataSmartmail === 'string' && dataSmartmail.toLowerCase().includes('gmail_signature')) {
    return true;
  }

  const text = (frame.text ?? '').trim();
  if (frame.tag === 'blockquote' && (className.includes('gmail_quote') || QUOTE_HEADER_REGEX.test(text))) {
    return true;
  }

  if (frame.tag === 'div' && QUOTE_SEPARATOR_REGEXES.some((regex) => regex.test(text))) {
    return true;
  }

  return false;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, '&');
}

function countQuotedBlock(lines: string[], startIndex: number): number {
  let count = 0;
  for (let i = startIndex; i < lines.length; i += 1) {
    if (lines[i].trim().startsWith('>')) {
      count += 1;
    } else {
      break;
    }
  }
  return count;
}

function looksLikeForwardHeader(lines: string[], index: number): boolean {
  const line = lines[index].trim();
  if (!/^From:/i.test(line)) {
    return false;
  }
  const previous = index > 0 ? lines[index - 1].trim() : '';
  if (previous) {
    return false;
  }

  let headerHits = 0;
  for (let cursor = index; cursor < Math.min(lines.length, index + 6); cursor += 1) {
    const candidate = lines[cursor].trim();
    if (HEADER_LINE_REGEXES.some((regex) => regex.test(candidate))) {
      headerHits += 1;
    }
  }
  return headerHits >= 2;
}
