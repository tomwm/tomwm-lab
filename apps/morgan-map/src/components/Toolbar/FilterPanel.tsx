import { X } from 'lucide-react';
import { useMapStore } from '../../store/mapStore';
import { NodeType, NODE_TYPE_LABELS } from '../../types';

const ALL_NODE_TYPES = Object.keys(NODE_TYPE_LABELS) as NodeType[];

export function FilterPanel() {
  const setActivePanel = useMapStore((s) => s.setActivePanel);
  const filters = useMapStore((s) => s.filters);
  const setFilters = useMapStore((s) => s.setFilters);
  const resetFilters = useMapStore((s) => s.resetFilters);
  const nodes = useMapStore((s) => s.nodes);

  // Auto-populate organisations and tags from current nodes
  const allOrgs = [...new Set(nodes.map((n) => n.data.organisation).filter(Boolean))].sort();
  const allTags = [...new Set(nodes.flatMap((n) => n.data.tags))].sort();

  const toggleNodeType = (type: NodeType) => {
    const current = filters.nodeTypes;
    setFilters({
      nodeTypes: current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type],
    });
  };

  const toggleOrg = (org: string) => {
    const current = filters.organisations;
    setFilters({
      organisations: current.includes(org)
        ? current.filter((o) => o !== org)
        : [...current, org],
    });
  };

  const toggleTag = (tag: string) => {
    const current = filters.tags;
    setFilters({
      tags: current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag],
    });
  };

  const hasActiveFilters =
    filters.nodeTypes.length > 0 ||
    filters.organisations.length > 0 ||
    filters.tags.length > 0 ||
    filters.criticalityRange[0] > 0 ||
    filters.criticalityRange[1] < 1 ||
    filters.automationRange[0] > 0 ||
    filters.automationRange[1] < 1 ||
    filters.showOnlyDecisions ||
    filters.showOnlyCrossBoundary ||
    filters.showOnlyHighRisk;

  return (
    <div className="absolute top-14 left-0 z-20 w-72 h-[calc(100vh-56px)] bg-white border-r border-gray-200 flex flex-col overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">Filters</span>
          {hasActiveFilters && (
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-semibold">
              Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-[11px] text-gray-500 hover:text-red-500 transition-colors px-2 py-1 rounded hover:bg-red-50"
            >
              Reset all
            </button>
          )}
          <button
            onClick={() => setActivePanel('none')}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">

        {/* Quick filters */}
        <div>
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Quick Filters</div>
          <div className="space-y-1.5">
            {[
              { key: 'showOnlyDecisions', label: 'Decisions only' },
              { key: 'showOnlyCrossBoundary', label: 'Cross-boundary only' },
              { key: 'showOnlyHighRisk', label: 'High risk only' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters[key as keyof typeof filters] as boolean}
                  onChange={(e) => setFilters({ [key]: e.target.checked })}
                  className="w-3.5 h-3.5 accent-blue-500 rounded"
                />
                <span className="text-xs text-gray-700 group-hover:text-gray-900">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Node types */}
        <div>
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Node Types</div>
          <div className="grid grid-cols-2 gap-1">
            {ALL_NODE_TYPES.map((type) => (
              <label key={type} className="flex items-center gap-1.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.nodeTypes.includes(type)}
                  onChange={() => toggleNodeType(type)}
                  className="w-3 h-3 accent-blue-500"
                />
                <span className="text-[11px] text-gray-700 group-hover:text-gray-900">
                  {NODE_TYPE_LABELS[type]}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Criticality range */}
        <div>
          <div className="flex justify-between text-[10px] text-gray-500 mb-1">
            <span className="font-semibold uppercase tracking-wide">Criticality Range</span>
            <span>{Math.round(filters.criticalityRange[0] * 100)}% – {Math.round(filters.criticalityRange[1] * 100)}%</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-gray-400 w-6">Min</span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(filters.criticalityRange[0] * 100)}
                onChange={(e) => {
                  const val = Number(e.target.value) / 100;
                  if (val <= filters.criticalityRange[1]) {
                    setFilters({ criticalityRange: [val, filters.criticalityRange[1]] });
                  }
                }}
                className="flex-1 h-1.5 accent-red-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-gray-400 w-6">Max</span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(filters.criticalityRange[1] * 100)}
                onChange={(e) => {
                  const val = Number(e.target.value) / 100;
                  if (val >= filters.criticalityRange[0]) {
                    setFilters({ criticalityRange: [filters.criticalityRange[0], val] });
                  }
                }}
                className="flex-1 h-1.5 accent-red-400"
              />
            </div>
          </div>
        </div>

        {/* Automation range */}
        <div>
          <div className="flex justify-between text-[10px] text-gray-500 mb-1">
            <span className="font-semibold uppercase tracking-wide">Automation Range</span>
            <span>{Math.round(filters.automationRange[0] * 100)}% – {Math.round(filters.automationRange[1] * 100)}%</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-gray-400 w-6">Min</span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(filters.automationRange[0] * 100)}
                onChange={(e) => {
                  const val = Number(e.target.value) / 100;
                  if (val <= filters.automationRange[1]) {
                    setFilters({ automationRange: [val, filters.automationRange[1]] });
                  }
                }}
                className="flex-1 h-1.5 accent-purple-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-gray-400 w-6">Max</span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(filters.automationRange[1] * 100)}
                onChange={(e) => {
                  const val = Number(e.target.value) / 100;
                  if (val >= filters.automationRange[0]) {
                    setFilters({ automationRange: [filters.automationRange[0], val] });
                  }
                }}
                className="flex-1 h-1.5 accent-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Organisations */}
        {allOrgs.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Organisations</div>
            <div className="space-y-1">
              {allOrgs.map((org) => (
                <label key={org} className="flex items-center gap-1.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.organisations.includes(org)}
                    onChange={() => toggleOrg(org)}
                    className="w-3 h-3 accent-blue-500"
                  />
                  <span className="text-[11px] text-gray-700 group-hover:text-gray-900">{org}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {allTags.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Tags</div>
            <div className="flex flex-wrap gap-1">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                    filters.tags.includes(tag)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
