'use client';

import { useState, useEffect } from 'react';
import {
  ChevronDown, ChevronRight, UtensilsCrossed, Loader2,
  Search, Package,
} from 'lucide-react';

interface MenuItem {
  name: string;
  price: number | null;
  category: string;
  subcategory: string | null;
  description: string | null;
}

interface CompetitorMenu {
  name: string;
  menuCoverage: string;
  menuLastUpdated: string | null;
  itemCount: number;
  items: MenuItem[];
}

interface MenuViewerProps {
  clientId: string;
}

export function MenuViewer({ clientId }: MenuViewerProps) {
  const [data, setData] = useState<{ competitors: CompetitorMenu[]; totalItems: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCompetitors, setExpandedCompetitors] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchMenus() {
      try {
        setLoading(true);
        const res = await fetch(`/api/ai-insights/menus?clientId=${encodeURIComponent(clientId)}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        setData(json);
        if (json.competitors.length === 1) {
          setExpandedCompetitors(new Set([json.competitors[0].name]));
        }
      } catch {
        setError('Could not load menu data.');
      } finally {
        setLoading(false);
      }
    }
    fetchMenus();
  }, [clientId]);

  const toggleCompetitor = (name: string) => {
    setExpandedCompetitors((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm">Loading menus...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-sm text-destructive">{error}</div>
    );
  }

  if (!data || data.competitors.length === 0) {
    return (
      <div className="text-center py-8 space-y-2">
        <Package className="w-8 h-8 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">No menus uploaded yet.</p>
        <p className="text-xs text-muted-foreground">Upload a CSV, JSON, or PDF to get started.</p>
      </div>
    );
  }

  const lowerSearch = searchQuery.toLowerCase();

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Uploaded Menus</h3>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
            {data.totalItems} items
          </span>
        </div>
      </div>

      {/* Search */}
      {data.totalItems > 10 && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs rounded-lg border border-border bg-input-background text-foreground pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-muted-foreground"
          />
        </div>
      )}

      {/* Competitor groups */}
      <div className="space-y-2">
        {data.competitors.map((comp) => {
          const isExpanded = expandedCompetitors.has(comp.name);

          const grouped: Record<string, MenuItem[]> = {};
          for (const item of comp.items) {
            if (lowerSearch && !item.name.toLowerCase().includes(lowerSearch) && !item.category.toLowerCase().includes(lowerSearch)) {
              continue;
            }
            const cat = item.category || 'Uncategorized';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(item);
          }

          const filteredCount = Object.values(grouped).reduce((s, arr) => s + arr.length, 0);
          if (lowerSearch && filteredCount === 0) return null;

          const categories = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));

          return (
            <div key={comp.name} className="rounded-lg border border-border overflow-hidden">
              {/* Competitor header */}
              <button
                onClick={() => toggleCompetitor(comp.name)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isExpanded
                    ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  }
                  <span className="text-sm font-medium text-foreground truncate">{comp.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {lowerSearch ? `${filteredCount} / ${comp.itemCount}` : `${comp.itemCount} items`}
                  </span>
                  {comp.menuLastUpdated && (
                    <span className="text-[10px] text-muted-foreground hidden sm:inline">
                      {new Date(comp.menuLastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </button>

              {/* Expanded items */}
              {isExpanded && (
                <div className="divide-y divide-border">
                  {categories.map(([category, items]) => (
                    <div key={category}>
                      <div className="px-3 py-1.5 bg-muted/20 border-b border-border">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          {category} ({items.length})
                        </p>
                      </div>
                      <div className="divide-y divide-border/50">
                        {items.map((item, i) => (
                          <div key={`${item.name}-${i}`} className="flex items-start justify-between px-3 py-2 hover:bg-muted/20 transition-colors">
                            <div className="min-w-0 flex-1 mr-3">
                              <p className="text-xs font-medium text-foreground">{item.name}</p>
                              {item.description && (
                                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            {item.price != null && (
                              <span className="text-xs font-semibold text-foreground whitespace-nowrap">
                                ${item.price.toFixed(2)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
