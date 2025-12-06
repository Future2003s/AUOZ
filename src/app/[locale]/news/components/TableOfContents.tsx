"use client";
import React from "react";
import { List } from "lucide-react";
import { NewsContentBlock } from "@/types/news";

interface TableOfContentsProps {
  blocks?: NewsContentBlock[];
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ blocks }) => {
  // Type guard to ensure we only get headings with content
  const headings = blocks?.filter((block): block is { type: "h2" | "h3"; id?: string; content: string } => 
    (block.type === 'h2' || block.type === 'h3') && 'content' in block
  ) || [];

  if (headings.length === 0) return null;

  return (
    <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 sticky top-24">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center uppercase text-sm tracking-wider">
        <List size={16} className="mr-2"/> Mục lục
      </h3>
      <nav className="flex flex-col space-y-3">
        {headings.map((heading, index) => {
          const id = heading.id || `heading-${index}`;
          
          return (
            <a 
              key={index} 
              href={`#${id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`text-sm hover:text-red-600 transition-colors block leading-snug ${
                heading.type === 'h3' ? 'pl-4 text-gray-500' : 'text-gray-700 font-medium'
              }`}
            >
              {heading.content}
            </a>
          );
        })}
      </nav>
    </div>
  );
};
