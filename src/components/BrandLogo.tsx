import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const BrandLogo = ({ 
  className, 
  collapsed = false, 
  customLogo, 
  brandName = "STUDIO AI",
  noReferrer = true,
  autoColor = false
}: { 
  className?: string, 
  collapsed?: boolean, 
  customLogo?: string, 
  brandName?: string,
  noReferrer?: boolean,
  autoColor?: boolean
}) => {
  if (!customLogo && !collapsed) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white font-bold text-xl">
          {brandName.charAt(0)}
        </div>
        {!collapsed && <span className="font-bold text-slate-800 dark:text-white truncate max-w-[120px]">{brandName}</span>}
      </div>
    );
  }

  const logoSrc = customLogo || "/logo.svg";

  return (
    <div className={cn("flex items-center justify-center rounded-md bg-slate-900/5 dark:bg-transparent p-1", collapsed ? "h-10 w-10" : "h-12 w-auto min-w-[48px] shrink-0", className)}>
      <img 
        src={logoSrc} 
        alt={brandName} 
        className={cn(
          "w-full h-full object-contain transition-all duration-300", 
          autoColor ? "brightness-0 dark:invert" : "dark:drop-shadow-none drop-shadow-[0_0_1px_rgba(0,0,0,0.1)]"
        )} 
        {...(noReferrer ? { referrerPolicy: "no-referrer" } : {})}
      />
    </div>
  );
};
