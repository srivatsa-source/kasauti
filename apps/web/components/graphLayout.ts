export const GRAPH_WIDTH = 1000;
export const GRAPH_HEIGHT = 640;
export const GRAPH_LABEL_FONT = "bold 13px sans-serif";
export const GRAPH_LINE_HEIGHT = 16;

const HEADER_HEIGHT = 44;
const NODE_INSET = 22;
const LABEL_OFFSET = 22;
const LABEL_RIGHT_GAP = 12;
const MAX_LABEL_LINES = 2;
const SCENARIO_LANGUAGE_ORDER = ["Hindi", "Hinglish", "Kannada", "Indian English"];

// Edges run dialect <- scenario -> rule -> failure <- fix, so these columns read left to right.
const COLUMNS = [
  { type: "language", title: "Dialects", width: 140 },
  { type: "scenario", title: "Scenarios", width: 245 },
  { type: "rule", title: "Rules", width: 205 },
  { type: "failure", title: "Violations", width: 205 },
  { type: "fix", title: "Patches", width: 205 },
];

export const GRAPH_COLUMNS = COLUMNS.map((column, index) => ({
  ...column,
  x: COLUMNS.slice(0, index).reduce((sum, previous) => sum + previous.width, 0),
}));

interface LayoutInput {
  type: string;
  label: string;
  val?: number;
  metadata?: { language?: string };
}

export interface NodePlacement {
  x: number;
  y: number;
  radius: number;
  labelX: number;
  labelWidth: number;
  labelLines: string[];
}

type MeasureText = (text: string) => number;

export const wrapLabel = (text: string, maxWidth: number, measure: MeasureText): string[] => {
  const lines: string[] = [];
  let current = "";

  for (const word of text.split(" ")) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && measure(candidate) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  lines.push(current);

  if (lines.length <= MAX_LABEL_LINES) return lines;

  let last = lines.slice(MAX_LABEL_LINES - 1).join(" ");
  while (last.length > 1 && measure(`${last}…`) > maxWidth) {
    last = last.slice(0, -1);
  }
  return [...lines.slice(0, MAX_LABEL_LINES - 1), `${last.trimEnd()}…`];
};

const languageRank = (node: LayoutInput) => {
  const rank = SCENARIO_LANGUAGE_ORDER.indexOf(node.metadata?.language ?? "");
  return rank === -1 ? SCENARIO_LANGUAGE_ORDER.length : rank;
};

export const layoutGraph = <T extends LayoutInput>(
  nodes: T[],
  measure: MeasureText
): (T & NodePlacement)[] =>
  GRAPH_COLUMNS.flatMap((column) => {
    const members = nodes.filter((node) => node.type === column.type);
    // Grouping scenarios by dialect keeps their edges to the first column from crossing.
    if (column.type === "scenario") {
      members.sort((a, b) => languageRank(a) - languageRank(b));
    }

    const rowHeight = (GRAPH_HEIGHT - HEADER_HEIGHT) / members.length;
    const x = column.x + NODE_INSET;
    const labelX = x + LABEL_OFFSET;
    const maxLabelWidth = column.width - NODE_INSET - LABEL_OFFSET - LABEL_RIGHT_GAP;

    return members.map((node, index) => {
      const labelLines = wrapLabel(node.label, maxLabelWidth, measure);
      return {
        ...node,
        x,
        y: HEADER_HEIGHT + rowHeight * (index + 0.5),
        radius: (node.val ?? 16) * 0.45,
        labelX,
        labelWidth: Math.max(...labelLines.map(measure)),
        labelLines,
      };
    });
  });
