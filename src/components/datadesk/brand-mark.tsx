export function BrandMark({ size = 22 }: { size?: number }) {
  return (
    <div
      className="grid shrink-0 place-items-center rounded-md bg-primary/90 text-primary-foreground shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_50%,transparent),_inset_0_1px_0_0_oklch(1_0_0_/_0.18)]"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 20 20"
        width={size * 0.64}
        height={size * 0.64}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <ellipse cx="10" cy="4.5" rx="6.5" ry="2.2" />
        <path d="M3.5 4.5v10.5c0 1.22 2.91 2.2 6.5 2.2s6.5-.98 6.5-2.2V4.5" />
        <path d="M3.5 10c0 1.22 2.91 2.2 6.5 2.2s6.5-.98 6.5-2.2" />
      </svg>
    </div>
  )
}
