import { Node, Edge } from 'reactflow';
import { NodeData, EdgeData, RiskFlag, Opportunity } from '../types';

let flagIdCounter = 0;
function newId() {
  return `rf_${++flagIdCounter}`;
}

export function computeAllRiskFlags(
  nodes: Node<NodeData>[],
  edges: Edge<EdgeData>[]
): Node<NodeData>[] {
  // Build adjacency counts
  const inDegree: Record<string, number> = {};
  const outDegree: Record<string, number> = {};
  nodes.forEach((n) => {
    inDegree[n.id] = 0;
    outDegree[n.id] = 0;
  });
  edges.forEach((e) => {
    if (outDegree[e.source] !== undefined) outDegree[e.source]++;
    if (inDegree[e.target] !== undefined) inDegree[e.target]++;
  });

  // Build org lookup
  const orgById: Record<string, string> = {};
  nodes.forEach((n) => {
    orgById[n.id] = n.data.organisation;
  });

  // Build tag → organisations map for shared capability opportunity
  const tagOrgMap: Record<string, Set<string>> = {};
  const tagNodeMap: Record<string, string[]> = {};
  nodes.forEach((n) => {
    n.data.tags.forEach((tag) => {
      if (!tagOrgMap[tag]) {
        tagOrgMap[tag] = new Set();
        tagNodeMap[tag] = [];
      }
      tagOrgMap[tag].add(n.data.organisation);
      tagNodeMap[tag].push(n.id);
    });
  });

  // Tags shared across 3+ organisations
  const sharedCapabilityNodeIds = new Set<string>();
  Object.entries(tagOrgMap).forEach(([tag, orgs]) => {
    if (orgs.size >= 3) {
      const nodeIds = tagNodeMap[tag];
      nodeIds.forEach((id) => sharedCapabilityNodeIds.add(id));
    }
  });

  // Cross-boundary edges: edge with interoperabilityNote connecting different orgs
  const crossBoundaryTargets = new Set<string>();
  edges.forEach((e) => {
    const note = e.data?.interoperabilityNote ?? '';
    if (note.trim() !== '') {
      const sourceOrg = orgById[e.source];
      const targetOrg = orgById[e.target];
      if (sourceOrg && targetOrg && sourceOrg !== targetOrg) {
        crossBoundaryTargets.add(e.target);
      }
    }
  });

  return nodes.map((node) => {
    const flags: RiskFlag[] = [];
    const opportunities: Opportunity[] = [];
    const d = node.data;
    const degree = (inDegree[node.id] ?? 0) + (outDegree[node.id] ?? 0);

    // 1. Unguarded automation
    if (
      d.nodeType === 'decision' &&
      d.automationLevel > 0.7 &&
      d.criticalityLevel > 0.75
    ) {
      flags.push({
        id: newId(),
        type: 'unguardedAutomation',
        description:
          'High-criticality decision running with high automation and no visible human oversight.',
        severity: 'critical',
      });
    }

    // 2. Stranded human effort
    if (
      d.nodeType !== 'decision' &&
      d.automationLevel < 0.2 &&
      d.criticalityLevel < 0.4
    ) {
      flags.push({
        id: newId(),
        type: 'strandedHumanEffort',
        description:
          'Low-criticality activity appears fully manual. Consider automation or removal.',
        severity: 'medium',
      });
    }

    // 3. Fragile hub
    if (degree >= 4) {
      flags.push({
        id: newId(),
        type: 'fragileHub',
        description:
          'This node is a dependency hub. Failure here could cascade widely.',
        severity: 'high',
      });
    }

    // 4. Underpowered evidence
    if (
      d.nodeType === 'evidence' &&
      d.criticalityLevel > 0.7 &&
      d.confidenceScore < 0.6
    ) {
      flags.push({
        id: newId(),
        type: 'underpoweredPolicy',
        description:
          'High-criticality evidence node has low confidence score. Risk of misapplication.',
        severity: 'high',
      });
    }

    // 5. Cross-boundary trust gap
    if (crossBoundaryTargets.has(node.id)) {
      flags.push({
        id: newId(),
        type: 'crossBoundaryTrustGap',
        description:
          'Cross-boundary dependency without formal interoperability agreement.',
        severity: 'high',
      });
    }

    // 6. Low confidence, high criticality
    if (d.confidenceScore < 0.6 && d.criticalityLevel > 0.8) {
      flags.push({
        id: newId(),
        type: 'lowConfidenceHighCriticality',
        description:
          'Node is both high-criticality and low-confidence. Prioritise for review.',
        severity: 'high',
      });
    }

    // Opportunity 1: Safe automation candidate
    if (
      d.automationLevel < 0.35 &&
      d.criticalityLevel < 0.4 &&
      d.confidenceScore > 0.7
    ) {
      opportunities.push({
        id: newId(),
        type: 'safeAutomationCandidate',
        description:
          'Low-criticality activity with reasonable confidence. Strong automation candidate.',
        impact: 'high',
      });
    }

    // Opportunity 2: Shared capability potential
    if (sharedCapabilityNodeIds.has(node.id)) {
      opportunities.push({
        id: newId(),
        type: 'sharedCapabilityPotential',
        description:
          'Multiple organisations using similar capability. Consider shared platform.',
        impact: 'medium',
      });
    }

    return {
      ...node,
      data: {
        ...d,
        riskFlags: flags,
        opportunities,
      },
    };
  });
}
