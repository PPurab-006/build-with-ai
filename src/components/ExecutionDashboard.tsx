'use client';

import React, { useState } from 'react';
import { usePlanner } from '../context/PlannerContext';
import DashboardSummary from './DashboardSummary';
import TodayFocus from './TodayFocus';
import MilestonesSummary from './MilestonesSummary';
import ScheduleView from './ScheduleView';
import ReplanReviewModal from './ReplanReviewModal';
import RevisionHistory from './RevisionHistory';

export default function ExecutionDashboard() {
  const { state } = usePlanner();
  const [isReplanModalOpen, setIsReplanModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  if (!state.goal) return null;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Top Dashboard Summary */}
      <DashboardSummary
        onOpenReplan={() => setIsReplanModalOpen(true)}
        onOpenHistory={() => setIsHistoryDrawerOpen(true)}
      />

      {/* Today Focus Card (Dedicated day view with capacity meter) */}
      <TodayFocus onOpenReplan={() => setIsReplanModalOpen(true)} />

      {/* Milestones Overview */}
      <MilestonesSummary />

      {/* Day-by-Day Full Schedule */}
      <ScheduleView />

      {/* Replan Review Modal */}
      <ReplanReviewModal
        isOpen={isReplanModalOpen}
        onClose={() => setIsReplanModalOpen(false)}
      />

      {/* Revision History Drawer */}
      <RevisionHistory
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
      />
    </div>
  );
}
