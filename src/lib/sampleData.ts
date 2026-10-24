import { Goal, Milestone, Task } from '../types/planner';

export function getSampleGoal(): Goal {
  return {
    title: 'Build and submit a working machine-learning project in 7 days',
    dailyHours: 2.0,
    totalDays: 7,
    context: 'Basic familiarity with Python, project not started. Deliver working prototype, tests, documentation.',
    constraints: 'Fixed 2 hours available per day. Must finish prototype before writing documentation.',
    isRelativeDays: true,
    createdAt: new Date().toISOString(),
  };
}

export function getSampleMilestones(): Milestone[] {
  return [
    {
      id: 'm1',
      title: 'Milestone 1: Data Pipeline & Baseline Model',
      targetDay: 3,
    },
    {
      id: 'm2',
      title: 'Milestone 2: Evaluation & Model Refinement',
      targetDay: 5,
    },
    {
      id: 'm3',
      title: 'Milestone 3: Documentation & Submission Package',
      targetDay: 7,
    },
  ];
}

export function getSampleTasks(): Task[] {
  return [
    {
      id: 'task-1',
      title: 'Set up project repository & dataset ingestion',
      description: 'Clone template, configure virtualenv/deps, and write data loader script.',
      milestoneId: 'm1',
      estimatedHours: 1.5,
      priority: 'high',
      dependencies: [],
      completionCriterion: 'Dataset script loads raw data and outputs row count and column schemas without error.',
      status: 'pending',
    },
    {
      id: 'task-2',
      title: 'Explore dataset & preprocess features',
      description: 'Handle missing values, encode categorical variables, and generate train/test splits.',
      milestoneId: 'm1',
      estimatedHours: 1.5,
      priority: 'high',
      dependencies: ['task-1'],
      completionCriterion: 'Cleaned feature matrix and target arrays saved to disk with 80/20 train/test split.',
      status: 'pending',
    },
    {
      id: 'task-3',
      title: 'Implement baseline model & training loop',
      description: 'Train a baseline model and log training loss and validation accuracy.',
      milestoneId: 'm1',
      estimatedHours: 2.0,
      priority: 'high',
      dependencies: ['task-2'],
      completionCriterion: 'Model trains for 10 epochs and achieves at least 70% baseline accuracy on validation split.',
      status: 'pending',
    },
    {
      id: 'task-4',
      title: 'Build evaluation metrics & test harness',
      description: 'Calculate precision, recall, F1 score, and generate confusion matrix plot.',
      milestoneId: 'm2',
      estimatedHours: 1.0,
      priority: 'medium',
      dependencies: ['task-3'],
      completionCriterion: 'Evaluation script outputs formatted metrics table and saves confusion matrix PNG.',
      status: 'pending',
    },
    {
      id: 'task-5',
      title: 'Perform hyperparameter tuning & error analysis',
      description: 'Tune learning rate and regularization; inspect false positive failure cases.',
      milestoneId: 'm2',
      estimatedHours: 1.5,
      priority: 'medium',
      dependencies: ['task-4'],
      completionCriterion: 'Tuned model beats baseline accuracy by at least 3% and top error modes are logged.',
      status: 'pending',
    },
    {
      id: 'task-6',
      title: 'Write unit tests for data transformation',
      description: 'Add automated tests for data normalization and boundary cases.',
      milestoneId: 'm2',
      estimatedHours: 0.5,
      priority: 'medium',
      dependencies: ['task-2'],
      completionCriterion: 'Test suite passes with 100% assertions on feature normalization functions.',
      status: 'pending',
    },
    {
      id: 'task-7',
      title: 'Draft documentation and usage instructions',
      description: 'Write comprehensive README with installation, training, and testing commands.',
      milestoneId: 'm3',
      estimatedHours: 0.5,
      priority: 'low',
      dependencies: ['task-3'],
      completionCriterion: 'README contains verified step-by-step reproduction instructions and architecture summary.',
      status: 'pending',
    },
    {
      id: 'task-8',
      title: 'Record demonstration walkthrough video',
      description: 'Record 2-minute walkthrough showing data pipeline, training, and test results.',
      milestoneId: 'm3',
      estimatedHours: 1.5,
      priority: 'high',
      dependencies: ['task-5', 'task-7'],
      completionCriterion: 'Video file is under 3 minutes, runs end-to-end, and clearly demonstrates the working system.',
      status: 'pending',
    },
    {
      id: 'task-9',
      title: 'Assemble submission checklist & repository release',
      description: 'Check license, verify repository links, and draft Devpost submission text.',
      milestoneId: 'm3',
      estimatedHours: 0.5,
      priority: 'high',
      dependencies: ['task-8'],
      completionCriterion: 'Repository contains OSI license in About section, clean git history, and ready submission draft.',
      status: 'pending',
    },
  ];
}
