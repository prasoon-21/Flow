import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { TagPill } from '@/components/ui/TagPill';

export type TagOption = { id: string; name: string; scopes?: string[]; category?: string | null; color?: string | null };

type Props = {
  title?: string;
  tags: string[];
  note: string;
  availableTags: TagOption[];
  primaryScope?: string;
  isSaving?: boolean;
  onChangeTags: (tags: string[]) => void;
  onChangeNote: (note: string) => void;
  onSave: () => Promise<void>;
  onReset?: () => void;
  allowEdit?: boolean;
  showPlaceholder?: boolean;
  placeholderDescription?: string;
};

/**
  Shared Tags & Notes card with inline edit mode and tag search.
  Hosts controlled state via onChangeTags/onChangeNote.
 */
export function TagNotesCard({
  title = 'Tags & Notes',
  tags,
  note,
  availableTags,
  primaryScope,
  isSaving,
  onChangeTags,
  onChangeNote,
  onSave,
  onReset,
  allowEdit = true,
  showPlaceholder = false,
  placeholderDescription = 'Select a contact to manage tags & notes.',
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [tagFilter, setTagFilter] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const appliedTags = tags ?? [];
  const normalizedTagFilter = tagFilter.trim();
  const normalizedTagFilterLower = normalizedTagFilter.toLowerCase();
  const appliedTagSet = new Set(appliedTags.map((tag) => tag.toLowerCase()));

  const startEdit = () => {
    if (!allowEdit || showPlaceholder) return;
    setStatus(null);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setTagFilter('');
    setStatus(null);
    onReset?.();
  };

  const handleSave = async () => {
    setStatus(null);
    try {
      await onSave();
      setIsEditing(false);
      setStatus('Saved');
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  const filteredSuggestions = normalizedTagFilter
    ? availableTags.filter((item) => {
        const name = item.name.toLowerCase();
        return name.includes(normalizedTagFilterLower) && !appliedTagSet.has(name);
      })
    : [];

  const hasExactMatch = availableTags.some((item) => item.name.toLowerCase() === normalizedTagFilterLower);
  const isAlreadyApplied = appliedTags.some((t) => t.toLowerCase() === normalizedTagFilterLower);
  const canCreateTag = Boolean(normalizedTagFilter && !hasExactMatch && !isAlreadyApplied);
  const primaryMatches = primaryScope
    ? filteredSuggestions.filter((item) => (item.scopes ?? []).includes(primaryScope))
    : filteredSuggestions;
  const secondaryMatches =
    primaryScope
      ? filteredSuggestions.filter((item) => !(item.scopes ?? []).includes(primaryScope))
      : [];
  const showSecondaryMatches = Boolean(
    primaryScope && normalizedTagFilter && primaryMatches.length === 0 && secondaryMatches.length > 0
  );

  const handleAddTag = (value: string) => {
    const nextTag = value.trim();
    if (!nextTag) return;
    if (appliedTags.some((t) => t.toLowerCase() === nextTag.toLowerCase())) {
      setTagFilter('');
      return;
    }
    onChangeTags([...appliedTags, nextTag]);
    setTagFilter('');
  };

  return (
    <div className="tag-card">
      <header className="tag-card-header">
        <h3>{title}</h3>
        {!isEditing && allowEdit && !showPlaceholder ? (
          <Button variant="outline" size="sm" onClick={startEdit}>
            Edit
          </Button>
        ) : null}
      </header>

      <div className="tag-card-body">
        {showPlaceholder && !isEditing ? (
          <div className="tag-empty">
            <div className="empty-outline">
              <p>{placeholderDescription}</p>
            </div>
          </div>
        ) : !isEditing ? (
          <>
            <section className="tag-view-section">
              <div className="tag-view-label">Tags</div>
              <div className="tag-view-items">
                {appliedTags.length ? (
                  appliedTags.map((t) => (
                    <TagPill key={t} label={t} caps="title" />
                  ))
                ) : (
                  <TagPill label="None" caps="title" />
                )}
              </div>
            </section>

            <section className="tag-view-section">
              <div className="tag-view-label">Note</div>
              {note ? <div className="tag-note-box">{note}</div> : <div className="tag-note-box empty">No note yet.</div>}
            </section>
          </>
        ) : (
          <>
            <div className="tag-input-stack">
              <div className="tag-search-wrapper">
                <InputField
                  label="Tags"
                  placeholder="Search and add tags..."
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag(tagFilter);
                    }
                  }}
                />
                {primaryMatches.length || showSecondaryMatches || canCreateTag ? (
                  <ul className="tag-search-dropdown">
                    {primaryMatches.map((item) => (
                      <li
                        key={item.id}
                        className="tag-search-item"
                        onClick={() => {
                          handleAddTag(item.name);
                        }}
                      >
                        <span>{item.name}</span>
                      </li>
                    ))}
                    {showSecondaryMatches ? (
                      <li className="tag-search-section">Other scopes</li>
                    ) : null}
                    {showSecondaryMatches
                      ? secondaryMatches.map((item) => (
                          <li
                            key={item.id}
                            className="tag-search-item with-scope"
                            onClick={() => {
                              handleAddTag(item.name);
                            }}
                          >
                            <span>{item.name}</span>
                            <span className="scope-badges">
                              {(item.scopes ?? []).map((scope) => (
                                <span key={`${item.id}-${scope}`} className="scope-badge">
                                  {scope}
                                </span>
                              ))}
                            </span>
                          </li>
                        ))
                      : null}
                    {canCreateTag ? (
                      <li
                        className="tag-search-item create"
                        onClick={() => {
                          handleAddTag(normalizedTagFilter);
                        }}
                      >
                        Create &quot;{normalizedTagFilter}&quot;
                      </li>
                    ) : null}
                  </ul>
                ) : null}
              </div>
              <div className="tag-selected-list">
                {appliedTags.length ? (
                  appliedTags.map((tag) => (
                    <TagPill
                      key={tag}
                      label={tag}
                      caps="title"
                      onRemove={() => onChangeTags(appliedTags.filter((t) => t !== tag))}
                    />
                  ))
                ) : (
                  <div className="tag-edit-empty">No tags selected yet.</div>
                )}
              </div>
            </div>

            <InputField
              label="Note"
              multiline
              rows={4}
              placeholder="Add a note..."
              value={note}
              onChange={(e) => onChangeNote(e.target.value)}
            />
          </>
        )}
      </div>

      {isEditing ? (
        <div className="tag-edit-actions action-group">
          <Button variant="secondary" size="sm" onClick={cancelEdit} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
          {status ? <span className="save-status">{status}</span> : null}
        </div>
      ) : null}

      <style jsx>{`
        .tag-card {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .tag-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .tag-card-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .tag-card-body {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .tag-view-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .tag-view-label {
          font-size: 13px;
          color: var(--text-tertiary);
        }
        .tag-view-items {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .tag-note-box {
          padding: 12px;
          border-radius: 12px;
          border: 1px solid rgba(210, 216, 255, 0.5);
          background: rgba(248, 249, 255, 0.8);
          min-height: 60px;
        }
        .tag-note-box.empty {
          color: var(--text-tertiary);
        }
        .tag-input-stack {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tag-search-wrapper {
          position: relative;
        }
        .tag-search-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #fff;
          border: 1px solid rgba(210, 216, 255, 0.6);
          border-radius: 12px;
          margin-top: 4px;
          max-height: 160px;
          overflow-y: auto;
          z-index: 5;
        }
        .tag-search-item {
          padding: 8px 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .tag-search-item.with-scope span:first-child {
          font-weight: 600;
        }
        .tag-search-item:hover {
          background: rgba(81, 98, 255, 0.06);
        }
        .tag-search-item.create {
          font-weight: 600;
          color: var(--primary-500);
        }
        .tag-search-section {
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-tertiary);
        }
        .scope-badges {
          display: inline-flex;
          gap: 4px;
          flex-wrap: wrap;
        }
        .scope-badge {
          padding: 2px 6px;
          border-radius: 999px;
          font-size: 10px;
          border: 1px solid rgba(210, 216, 255, 0.8);
          background: rgba(255, 255, 255, 0.9);
          color: var(--text-tertiary);
        }
        .tag-selected-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          min-height: 34px;
        }
        .tag-edit-empty {
          font-size: 13px;
          color: var(--text-tertiary);
        }
        .tag-edit-actions {
          display: flex;
          justify-content: flex-end;
        }
        .save-status {
          font-size: 12px;
          color: var(--text-tertiary);
        }
        .tag-empty {
          padding: 6px;
        }

        .tag-empty .empty-outline {
          border: 1px dashed rgba(210, 216, 255, 0.8);
          border-radius: 16px;
          padding: 22px;
          text-align: center;
          color: var(--text-tertiary);
        }

        .tag-empty .empty-outline p {
          margin: 0;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
