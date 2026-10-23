"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { format, startOfDay, isBefore, parseISO } from "date-fns";
import { CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const router = useRouter();
  const { goal, schedule, tasks, updateTaskStatus } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (mounted && !goal) {
      router.push("/plan");
    }
  }, [mounted, goal, router]);

  if (!mounted || !goal || !schedule) return null;

  const todayStr = format(startOfDay(new Date()), "yyyy-MM-dd");
  const todayDate = startOfDay(new Date());

  const todaysTasks = tasks.filter(t => t.scheduledDate === todayStr);
  const overdueTasks = tasks.filter(t =>
    t.status !== 'completed' && t.scheduledDate && isBefore(parseISO(t.scheduledDate), todayDate)
  );

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6">
      <div className="mb-8 bg-white p-6 rounded shadow flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold mb-2">Goal: {goal.description}</h1>
          <p className="text-gray-600">Deadline: {goal.deadline} | {goal.availableHoursPerDay} hrs/day</p>
          {schedule.conflict && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded border border-red-200">
              ⚠️ Warning: {schedule.conflict}
            </div>
          )}
        </div>
        <Link
          href="/replan"
          className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded hover:bg-yellow-200"
        >
          Replan
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-bold mb-4 text-red-600">Overdue</h2>
          {overdueTasks.length === 0 ? (
            <p className="text-gray-500 italic">No overdue tasks! Keep it up.</p>
          ) : (
            <div className="space-y-3">
              {overdueTasks.map(t => (
                <div key={t.id} className="bg-red-50 p-4 rounded border border-red-200 flex gap-3 items-start">
                  <button onClick={() => updateTaskStatus(t.id, t.status === 'completed' ? 'pending' : 'completed')}>
                    {t.status === 'completed' ? (
                      <CheckCircle2 className="text-green-600" />
                    ) : (
                      <Circle className="text-red-400" />
                    )}
                  </button>
                  <div>
                    <h3 className={`font-medium ${t.status === 'completed' ? 'line-through text-gray-500' : ''}`}>{t.title}</h3>
                    <p className="text-sm text-gray-600">{t.estimatedEffortHours} hrs</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Today ({todayStr})</h2>
          {todaysTasks.length === 0 ? (
            <p className="text-gray-500 italic">No tasks scheduled for today.</p>
          ) : (
            <div className="space-y-3">
              {todaysTasks.map(t => (
                <div key={t.id} className="bg-white p-4 rounded shadow border flex gap-3 items-start">
                  <button onClick={() => updateTaskStatus(t.id, t.status === 'completed' ? 'pending' : 'completed')}>
                    {t.status === 'completed' ? (
                      <CheckCircle2 className="text-green-600" />
                    ) : (
                      <Circle className="text-gray-400" />
                    )}
                  </button>
                  <div>
                    <h3 className={`font-medium ${t.status === 'completed' ? 'line-through text-gray-500' : ''}`}>{t.title}</h3>
                    <p className="text-sm text-gray-600">{t.description}</p>
                    <p className="text-sm text-gray-500 mt-1">{t.estimatedEffortHours} hrs</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
