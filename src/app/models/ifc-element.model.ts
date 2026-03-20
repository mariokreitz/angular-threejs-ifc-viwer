export type SelectedElement = {
  expressID: number;
  modelID: number;
  ifcType: string;
  colorHex: string | null;
  currentColor?: string;
};

export type HoveredElement = {
  expressID: number;
  modelID: number;
  ifcType: string;
};
