'use client';

import React, { useState } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { Goal, Milestone, Task } from '../types/planner';
import { generateInitialSchedule } from '../lib/engine';
import { getSampleGoal, getSampleMilestones, getSampleTasks } from '../lib/sampleData';
import { Sparkles, Calendar, Clock, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function GoalSetup() {
  const { dispatch } = usePlanner();

  const [title, setTitle] = useState('');
  const [totalDays, setTotalDays] = useState<number>(7);
  const [dailyHours, setDailyHours] = useState<number>(2.0);
  const [context, setContext] = useState('');
  const [constraints, setConstraints] = useState('');

  const [isSampleLoaded, setIsSampleLoaded] = useState(false);
  const [loadedMilestones, setLoadedMilestones] = useState<Milestone[] | null>(null);
  const [loadedTasks, setLoadedTasks] = useState<Task[] | null>(null);

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleLoadSample = () => {
    const sampleGoal = getSampleGoal();
    const sampleMilestones = getSampleMilestones();
    const sampleTasks = getSampleTasks();

    setTitle(sampleGoal.title);
    setTotalDays(sampleGoal.totalDays);
    setDailyHours(sampleGoal.dailyHours);
    setContext(sampleGoal.context || '');
    setConstraints(sampleGoal.constraints || '');

    setLoadedMilestones(sampleMilestones);
    setLoadedTasks(sampleTasks);
    setIsSampleLoaded(true);
    setValidationError(null);
  };

  const handleGeneratePlan = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setValidationError('Please enter a goal title.');
      return;
    }

    if (dailyHours <= 0 || isNaN(dailyHours)) {
      setValidationError('Daily available hours must be a positive number.');
      return;
    }

    if (dailyHours > 16) {
      setValidationError('Daily capacity cannot exceed 16 hours per day.');
      return;
    }

    if (totalDays <= 0 || isNaN(totalDays)) {
      setValidationError('Total duration must be at least 1 day.');
      return;
    }

    const goal: Goal = {
      title: title.trim(),
      dailyHours,
      totalDays,
      context: context.trim(),
      constraints: constraints.trim(),
      isRelativeDays: isSampleLoaded,
      createdAt: new Date().toISOString(),
    };

    // Use loaded tasks or synthesize structured initial tasks if custom
    let milestones: Milestone[];
    let tasks: Task[];

    if (isSampleLoaded && loadedMilestones && loadedTasks) {
      milestones = loadedMilestones;
      tasks = loadedTasks;
    } else {
      // Basic structured fallback tasks for a custom goal
      milestones = [
        { id: 'm1', title: 'Milestone 1: Research & Scaffolding', targetDay: Math.max(1, Math.floor(totalDays * 0.3)) },
        { id: 'm2', title: 'Milestone 2: Core Implementation', targetDay: Math.max(2, Math.floor(totalDays * 0.7)) },
        { id: 'm3', title: 'Milestone 3: Verification & Polish', targetDay: totalDays },
      ];

      tasks = [
        {
          id: 'custom-1',
          title: 'Define scope and setup environment',
          description: `Kickoff setup for "${title}".`,
          milestoneId: 'm1',
          estimatedHours: Math.min(dailyHours, 1.5),
          priority: 'high',
          dependencies: [],
          completionCriterion: 'Environment and repository initialized.',
          status: 'pending',
        },
        {
          id: 'custom-2',
          title: 'Build primary functionality',
          description: 'Implement core modules and critical features.',
          milestoneId: 'm2',
          estimatedHours: Math.min(dailyHours, 2.0),
          priority: 'high',
          dependencies: ['custom-1'],
          completionCriterion: 'Core functions operational and passing smoke test.',
          status: 'pending',
        },
        {
          id: 'custom-3',
          title: 'Review and finalize output',
          description: 'Document and perform final testing.',
          milestoneId: 'm3',
          estimatedHours: Math.min(dailyHours, 1.0),
          priority: 'medium',
          dependencies: ['custom-2'],
          completionCriterion: 'Deliverable complete and verified against goals.',
          status: 'pending',
        },
      ];
    }

    const scheduleResult = generateInitialSchedule(goal, tasks);

    dispatch({
      type: 'INITIALIZE_PLAN',
      payload: {
        goal,
        milestones,
        tasks: scheduleResult.tasks,
        schedule: scheduleResult.schedule,
      },
    });
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6">
      {/* Header and Hero */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Build With AI: Basics
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Adaptive Execution Planner
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Transform goals into dependency-ordered daily schedules with honest feasibility and adaptive replanning.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLoadSample}
            id="btn-try-sample"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50/50 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Try Sample Project
          </button>
        </div>

        {/* Sample project info banner */}
        {isSampleLoaded && (
          <div className="mt-4 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-start gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold">Sample Project loaded:</span> 7-Day ML Prototype with 9 dependency-linked tasks (10.5h effort total) and 3 sequential milestones. Click <strong>Generate Plan</strong> below to compute the deterministic schedule.
            </div>
          </div>
        )}
      </div>

      {/* Main Setup Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <form onSubmit={handleGeneratePlan} className="space-y-6">
          {validationError && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Goal Title */}
          <div>
            <label htmlFor="goal-title" className="block text-sm font-semibold text-slate-900 mb-1.5">
              Goal Title <span className="text-red-500">*</span>
            </label>
            <input
              id="goal-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Build and submit a working machine-learning project in 7 days"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 transition-colors"
            />
          </div>

          {/* Duration & Daily Hours Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="total-days" className="block text-sm font-semibold text-slate-900 mb-1.5">
                Target Duration (Days)
              </label>
              <div className="relative">
                <input
                  id="total-days"
                  type="number"
                  min="1"
                  max="60"
                  value={totalDays}
                  onChange={(e) => setTotalDays(parseInt(e.target.value) || 1)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 transition-colors"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
              <span className="text-xs text-slate-500 mt-1 block">Relative calendar days (Day 1 to Day {totalDays}).</span>
            </div>

            <div>
              <label htmlFor="daily-hours" className="block text-sm font-semibold text-slate-900 mb-1.5">
                Daily Available Hours
              </label>
              <div className="relative">
                <input
                  id="daily-hours"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="16"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(parseFloat(e.target.value) || 0)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 transition-colors"
                />
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
              <span className="text-xs text-slate-500 mt-1 block">Capacity limit per day (e.g. 2.0h / day).</span>
            </div>
          </div>

          {/* Context / Background */}
          <div>
            <label htmlFor="goal-context" className="block text-sm font-semibold text-slate-900 mb-1.5">
              Context & Learner Background
            </label>
            <textarea
              id="goal-context"
              rows={2}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g. Basic Python familiarity, starting from scratch. Need clear working proof-of-concept."
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 transition-colors resize-none"
            />
          </div>

          {/* Constraints */}
          <div>
            <label htmlFor="goal-constraints" className="block text-sm font-semibold text-slate-900 mb-1.5">
              Constraints & Hard Deadlines
            </label>
            <textarea
              id="goal-constraints"
              rows={2}
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              placeholder="e.g. Strictly 2 hours available per weekday evening. Must complete training before documentation."
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 transition-colors resize-none"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {isSampleLoaded ? '9 verified tasks ready for scheduling' : 'Structured task synthesis enabled'}
            </span>

            <button
              type="submit"
              id="btn-generate-plan"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
            >
              Generate Plan
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
