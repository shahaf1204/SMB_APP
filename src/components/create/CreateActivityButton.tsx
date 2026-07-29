import { CreateActivitySheet } from './CreateActivitySheet';
import { useCreateActivityFlow } from '../../hooks/useCreateActivityFlow';

interface CreateActivityButtonProps {
  label?: string;
  className?: string;
}

/**
 * Primary CTA for new activity creation — opens sheet or navigates when one model is enabled.
 */
export function CreateActivityButton({
  label = '+ חדש',
  className = 'btn btn-primary btn-sm',
}: CreateActivityButtonProps) {
  const { models, sheetOpen, openCreate, closeSheet, navigateToModel } = useCreateActivityFlow();

  return (
    <>
      <button type="button" className={className} onClick={openCreate}>
        {label}
      </button>
      {models.length > 1 && (
        <CreateActivitySheet
          open={sheetOpen}
          onClose={closeSheet}
          models={models}
          onSelect={navigateToModel}
        />
      )}
    </>
  );
}

interface CreateActivityEmptyActionProps {
  label?: string;
}

/** Empty-state CTA using onAction instead of Link. */
export function CreateActivityEmptyAction({
  label = '+ פעילות חדשה',
}: CreateActivityEmptyActionProps) {
  const { models, sheetOpen, openCreate, closeSheet, navigateToModel } = useCreateActivityFlow();

  return (
    <>
      <button type="button" className="btn btn-primary ds-empty__action" onClick={openCreate}>
        {label}
      </button>
      {models.length > 1 && (
        <CreateActivitySheet
          open={sheetOpen}
          onClose={closeSheet}
          models={models}
          onSelect={navigateToModel}
        />
      )}
    </>
  );
}
