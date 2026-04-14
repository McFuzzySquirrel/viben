import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import {
  DIFFICULTY_DEFINITIONS,
  getDifficultyDefinition,
  type DifficultyDefinition,
  type DifficultyId,
} from '@shared/config/difficulty';
import {
  loadProgressionState,
  persistSelectedDifficulty,
  type ProgressionLoadStatus,
  type ProgressionStorageIssue,
} from '@shared/persistence';

export interface DifficultySelectionContextValue {
  availableDifficulties: ReadonlyArray<DifficultyDefinition>;
  selectedDifficultyId: DifficultyId;
  selectedDifficulty: DifficultyDefinition;
  persistenceStatus: ProgressionLoadStatus;
  persistenceIssues: ReadonlyArray<ProgressionStorageIssue>;
  setSelectedDifficulty: (difficultyId: DifficultyId) => void;
}

const DifficultySelectionContext = createContext<DifficultySelectionContextValue | null>(null);

export function DifficultySelectionProvider({ children }: PropsWithChildren) {
  const [snapshot, setSnapshot] = useState(() => loadProgressionState());

  const setSelectedDifficulty = useCallback((difficultyId: DifficultyId) => {
    setSnapshot(persistSelectedDifficulty(difficultyId));
  }, []);

  const selectedDifficulty = useMemo(
    () => getDifficultyDefinition(snapshot.save.selectedDifficultyId),
    [snapshot.save.selectedDifficultyId],
  );

  const value = useMemo<DifficultySelectionContextValue>(
    () => ({
      availableDifficulties: DIFFICULTY_DEFINITIONS,
      selectedDifficultyId: snapshot.save.selectedDifficultyId,
      selectedDifficulty,
      persistenceStatus: snapshot.status,
      persistenceIssues: snapshot.issues,
      setSelectedDifficulty,
    }),
    [selectedDifficulty, setSelectedDifficulty, snapshot.issues, snapshot.save.selectedDifficultyId, snapshot.status],
  );

  return (
    <DifficultySelectionContext.Provider value={value}>
      {children}
    </DifficultySelectionContext.Provider>
  );
}

export function useDifficultySelection() {
  const context = useContext(DifficultySelectionContext);

  if (!context) {
    throw new Error('useDifficultySelection must be used within DifficultySelectionProvider.');
  }

  return context;
}
