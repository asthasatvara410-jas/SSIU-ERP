import React from 'react';
import { ERPNotification } from '../../types';
import { PostLoginUpdateModal } from './PostLoginUpdateModal';

export interface WhatsNewModalProps {
  notifications: ERPNotification[];
  onClose: () => void;
  onNavigateTab?: (tab: string, params?: any) => void;
}

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({ notifications, onClose, onNavigateTab }) => {
  return (
    <PostLoginUpdateModal
      notifications={notifications}
      onClose={onClose}
      onNavigateTab={onNavigateTab}
    />
  );
};

