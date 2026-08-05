import { component$, type PropFunction } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';

export interface StudyRowProps {
  title: string;
  desc: string;
  icon: string;
  iconType?: 'emoji' | 'img';
  href: string;
  badge?: string;
  onClick$?: PropFunction<() => void>;
}

export const StudyRow = component$<StudyRowProps>(({ title, desc, icon, iconType, href, badge, onClick$ }) => {
  return (
    <Link
      href={href}
      onClick$={onClick$}
      class="study-row group relative flex items-center p-4 min-h-[76px] rounded-2xl border no-underline outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200 pressable"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        color: 'var(--color-text)',
      }}
    >
      {/* Icon 48px */}
      <div
        class="w-12 h-12 rounded-xl flex items-center justify-center mr-4 shrink-0 overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface-alt)' }}
      >
        {iconType === 'emoji' ? (
          <span class="text-2xl">{icon}</span>
        ) : (
          <img
            src={icon}
            alt={title}
            class="w-8 h-8 object-contain transition-transform duration-200 group-hover:scale-110"
            loading="lazy"
            width={32}
            height={32}
          />
        )}
      </div>

      {/* Content */}
      <div class="flex-1 min-w-0 pr-2">
        <div class="flex items-center gap-2">
          <h3
            class="font-bold text-base md:text-lg leading-tight truncate m-0 group-hover:text-[var(--color-action)] transition-colors"
            style={{ color: 'var(--color-text)' }}
          >
            {title}
          </h3>
          {badge && (
            <span
              class="px-2 py-0.5 text-xs font-semibold rounded-md shrink-0"
              style={{
                backgroundColor: 'rgba(180, 35, 45, 0.1)',
                color: 'var(--color-action)',
              }}
            >
              {badge}
            </span>
          )}
        </div>
        <p
          class="text-sm leading-normal truncate m-0 mt-0.5"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {desc}
        </p>
      </div>

      {/* Chevron */}
      <div class="study-row-chevron shrink-0 w-8 h-8 flex items-center justify-center text-xl font-bold" style={{ color: 'var(--color-text-muted)' }}>
        ›
      </div>
    </Link>
  );
});
