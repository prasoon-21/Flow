import React, { useMemo, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { trpc } from '@/lib/trpc/client';
import { InputField } from '@/components/ui/InputField';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Pencil, Trash2 } from 'lucide-react';

type TagForm = {
  id?: string | null;
  name: string;
  scopes: string[];
  category: string;
  color: string;
  archived: boolean;
};

const SCOPE_OPTIONS = [
  { key: 'call', label: 'Calls' },
  { key: 'conversation', label: 'Email' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'webchat', label: 'Web Chat' },
  { key: 'contact', label: 'Contacts' },
];

export default function TagManagementPage() {
  const router = useRouter();
  const listQuery = trpc.tags.list.useQuery({ includeArchived: true });
  const upsertMutation = trpc.tags.upsert.useMutation();
  const deleteMutation = trpc.tags.delete.useMutation();

  const [form, setForm] = useState<TagForm>({
    id: null,
    name: '',
    scopes: ['call', 'conversation'],
    category: '',
    color: '',
    archived: false,
  });
  const [status, setStatus] = useState<string | null>(null);
  const [categoryStatus, setCategoryStatus] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    source: '',
    target: '',
    extraTagIds: [] as string[],
  });

  const sortedTags = useMemo(() => {
    const toMillis = (value: Date | string | undefined | null) => {
      if (!value) return 0;
      const dateValue = value instanceof Date ? value : new Date(value);
      const time = dateValue.getTime();
      return Number.isFinite(time) ? time : 0;
    };
    const tags = listQuery.data?.tags ?? [];
    return [...tags].sort((a, b) => {
      const aTime = toMillis((a.updatedAt as Date | string | undefined) ?? (a.createdAt as Date | string | undefined));
      const bTime = toMillis((b.updatedAt as Date | string | undefined) ?? (b.createdAt as Date | string | undefined));
      if (Number.isFinite(aTime) && Number.isFinite(bTime) && aTime !== bTime) {
        return bTime - aTime; // newest first
      }
      return a.name.localeCompare(b.name);
    });
  }, [listQuery.data?.tags]);
  const [listSearch, setListSearch] = useState('');
  const filteredTags = useMemo(() => {
    const term = listSearch.trim().toLowerCase();
    const tags = sortedTags;
    if (!term) return tags;
    return tags.filter(
      (tag) =>
        tag.name.toLowerCase().includes(term) || (tag.category ?? '').toLowerCase().includes(term)
    );
  }, [sortedTags, listSearch]);

  const existingNames = useMemo(() => Array.from(new Set(sortedTags.map((t: any) => t.name))), [sortedTags]);
  const existingCategories = useMemo(
    () => Array.from(new Set(sortedTags.map((t: any) => (t.category || '').trim()).filter(Boolean))),
    [sortedTags]
  );
  const categoryOptions = useMemo(() => [...existingCategories].sort((a, b) => a.localeCompare(b)), [existingCategories]);

  const categoryTags = useMemo(() => {
    if (!categoryForm.source) return [];
    const needle = categoryForm.source.trim().toLowerCase();
    return sortedTags.filter((tag: any) => (tag.category || '').trim().toLowerCase() === needle);
  }, [sortedTags, categoryForm.source]);
  const categoryTagIds = useMemo(() => new Set(categoryTags.map((tag: any) => tag.id)), [categoryTags]);
  const extraTagOptions = useMemo(
    () => sortedTags.filter((tag: any) => tag.id && !categoryTagIds.has(tag.id)),
    [sortedTags, categoryTagIds]
  );

  const resetForm = () =>
    setForm({
      id: null,
      name: '',
      scopes: ['call', 'conversation'],
      category: '',
      color: '',
      archived: false,
    });
  const resetCategoryForm = () =>
    setCategoryForm({
      source: '',
      target: '',
      extraTagIds: [],
    });

  const handleEdit = (tag: any) => {
    setForm({
      id: tag.id,
      name: tag.name,
      scopes: tag.scopes ?? [],
      category: tag.category ?? '',
      color: tag.color ?? '',
      archived: Boolean(tag.archived),
    });
    setStatus(null);
  };

  const toggleScope = (scope: string) => {
    setForm((prev) => {
      const hasScope = prev.scopes.includes(scope);
      return {
        ...prev,
        scopes: hasScope ? prev.scopes.filter((s) => s !== scope) : [...prev.scopes, scope],
      };
    });
  };

  const handleSubmit = async () => {
    try {
      await upsertMutation.mutateAsync({
        id: form.id ?? undefined,
        name: form.name.trim(),
        scopes: form.scopes,
        category: form.category.trim() || undefined,
        color: form.color.trim() || undefined,
        archived: form.archived,
      });
      await listQuery.refetch();
      setStatus(form.id ? 'Tag updated.' : 'Tag created.');
      resetForm();
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  const handleDelete = async (tagId: string, tagName: string) => {
    const confirmed = window.confirm(`Delete tag "${tagName}"? This cannot be undone.`);
    if (!confirmed) return;
    try {
      await deleteMutation.mutateAsync({ id: tagId });
      await listQuery.refetch();
      if (form.id === tagId) {
        resetForm();
      }
      setStatus('Tag deleted.');
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  const toggleExtraTag = (tagId: string) => {
    setCategoryForm((prev) => {
      const nextIds = prev.extraTagIds.includes(tagId)
        ? prev.extraTagIds.filter((id) => id !== tagId)
        : [...prev.extraTagIds, tagId];
      return { ...prev, extraTagIds: nextIds };
    });
  };

  const handleCategoryUpdate = async () => {
    const source = categoryForm.source.trim();
    const target = categoryForm.target.trim();
    if (!source) {
      setCategoryStatus('Select a category to update.');
      return;
    }
    if (!target) {
      setCategoryStatus('Enter a new category name.');
      return;
    }

    const extraTags = extraTagOptions.filter((tag: any) => categoryForm.extraTagIds.includes(tag.id));
    const updates = [...categoryTags, ...extraTags];
    if (!updates.length) {
      setCategoryStatus('No tags available to update.');
      return;
    }

    try {
      await Promise.all(
        updates.map((tag: any) =>
          upsertMutation.mutateAsync({
            id: tag.id,
            name: tag.name,
            scopes: Array.isArray(tag.scopes) && tag.scopes.length ? tag.scopes : form.scopes,
            category: target,
            color: tag.color ?? undefined,
            archived: Boolean(tag.archived),
          })
        )
      );
      await listQuery.refetch();
      setCategoryStatus('Category updated.');
      resetCategoryForm();
    } catch (error) {
      setCategoryStatus((error as Error).message);
    }
  };

  const disableSave = !form.name.trim() || form.scopes.length === 0 || upsertMutation.isLoading;
  const disableCategorySave = !categoryForm.source.trim() || !categoryForm.target.trim() || upsertMutation.isLoading;

  if (listQuery.isLoading) {
    return (
      <Layout title="Tag Management">
        <div className="card">Loading tags…</div>
      </Layout>
    );
  }

  return (
    <Layout title="Tag Management">
      <div className="settings-container">
        <nav className="tabs">
          {[
            { href: '/settings/email', label: 'Email' },
            { href: '/settings/shopify', label: 'Shopify' },
            { href: '/settings/tags', label: 'Tags' },
            { href: '/settings/notifications', label: 'Notifications' },
          ].map((tab) => (
            <Link key={tab.href} href={tab.href} className={`tab ${router.pathname === tab.href ? 'active' : ''}`}>
              {tab.label}
            </Link>
          ))}
        </nav>
        <div className="tag-layout">
          <div className="card list-card">
            <header className="list-head">
              <div className="header-left">
                <span>Existing Tags</span>
                <Badge size="sm" variant="neutral">
                  {sortedTags.length}
                </Badge>
              </div>
            </header>
            <div className="list-search">
              <input
                type="text"
                placeholder="Search tags..."
                value={listSearch}
                onChange={(event) => setListSearch(event.target.value)}
              />
            </div>
            <div className="tag-list">
              {filteredTags.length === 0 ? (
                <p className="muted">No tags yet. Create your first tag.</p>
              ) : (
                filteredTags.map((tag) => (
                  <div key={tag.id} className={`tag-row ${form.id === tag.id ? 'active' : ''}`}>
                    <div className="tag-row-header">
                      <p className="tag-name">
                        {tag.name} {tag.archived ? <span className="pill muted">Archived</span> : null}
                      </p>
                      <div className="tag-actions">
                        <button
                          type="button"
                          className="icon-btn edit"
                          onClick={() => handleEdit(tag)}
                          aria-label={`Edit ${tag.name}`}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn delete"
                          onClick={() => handleDelete(tag.id, tag.name)}
                          disabled={deleteMutation.isLoading}
                          aria-label={`Delete ${tag.name}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {tag.category ? <p className="muted small">{tag.category}</p> : null}
                    <div className="scope-badges">
                      {(tag.scopes ?? []).map((scope: string) => (
                        <Badge key={scope} size="sm">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="right-column">
            <div className="card form-card">
              <header className="card-head">
                <h3>{form.id ? 'Update Tag' : 'Create Tag'}</h3>
                <Button variant="ghost" size="sm" onClick={resetForm} disabled={upsertMutation.isLoading}>
                  New Tag
                </Button>
              </header>
              <div className="card-body">
                <div className="input-with-suggest">
                  <InputField
                    label="Name"
                    placeholder="e.g. Refund Issue"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                  {(() => {
                    const matches = existingNames
                      .filter(
                        (n) =>
                          form.name.trim() &&
                          n.toLowerCase().includes(form.name.toLowerCase()) &&
                          n.toLowerCase() !== form.name.toLowerCase()
                      )
                      .slice(0, 5);
                    if (!matches.length) return null;
                    return (
                      <ul className="suggestions">
                        {matches.map((name) => (
                          <li
                            key={name}
                            onClick={() => setForm((prev) => ({ ...prev, name }))}
                            className="suggestion-item"
                          >
                            {name}
                          </li>
                        ))}
                      </ul>
                    );
                  })()}
                </div>

                <div className="input-with-suggest">
                  <InputField
                    label="Category (optional)"
                    placeholder="e.g. Refund"
                    value={form.category}
                    onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                  />
                  {(() => {
                    const matches = existingCategories
                      .filter(
                        (c) =>
                          form.category.trim() &&
                          c.toLowerCase().includes(form.category.toLowerCase()) &&
                          c.toLowerCase() !== form.category.toLowerCase()
                      )
                      .slice(0, 5);
                    if (!matches.length) return null;
                    return (
                      <ul className="suggestions">
                        {matches.map((cat) => (
                          <li
                            key={cat}
                            onClick={() => setForm((prev) => ({ ...prev, category: cat }))}
                            className="suggestion-item"
                          >
                            {cat}
                          </li>
                        ))}
                      </ul>
                    );
                  })()}
                </div>
                <div className="scopes">
                  <p className="section-label">Scopes</p>
                  <div className="scope-chips">
                    {SCOPE_OPTIONS.map((scope) => {
                      const active = form.scopes.includes(scope.key);
                      return (
                        <button
                          key={scope.key}
                          type="button"
                          className={`scope-chip ${active ? 'active' : ''}`}
                          onClick={() => toggleScope(scope.key)}
                        >
                          {scope.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="hint">Scopes auto-expand when a tag is used in a new area.</p>
                </div>

                <label className="archived">
                  <input
                    type="checkbox"
                    checked={form.archived}
                    onChange={(e) => setForm((prev) => ({ ...prev, archived: e.target.checked }))}
                  />
                  Archived
                </label>

                <div className="form-actions action-group">
                  <Button variant="primary" size="sm" onClick={handleSubmit} disabled={disableSave}>
                    {upsertMutation.isLoading ? 'Saving…' : form.id ? 'Update tag' : 'Create tag'}
                  </Button>
                  {status ? <span className="status">{status}</span> : null}
                </div>
              </div>
            </div>
            <div className="card category-card">
              <header className="card-head">
                <h3>Update Category</h3>
              </header>
              <div className="card-body">
                <label className="field">
                  <span>Current category</span>
                  <select
                    value={categoryForm.source}
                    onChange={(event) =>
                      setCategoryForm((prev) => ({ ...prev, source: event.target.value, extraTagIds: [] }))
                    }
                  >
                    <option value="">Select category</option>
                    {categoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <InputField
                  label="New category name"
                  placeholder="e.g. Action / Resolution"
                  value={categoryForm.target}
                  onChange={(event) => setCategoryForm((prev) => ({ ...prev, target: event.target.value }))}
                />

                <div className="category-group">
                  <p className="section-label">Tags in this category</p>
                  <div className="tag-chips">
                    {categoryTags.length ? (
                      categoryTags.map((tag: any) => (
                        <span key={tag.id} className="tag-chip locked">
                          {tag.name}
                        </span>
                      ))
                    ) : (
                      <span className="muted small">No tags yet.</span>
                    )}
                  </div>
                </div>

                <div className="category-group">
                  <p className="section-label">Add tags to category</p>
                  <div className="tag-chips">
                    {extraTagOptions.length ? (
                      extraTagOptions.map((tag: any) => {
                        const active = categoryForm.extraTagIds.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            className={`tag-chip selectable ${active ? 'active' : ''}`}
                            onClick={() => toggleExtraTag(tag.id)}
                          >
                            {tag.name}
                          </button>
                        );
                      })
                    ) : (
                      <span className="muted small">All tags are already in this category.</span>
                    )}
                  </div>
                </div>

                <div className="form-actions action-group">
                  <Button variant="primary" size="sm" onClick={handleCategoryUpdate} disabled={disableCategorySave}>
                    {upsertMutation.isLoading ? 'Updating…' : 'Update category'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={resetCategoryForm} disabled={upsertMutation.isLoading}>
                    Reset
                  </Button>
                  {categoryStatus ? <span className="status">{categoryStatus}</span> : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .settings-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .tabs {
          display: inline-flex;
          gap: 8px;
          padding: 4px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(210, 216, 255, 0.5);
          box-shadow: 0 10px 20px rgba(108, 122, 208, 0.12);
        }

        :global(a.tab) {
          padding: 8px 12px;
          border-radius: 10px;
          color: var(--text-secondary);
          font-weight: 700;
          text-decoration: none;
          letter-spacing: 0.01em;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        :global(a.tab.active) {
          background: rgba(81, 98, 255, 0.12);
          color: var(--text-primary);
          border: 1px solid rgba(81, 98, 255, 0.35);
          box-shadow: 0 8px 16px rgba(81, 98, 255, 0.14);
        }

        .muted {
          color: var(--text-tertiary);
          margin: 0;
        }

        .tag-layout {
          display: grid;
          grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
          gap: 16px;
          align-items: stretch;
        }

        .right-column {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .list-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .header-left {
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        .list-search {
          margin: 10px 0 6px;
        }

        .list-search input {
          border: 1px solid rgba(210, 216, 255, 0.6);
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 14px;
          background: rgba(255, 255, 255, 0.95);
          width: 100%;
          max-width: 360px;
        }

        .form-card,
        .list-card {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .list-card {
          height: 100%;
        }

        .category-card {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .card-body {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .card-head h3 {
          margin: 0;
          font-size: 16px;
          color: var(--text-primary);
        }

        .card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .input-with-suggest {
          position: relative;
        }

        .suggestions {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #fff;
          border: 1px solid rgba(210, 216, 255, 0.6);
          border-radius: 10px;
          margin-top: 4px;
          max-height: 140px;
          overflow-y: auto;
          z-index: 5;
          padding: 6px 0;
          box-shadow: 0 8px 18px rgba(81, 98, 255, 0.08);
        }

        .suggestion-item {
          padding: 8px 12px;
          cursor: pointer;
        }

        .suggestion-item:hover {
          background: rgba(81, 98, 255, 0.06);
        }

        .section-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-tertiary);
          margin: 0 0 6px;
        }

        .hint {
          margin: 6px 0 0;
          font-size: 12px;
          color: var(--text-tertiary);
        }

        .scope-chips {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .scope-chip {
          padding: 6px 12px;
          border-radius: 999px;
          border: 1px solid rgba(210, 216, 255, 0.8);
          background: rgba(255, 255, 255, 0.95);
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .scope-chip.active {
          background: rgba(81, 98, 255, 0.08);
          border-color: rgba(81, 98, 255, 0.6);
        }

        .archived {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .form-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .status {
          font-size: 13px;
          color: var(--text-tertiary);
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 12px;
          color: var(--text-tertiary);
        }

        .field span {
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 700;
          color: var(--text-tertiary);
        }

        .field select {
          border-radius: 12px;
          border: 1px solid rgba(122, 147, 255, 0.3);
          padding: 8px 10px;
          background: rgba(255, 255, 255, 0.95);
          font-size: 13px;
          color: var(--text-primary);
        }

        .tag-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tag-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          padding: 5px 12px;
          font-size: 12px;
          border: 1px solid rgba(210, 216, 255, 0.8);
          background: rgba(255, 255, 255, 0.95);
          color: var(--text-secondary);
        }

        .tag-chip.locked {
          background: rgba(81, 98, 255, 0.1);
          border-color: rgba(81, 98, 255, 0.25);
          color: var(--text-primary);
        }

        .tag-chip.selectable {
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .tag-chip.selectable.active {
          background: rgba(81, 98, 255, 0.12);
          border-color: rgba(81, 98, 255, 0.5);
          color: var(--text-primary);
        }

        .list-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .tag-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 12px;
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          padding-right: 6px;
        }

        .tag-list::-webkit-scrollbar {
          width: 6px;
        }

        .tag-list::-webkit-scrollbar-thumb {
          background: rgba(210, 216, 255, 0.8);
          border-radius: 999px;
        }

        .tag-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 10px 12px;
          border: 1px solid rgba(210, 216, 255, 0.55);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.96);
          min-width: 0;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
        }

        .tag-row:hover {
          border-color: rgba(81, 98, 255, 0.35);
          box-shadow: 0 10px 18px rgba(81, 98, 255, 0.08);
        }

        .tag-row.active {
          border-color: rgba(81, 98, 255, 0.6);
          background: rgba(247, 249, 255, 0.95);
        }

        .tag-row-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }

        .tag-row .tag-main {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .tag-name {
          margin: 0;
          font-weight: 600;
          font-size: 14px;
          line-height: 1.3;
        }

        .pill {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 999px;
          background: rgba(210, 216, 255, 0.6);
          color: var(--text-secondary);
        }

        .tag-actions {
          display: flex;
          gap: 6px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.15s ease;
        }

        .tag-row:hover .tag-actions,
        .tag-row.active .tag-actions,
        .tag-row:focus-within .tag-actions {
          opacity: 1;
          pointer-events: auto;
        }

        .icon-btn {
          border: none;
          background: rgba(255, 255, 255, 0.6);
          width: 28px;
          height: 28px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s ease, transform 0.15s ease;
          border: 1px solid rgba(210, 216, 255, 0.6);
        }

        .icon-btn.edit {
          color: #2f46d7;
        }

        .icon-btn.delete {
          color: #d64545;
        }

        .icon-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .icon-btn.edit:hover:not(:disabled) {
          background: rgba(81, 98, 255, 0.12);
          border-color: rgba(81, 98, 255, 0.35);
        }

        .icon-btn.delete:hover:not(:disabled) {
          background: rgba(214, 69, 69, 0.12);
          border-color: rgba(214, 69, 69, 0.35);
        }

        .scope-badges {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .small {
          font-size: 12px;
        }

        @media (max-width: 960px) {
          .tag-layout {
            grid-template-columns: 1fr;
          }

          .list-search input {
            max-width: 100%;
          }
        }
      `}</style>
    </Layout>
  );
}
