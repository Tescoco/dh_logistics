import React from "react";

type IconProps = React.SVGProps<SVGSVGElement> & {
  size?: number;
  strokeWidth?: number;
};

export const GoogleIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21c2.6 0 4.8-1 6.2-2.6l-2.6-2.6c-.9.6-2 1-3.2 1-2.4 0-4.4-1.7-5.1-3.9-.1-.4-.1-.8-.1-1.2s0-.8.1-1.2c.1-2.2 2-3.9 4.1-3.9 1.1 0 2.1.4 2.8 1l2.6-2.6C16.8 2.6 14.6 2 12 2 7 2 2.7 5.7 2.2 10.2c-.5 4.5 3.1 8.7 7.6 9.2 4.5.5 8.7-3.1 9.2-7.6.5-4.5-3.1-8.7-7.6-9.2z" />
  </Svg>
);

export const AppleIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21c2.6 0 4.8-1 6.2-2.6l-2.6-2.6c-.9.6-2 1-3.2 1-2.4 0-4.4-1.7-5.1-3.9-.1-.4-.1-.8-.1-1.2s0-.8.1-1.2c.1-2.2 2-3.9 4.1-3.9 1.1 0 2.1.4 2.8 1l2.6-2.6C16.8 2.6 14.6 2 12 2 7 2 2.7 5.7 2.2 10.2c-.5 4.5 3.1 8.7 7.6 9.2 4.5.5 8.7-3.1 9.2-7.6.5-4.5-3.1-8.7-7.6-9.2z" />
  </Svg>
);

export const MicrosoftIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21c2.6 0 4.8-1 6.2-2.6l-2.6-2.6c-.9.6-2 1-3.2 1-2.4 0-4.4-1.7-5.1-3.9-.1-.4-.1-.8-.1-1.2s0-.8.1-1.2c.1-2.2 2-3.9 4.1-3.9 1.1 0 2.1.4 2.8 1l2.6-2.6C16.8 2.6 14.6 2 12 2 7 2 2.7 5.7 2.2 10.2c-.5 4.5 3.1 8.7 7.6 9.2 4.5.5 8.7-3.1 9.2-7.6.5-4.5-3.1-8.7-7.6-9.2z" />
  </Svg>
);

function Svg({ children, size = 20, strokeWidth = 1.8, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export const DashboardIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
  </Svg>
);

export const PackageIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73L13 2.5a2 2 0 0 0-2 0L4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 3.77a2 2 0 0 0 2 0l7-3.77A2 2 0 0 0 21 16Z" />
    <path d="M3.3 7.3 12 12l8.7-4.7" />
    <path d="M12 22V12" />
  </Svg>
);

export const TruckIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 16V6a1 1 0 0 1 1-1h9v11H3Z" />
    <path d="M13 11h5l3 4v1h-3" />
    <circle cx="7.5" cy="18" r="1.5" />
    <circle cx="17" cy="18" r="1.5" />
  </Svg>
);

export const UsersIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="3" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a3 3 0 0 1 0 5.75" />
  </Svg>
);

export const SettingsIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0A1.65 1.65 0 0 0 9 3.09V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0A1.65 1.65 0 0 0 20.91 11H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
  </Svg>
);

export const UserIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 21a8 8 0 1 0-16 0" />
    <circle cx="12" cy="7" r="4" />
  </Svg>
);

export const BellIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M18 8a6 6 0 10-12 0c0 7-3 8-3 8h18s-3-1-3-8" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </Svg>
);

export const PlusIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const UploadIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3v12" />
    <path d="M8 7l4-4 4 4" />
    <path d="M20 21H4a2 2 0 0 1-2-2v-4" />
  </Svg>
);

export const SearchIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </Svg>
);

export const EyeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

export const EditIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </Svg>
);

export const TrashIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </Svg>
);

export const CheckIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Svg>
);

export const TrendingUpIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M22 7 13.5 15.5L8.5 10.5L2 17" />
    <path d="M16 7h6v6" />
  </Svg>
);

export const ClockIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </Svg>
);

export const RefreshIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </Svg>
);

export const ArrowUpIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 17L17 7" />
    <path d="M7 7h10v10" />
  </Svg>
);
