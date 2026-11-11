import React, { useState, useRef, useEffect } from 'react';
import { Edit2, Check, X, MessageSquarePlus } from 'lucide-react';

interface CommentCellProps {
  value?: string;
  onSave?: (newValue: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}

export const CommentCell: React.FC<CommentCellProps> = ({
  value = '',
  onSave,
  placeholder = 'Add comment...',
  readOnly = false,
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = (e: React.MouseEvent) => {
    if (readOnly || !onSave) return;
    e.stopPropagation();
    setDraft(value);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (readOnly || !onSave) {
      setIsEditing(false);
      return;
    }
    const trimmed = draft.trim();
    if (trimmed !== value) {
      onSave(trimmed);
    }
    setIsEditing(false);
  };

  const handleCancel = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDraft(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div 
        className="flex items-center gap-1.5 w-full min-w-0 px-1 py-0.5"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          placeholder={placeholder}
          className="w-full text-[11px] py-1 px-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded border border-blue-500 shadow-2xs focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-sans"
        />
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="p-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded shrink-0 transition-colors"
          title="Save comment (Enter)"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleCancel();
          }}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded shrink-0 transition-colors"
          title="Cancel (Esc)"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  const hasComment = Boolean(value && value.trim().length > 0);

  return (
    <div
      onClick={handleStartEdit}
      className={`group/comment relative flex items-center justify-between gap-1.5 w-full min-w-0 py-1 px-2 rounded-md transition-colors ${
        !readOnly && onSave ? 'cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800/60' : ''
      } ${className}`}
      title={hasComment ? `Comment: ${value} (Click to edit)` : 'Click to add a staffing comment'}
    >
      <div className="min-w-0 flex-1">
        {hasComment ? (
          <span className="text-[11px] text-slate-700 dark:text-slate-300 truncate block leading-relaxed font-sans">
            {value}
          </span>
        ) : (
          <span className="text-[11px] text-slate-300 dark:text-slate-600 italic block group-hover/comment:text-blue-500 dark:group-hover/comment:text-blue-400 transition-colors font-sans">
            {readOnly ? '—' : '+ Add comment'}
          </span>
        )}
      </div>

      {!readOnly && onSave && (
        <span className="shrink-0 opacity-0 group-hover/comment:opacity-100 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-opacity">
          {hasComment ? (
            <Edit2 className="w-3 h-3" />
          ) : (
            <MessageSquarePlus className="w-3 h-3 text-blue-500" />
          )}
        </span>
      )}
    </div>
  );
};
