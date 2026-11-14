import { TrafficGraph } from '../types/graph';

export function displayNodeId(nodeId: string, graph: TrafficGraph): string {
  if (graph.city !== 'haiphong') return nodeId;
  const index = graph.nodes.findIndex(node => node.id === nodeId);
  return index >= 0 ? `N${index + 1}` : nodeId.replace(/^HP_/, '');
}

export function displayGraphText(text: string, graph: TrafficGraph): string {
  if (graph.city !== 'haiphong') return text;
  return graph.nodes.reduce(
    (visibleText, node, index) => visibleText.replaceAll(node.id, `N${index + 1}`),
    text,
  );
}
