import {useState, useMemo, useEffect, useRef} from "react";
import { Title, Button, Input, Spinner, List, Cell, Avatar } from "@telegram-apps/telegram-ui";
import useFetch from "@/hooks/useFetch";
import { getData } from "@/api";
import { Pagination } from "@telegram-apps/telegram-ui/dist/components/Navigation/Pagination/Pagination";
import { Page } from "@/components/Page.tsx";
import { getRatingsPageImageSize } from "@/utils/imageSize";
import "./RatingsPage.css";

const ITEMS_PER_PAGE = 20;

// Helper function to check if person has a real photo (not stock/fallback)
function hasRealPhoto(photo) {
  if (!photo) {
    return false;
  }
  // Stock photos should be filtered out
  if (photo.includes("pravatar.cc") || photo.includes("placeholder")) {
    return false;
  }
  // Base64 photos are real (with or without data URI prefix)
  if (photo.startsWith("data:image/") && photo.includes("base64,")) {
    return true;
  }
  // Detect base64 JPEG/PNG (starts with common base64 patterns)
  // JPEG: /9j/4AAQ, PNG: iVBORw0KGgo
  if (photo.length > 100 && (photo.startsWith("/9j/") || photo.startsWith("iVBORw0KGgo") || photo.match(/^[A-Za-z0-9+/=]{100,}$/))) {
    return true;
  }
  // Regular URLs are real (if not stock)
  if (photo.startsWith("http://") || photo.startsWith("https://")) {
    return true;
  }
  // Long base64-like strings without prefix are real
  if (photo.length > 100 && !photo.startsWith("data:") && !photo.includes(".")) {
    return true;
  }
  return false;
}

// Helper function to handle photo URLs (base64 or regular URLs)
// Returns fallback avatar if photo is missing or is a stock photo
function getPhotoUrl(photo) {
  if (!photo) {
    return getFallbackAvatar();
  }
  
  // If it's a stock photo (pravatar), use fallback instead
  if (photo.includes("pravatar.cc") || photo.includes("placeholder")) {
    return getFallbackAvatar();
  }
  
  // If it's already a data URI or URL, use it as-is
  if (photo.startsWith("data:") || photo.startsWith("http://") || photo.startsWith("https://")) {
    return photo;
  }
  
  // Otherwise, assume it's base64 and add the data URI prefix
  // Try to detect image format, default to jpeg
  const format = photo.length > 100 && photo.includes("/") ? "jpeg" : "jpeg";
  return `data:image/${format};base64,${photo}`;
}

// Fallback avatar SVG (user icon)
function getFallbackAvatar() {
  // Simple user icon SVG as data URI
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export function RatingsPage() {
  const [selectedTab, setSelectedTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [listKey, setListKey] = useState(0);
  const [onlyWithPhoto, setOnlyWithPhoto] = useState(false);
  const prevSearchQueryRef = useRef("");
  const [photoCache, setPhotoCache] = useState({}); // Cache for loaded photos

  // Fetch all persons once - without photos to reduce response size (41MB -> ~100KB)
  // Photos will be loaded lazily per person when needed
  const { data: allPersonsRaw, loading, error } = useFetch("/api/persons?includePhotos=false");

  const allPersons = useMemo(() => {
    if (!allPersonsRaw) {
      return [];
    }
    let filtered = [...allPersonsRaw];
    
    // Filter by gender (male field: "male" or "female")
    if (selectedTab === "male") {
      filtered = filtered.filter(person => person.male === "male");
    } else if (selectedTab === "female") {
      filtered = filtered.filter(person => person.male === "female");
    }
    // else "all" - no gender filter
    
    // Filter to only people with photos if filter is enabled
    // Note: Since photos are excluded from bulk load, we need to fetch individual persons
    // For now, we'll skip this filter when photos aren't loaded (they're null)
    // TODO: Add backend endpoint to check photo existence without loading full photo
    if (onlyWithPhoto) {
      filtered = filtered.filter(person => {
        const photo = photoCache[person.id] || person.photo;
        return hasRealPhoto(photo);
      });
    }
    
    
    // Sort by rating descending (highest first)
    return filtered.sort((a, b) => b.rating - a.rating);
  }, [allPersonsRaw, selectedTab, onlyWithPhoto, photoCache]);

  const filteredPersons = useMemo(() => {
    if (!searchQuery.trim()) {
      return allPersons;
    }

    // Split query into words and normalize (trim, lowercase)
    const queryWords = searchQuery
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 0);

    if (queryWords.length === 0) {
      return allPersons;
    }

    return allPersons.filter((person) => {
      // Normalize person data for comparison
      const nameLower = person.name?.toLowerCase() || '';
      const surnameLower = person.surname?.toLowerCase() || '';
      const fullNameLower = `${nameLower} ${surnameLower}`.trim();
      const reversedNameLower = `${surnameLower} ${nameLower}`.trim();
      const schoolClassLower = person.schoolClass?.toLowerCase() || '';

      // If single word query, check if it matches any part
      if (queryWords.length === 1) {
        const query = queryWords[0];
        return (
          nameLower.includes(query) ||
          surnameLower.includes(query) ||
          fullNameLower.includes(query) ||
          schoolClassLower.includes(query)
        );
      }

      // For multi-word queries (e.g., "Иван Петров" or "Петров Иван")
      // Check if the full query matches the full name (in any order)
      const queryLower = queryWords.join(' ');
      
      // Check exact match on full name (name+surname or surname+name)
      if (fullNameLower.includes(queryLower) || reversedNameLower.includes(queryLower)) {
        return true;
      }

      // Check if all words match somewhere (more flexible)
      // This handles partial matches like "Ив Петр" matching "Иван Петров"
      const allWordsMatch = queryWords.every(queryWord => {
        return (
          nameLower.includes(queryWord) ||
          surnameLower.includes(queryWord) ||
          schoolClassLower.includes(queryWord)
        );
      });

      return allWordsMatch;
    });
  }, [allPersons, searchQuery]);

  const totalPages = Math.ceil(filteredPersons.length / ITEMS_PER_PAGE);
  const paginatedPersons = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    console.log("currentPage:", currentPage);
    console.log("ITEMS_PER_PAGE:", ITEMS_PER_PAGE);
    console.log("filteredPersons.length:", filteredPersons.length);
    console.log("totalPages:", totalPages);
    console.log("startIndex:", startIndex);
    console.log("endIndex:", endIndex);
    const paginated = filteredPersons.slice(startIndex, endIndex);
    console.log("paginatedPersons:", paginated);
    return paginated;
  }, [filteredPersons, currentPage, totalPages]);

  // Lazy load photos ONLY for current page items (page-by-page loading)
  useEffect(() => {
    if (!paginatedPersons.length) return;
    
    // Fetch photos for persons on current page that don't have photos cached
    // This ensures photos are loaded page by page, not all at once
    paginatedPersons.forEach(person => {
      // Only load if photo is not already cached
      if (!photoCache[person.id]) {
        // Fetch individual person data with photo (calculated based on device pixel ratio)
        // Avatar displays at 48px, but we need 3x resolution for sharp images on mobile high-DPI screens
        const imageSize = getRatingsPageImageSize();
        getData(`/api/persons/${person.id}?photoWidth=${imageSize.width}&photoHeight=${imageSize.height}`).then(result => {
          if (result.success && result.data?.photo) {
            setPhotoCache(prev => ({
              ...prev,
              [person.id]: result.data.photo
            }));
          }
        }).catch(err => {
          console.warn(`Failed to load photo for person ${person.id}:`, err);
        });
      }
    });
    // Only depend on paginatedPersons - when page changes, load photos for that page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginatedPersons]);

  // Reset to page 1 when filters change
  useEffect(() => {
    console.log("selectedTab:", selectedTab, "searchQuery:", searchQuery);
    setCurrentPage(1);
  }, [selectedTab, searchQuery, onlyWithPhoto]);

  // Track search and pagination changes for animation
  useEffect(() => {
    if (searchQuery !== prevSearchQueryRef.current) {
      prevSearchQueryRef.current = searchQuery;
      setListKey(prev => prev + 1);
    }
  }, [searchQuery]);

  useEffect(() => {
    setListKey(prev => prev + 1);
  }, [currentPage, selectedTab, onlyWithPhoto]);

  return (
    <Page back={true}>
      <div className="ratings-page">
        <div className="ratings-header">
          <Title level="2" weight="2">
            Таблица рейтингов
          </Title>
        </div>

        <div className="ratings-controls">
          <div className="ratings-tabs">
            <Button
              mode={selectedTab === "all" ? "filled" : "outline"}
              size="s"
              onClick={() => setSelectedTab("all")}
            >
              Все
            </Button>
            <Button
              mode={selectedTab === "male" ? "filled" : "outline"}
              size="s"
              onClick={() => setSelectedTab("male")}
            >
              Парни
            </Button>
            <Button
              mode={selectedTab === "female" ? "filled" : "outline"}
              size="s"
              onClick={() => setSelectedTab("female")}
            >
              Девушки
            </Button>
          </div>

          <div className="ratings-search-wrapper">
            <Input
              header="Поиск"
              placeholder="Введите имя, фамилию или класс..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="ratings-filter-photo">
            <Button
              size="m"
              stretched
              mode={onlyWithPhoto ? "filled" : "outline"}
              onClick={() => setOnlyWithPhoto(!onlyWithPhoto)}
              className="ratings-button-filter"
            >
              Показывать только с фото
            </Button>
          </div>
        </div>

        {loading && (
          <div className="ratings-loader">
            <Spinner size="l"/>
          </div>
        )}

        {error && (
          <div className="ratings-error">
            Ошибка: {error}
          </div>
        )}

        {!loading && !error && (
          <List key={listKey}>
            {paginatedPersons.map((person, index) => {
              const originalIndex = allPersons.findIndex(p => p.id === person.id);
              const isInSearchMode = searchQuery.trim().length > 0;
              const isFirst = originalIndex === 0;
              const isSecond = originalIndex === 1;
              const isThird = originalIndex === 2;
              
              // Determine medal class only when not in search mode
              let medalClass = '';
              if (!isInSearchMode) {
                if (isFirst) {
                  medalClass = 'ratings-cell--gold';
                } else if (isSecond) {
                  medalClass = 'ratings-cell--silver';
                } else if (isThird) {
                  medalClass = 'ratings-cell--bronze';
                }
              }
              
              // Determine animation class based on search mode
              const animationClass = isInSearchMode 
                ? 'ratings-cell--search-appear' 
                : 'ratings-cell--appear';
              
              return (
                <Cell
                  key={`${listKey}-${person.id}`}
                  className={`ratings-cell ${medalClass} ${animationClass}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                  before={
                    <div className="ratings-cell-before">
                      <span className="ratings-rank-badge">#{originalIndex + 1}</span>
                      <Avatar
                        src={getPhotoUrl(photoCache[person.id] || person.photo)}
                      alt={`${person.surname} ${person.name}`}
                      size={48}
                    />
                  </div>
                }
                subtitle={person.schoolClass}
                after={person.rating}
              >
                {person.surname} {person.name}
                </Cell>
              );
            })}
          </List>
        )}

        {!loading && !error && filteredPersons.length === 0 && (
          <div className="ratings-empty">
            Ничего не найдено
          </div>
        )}

      {!loading && !error && totalPages > 1 && (
        <div className="ratings-pagination">
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
          />
        </div>
      )}
      </div>
    </Page>
  );
}