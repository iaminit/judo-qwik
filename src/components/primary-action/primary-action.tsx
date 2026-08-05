import { component$, Slot, type PropFunction } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';

export interface PrimaryActionProps {
  href?: string;
  onClick$?: PropFunction<() => void>;
  class?: string;
}

export const PrimaryAction = component$<PrimaryActionProps>((props) => {
  const baseClasses = `
    h-14 px-8 rounded-2xl flex items-center justify-center font-bold text-lg text-white
    shadow-md transition-all duration-200 pressable cursor-pointer no-underline
    select-none text-center inline-flex gap-3 w-full sm:w-auto
    ${props.class || ''}
  `;

  const style = {
    backgroundColor: 'var(--color-action)',
  };

  if (props.href) {
    return (
      <Link href={props.href} class={baseClasses} style={style}>
        <Slot />
      </Link>
    );
  }

  return (
    <button onClick$={props.onClick$} class={baseClasses} style={style}>
      <Slot />
    </button>
  );
});
