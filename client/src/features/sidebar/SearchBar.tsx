import { useSidebarStore } from "./store.js";

export function SearchBar() {
  const { searchQuery, search, clearSearch } = useSidebarStore();

  return (
    <div className="relative">
      <input
        type="text"
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-500"
        placeholder="Search..."
        value={searchQuery}
        onChange={(e) => search(e.target.value)}
      />
      {searchQuery && (
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
          onClick={clearSearch}
        >
          x
        </button>
      )}
    </div>
  );
}
