import { create } from 'zustand';

export type RightPanel = 'none' | 'table' | 'relation' | 'sql';

interface EditorState {
  selectedTableId: string | null;
  selectedRelationId: string | null;
  rightPanel: RightPanel;
}

interface EditorActions {
  selectTable: (id: string | null) => void;
  selectRelation: (id: string | null) => void;
  clearSelection: () => void;
  setRightPanel: (p: RightPanel) => void;
}

export const useEditorStore = create<EditorState & EditorActions>((set) => ({
  selectedTableId: null,
  selectedRelationId: null,
  rightPanel: 'none',

  selectTable: (id) =>
    set({
      selectedTableId: id,
      selectedRelationId: null,
      rightPanel: id ? 'table' : 'none',
    }),
  selectRelation: (id) =>
    set({
      selectedRelationId: id,
      selectedTableId: null,
      rightPanel: id ? 'relation' : 'none',
    }),
  clearSelection: () =>
    set({ selectedTableId: null, selectedRelationId: null, rightPanel: 'none' }),
  setRightPanel: (p) => set({ rightPanel: p }),
}));
