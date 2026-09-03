import React from 'react';
import { Modal } from '../common/Modal';
import { EntityProfile, EntityType } from './EntityProfile';

export interface EntityProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: EntityType;
  entityId: string | null;
  initialTab?: string;
  onEditClick?: (entity: any) => void;
  canMutate?: boolean;
}

export const EntityProfileModal: React.FC<EntityProfileModalProps> = ({
  isOpen,
  onClose,
  entityType,
  entityId,
  initialTab,
  onEditClick,
  canMutate = true
}) => {
  if (!entityId || !isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${entityType.toUpperCase()} Record & Institutional Profile`}
      subtitle={`ID: ${entityId}`}
      maxWidth="1240px"
      footer={
        <button className="btn btn-secondary" onClick={onClose}>
          Close Profile
        </button>
      }
    >
      <EntityProfile
        entityType={entityType}
        entityId={entityId}
        initialTab={initialTab}
        onEditClick={onEditClick}
        onClose={onClose}
        canMutate={canMutate}
      />
    </Modal>
  );
};
