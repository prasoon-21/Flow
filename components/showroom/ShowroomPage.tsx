import React, { useMemo, useState } from 'react';
import styles from './Showroom.module.css';
import { ShowroomEntry, showroomRegistry } from './showroomRegistry';

type ThemeMode = 'light' | 'dark';
type DensityMode = 'comfortable' | 'compact';

type GroupedEntries = Array<[string, ShowroomEntry[]]>;

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const groupEntries = (entries: ShowroomEntry[]): GroupedEntries => {
  const map = new Map<string, ShowroomEntry[]>();
  entries.forEach((entry) => {
    if (!map.has(entry.category)) {
      map.set(entry.category, []);
    }
    map.get(entry.category)?.push(entry);
  });
  return Array.from(map.entries());
};

const getEntryMatches = (entry: ShowroomEntry, term: string) => {
  if (!term) return true;
  const value = term.toLowerCase();
  if (entry.name.toLowerCase().includes(value)) return true;
  if (entry.category.toLowerCase().includes(value)) return true;
  if (entry.description?.toLowerCase().includes(value)) return true;
  return entry.examples.some(
    (example) =>
      example.title.toLowerCase().includes(value) ||
      example.description?.toLowerCase().includes(value)
  );
};

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else if (typeof window !== 'undefined') {
        window.prompt('Copy to clipboard:', text);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch (error) {
      console.error('Copy failed', error);
    }
  };

  return (
    <button type="button" className={styles.copyButton} onClick={handleCopy}>
      {copied ? 'Copied' : label}
    </button>
  );
}

export default function ShowroomPage() {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [density, setDensity] = useState<DensityMode>('comfortable');
  const [search, setSearch] = useState('');

  const filteredEntries = useMemo(
    () => showroomRegistry.filter((entry) => getEntryMatches(entry, search.trim())),
    [search]
  );

  const groupedEntries = useMemo(() => groupEntries(filteredEntries), [filteredEntries]);

  return (
    <div
      className={[
        styles.root,
        theme === 'dark' ? styles.themeDark : '',
        density === 'compact' ? styles.densityCompact : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-theme={theme}
      data-density={density}
    >
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <div>
              <div className={styles.sidebarTitle}>Component Showroom</div>
              <div className={styles.sidebarMeta}>{filteredEntries.length} components</div>
            </div>
          </div>
          <nav className={styles.sidebarNav}>
            {groupedEntries.map(([category, entries]) => (
              <div key={category} className={styles.navGroup}>
                <div className={styles.navCategory}>{category}</div>
                <div className={styles.navItems}>
                  {entries.map((entry) => (
                    <a key={entry.name} className={styles.navItem} href={`#${toSlug(entry.name)}`}>
                      {entry.name}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <main className={styles.main}>
          <header className={styles.toolbar}>
            <div className={styles.toolbarIntro}>
              <h1>Component Showroom</h1>
              <p>Dev-only route for previewing components, variants, and edge cases.</p>
            </div>
            <div className={styles.toolbarControls}>
              <input
                className={styles.searchInput}
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search components"
                aria-label="Search components"
              />
              <div className={styles.toggleGroup}>
                <span className={styles.toggleLabel}>Theme</span>
                <div className={styles.toggleButtons}>
                  <button
                    type="button"
                    className={`${styles.toggleButton} ${theme === 'light' ? styles.toggleActive : ''}`}
                    onClick={() => setTheme('light')}
                  >
                    Light
                  </button>
                  <button
                    type="button"
                    className={`${styles.toggleButton} ${theme === 'dark' ? styles.toggleActive : ''}`}
                    onClick={() => setTheme('dark')}
                  >
                    Dark
                  </button>
                </div>
              </div>
              <div className={styles.toggleGroup}>
                <span className={styles.toggleLabel}>Density</span>
                <div className={styles.toggleButtons}>
                  <button
                    type="button"
                    className={`${styles.toggleButton} ${density === 'comfortable' ? styles.toggleActive : ''}`}
                    onClick={() => setDensity('comfortable')}
                  >
                    Comfortable
                  </button>
                  <button
                    type="button"
                    className={`${styles.toggleButton} ${density === 'compact' ? styles.toggleActive : ''}`}
                    onClick={() => setDensity('compact')}
                  >
                    Compact
                  </button>
                </div>
              </div>
            </div>
          </header>

          <section className={styles.content}>
            {groupedEntries.length === 0 ? (
              <div className={styles.emptyState}>
                <h2>No components found.</h2>
                <p>Try a different search term to find what you need.</p>
              </div>
            ) : (
              groupedEntries.map(([category, entries]) => (
                <section key={category} className={styles.categorySection}>
                  <h2 className={styles.categoryTitle}>{category}</h2>
                  <div className={styles.componentGrid}>
                    {entries.map((entry) => (
                      <article key={entry.name} id={toSlug(entry.name)} className={styles.componentCard}>
                        <header className={styles.componentHeader}>
                          <div>
                            <h3 className={styles.componentName}>{entry.name}</h3>
                            {entry.description ? (
                              <p className={styles.componentDescription}>{entry.description}</p>
                            ) : null}
                          </div>
                        </header>
                        <div className={styles.exampleList}>
                          {entry.examples.map((example) => (
                            <div key={`${entry.name}-${example.title}`} className={styles.exampleCard}>
                              <div className={styles.exampleHeader}>
                                <div>
                                  <div className={styles.exampleTitle}>{example.title}</div>
                                  {example.description ? (
                                    <div className={styles.exampleDescription}>{example.description}</div>
                                  ) : null}
                                </div>
                                <div className={styles.exampleActions}>
                                  {example.usage ? <CopyButton text={example.usage} label="Copy usage" /> : null}
                                  {example.props ? <CopyButton text={example.props} label="Copy props" /> : null}
                                </div>
                              </div>
                              <div className={styles.examplePreview}>{example.render()}</div>
                              {example.usage ? (
                                <div className={styles.codeGroup}>
                                  <div className={styles.codeLabel}>Usage</div>
                                  <pre className={styles.codeBlock}>
                                    <code>{example.usage}</code>
                                  </pre>
                                </div>
                              ) : null}
                              {example.props ? (
                                <div className={styles.codeGroup}>
                                  <div className={styles.codeLabel}>Props</div>
                                  <pre className={styles.codeBlock}>
                                    <code>{example.props}</code>
                                  </pre>
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
