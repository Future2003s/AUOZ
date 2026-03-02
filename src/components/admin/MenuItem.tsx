"use client";
import React, { memo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

interface MenuItemProps {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  href?: string;
  isActive: boolean;
  onClick: (id: string) => void;
}

const MenuItem = memo(({ id, label, icon: Icon, href, isActive, onClick }: MenuItemProps) => {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (href && pathname === href) {
      e.preventDefault();
      return;
    }
    // Don't prevent default - let Next.js Link handle navigation smoothly
    setIsNavigating(true);
    onClick(id);
    // Reset after navigation completes
    setTimeout(() => setIsNavigating(false), 300);
  };

  const content = (
    <div className={`flex items-center w-full relative z-10 transition-colors duration-200 ${isActive ? "text-[#0b57d0] dark:text-[#a8c7fa]" : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100"}`}>
      <Icon
        size={20}
        className={`mr-3 flex-shrink-0 transition-all ${isNavigating ? "animate-pulse" : ""}`}
      />
      <span className={`text-[14px] font-[500] leading-5 truncate ${isNavigating ? "opacity-70" : ""}`}>
        {label}
      </span>
      {isActive && (
        <ChevronRight
          size={16}
          className="ml-auto opacity-70"
        />
      )}
      {isNavigating && (
        <div className="ml-auto h-4 w-4 border-2 border-[#0b57d0] dark:border-[#a8c7fa] border-t-transparent rounded-full animate-spin" />
      )}
    </div>
  );

  // Material 3 style completely rounded pill active state
  const containerClasses = `
    relative w-full flex items-center px-4 py-[10px] my-[2px] rounded-full transition-all duration-200 group overflow-hidden
    ${isActive
      ? "bg-[#d3e3fd] dark:bg-[#004a77]"
      : "hover:bg-gray-100/80 dark:hover:bg-gray-800"
    }
    ${isNavigating ? "opacity-75" : ""}
  `;

  if (href) {
    return (
      <li className="list-none">
        <Link
          href={href}
          onClick={handleClick}
          prefetch={true}
          scroll={true}
          className={containerClasses}
        >
          {content}
        </Link>
      </li>
    );
  }

  return (
    <li className="list-none">
      <button
        onClick={handleClick}
        disabled={isNavigating}
        className={`${containerClasses} ${isNavigating ? "cursor-wait" : ""}`}
      >
        {content}
      </button>
    </li>
  );
});

MenuItem.displayName = "MenuItem";

export default MenuItem;
