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
    <>
      <Icon
        size={18}
        className={`mr-3 transition-colors ${
          isActive
            ? "text-indigo-600"
            : "text-gray-400 group-hover:text-gray-600"
        } ${isNavigating ? "animate-pulse" : ""}`}
      />
      <span className={isNavigating ? "opacity-70" : ""}>{label}</span>
      {isActive && (
        <ChevronRight
          size={14}
          className="ml-auto text-indigo-400"
        />
      )}
      {isNavigating && (
        <div className="ml-auto h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      )}
    </>
  );

  if (href) {
    return (
      <li>
        <Link
          href={href}
          onClick={handleClick}
          prefetch={true}
          scroll={true}
          className={`
            w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group
            ${
              isActive
                ? "bg-indigo-50 text-indigo-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }
            ${isNavigating ? "opacity-75" : ""}
          `}
        >
          {content}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <button
        onClick={handleClick}
        disabled={isNavigating}
        className={`
          w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group
          ${
            isActive
              ? "bg-indigo-50 text-indigo-700"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }
          ${isNavigating ? "opacity-75 cursor-wait" : ""}
        `}
      >
        {content}
      </button>
    </li>
  );
});

MenuItem.displayName = "MenuItem";

export default MenuItem;

