"use client";
import React, { useState } from "react";
import { Search } from "lucide-react";

const SearchInput = React.memo(() => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="relative hidden sm:block max-w-md w-full">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Search size={16} className="text-gray-400" />
      </div>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
        placeholder="Tìm đơn hàng, khách hàng..."
      />
    </div>
  );
});

SearchInput.displayName = "SearchInput";

export default SearchInput;

