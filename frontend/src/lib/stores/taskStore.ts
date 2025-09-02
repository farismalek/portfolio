import { writable, get, derived } from 'svelte/store';
import type { Task, TaskStatus } from '$lib/types/workspace';
import { getTasks, createTask, updateTask, deleteTask, reorderTasks } from '$lib/services/taskService';
import { authUser } from './authStore';

export interface TasksState {
  tasks: Record<TaskStatus, Task[]>;
  isLoading: boolean;
  error: string | null;
  currentWorkspaceId: string | null;
  currentProjectId: string | null;
}

function createTasksStore() {
  const initialState: TasksState = {
    tasks: {
      backlog: [],
      todo: [],
      in_progress: [],
      review: [],
      done: []
    },
    isLoading: false,
    error: null,
    currentWorkspaceId: null,
    currentProjectId: null
  };

  const { subscribe, set, update } = writable(initialState);

  return {
    subscribe,

    // Load tasks for a workspace or project
    loadTasks: async (workspaceId: string, projectId?: string) => {
      update(state => ({
        ...state,
        isLoading: true,
        error: null,
        currentWorkspaceId: workspaceId,
        currentProjectId: projectId || null
      }));

      try {
        const tasks = await getTasks({
          workspaceId,
          projectId
        });

        // Group tasks by status
        const groupedTasks: Record<TaskStatus, Task[]> = {
          backlog: [],
          todo: [],
          in_progress: [],
          review: [],
          done: []
        };

        tasks.forEach(task => {
          if (groupedTasks[task.status]) {
            groupedTasks[task.status].push(task);
          }
        });

        // Sort tasks by orderIndex within each status group
        Object.keys(groupedTasks).forEach(status => {
          groupedTasks[status as TaskStatus].sort((a, b) => a.orderIndex - b.orderIndex);
        });

        update(state => ({
          ...state,
          tasks: groupedTasks,
          isLoading: false
        }));
      } catch (error) {
        console.error('Error loading tasks:', error);

        update(state => ({
          ...state,
          isLoading: false,
          error: error.message || 'Failed to load tasks'
        }));
      }
    },

    // Add a task to the store
    addTask: async (taskData: {
      title: string;
      description?: string;
      status: TaskStatus;
      priority?: any;
      assignedToId?: string;
      dueDate?: string;
    }) => {
      const state = get({ subscribe });
      if (!state.currentWorkspaceId || !$authUser) return null;

      try {
        const newTask = await createTask({
          ...taskData,
          workspaceId: state.currentWorkspaceId,
          projectId: state.currentProjectId || undefined,
          createdById: $authUser.id
        });

        update(state => {
          const updatedTasks = { ...state.tasks };
          updatedTasks[newTask.status] = [...updatedTasks[newTask.status], newTask];

          return {
            ...state,
            tasks: updatedTasks
          };
        });

        return newTask;
      } catch (error) {
        console.error('Error creating task:', error);
        return null;
      }
    },

    // Update a task in the store
    updateTask: async (taskId: string, taskData: Partial<Task>) => {
      try {
        const updatedTask = await updateTask(taskId, taskData);

        update(state => {
          const oldStatus = Object.keys(state.tasks).find(status =>
            state.tasks[status as TaskStatus].some(task => task.id === taskId)
          ) as TaskStatus;

          if (!oldStatus) return state;

          let updatedTasks = { ...state.tasks };

          // Remove from old status array
          updatedTasks[oldStatus] = updatedTasks[oldStatus].filter(task => task.id !== taskId);

          // Add to new status array (or back to the same one if status didn't change)
          const targetStatus = taskData.status || oldStatus;
          updatedTasks[targetStatus] = [...updatedTasks[targetStatus], updatedTask];

          // Sort by orderIndex
          updatedTasks[targetStatus].sort((a, b) => a.orderIndex - b.orderIndex);

          return {
            ...state,
            tasks: updatedTasks
          };
        });

        return updatedTask;
      } catch (error) {
        console.error('Error updating task:', error);
        return null;
      }
    },

    // Move a task between statuses
    moveTask: async (taskId: string, fromStatus: TaskStatus, toStatus: TaskStatus, newIndex: number) => {
      update(state => {
        // Clone the tasks object to avoid mutating state directly
        const updatedTasks = { ...state.tasks };

        // Find the task to move
        const taskToMove = updatedTasks[fromStatus].find(task => task.id === taskId);
        if (!taskToMove) return state;

        // Remove the task from its current status column
        updatedTasks[fromStatus] = updatedTasks[fromStatus].filter(task => task.id !== taskId);

        // Update the task's status
        taskToMove.status = toStatus;

        // Insert the task at the new index in the target status column
        updatedTasks[toStatus] = [
          ...updatedTasks[toStatus].slice(0, newIndex),
          taskToMove,
          ...updatedTasks[toStatus].slice(newIndex)
        ];

        // Update orderIndex values for the destination column
        updatedTasks[toStatus] = updatedTasks[toStatus].map((task, index) => ({
          ...task,
          orderIndex: index
        }));

        return {
          ...state,
          tasks: updatedTasks
        };
      });

      // Get the new order of taskIds in the destination column
      const currentState = get({ subscribe });
      const taskIds = currentState.tasks[toStatus].map(task => task.id);

      try {
        // Persist the new order to the backend
        await reorderTasks(currentState.currentWorkspaceId!, taskIds, toStatus);

        // Also update the task's status on the server
        await updateTask(taskId, { status: toStatus });
      } catch (error) {
        console.error('Error persisting task move:', error);
        // Reload tasks to ensure UI reflects server state if there was an error
        this.loadTasks(currentState.currentWorkspaceId!, currentState.currentProjectId || undefined);
      }
    },

    // Delete a task
    deleteTask: async (taskId: string) => {
      try {
        await deleteTask(taskId);

        update(state => {
          const updatedTasks = { ...state.tasks };

          // Find which status array contains the task
          Object.keys(updatedTasks).forEach(status => {
            updatedTasks[status as TaskStatus] = updatedTasks[status as TaskStatus]
              .filter(task => task.id !== taskId);
          });

          return {
            ...state,
            tasks: updatedTasks
          };
        });

        return true;
      } catch (error) {
        console.error('Error deleting task:', error);
        return false;
      }
    },

    // Reset the store to initial state
    reset: () => set(initialState)
  };
}

export const tasksStore = createTasksStore();

// Derived store for all tasks flattened into a single array
export const allTasks = derived(
  tasksStore,
  $tasksStore => Object.values($tasksStore.tasks).flat()
);

// Derived store for filtering tasks
export function filteredTasks(filterFn: (task: Task) => boolean) {
  return derived(allTasks, $allTasks => $allTasks.filter(filterFn));
}

// Reset store when user logs out
authUser.subscribe(user => {
  if (!user) {
    tasksStore.reset();
  }
});