import { useSidebarStore } from "./store.js";

export function SearchBar() {
  const { searchQuery, search, clearSearch } = useSidebarStore();

  return (
    <div className="relative">
      <input
        type="text"
        className="w-full rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 border"
        style={{
          background: "white",
          borderColor: "var(--color-border)",
          color: "var(--color-text)",
        }}
        placeholder="Search..."
        value={searchQuery}
        onChange={(e) => search(e.target.value)}
      />
      {searchQuery && (
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs"
          style={{ color: "var(--color-text-secondary)" }}
          onClick={clearSearch}
        >
          ✕
        </button>
      )}
    </div>
  );
}
