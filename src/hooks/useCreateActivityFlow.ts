import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getEnabledCreationModels,
  type EnabledCreationModel,
} from '../lib/workspace/creationModels';
import { useAppStore } from '../store/useAppStore';

export function useCreateActivityFlow() {
  const navigate = useNavigate();
  const business = useAppStore((s) => s.business);
  const [sheetOpen, setSheetOpen] = useState(false);

  const models = useMemo(
    () => getEnabledCreationModels(business),
    [business],
  );

  const navigateToModel = useCallback(
    (model: EnabledCreationModel) => {
      setSheetOpen(false);
      navigate(model.route);
    },
    [navigate],
  );

  const openCreate = useCallback(() => {
    if (models.length === 0) return;
    if (models.length === 1) {
      navigateToModel(models[0]);
      return;
    }
    setSheetOpen(true);
  }, [models, navigateToModel]);

  const closeSheet = useCallback(() => setSheetOpen(false), []);

  return {
    models,
    sheetOpen,
    openCreate,
    closeSheet,
    navigateToModel,
  };
}
