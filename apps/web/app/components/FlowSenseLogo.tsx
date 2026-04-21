type FlowSenseLogoProps = {
  className?: string;
};

export function FlowSenseLogo({ className }: FlowSenseLogoProps) {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <line
        x1="6"
        y1="12"
        x2="18"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.5"
        className="opacity-40 transition-opacity duration-200 group-hover/logo:opacity-60"
      />
      <line
        x1="18"
        y1="12"
        x2="30"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.5"
        className="opacity-40 transition-opacity duration-200 group-hover/logo:opacity-60"
      />
      <line
        x1="18"
        y1="12"
        x2="18"
        y2="24"
        stroke="currentColor"
        strokeWidth="1.5"
        className="opacity-40 transition-opacity duration-200 group-hover/logo:opacity-60"
      />

      <circle
        cx="6"
        cy="12"
        r="2"
        fill="currentColor"
        className="opacity-60 transition-opacity duration-200 group-hover/logo:opacity-80"
      />
      <circle
        cx="18"
        cy="12"
        r="2.5"
        fill="currentColor"
        className="transition-transform duration-200 [transform-box:fill-box] [transform-origin:center] group-hover/logo:scale-110"
      />
      <circle
        cx="30"
        cy="12"
        r="2"
        fill="currentColor"
        className="opacity-60 transition-opacity duration-200 group-hover/logo:opacity-80"
      />
      <circle
        cx="18"
        cy="24"
        r="2"
        fill="currentColor"
        className="opacity-60 transition-opacity duration-200 group-hover/logo:opacity-80"
      />
    </svg>
  );
}
