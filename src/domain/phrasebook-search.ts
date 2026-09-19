type SearchablePhrase = { targetText: string; supportText: string };

function searchText(text: string) {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function filterPhrasebook<T extends SearchablePhrase>(items: T[], query: string): T[] {
  const words = searchText(query).trim().split(/\s+/u).filter(Boolean);
  if (words.length === 0) return items;
  return items.filter((item) => {
    const text = searchText(`${item.targetText} ${item.supportText}`);
    return words.every((word) => text.includes(word));
  });
}
