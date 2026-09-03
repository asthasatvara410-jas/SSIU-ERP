import React from 'react';
import { Modal } from '../common/Modal';
import { Faculty } from '../../types';
import { EntityProfile } from './EntityProfile';

interface FacultyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  faculty: Faculty | null;
  initialTab?: string;
  onEditClick?: (faculty: Faculty) => void;
  canMutate?: boolean;
}

export const FacultyProfileModal: React.FC<FacultyProfileModalProps> = ({
  isOpen,
  onClose,
  faculty,
  initialTab = 'OVERVIEW',
  onEditClick,
  canMutate = true
}) => {
  if (!faculty || !isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Faculty Profile & Institutional Record"
      subtitle={`Employee ID: ${faculty.employeeId}`}
      maxWidth="1240px"
      footer={
        <button className="btn btn-secondary" onClick={onClose}>
          Close Profile
        </button>
      }
    >
      <EntityProfile
        entityType="faculty"
        entityId={faculty.id}
        initialTab={initialTab}
        onEditClick={onEditClick}
        onClose={onClose}
        canMutate={canMutate}
      />
    </Modal>
  );
};
