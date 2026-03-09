import Image from 'next/image';
import React, { useEffect, useMemo, useRef, useState } from 'react';

type AttachmentPayload = {
  id: string;
  filename: string;
  mimeType: string | null;
  size: number;
  downloadUrl: string | null;
};

type EmailMessage = {
  id: string;
  senderType: string;
  content: string;
  contentHtml?: string | null;
  bodyFormat?: 'text' | 'html' | string;
  createdAt?: string | null;
  sentAt?: string | null;
  attachments?: AttachmentPayload[];
};

type EmailThreadData = {
  conversation: {
    subject: string | null;
    createdAt: string | null;
  };
  contact: {
    name: string;
    email: string | null;
  };
  messages: EmailMessage[];
};

type EmailThreadProps = {
  thread: EmailThreadData;
  formatExactTime: (date: Date | string | null) => string;
  showHeader?: boolean;
  preferContactEmail?: boolean;
};

export function EmailThread({
  thread,
  formatExactTime,
  showHeader = true,
  preferContactEmail = false,
}: EmailThreadProps) {
  const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>({});
  const messageFeedRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setExpandedMessages({});
    const feed = messageFeedRef.current;
    if (feed) {
      requestAnimationFrame(() => {
        feed.scrollTop = feed.scrollHeight;
      });
    }
  }, [thread?.conversation?.subject, thread?.messages?.length]);

  const toggleMessageExpansion = (messageId: string) => {
    setExpandedMessages((prev) => ({ ...prev, [messageId]: !prev[messageId] }));
  };

  const contactLabel = useMemo(() => {
    if (preferContactEmail) {
      return thread.contact.email || thread.contact.name || 'Contact';
    }
    return thread.contact.name || thread.contact.email || 'Contact';
  }, [preferContactEmail, thread.contact.email, thread.contact.name]);

  return (
    <div className="email-thread">
      {showHeader ? (
        <>
          <header className="email-thread-head">
            <div className="thread-head-row">
              <div className="email-thread-title">Email Thread</div>
            </div>
            <div className="thread-head-row">
              <p className="thread-subject-line">{thread.conversation.subject ?? '(no subject)'}</p>
              <div className="thread-head-right">{formatExactTime(thread.conversation.createdAt)}</div>
            </div>
          </header>
          <div className="thread-separator" />
        </>
      ) : null}
      <div className="message-feed" ref={messageFeedRef}>
        {thread.messages.map((message) => {
          const normalizedFormat =
            message.bodyFormat === 'html' ? 'html' : message.bodyFormat === 'text' ? 'text' : undefined;
          const quotedSegments = message.contentHtml ? null : splitQuotedContent(message.content ?? '');
          const hiddenText = quotedSegments?.hidden ?? null;
          const previewText = quotedSegments?.visible ?? message.content ?? '';
          const showPlaceholder = Boolean(hiddenText && !previewText.trim().length);
          const displayHtml = hiddenText ? null : message.contentHtml;
          const displayText = hiddenText ? previewText : message.content ?? '';
          const isExpanded = Boolean(expandedMessages[message.id]);
          const senderLabel = message.senderType === 'contact' ? contactLabel : 'Support Agent';
          return (
            <article key={message.id} className={`message ${message.senderType !== 'contact' ? 'admin' : 'contact'}`}>
              <div className="message-body">
                {showPlaceholder ? (
                  <div className="quoted-placeholder">Previous email thread hidden.</div>
                ) : (
                  renderMessageBody(displayHtml, displayText, displayHtml ? 'html' : normalizedFormat ?? 'text')
                )}
                {hiddenText ? (
                  <>
                    <button
                      type="button"
                      className="quoted-toggle"
                      onClick={() => toggleMessageExpansion(message.id)}
                    >
                      {isExpanded ? 'Hide older emails' : 'View previous emails'}
                    </button>
                    {isExpanded ? (
                      <div className="quoted-block">{renderMessageBody(null, hiddenText, 'text')}</div>
                    ) : null}
                  </>
                ) : null}
              </div>
              {message.attachments && message.attachments.length ? (
                <div className="message-attachments">
                  {message.attachments.map((attachment) => (
                    <div key={attachment.id} className="attachment-chip">
                      <div className="attachment-preview">{renderAttachmentPreview(attachment)}</div>
                      <div className="attachment-meta">
                        <strong>{attachment.filename}</strong>
                        <span>{formatFileSize(attachment.size)}</span>
                      </div>
                      <div className="attachment-actions">
                        {attachment.downloadUrl ? (
                          <a href={attachment.downloadUrl} download={attachment.filename} target="_blank" rel="noreferrer">
                            Download
                          </a>
                        ) : (
                          <span className="muted">Unavailable</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="message-footer">
                <span>{senderLabel}</span>
                <span>{formatExactTime(message.sentAt ?? message.createdAt ?? null)}</span>
              </div>
            </article>
          );
        })}
      </div>

      <style jsx>{`
        .email-thread {
          display: flex;
          flex-direction: column;
          min-height: 0;
          flex: 1;
        }

        .email-thread-head {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .thread-head-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .email-thread-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .thread-subject-line {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .thread-head-right {
          font-size: 14px;
          color: var(--text-tertiary);
          font-weight: 500;
        }

        .thread-separator {
          border-bottom: 1px solid rgba(210, 216, 255, 0.4);
          margin: 8px 0 12px;
        }

        .message-feed {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 14px;
          overflow-y: auto;
          padding-right: 6px;
          min-height: 0;
        }

        .message {
          padding: 14px 16px;
          border-radius: 16px;
          border: 1px solid rgba(150, 165, 225, 0.35);
          background: rgba(255, 255, 255, 0.95);
          width: 100%;
          max-width: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-self: flex-start;
        }

        .message.contact {
          align-self: flex-start;
        }

        .message.admin {
          align-self: flex-end;
          border-color: rgba(81, 98, 255, 0.35);
          background: rgba(109, 123, 255, 0.15);
          box-shadow: 0 12px 24px rgba(85, 110, 255, 0.15);
        }

        .message-html {
          color: var(--text-secondary);
          line-height: 1.5;
          overflow-x: auto;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .message-body {
          color: var(--text-secondary);
          line-height: 1.55;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .message-html :global(table) {
          width: 100%;
        }

        .message-plain p {
          margin: 0;
          word-break: break-word;
          overflow-wrap: anywhere;
          white-space: pre-wrap;
          line-height: 1.55;
        }

        .message-plain p + p {
          margin-top: 8px;
        }

        .message-attachments {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .attachment-meta {
          display: flex;
          flex-direction: column;
          font-size: 12px;
          color: var(--text-tertiary);
        }

        .attachment-meta strong {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .attachment-actions {
          display: flex;
          gap: 10px;
          margin-top: 6px;
        }

        .attachment-actions a {
          font-size: 12px;
          font-weight: 600;
          color: var(--primary-500);
        }

        .attachment-chip {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .message.admin .attachment-chip {
          border-color: rgba(255, 255, 255, 0.5);
          background: rgba(255, 255, 255, 0.16);
          color: #fff;
        }

        .attachment-preview {
          border-radius: 10px;
          background: rgba(248, 249, 255, 0.9);
          border: 1px solid rgba(122, 147, 255, 0.2);
          padding: 8px;
          max-height: 220px;
          overflow: hidden;
        }

        .attachment-preview :global(img),
        .attachment-preview :global(iframe) {
          width: 100%;
          border: none;
          border-radius: 6px;
          max-height: 200px;
          object-fit: cover;
          background: #fff;
        }

        .attachment-preview :global(iframe) {
          background: #fff;
          height: 200px;
        }

        .attachment-preview :global(.file-preview-text) {
          font-size: 13px;
          line-height: 1.4;
          color: var(--text-secondary);
          white-space: pre-wrap;
        }

        .attachment-preview :global(.generic-preview) {
          font-size: 12px;
          color: var(--text-tertiary);
          text-align: center;
        }

        .quoted-toggle {
          margin-top: 8px;
          font-size: 12px;
          color: var(--primary-500);
          border: none;
          background: transparent;
          padding: 0;
          cursor: pointer;
          font-weight: 600;
        }

        .quoted-block {
          margin-top: 8px;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px dashed rgba(122, 147, 255, 0.4);
          background: rgba(248, 249, 255, 0.7);
        }

        .quoted-placeholder {
          font-size: 13px;
          color: var(--text-tertiary);
          font-style: italic;
        }

        .message-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: var(--text-tertiary);
        }

        .message.admin .message-footer {
          color: rgba(81, 98, 255, 0.85);
        }
      `}</style>
    </div>
  );
}

const QUOTED_LINE_PATTERNS = [
  /(?:^|\n)On .+wrote:?/i,
  /(?:^|\n)-{2,}\s+On .+wrote.*-{2,}/i,
  /(?:^|\n)-{2,}\s*Original Message\s*-{2,}/i,
];

function splitQuotedContent(text: string): { visible: string; hidden: string | null } {
  if (!text) {
    return { visible: '', hidden: null };
  }
  const normalized = text.replace(/\r\n/g, '\n');
  for (const pattern of QUOTED_LINE_PATTERNS) {
    const match = normalized.match(pattern);
    if (match && typeof match.index !== 'undefined') {
      let startIndex = match.index;
      if (normalized[startIndex] === '\n') {
        startIndex += 1;
      }
      const visible = normalized.slice(0, startIndex).trimEnd();
      const hidden = normalized.slice(startIndex).trim();
      if (hidden.length) {
        return { visible, hidden };
      }
    }
  }
  return { visible: normalized, hidden: null };
}

function renderMessageBody(
  htmlContent: string | null | undefined,
  fallbackContent: string | null | undefined,
  format?: 'text' | 'html',
) {
  if (format === 'html' && htmlContent) {
    return <div className="message-html" dangerouslySetInnerHTML={{ __html: htmlContent }} />;
  }
  const content = fallbackContent ?? '';
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(content);
  if (looksLikeHtml) {
    return <div className="message-html" dangerouslySetInnerHTML={{ __html: content }} />;
  }
  const lines = content.split('\n');
  return (
    <div className="message-plain">
      {lines.map((line, index) => (
        <p key={`line-${index}`}>{line ? linkifyLine(line) : <>&nbsp;</>}</p>
      ))}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (!bytes || Number.isNaN(bytes)) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  const value = unitIndex === 0 ? size : parseFloat(size.toFixed(size >= 10 ? 0 : 1));
  return `${value} ${units[unitIndex]}`;
}

function renderAttachmentPreview(attachment: AttachmentPayload) {
  if (!attachment.downloadUrl) {
    return <div className="generic-preview">Preview unavailable</div>;
  }
  if (attachment.mimeType?.startsWith('image/')) {
    return (
      <Image
        src={attachment.downloadUrl}
        alt={attachment.filename}
        width={600}
        height={400}
        unoptimized
        style={{ width: '100%', height: 'auto', maxHeight: 200, objectFit: 'cover', borderRadius: 6 }}
      />
    );
  }
  if (attachment.mimeType === 'application/pdf') {
    return <iframe src={attachment.downloadUrl} title={attachment.filename} />;
  }
  return <div className="generic-preview">No inline preview</div>;
}

function linkifyLine(line: string) {
  return line.split(/(https?:\/\/[^\s]+)/g).map((segment, index) => {
    if (/^https?:\/\//i.test(segment)) {
      return (
        <a key={`link-${index}`} href={segment} target="_blank" rel="noreferrer">
          {segment}
        </a>
      );
    }
    return <React.Fragment key={`text-${index}`}>{segment}</React.Fragment>;
  });
}
