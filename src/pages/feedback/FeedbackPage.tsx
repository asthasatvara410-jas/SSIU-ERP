import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { StudentFeedbackPage } from './StudentFeedbackPage';
import { AdminFeedbackDashboardPage } from './AdminFeedbackDashboardPage';

export interface FeedbackPageProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const FeedbackPage: React.FC<FeedbackPageProps> = ({ activeTab, setActiveTab }) => {
  const { role } = useAuth();

  // Route sub-tabs (such as anonymous grievance filing, tracking, or feedback submission) to StudentFeedbackPage
  if (
    role === 'STUDENT' || 
    activeTab === 'feedback-anonymous-grievance' || 
    activeTab === 'feedback-anonymous' || 
    activeTab === 'feedback-track' || 
    activeTab === 'feedback-give' || 
    activeTab === 'feedback-my' || 
    activeTab === 'feedback-suggestions'
  ) {
    return <StudentFeedbackPage activeSubTab={activeTab} onTabChange={setActiveTab} />;
  }

  return <AdminFeedbackDashboardPage />;
};

export default FeedbackPage;
