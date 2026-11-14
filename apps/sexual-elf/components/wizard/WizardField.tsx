'use client';

import type { WizardField as WizardFieldType } from '@/lib/wizardConfig';
import type { WizardAnswers } from '@/lib/types';

interface WizardFieldProps {
  field: WizardFieldType;
  answers: WizardAnswers;
  onChange: (key: string, value: string | string[] | undefined) => void;
}

export default function WizardField({ field, answers, onChange }: WizardFieldProps) {
  const value = answers[field.key];

  const baseInput =
    'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-forest-400 focus:border-forest-400 transition';

  if (field.type === 'select') {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {field.hint && <p className="text-xs text-gray-500">{field.hint}</p>}
        <select
          className={baseInput}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(field.key, e.target.value || undefined)}
        >
          <option value="">Select an option…</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === 'radio') {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {field.hint && <p className="text-xs text-gray-500">{field.hint}</p>}
        <div className="flex flex-col gap-2 mt-1">
          {field.options?.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 cursor-pointer transition-colors ${
                value === opt.value
                  ? 'border-forest-500 bg-forest-50 text-forest-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-forest-300'
              }`}
            >
              <input
                type="radio"
                name={field.key}
                value={opt.value}
                checked={value === opt.value}
                onChange={() => onChange(field.key, opt.value)}
                className="accent-forest-500"
              />
              <span className="text-sm font-medium">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (field.type === 'multiselect') {
    const selected = (value as string[]) ?? [];
    const toggle = (v: string) => {
      // If "none" selected, clear all others; if other selected, remove "none"
      if (v === 'none') {
        onChange(field.key, selected.includes('none') ? [] : ['none']);
        return;
      }
      const without = selected.filter((s) => s !== 'none');
      if (without.includes(v)) {
        onChange(field.key, without.filter((s) => s !== v));
      } else {
        onChange(field.key, [...without, v]);
      }
    };

    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">{field.label}</label>
        {field.hint && <p className="text-xs text-gray-500">{field.hint}</p>}
        <div className="flex flex-wrap gap-2 mt-1">
          {field.options?.map((opt) => {
            const active = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-colors ${
                  active
                    ? 'bg-forest-500 border-forest-500 text-white'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-forest-300'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (field.type === 'date') {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">{field.label}</label>
        {field.hint && <p className="text-xs text-gray-500">{field.hint}</p>}
        <input
          type="date"
          className={baseInput}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(field.key, e.target.value || undefined)}
          max={new Date().toISOString().split('T')[0]}
        />
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">{field.label}</label>
        {field.hint && <p className="text-xs text-gray-500">{field.hint}</p>}
        <textarea
          className={`${baseInput} resize-none`}
          rows={4}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(field.key, e.target.value || undefined)}
        />
        <p className="text-xs text-gray-400 text-right">
          {((value as string) ?? '').length}/{field.maxLength ?? 500}
        </p>
      </div>
    );
  }

  return null;
}
