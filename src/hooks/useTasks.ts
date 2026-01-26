import { useState, useCallback, useEffect } from "react";
import { tasksApi, Task as ApiTask, CreateTaskPayload, UpdateTaskPayload } from "@/apiRequests/tasks";
import { HttpError } from "@/lib/http";
import { toast } from "sonner";

// Transformed Task type with numeric id for component use
export interface Task {
  id: number;
  _id: string;
  date: string;
  title: string;
  assignee: string;
  tag: string;
  status: "todo" | "pending" | "done";
  description?: string;
  deadline?: string; // YYYY-MM-DD format - thời hạn công việc đến bao giờ
  progressNotes?: string; // ghi chú tiến độ công việc
  createdBy?: string;
}

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
}

interface TaskActions {
  fetchTasks: (params?: {
    startDate?: string;
    endDate?: string;
    status?: "todo" | "pending" | "done";
  }) => Promise<void>;
  createTask: (payload: CreateTaskPayload) => Promise<Task | null>;
  updateTask: (id: string, payload: UpdateTaskPayload) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<boolean>;
  toggleTaskStatus: (id: string) => Promise<boolean>;
  refreshTasks: () => Promise<void>;
}

type UseTasksReturn = TaskState & TaskActions;

export const useTasks = (): UseTasksReturn => {
  const [taskState, setTaskState] = useState<TaskState>({
    tasks: [],
    isLoading: false,
    error: null,
  });

  // Fetch tasks with date range
  const fetchTasks = useCallback(
    async (params?: {
      startDate?: string;
      endDate?: string;
      status?: "todo" | "pending" | "done";
    }) => {
      try {
        setTaskState((prev) => ({ ...prev, isLoading: true, error: null }));

        // Calculate date range for current month if not provided
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const startDate =
          params?.startDate ||
          new Date(year, month, 1).toISOString().split("T")[0];
        const endDate =
          params?.endDate ||
          new Date(year, month + 1, 0).toISOString().split("T")[0];

        const response = await tasksApi.list({
          startDate,
          endDate,
          limit: 1000, // Get all tasks for the month
          ...(params?.status && { status: params.status }),
        });

        // Map backend Task to component Task format
        // Convert _id to numeric id for component compatibility
        const mappedTasks: Task[] = (response.data || []).map((task: ApiTask, index) => {
          // Generate a numeric ID from _id (use last 8 chars as hex, fallback to timestamp)
          let numericId = Date.now() + index;
          if (task._id) {
            try {
              // Try to extract numeric part from ObjectId
              const hexPart = task._id.slice(-8);
              numericId = parseInt(hexPart, 16) || Date.now() + index;
            } catch {
              numericId = Date.now() + index;
            }
          }
          
          return {
            id: numericId,
            _id: task._id,
            date: task.date,
            title: task.title,
            assignee: task.assignee,
            tag: task.tag,
            status: task.status,
            description: task.description,
            deadline: task.deadline,
            progressNotes: task.progressNotes,
            createdBy: task.createdBy,
          };
        });

        setTaskState({
          tasks: mappedTasks,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        const errorMessage =
          error instanceof HttpError
            ? error.payload?.message || "Không thể tải danh sách công việc"
            : "Đã xảy ra lỗi không mong muốn";

        setTaskState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        toast.error(errorMessage);
      }
    },
    []
  );

  // Create task
  const createTask = useCallback(
    async (payload: CreateTaskPayload): Promise<Task | null> => {
      try {
        const response = await tasksApi.create(payload);
        const newTask: ApiTask = response.data;

        // Generate numeric ID from _id
        let numericId = Date.now();
        if (newTask._id) {
          try {
            const hexPart = newTask._id.slice(-8);
            numericId = parseInt(hexPart, 16) || Date.now();
          } catch {
            numericId = Date.now();
          }
        }

        // Add to local state
        setTaskState((prev) => ({
          ...prev,
          tasks: [
            ...prev.tasks,
            {
              id: numericId,
              _id: newTask._id,
              date: newTask.date,
              title: newTask.title,
              assignee: newTask.assignee,
              tag: newTask.tag,
              status: newTask.status,
              description: newTask.description,
              deadline: newTask.deadline,
              progressNotes: newTask.progressNotes,
              createdBy: newTask.createdBy,
            },
          ],
        }));

        toast.success("Đã tạo công việc mới");
        return {
          id: numericId,
          _id: newTask._id,
          date: newTask.date,
          title: newTask.title,
          assignee: newTask.assignee,
          tag: newTask.tag,
          status: newTask.status,
          description: newTask.description,
          deadline: newTask.deadline,
          progressNotes: newTask.progressNotes,
          createdBy: newTask.createdBy,
        };
      } catch (error) {
        const errorMessage =
          error instanceof HttpError
            ? error.payload?.message || "Không thể tạo công việc"
            : "Đã xảy ra lỗi không mong muốn";
        toast.error(errorMessage);
        return null;
      }
    },
    []
  );

  // Update task
  const updateTask = useCallback(
    async (
      id: string,
      payload: UpdateTaskPayload
    ): Promise<Task | null> => {
      try {
        const response = await tasksApi.update(id, payload);
        const updatedTask: ApiTask = response.data;

        // Update local state and get the updated task
        let updatedTaskWithId: Task | null = null;
        setTaskState((prev) => {
          const existingTask = prev.tasks.find(
            (task) => task._id === id || String(task.id) === id
          );
          updatedTaskWithId = {
            id: existingTask?.id || Date.now(),
            _id: updatedTask._id,
            date: updatedTask.date,
            title: updatedTask.title,
            assignee: updatedTask.assignee,
            tag: updatedTask.tag,
            status: updatedTask.status,
            description: updatedTask.description,
            deadline: updatedTask.deadline,
            progressNotes: updatedTask.progressNotes,
            createdBy: updatedTask.createdBy,
          };
          return {
            ...prev,
            tasks: prev.tasks.map((task) =>
              task._id === id || String(task.id) === id
                ? updatedTaskWithId!
                : task
            ),
          };
        });

        toast.success("Đã cập nhật công việc");
        return updatedTaskWithId;
      } catch (error) {
        const errorMessage =
          error instanceof HttpError
            ? error.payload?.message || "Không thể cập nhật công việc"
            : "Đã xảy ra lỗi không mong muốn";
        toast.error(errorMessage);
        return null;
      }
    },
    []
  );

  // Delete task
  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    try {
      await tasksApi.delete(id);

      // Remove from local state
      setTaskState((prev) => ({
        ...prev,
        tasks: prev.tasks.filter(
          (task) => task._id !== id && String(task.id) !== id
        ),
      }));

      toast.success("Đã xóa công việc");
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof HttpError
          ? error.payload?.message || "Không thể xóa công việc"
          : "Đã xảy ra lỗi không mong muốn";
      toast.error(errorMessage);
      return false;
    }
  }, []);

  // Toggle task status
  const toggleTaskStatus = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const response = await tasksApi.toggleStatus(id);
        const updatedTask = response.data;

        // Update local state
        setTaskState((prev) => ({
          ...prev,
          tasks: prev.tasks.map((task) =>
            task._id === id || String(task.id) === id
              ? {
                  ...task,
                  status: updatedTask.status,
                }
              : task
          ),
        }));

        return true;
      } catch (error) {
        const errorMessage =
          error instanceof HttpError
            ? error.payload?.message || "Không thể cập nhật trạng thái"
            : "Đã xảy ra lỗi không mong muốn";
        toast.error(errorMessage);
        return false;
      }
    },
    []
  );

  // Refresh tasks
  const refreshTasks = useCallback(async () => {
    await fetchTasks();
  }, [fetchTasks]);

  return {
    ...taskState,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    refreshTasks,
  };
};

