import { X, RefreshCw, AlertTriangle, Lightbulb, ShieldAlert } from 'lucide-react';
import { useMapStore } from '../../store/mapStore';
import { Severity, RiskFlag, Opportunity } from '../../types';

const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'medium', 'low'];

const SEVERITY_COLOURS: Record<Severity, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-gray-100 text-gray-600 border-gray-200',
};

const SEVERITY_DOT: Record<Severity, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-400',
  medium: 'bg-yellow-400',
  low: 'bg-gray-300',
};

const IMPACT_COLOURS = {
  high: 'bg-green-100 text-green-700 border-green-200',
  medium: 'bg-blue-100 text-blue-700 border-blue-200',
  low: 'bg-gray-100 text-gray-500 border-gray-200',
};

interface NodeWithFlags {
  nodeId: string;
  nodeTitle: string;
  flags: RiskFlag[];
  opportunities: Opportunity[];
}

function generateInsights(nodesWithFlags: NodeWithFlags[]): string[] {
  const insights: string[] = [];

  const criticalDecisions = nodesWithFlags.filter((n) =>
    n.flags.some((f) => f.type === 'unguardedAutomation')
  );
  if (criticalDecisions.length > 0) {
    insights.push(
      `${criticalDecisions.length} high-criticality decision${criticalDecisions.length > 1 ? 's are' : ' is'} running with high automation and limited human oversight.`
    );
  }

  const lowConfHigh = nodesWithFlags.filter((n) =>
    n.flags.some((f) => f.type === 'lowConfidenceHighCriticality')
  );
  if (lowConfHigh.length > 0) {
    if (lowConfHigh.length === 1) {
      insights.push(`"${lowConfHigh[0].nodeTitle}" is high-criticality but has a low confidence score — prioritise for review.`);
    } else {
      insights.push(`${lowConfHigh.length} nodes are both high-criticality and low-confidence — these warrant urgent review.`);
    }
  }

  const crossBoundary = nodesWithFlags.filter((n) =>
    n.flags.some((f) => f.type === 'crossBoundaryTrustGap')
  );
  if (crossBoundary.length > 0) {
    insights.push(
      `${crossBoundary.length} cross-boundary dependenc${crossBoundary.length > 1 ? 'ies have' : 'y has'} no formal interoperability documentation.`
    );
  }

  const hubs = nodesWithFlags.filter((n) =>
    n.flags.some((f) => f.type === 'fragileHub')
  );
  if (hubs.length > 0) {
    insights.push(
      `${hubs.length} fragile hub${hubs.length > 1 ? 's' : ''} detected — failure here could cascade across multiple dependencies.`
    );
  }

  const automationCandidates = nodesWithFlags.filter((n) =>
    n.opportunities.some((o) => o.type === 'safeAutomationCandidate')
  );
  if (automationCandidates.length > 0) {
    insights.push(
      `${automationCandidates.length} node${automationCandidates.length > 1 ? 's are' : ' is'} a strong automation candidate — low criticality and high confidence.`
    );
  }

  if (insights.length === 0) {
    insights.push('No significant risk patterns detected. Map looks healthy.');
  }

  return insights;
}

export function RiskInsightsPanel() {
  const setActivePanel = useMapStore((s) => s.setActivePanel);
  const computeRiskFlags = useMapStore((s) => s.computeRiskFlags);
  const nodes = useMapStore((s) => s.nodes);

  const nodesWithFlags: NodeWithFlags[] = nodes
    .filter((n) => n.data.riskFlags.length > 0 || n.data.opportunities.length > 0)
    .map((n) => ({
      nodeId: n.id,
      nodeTitle: n.data.title,
      flags: n.data.riskFlags,
      opportunities: n.data.opportunities,
    }));

  // Counts
  const allFlags = nodesWithFlags.flatMap((n) => n.flags);
  const allOpportunities = nodesWithFlags.flatMap((n) => n.opportunities);
  const counts = SEVERITY_ORDER.reduce(
    (acc, sev) => ({ ...acc, [sev]: allFlags.filter((f) => f.severity === sev).length }),
    {} as Record<Severity, number>
  );

  const insights = generateInsights(nodesWithFlags);

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200 w-[380px] flex-shrink-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <ShieldAlert size={16} className="text-red-500" />
          <h2 className="text-sm font-semibold text-gray-800">Risk Insights</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={computeRiskFlags}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            title="Re-analyse map"
          >
            <RefreshCw size={11} />
            Re-analyse
          </button>
          <button
            onClick={() => setActivePanel('none')}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">

        {/* Summary counts */}
        <div className="grid grid-cols-4 gap-2">
          {SEVERITY_ORDER.map((sev) => (
            <div key={sev} className="text-center bg-gray-50 rounded-lg p-2">
              <div className={`w-2 h-2 rounded-full mx-auto mb-1 ${SEVERITY_DOT[sev]}`} />
              <div className="text-lg font-bold text-gray-800">{counts[sev]}</div>
              <div className="text-[9px] font-medium text-gray-400 uppercase tracking-wide">{sev}</div>
            </div>
          ))}
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{allOpportunities.length}</div>
          <div className="text-[9px] font-medium text-gray-400 uppercase tracking-wide">Opportunities</div>
        </div>

        {/* Key insights */}
        <div>
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Key Insights</div>
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-gray-700 bg-blue-50 rounded p-2.5 border border-blue-100">
                <span className="text-blue-400 mt-0.5 flex-shrink-0">•</span>
                {insight}
              </div>
            ))}
          </div>
        </div>

        {/* Risk flags by severity */}
        {SEVERITY_ORDER.filter((sev) => counts[sev] > 0).map((sev) => (
          <div key={sev}>
            <div className={`text-[10px] font-bold uppercase tracking-wide mb-1.5 flex items-center gap-1`}>
              <span className={`w-2 h-2 rounded-full ${SEVERITY_DOT[sev]}`} />
              <span className="text-gray-600">{sev} ({counts[sev]})</span>
            </div>
            <div className="space-y-1.5">
              {nodesWithFlags
                .filter((n) => n.flags.some((f) => f.severity === sev))
                .map((nwf) =>
                  nwf.flags
                    .filter((f) => f.severity === sev)
                    .map((flag) => (
                      <div
                        key={flag.id}
                        className={`rounded p-2 border text-[11px] ${SEVERITY_COLOURS[sev]}`}
                      >
                        <div className="font-semibold text-[10px] mb-0.5 opacity-80">{nwf.nodeTitle}</div>
                        <div className="leading-snug">{flag.description}</div>
                      </div>
                    ))
                )}
            </div>
          </div>
        ))}

        {/* Opportunities */}
        {allOpportunities.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <Lightbulb size={10} className="text-green-500" /> Opportunities ({allOpportunities.length})
            </div>
            <div className="space-y-1.5">
              {nodesWithFlags
                .filter((n) => n.opportunities.length > 0)
                .map((nwf) =>
                  nwf.opportunities.map((opp) => (
                    <div
                      key={opp.id}
                      className={`rounded p-2 border text-[11px] ${IMPACT_COLOURS[opp.impact]}`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="font-semibold text-[10px] opacity-80">{nwf.nodeTitle}</div>
                        <span className="text-[9px] font-bold uppercase">{opp.impact} impact</span>
                      </div>
                      <div className="leading-snug">{opp.description}</div>
                    </div>
                  ))
                )}
            </div>
          </div>
        )}

        {nodesWithFlags.length === 0 && (
          <div className="text-center py-8">
            <AlertTriangle size={32} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No risk flags found.</p>
            <p className="text-xs text-gray-300 mt-1">Click Re-analyse to run heuristics.</p>
          </div>
        )}
      </div>
    </div>
  );
}
