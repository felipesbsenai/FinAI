import React from 'react';
import {
  ArrowDownLeft,
  Car,
  Film,
  GraduationCap,
  Layers,
  Utensils,
} from 'lucide-react';
import { Category, TransactionType } from '../types';

export interface CategoryMeta {
  id: Category;
  label: string;
  color: string;
  tintBg: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  Alimentação: {
    id: 'Alimentação',
    label: 'Alimentação',
    color: '#F97316',
    tintBg: 'rgba(249, 115, 22, 0.15)',
    icon: Utensils,
  },
  Transporte: {
    id: 'Transporte',
    label: 'Transporte',
    color: '#3B82F6',
    tintBg: 'rgba(59, 130, 246, 0.15)',
    icon: Car,
  },
  Educação: {
    id: 'Educação',
    label: 'Educação',
    color: '#8B5CF6',
    tintBg: 'rgba(139, 92, 246, 0.15)',
    icon: GraduationCap,
  },
  Lazer: {
    id: 'Lazer',
    label: 'Lazer',
    color: '#EC4899',
    tintBg: 'rgba(236, 72, 153, 0.15)',
    icon: Film,
  },
  Outros: {
    id: 'Outros',
    label: 'Outros',
    color: '#6B7280',
    tintBg: 'rgba(107, 114, 128, 0.15)',
    icon: Layers,
  },
};

interface CategoryBadgeIconProps {
  category: Category;
  type?: TransactionType;
  size?: 'md' | 'sm';
}

export const CategoryBadgeIcon: React.FC<CategoryBadgeIconProps> = ({
  category,
  type = 'expense',
  size = 'md',
}) => {
  if (type === 'income') {
    return (
      <div
        className={`shrink-0 flex items-center justify-center rounded-xl ${
          size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'
        }`}
        style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}
        aria-hidden="true"
      >
        <ArrowDownLeft
          className={size === 'sm' ? 'w-4 h-4' : 'w-[18px] h-[18px]'}
          style={{ color: '#10B981' }}
        />
      </div>
    );
  }

  const meta = CATEGORY_META[category] ?? CATEGORY_META.Outros;
  const Icon = meta.icon;

  return (
    <div
      className={`shrink-0 flex items-center justify-center rounded-xl ${
        size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'
      }`}
      style={{ backgroundColor: meta.tintBg }}
      aria-hidden="true"
    >
      <Icon
        className={size === 'sm' ? 'w-4 h-4' : 'w-[18px] h-[18px]'}
        style={{ color: meta.color }}
      />
    </div>
  );
};
