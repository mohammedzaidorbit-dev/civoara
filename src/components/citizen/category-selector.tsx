'use client';

import React from 'react';
import {
  AlertTriangle,
  Trash2,
  LightbulbOff,
  Droplets,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';

export interface CategoryOption {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  bgLight: string;
}

export const INCIDENT_CATEGORIES: CategoryOption[] = [
  {
    id: 'pothole',
    name: 'Pothole',
    description: 'Road craters, broken pavement, asphalt damage',
    icon: AlertTriangle,
    accentColor: 'text-amber-600 border-amber-500',
    bgLight: 'bg-amber-50',
  },
  {
    id: 'garbage',
    name: 'Garbage',
    description: 'Uncollected refuse, overflowing bins, illegal dumping',
    icon: Trash2,
    accentColor: 'text-emerald-600 border-emerald-500',
    bgLight: 'bg-emerald-50',
  },
  {
    id: 'broken_streetlight',
    name: 'Broken streetlight',
    description: 'Dark streets, damaged luminaires, exposed wiring',
    icon: LightbulbOff,
    accentColor: 'text-sky-700 border-sky-600',
    bgLight: 'bg-sky-50',
  },
  {
    id: 'water_leakage',
    name: 'Water leakage',
    description: 'Water main burst, open hydrants, localized flooding',
    icon: Droplets,
    accentColor: 'text-cyan-600 border-cyan-500',
    bgLight: 'bg-cyan-50',
  },
  {
    id: 'other',
    name: 'Other',
    description: 'Traffic signals, drainage, public hazard',
    icon: HelpCircle,
    accentColor: 'text-slate-600 border-slate-500',
    bgLight: 'bg-slate-50',
  },
];

interface CategorySelectorProps {
  selectedCategory: string;
  onSelect: (categoryId: string) => void;
  error?: string;
}

export function CategorySelector({
  selectedCategory,
  onSelect,
  error,
}: CategorySelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
          Incident Category <span className="text-rose-500">*</span>
        </label>
        <span className="text-xs text-slate-400">Select one option</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {INCIDENT_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const Icon = cat.icon;

          return (
            <button
              type="button"
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={`
                relative flex items-start gap-3.5 p-3.5 rounded-lg border text-left cursor-pointer
                ${
                  isSelected
                    ? 'border-sky-700 bg-sky-50 shadow-xs ring-2 ring-sky-700/20'
                    : 'border-slate-200 hover:border-slate-400 bg-white'
                }
              `}
            >
              <div
                className={`
                  w-10 h-10 rounded-lg flex items-center justify-center shrink-0
                  ${isSelected ? 'bg-sky-700 text-white' : `${cat.bgLight} ${cat.accentColor.split(' ')[0]}`}
                `}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-semibold truncate ${
                      isSelected ? 'text-sky-950 font-bold' : 'text-slate-800'
                    }`}
                  >
                    {cat.name}
                  </span>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-sky-700 shrink-0 ml-1" />
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                  {cat.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
    </div>
  );
}
