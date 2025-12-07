"use client";
import React from "react";
import { Link as LinkIcon } from "lucide-react";
import Image from "next/image";
import { NewsContentBlock } from "@/types/news";

interface ContentRendererProps {
  blocks?: NewsContentBlock[];
  content?: string; // Fallback to HTML content
}

export const ContentRenderer: React.FC<ContentRendererProps> = ({ blocks, content }) => {
  const [processedContent, setProcessedContent] = React.useState<string>(content || "");
  
  // Process content on client-side to ensure images are properly rendered
  React.useEffect(() => {
    if (!blocks && content && typeof window !== "undefined") {
      console.log("Processing content for rendering:", content);
      console.log("Content has images:", content.includes("<img"));
      
      // Create a temporary div to parse HTML
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = content;
      
      // Process all images in the content
      const images = tempDiv.querySelectorAll("img");
      console.log("Found images:", images.length);
      
      images.forEach((img, index) => {
        console.log(`Processing image ${index}:`, img.src);
        // Ensure images have proper styling
        img.style.maxWidth = "100%";
        img.style.height = "auto";
        img.className = "rounded-lg my-4 w-full";
        // Add loading lazy for better performance
        if (!img.hasAttribute("loading")) {
          img.setAttribute("loading", "lazy");
        }
        // Ensure alt text exists
        if (!img.alt) {
          img.alt = "Article image";
        }
      });
      
      const processed = tempDiv.innerHTML;
      console.log("Processed content:", processed);
      setProcessedContent(processed);
    } else if (content) {
      setProcessedContent(content);
    }
  }, [content, blocks]);
  
  // If no blocks but has content, render HTML
  if (!blocks && content) {
    return (
      <>
        <style jsx>{`
          .article-content img {
            max-width: 100% !important;
            height: auto !important;
            border-radius: 0.5rem;
            margin: 1rem 0;
            display: block;
          }
          .article-content p {
            margin-bottom: 1rem;
            text-align: justify;
          }
          .article-content h1,
          .article-content h2,
          .article-content h3,
          .article-content h4 {
            margin-top: 2rem;
            margin-bottom: 1rem;
            font-weight: bold;
          }
        `}</style>
        <div 
          className="article-content prose prose-lg max-w-none text-gray-700 leading-loose"
          dangerouslySetInnerHTML={{ __html: processedContent }}
          style={{
            // Ensure images are responsive
            wordBreak: "break-word",
          }}
        />
      </>
    );
  }

  if (!blocks || blocks.length === 0) {
    return <p className="text-gray-500">Đang cập nhật nội dung...</p>;
  }

  return (
    <div className="prose prose-lg max-w-none text-gray-700 leading-loose">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'h2':
            const h2Id = block.id || `heading-${index}`;
            return (
              <h2 
                key={index} 
                id={h2Id} 
                className="text-2xl font-bold text-gray-900 mt-10 mb-4 flex items-center group scroll-mt-24"
              >
                {block.content}
                <a 
                  href={`#${h2Id}`} 
                  className="ml-2 text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity"
                >
                  <LinkIcon size={20} />
                </a>
              </h2>
            );

          case 'h3':
            const h3Id = block.id || `heading-${index}`;
            return (
              <h3 
                key={index} 
                id={h3Id} 
                className="text-xl font-semibold text-gray-800 mt-8 mb-3 scroll-mt-24"
              >
                {block.content}
              </h3>
            );

          case 'p':
            return (
              <p key={index} className="mb-6 text-justify">
                {block.content}
              </p>
            );

          case 'ul':
            return (
              <ul key={index} className="list-disc pl-6 mb-6 space-y-2 bg-red-50 py-4 pr-4 rounded-lg">
                {block.content.map((item, idx) => (
                  <li key={idx} className="text-gray-800">
                    {item}
                  </li>
                ))}
              </ul>
            );

          case 'quote':
            return (
              <blockquote 
                key={index} 
                className="border-l-4 border-red-600 pl-6 py-4 my-8 italic text-gray-600 text-xl bg-gray-50 rounded-r-lg shadow-sm"
              >
                &quot;{block.content}&quot;
              </blockquote>
            );

          case 'img':
            return (
              <figure key={index} className="my-8">
                <div className="relative w-full h-[400px] rounded-xl overflow-hidden shadow-md">
                  <Image
                    src={block.src}
                    alt={block.caption || "Article content"}
                    fill
                    className="object-cover"
                  />
                </div>
                {block.caption && (
                  <figcaption className="text-center text-sm text-gray-500 mt-2 italic">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );

          default:
            return null;
        }
      })}
    </div>
  );
};
