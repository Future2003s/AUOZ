"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp,
  ChevronDown,
  Plus, 
  User, 
  CheckCircle2, 
  Clock, 
  X,
  Trash2,
  Save,
  Tag,
  Loader2,
  Edit,
  Eye,
  Copy,
  CheckCircle,
  Calendar,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useTasks, Task } from '@/hooks/useTasks';
import { tasksApi } from '@/apiRequests/tasks';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import TasksToolbar from "./tasks/TasksToolbar";
import TaskCard from "./tasks/TaskCard";
import EmptyState from "./tasks/EmptyState";
import ErrorState from "./tasks/ErrorState";
import CalendarSkeleton from "./tasks/CalendarSkeleton";
import TaskDetailView from "./tasks/TaskDetailView";

// --- Types & Interfaces ---
// Task type is imported from useTasks hook

const DAYS_OF_WEEK = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const FULL_DAYS_OF_WEEK = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

// Bảng màu cho các Tag tự do (Pastel nhẹ nhàng) với dark mode
const TAG_PALETTE = [
  'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800',
  'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800',
  'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-100 dark:border-green-800',
  'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-800',
  'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 border-pink-100 dark:border-pink-800',
  'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-800',
  'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800',
  'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800',
  'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800',
  'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 border-cyan-100 dark:border-cyan-800',
];

  // Hàm lấy màu nhất quán dựa trên tên tag
const getTagStyle = (tagName: string): string => {
  if (!tagName) return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';
  
  // Tính tổng mã ASCII của các ký tự để chọn màu cố định
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Lấy trị tuyệt đối và chia lấy dư cho số lượng màu
  const index = Math.abs(hash) % TAG_PALETTE.length;
  return TAG_PALETTE[index];
};

interface Employee {
  id: string;
  fullName: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "ADMIN" | "CUSTOMER" | "SELLER" | "EMPLOYEE";
}

interface TaskCalendarProps {
  filterType?: "my-tasks" | "assigned-tasks" | "all";
  currentUserId?: string;
  employees?: Employee[];
  isAdmin?: boolean;
}

export default function TaskCalendar({ 
  filterType = "all",
  currentUserId,
  employees = [],
  isAdmin = false
}: TaskCalendarProps = {}) {
  // --- Hooks ---
  const {
    tasks: apiTasks,
    isLoading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
  } = useTasks();

  // --- State ---
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  
  // State để quản lý việc đang sửa (nếu null là đang thêm mới)
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // State cho detail view (chỉ xem)
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState<boolean>(false);
  
  // Form State
  const [newTaskTitle, setNewTaskTitle] = useState<string>("");
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>("");
  const [newTaskAssigneeIds, setNewTaskAssigneeIds] = useState<string[]>([]); // IDs của employees được chọn (nhiều nhân viên)
  const [newTaskTag, setNewTaskTag] = useState<string>(""); // Default rỗng để user tự nhập
  const [newTaskDesc, setNewTaskDesc] = useState<string>("");
  const [newTaskDeadline, setNewTaskDeadline] = useState<string>(""); // Thời hạn công việc
  const [newTaskProgressNotes, setNewTaskProgressNotes] = useState<string>(""); // Ghi chú tiến độ
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoadingTaskDetail, setIsLoadingTaskDetail] = useState<boolean>(false);
  
  // Confirm Dialog State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [taskToDelete, setTaskToDelete] = useState<{ id: number; _id: string } | null>(null);
  
  // Ref để theo dõi context menu đang mở (tránh re-render)
  const isContextMenuOpenRef = useRef<boolean>(false);
  
  // State cho tìm kiếm tên nhân viên
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState<string>("");
  const [showAssigneeSuggestions, setShowAssigneeSuggestions] = useState<boolean>(false);
  const [showEmployeeList, setShowEmployeeList] = useState<boolean>(true); // Hiển thị/ẩn danh sách nhân viên

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "todo" | "pending" | "done">("all");
  const [tagFilter, setTagFilter] = useState<string>("");

  // Filter tasks based on filterType
  const filteredTasksByType: Task[] = useMemo(() => {
    if (filterType === "all" || !currentUserId) {
      return apiTasks;
    }

    if (filterType === "my-tasks") {
      // Công việc của chính bản thân: createdBy === currentUserId
      return apiTasks.filter((task) => {
        const taskCreatedBy = task.createdBy || (task as any).createdBy;
        return taskCreatedBy === currentUserId || String(taskCreatedBy) === String(currentUserId);
      });
    }

    if (filterType === "assigned-tasks") {
      // Công việc được giao: createdBy !== currentUserId (được admin/seller tạo)
      return apiTasks.filter((task) => {
        const taskCreatedBy = task.createdBy || (task as any).createdBy;
        return taskCreatedBy !== currentUserId && String(taskCreatedBy) !== String(currentUserId);
      });
    }

    return apiTasks;
  }, [apiTasks, filterType, currentUserId]);

  // Apply search and filters
  const tasks: Task[] = useMemo(() => {
    let result = filteredTasksByType;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.assignee.toLowerCase().includes(query) ||
          task.tag.toLowerCase().includes(query) ||
          task.progressNotes?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((task) => task.status === statusFilter);
    }

    // Tag filter
    if (tagFilter) {
      result = result.filter((task) => task.tag === tagFilter);
    }

    return result;
  }, [filteredTasksByType, searchQuery, statusFilter, tagFilter]);

  // Fetch tasks when month changes
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
    
    fetchTasks({ startDate, endDate });
  }, [currentDate, fetchTasks]);

  // Đảm bảo modal không mở khi dialog đang mở
  useEffect(() => {
    if (isDeleteDialogOpen && isModalOpen) {
      setIsModalOpen(false);
      resetForm();
    }
  }, [isDeleteDialogOpen, isModalOpen]);
  
  // Reset context menu ref khi modal hoặc dialog đóng
  useEffect(() => {
    if (!isModalOpen && !isDeleteDialogOpen) {
      isContextMenuOpenRef.current = false;
    }
  }, [isModalOpen, isDeleteDialogOpen]);

  // --- Logic Lịch ---
  const getDaysInMonth = (date: Date): (string | null)[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days: (string | null)[] = [];
    
    // Padding days (ngày trống đầu tháng)
    // Chỉ cần padding cho desktop view (grid 7 cột)
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(year, month, i);
      // Format YYYY-MM-DD local
      const dateString = new Date(dayDate.getTime() - (dayDate.getTimezoneOffset() * 60000))
        .toISOString()
        .split('T')[0];
      days.push(dateString);
    }
    
    return days;
  };

  const days = getDaysInMonth(currentDate);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Reset form về trạng thái ban đầu
  const resetForm = () => {
    setNewTaskTitle("");
    setNewTaskAssignee("");
    setNewTaskAssigneeIds([]);
    setNewTaskDesc("");
    setNewTaskTag("");
    setNewTaskDeadline("");
    setNewTaskProgressNotes("");
    setEditingTask(null);
    setAssigneeSearchQuery("");
    setShowAssigneeSuggestions(false);
    setShowEmployeeList(true); // Reset về hiển thị danh sách
  };
  
  // Toggle chọn/bỏ chọn nhân viên
  const toggleEmployeeSelection = (employeeId: string, employeeName: string) => {
    setNewTaskAssigneeIds(prev => {
      if (prev.includes(employeeId)) {
        // Bỏ chọn
        const newIds = prev.filter(id => id !== employeeId);
        // Cập nhật assignee string
        const selectedNames = newIds.map(id => {
          const emp = employees.find(e => e.id === id);
          return emp ? emp.fullName : '';
        }).filter(Boolean);
        setNewTaskAssignee(selectedNames.join(', '));
        return newIds;
      } else {
        // Chọn thêm
        const newIds = [...prev, employeeId];
        // Cập nhật assignee string
        const selectedNames = newIds.map(id => {
          const emp = employees.find(e => e.id === id);
          return emp ? emp.fullName : '';
        }).filter(Boolean);
        setNewTaskAssignee(selectedNames.join(', '));
        // Không tự động đóng danh sách để có thể chọn nhiều nhân viên
        return newIds;
      }
    });
  };
  
  // Xóa nhân viên khỏi danh sách đã chọn
  const removeSelectedEmployee = (employeeId: string) => {
    setNewTaskAssigneeIds(prev => {
      const newIds = prev.filter(id => id !== employeeId);
      const selectedNames = newIds.map(id => {
        const emp = employees.find(e => e.id === id);
        return emp ? emp.fullName : '';
      }).filter(Boolean);
      setNewTaskAssignee(selectedNames.join(', '));
      return newIds;
    });
  };
  
  // Tìm kiếm employees dựa trên query
  const filteredEmployees = useMemo(() => {
    if (!assigneeSearchQuery.trim()) return employees;
    const query = assigneeSearchQuery.toLowerCase();
    return employees.filter(emp => 
      emp.fullName.toLowerCase().includes(query) ||
      emp.email?.toLowerCase().includes(query) ||
      emp.firstName?.toLowerCase().includes(query) ||
      emp.lastName?.toLowerCase().includes(query)
    );
  }, [employees, assigneeSearchQuery]);

  const handleDayClick = (dateStr: string | null) => {
    if (!dateStr) return;
    // Không cho phép tạo task mới trong tab "assigned-tasks"
    if (filterType === "assigned-tasks") return;
    // Không mở modal nếu dialog xóa đang mở
    if (isDeleteDialogOpen) return;
    resetForm(); // Đảm bảo form trống khi thêm mới
    setSelectedDate(dateStr);
    setIsModalOpen(true);
  };

  // Xử lý khi bấm vào Task để xem chi tiết (chỉ xem)
  const handleTaskClick = useCallback(async (task: Task, e?: React.MouseEvent | any) => {
    if (e) {
      // Xử lý React.MouseEvent
      if (e.stopPropagation && typeof e.stopPropagation === 'function') {
        e.stopPropagation();
      }
      // Xử lý preventDefault nếu có
      if (e.preventDefault && typeof e.preventDefault === 'function') {
        e.preventDefault();
      }
    }
    // Không mở view nếu dialog xóa đang mở hoặc context menu đang mở
    if (isDeleteDialogOpen || isContextMenuOpenRef.current) return;
    
    // Fetch dữ liệu mới nhất từ database
    if (task._id) {
      try {
        setIsLoadingTaskDetail(true);
        const response = await tasksApi.getById(task._id);
        const latestTask = response.data;
        
        // Tạo Task object với format đúng
        const taskToView: Task = {
          id: task.id,
          _id: latestTask._id,
          date: latestTask.date,
          title: latestTask.title,
          assignee: latestTask.assignee,
          tag: latestTask.tag,
          status: latestTask.status,
          description: latestTask.description,
          deadline: latestTask.deadline,
          progressNotes: latestTask.progressNotes,
          createdBy: latestTask.createdBy,
        };
        
        setViewingTask(taskToView);
        setIsDetailViewOpen(true);
      } catch (error) {
        console.error("Error fetching task details:", error);
        toast.error("Không thể tải chi tiết công việc. Sử dụng dữ liệu hiện có.");
        // Fallback: sử dụng dữ liệu local
        setViewingTask(task);
        setIsDetailViewOpen(true);
      } finally {
        setIsLoadingTaskDetail(false);
      }
    } else {
      // Nếu không có _id, sử dụng dữ liệu local
      setViewingTask(task);
      setIsDetailViewOpen(true);
    }
  }, [isDeleteDialogOpen]);

  // Xử lý khi muốn sửa task từ detail view
  const handleEditFromDetailView = useCallback(async () => {
    if (!viewingTask) return;
    
    // Đóng detail view
    setIsDetailViewOpen(false);
    
    // Mở modal edit với dữ liệu từ viewingTask
    setEditingTask(viewingTask);
    setSelectedDate(viewingTask.date);
    setNewTaskTitle(viewingTask.title);
    setNewTaskAssignee(viewingTask.assignee);
    
    // Parse assignee string
    const assigneeNames = viewingTask.assignee.split(',').map(name => name.trim()).filter(Boolean);
    const matchedEmployeeIds: string[] = [];
    assigneeNames.forEach(name => {
      const emp = employees.find(e => e.fullName === name || e.email === name);
      if (emp) {
        matchedEmployeeIds.push(emp.id);
      }
    });
    setNewTaskAssigneeIds(matchedEmployeeIds);
    if (matchedEmployeeIds.length === 0) {
      setAssigneeSearchQuery(viewingTask.assignee);
    } else {
      setAssigneeSearchQuery("");
    }
    setShowAssigneeSuggestions(false);
    setNewTaskTag(viewingTask.tag || "");
    setNewTaskDesc(viewingTask.description || "");
    setNewTaskDeadline(viewingTask.deadline || "");
    setNewTaskProgressNotes(viewingTask.progressNotes || "");
    setShowEmployeeList(true);
    
    setIsModalOpen(true);
  }, [viewingTask, employees]);

  const handleSaveTask = async () => {
    if (!newTaskTitle) return;
    if (isSaving) return;
    
    // Không cho phép tạo task mới trong tab "assigned-tasks"
    if (filterType === "assigned-tasks" && !editingTask) {
      return;
    }

    setIsSaving(true);

    try {
      // Nếu user không nhập tag, đặt mặc định là "Chung"
      const finalTag = newTaskTag.trim() || "Chung";
      
      // Xử lý assignee: nếu có chọn employees từ danh sách, dùng tên của họ; nếu không, dùng text đã nhập
      let finalAssignee = newTaskAssignee || "Chưa chỉ định";
      if (newTaskAssigneeIds.length > 0) {
        const selectedNames = newTaskAssigneeIds.map(id => {
          const emp = employees.find(e => e.id === id);
          return emp ? emp.fullName : '';
        }).filter(Boolean);
        if (selectedNames.length > 0) {
          finalAssignee = selectedNames.join(', ');
        }
      }

      if (editingTask && editingTask._id) {
        // Cập nhật task cũ
        await updateTask(editingTask._id, {
          date: selectedDate,
          title: newTaskTitle,
          assignee: finalAssignee,
          tag: finalTag,
          description: newTaskDesc,
          deadline: newTaskDeadline || undefined,
          progressNotes: newTaskProgressNotes || undefined,
        });
      } else {
        // Thêm task mới
        await createTask({
          date: selectedDate,
          title: newTaskTitle,
          assignee: finalAssignee,
          tag: finalTag,
          status: "todo",
          description: newTaskDesc,
          deadline: newTaskDeadline || undefined,
          progressNotes: newTaskProgressNotes || undefined,
        });
      }
      
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving task:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTask = useCallback((taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task._id) return;

    // Đóng modal thêm/sửa công việc nếu đang mở
    if (isModalOpen) {
      setIsModalOpen(false);
      resetForm();
    }

    setTaskToDelete({ id: taskId, _id: task._id });
    setIsDeleteDialogOpen(true);
  }, [tasks, isModalOpen]);

  // Xử lý khi muốn xóa task từ detail view
  const handleDeleteFromDetailView = useCallback(() => {
    if (!viewingTask) return;
    setIsDetailViewOpen(false);
    handleDeleteTask(viewingTask.id);
  }, [viewingTask, handleDeleteTask]);

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      const success = await deleteTask(taskToDelete._id);
      // Luôn đóng dialog và reset state sau khi xóa (thành công hoặc thất bại)
      setIsDeleteDialogOpen(false);
      setTaskToDelete(null);
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      // Nếu có lỗi, vẫn đóng dialog
      setIsDeleteDialogOpen(false);
      setTaskToDelete(null);
      setIsModalOpen(false);
      resetForm();
    }
  };

  const handleToggleTaskStatus = useCallback(async (taskId: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task._id) return;

    await toggleTaskStatus(task._id);
  }, [tasks, toggleTaskStatus]);

  const handleCopyTaskInfo = useCallback((task: Task) => {
    const taskInfo = `Công việc: ${task.title}\nNgày: ${task.date}\nNgười phụ trách: ${task.assignee}\nLoại: ${task.tag}\nTrạng thái: ${task.status === 'done' ? 'Hoàn thành' : task.status === 'pending' ? 'Đang làm' : 'Chưa làm'}\n${task.deadline ? `Thời hạn: ${new Date(task.deadline).toLocaleDateString('vi-VN')}` : ''}\n${task.description ? `Mô tả: ${task.description}` : ''}\n${task.progressNotes ? `Ghi chú tiến độ: ${task.progressNotes}` : ''}`;
    navigator.clipboard.writeText(taskInfo).then(() => {
      toast.success("Đã sao chép thông tin công việc");
    }).catch(() => {
      toast.error("Không thể sao chép thông tin");
    });
  }, []);

  // --- Render Components ---

  return (
    <div className="space-y-6">
      {/* Search and Filters Toolbar */}
      <TasksToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        tagFilter={tagFilter}
        onTagFilterChange={setTagFilter}
        tasks={filteredTasksByType}
      />

      {/* Loading State */}
      {isLoading && <CalendarSkeleton />}

      {/* Error State */}
      {error && !isLoading && (
        <ErrorState
          error={error}
          onRetry={() => {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const startDate = new Date(year, month, 1).toISOString().split("T")[0];
            const endDate = new Date(year, month + 1, 0).toISOString().split("T")[0];
            fetchTasks({ startDate, endDate });
          }}
        />
      )}

      {/* Calendar Content */}
      {!isLoading && !error && (
        <>
          {/* Month Navigation */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={prevMonth}
              className="min-w-[48px] min-h-[48px] flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 rounded-xl transition-all active:scale-95 touch-manipulation focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              aria-label="Tháng trước"
            >
              <ChevronLeft className="w-6 h-6 text-slate-600 dark:text-slate-300" />
            </button>
            <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white capitalize px-4">
              Tháng {currentDate.getMonth() + 1}, {currentDate.getFullYear()}
            </h2>
            <button
              type="button"
              onClick={nextMonth}
              className="min-w-[48px] min-h-[48px] flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 rounded-xl transition-all active:scale-95 touch-manipulation focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              aria-label="Tháng sau"
            >
              <ChevronRight className="w-6 h-6 text-slate-600 dark:text-slate-300" />
            </button>
          </div>

          {/* Calendar Grid Container */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700">
            {/* Desktop Days Header (Hidden on Mobile) */}
            <div className="hidden lg:grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800">
              {DAYS_OF_WEEK.map((day, idx) => (
                <div
                  key={idx}
                  className={`py-4 text-center font-semibold text-sm ${
                    idx === 0
                      ? "text-rose-500 dark:text-rose-400"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

        {/* Responsive Grid: 
            - Mobile: grid-cols-1 (List View) 
            - Desktop: grid-cols-7 (Calendar View) 
        */}
        <div className="grid grid-cols-1 lg:grid-cols-7 auto-rows-fr bg-slate-200 dark:bg-slate-700 gap-px"> 
          
          {days.map((dateStr, index) => {
            // Logic ẩn ô trống (padding days) trên mobile để tránh khoảng trắng vô nghĩa
            if (!dateStr) {
              return <div key={`empty-${index}`} className="hidden lg:block bg-slate-50 dark:bg-slate-800/50 min-h-[140px]" />;
            }

            const dayTasks = tasks.filter(t => t.date === dateStr);
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            const dateObj = new Date(dateStr);
            const dayOfWeekIndex = dateObj.getDay();

            return (
              <button
                type="button"
                key={dateStr}
                disabled={filterType === "assigned-tasks"}
                className={`bg-white dark:bg-slate-800 min-h-[120px] lg:min-h-[180px] p-3 md:p-2.5 transition-all group relative flex flex-col gap-2.5 touch-manipulation
                  ${
                    filterType === "assigned-tasks"
                      ? "cursor-default"
                      : "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 active:bg-indigo-50 dark:active:bg-indigo-900/20 active:scale-[0.98]"
                  }
                  ${isToday ? "bg-indigo-50/50 dark:bg-indigo-900/20 ring-2 ring-indigo-200 dark:ring-indigo-800" : ""}
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                onClick={() => handleDayClick(dateStr)}
              >
                {/* Date Header */}
                <div className="flex justify-between items-center lg:items-start mb-2 lg:mb-0">
                    <div className="flex items-center gap-2">
                        {/* Date Number */}
                        <span className={`text-sm font-semibold w-8 h-8 flex items-center justify-center rounded-full transition-all 
                            ${isToday 
                              ? 'bg-indigo-500 dark:bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50' 
                              : 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 lg:bg-transparent lg:dark:bg-transparent lg:text-slate-500 dark:lg:text-slate-400 lg:group-hover:text-indigo-600 dark:lg:group-hover:text-indigo-400 lg:group-hover:bg-indigo-50 dark:lg:group-hover:bg-indigo-900/20'
                            }`}>
                            {dateObj.getDate()}
                        </span>
                        
                        {/* Mobile Day Label (Only shows on mobile) */}
                        <span className={`lg:hidden text-sm font-semibold ${dayOfWeekIndex === 0 ? 'text-rose-500 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'}`}>
                            {FULL_DAYS_OF_WEEK[dayOfWeekIndex]}
                        </span>
                    </div>

                    {filterType !== "assigned-tasks" && (
                      <button
                        type="button"
                        className="min-w-[40px] min-h-[40px] flex items-center justify-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 active:bg-indigo-200 dark:active:bg-indigo-900/50 rounded-lg text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-90 touch-manipulation"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDayClick(dateStr);
                        }}
                        aria-label="Thêm công việc"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    )}
                </div>

                {/* Tasks List */}
                <div className="flex flex-col gap-2.5 flex-1">
                  {dayTasks.length > 0 ? (
                    dayTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        filterType={filterType}
                        onTaskClick={handleTaskClick}
                        onToggleStatus={handleToggleTaskStatus}
                        onDelete={handleDeleteTask}
                        onCopy={handleCopyTaskInfo}
                        getTagStyle={getTagStyle}
                        isContextMenuOpenRef={isContextMenuOpenRef}
                        isDeleteDialogOpen={isDeleteDialogOpen}
                      />
                    ))
                  ) : (
                    <div className="hidden lg:hidden h-8"></div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {!isLoading && !error && tasks.length === 0 && (
        <EmptyState
          onCreateTask={() => {
            resetForm();
            setSelectedDate(new Date().toISOString().split("T")[0]);
            setIsModalOpen(true);
          }}
          filterType={filterType}
        />
      )}
        </>
      )}

      {/* Confirm Delete Dialog */}
      <Dialog 
        open={isDeleteDialogOpen} 
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) {
            // Reset state khi đóng dialog
            setTaskToDelete(null);
            setIsModalOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800 dark:text-white">
              Xác nhận xóa công việc
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400 pt-2">
              Bạn có chắc chắn muốn xóa công việc này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDeleteDialogOpen(false);
                setTaskToDelete(null);
                setIsModalOpen(false);
                resetForm();
              }}
              className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
            >
              Hủy
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                confirmDeleteTask();
              }}
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 rounded-lg transition-all"
            >
              Xóa
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal - Xem/Sửa/Tạo Task */}
      {isModalOpen && !isDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-slate-200 dark:ring-slate-700 animate-in zoom-in-95 duration-200 relative">
            
            {/* Loading overlay khi đang fetch task detail */}
            {isLoadingTaskDetail && (
              <div className="absolute inset-0 z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
                  <p className="text-sm text-slate-600 dark:text-slate-400">Đang tải dữ liệu công việc...</p>
                </div>
              </div>
            )}
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                {editingTask ? "Chi tiết công việc" : filterType === "assigned-tasks" ? "Xem công việc" : "Thêm công việc mới"}
              </h3>
              <button
                type="button"
                onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                }}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-300 dark:active:bg-slate-600 rounded-lg transition-all active:scale-90 touch-manipulation"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body - Scrollable */}
            <div className="p-6 space-y-5 overflow-y-auto bg-white dark:bg-slate-800">
                {/* Date Picker */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Ngày thực hiện</label>
                    <input 
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        disabled={filterType === "assigned-tasks" && !editingTask}
                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all text-slate-700 dark:text-slate-300 font-medium bg-white dark:bg-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                </div>

                {/* Title Input */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tên công việc <span className="text-rose-500 dark:text-rose-400">*</span></label>
                    <input 
                        type="text" 
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="..."
                        disabled={filterType === "assigned-tasks" && !editingTask}
                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all text-lg font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-white dark:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        autoFocus={!editingTask}
                    />
                </div>

                {/* Grid Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Người phụ trách {isAdmin && employees.length > 0 && <span className="text-xs text-slate-500">(Có thể chọn nhiều nhân viên)</span>}
                        </label>
                        {isAdmin && employees.length > 0 ? (
                            <div className="space-y-2">
                                <div className="relative">
                                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500 z-10" />
                                    <input 
                                        type="text" 
                                        value={assigneeSearchQuery}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setAssigneeSearchQuery(value);
                                            setShowAssigneeSuggestions(value.length > 0);
                                        }}
                                        onFocus={() => {
                                            if (assigneeSearchQuery.length > 0) {
                                                setShowAssigneeSuggestions(true);
                                            }
                                        }}
                                        onBlur={() => {
                                            // Delay để cho phép click vào suggestion
                                            setTimeout(() => setShowAssigneeSuggestions(false), 200);
                                        }}
                                        placeholder="Nhập tên hoặc email để tìm nhân viên..."
                                        disabled={filterType === "assigned-tasks" && !editingTask}
                                        className="w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-white dark:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    {showAssigneeSuggestions && filteredEmployees.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                                            {filteredEmployees.map((employee) => (
                                                <button
                                                    key={employee.id}
                                                    type="button"
                                                    onClick={() => {
                                                        toggleEmployeeSelection(employee.id, employee.fullName);
                                                        setAssigneeSearchQuery("");
                                                        setShowAssigneeSuggestions(false);
                                                        // Không tự động đóng danh sách để có thể chọn nhiều nhân viên
                                                    }}
                                                    className="min-h-[44px] w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 transition-all touch-manipulation"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                                            newTaskAssigneeIds.includes(employee.id)
                                                                ? 'bg-indigo-600 border-indigo-600'
                                                                : 'border-slate-300 dark:border-slate-600'
                                                        }`}>
                                                            {newTaskAssigneeIds.includes(employee.id) && (
                                                                <CheckCircle className="w-3 h-3 text-white" />
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col flex-1">
                                                            <span className="font-medium text-slate-800 dark:text-slate-200">{employee.fullName}</span>
                                                            {employee.email && (
                                                                <span className="text-xs text-slate-500 dark:text-slate-400">{employee.email}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {showAssigneeSuggestions && filteredEmployees.length === 0 && assigneeSearchQuery.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-4 text-sm text-slate-500 dark:text-slate-400">
                                            Không tìm thấy nhân viên nào.
                                        </div>
                                    )}
                                </div>
                                
                                {/* Danh sách tài khoản - có thể đóng/mở */}
                                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-slate-50 dark:bg-slate-900/50">
                                    <button
                                        type="button"
                                        onClick={() => setShowEmployeeList(!showEmployeeList)}
                                        className="min-h-[44px] w-full flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 rounded-lg px-2 py-2 transition-all touch-manipulation"
                                    >
                                        <span>
                                            Danh sách nhân viên ({employees.length}) - Đã chọn: {newTaskAssigneeIds.length}
                                        </span>
                                        {showEmployeeList ? (
                                            <ChevronUp className="w-4 h-4" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4" />
                                        )}
                                    </button>
                                    {showEmployeeList && (
                                        <div className="max-h-48 overflow-y-auto space-y-1">
                                        {employees.map((employee) => {
                                            const isSelected = newTaskAssigneeIds.includes(employee.id);
                                            return (
                                                <button
                                                    key={employee.id}
                                                    type="button"
                                                    onClick={() => toggleEmployeeSelection(employee.id, employee.fullName)}
                                                    className={`min-h-[44px] w-full text-left px-3 py-2.5 rounded-lg transition-all touch-manipulation ${
                                                        isSelected
                                                            ? 'bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-700 active:bg-indigo-200 dark:active:bg-indigo-900/50'
                                                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 border border-transparent'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                                            isSelected
                                                                ? 'bg-indigo-600 border-indigo-600'
                                                                : 'border-slate-300 dark:border-slate-600'
                                                        }`}>
                                                            {isSelected && (
                                                                <CheckCircle className="w-3 h-3 text-white" />
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col flex-1 min-w-0">
                                                            <span className={`font-medium text-sm truncate ${
                                                                isSelected
                                                                    ? 'text-indigo-700 dark:text-indigo-300'
                                                                    : 'text-slate-800 dark:text-slate-200'
                                                            }`}>
                                                                {employee.fullName}
                                                            </span>
                                                            {employee.email && (
                                                                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                                    {employee.email}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Hiển thị danh sách nhân viên đã chọn */}
                                {newTaskAssigneeIds.length > 0 && (
                                    <div className="border border-indigo-300 dark:border-indigo-700 rounded-lg p-3 bg-indigo-50 dark:bg-indigo-900/30">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                                            <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                                                Đã chọn {newTaskAssigneeIds.length} nhân viên
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {newTaskAssigneeIds.map((employeeId) => {
                                                const employee = employees.find(emp => emp.id === employeeId);
                                                if (!employee) return null;
                                                return (
                                                    <div
                                                        key={employeeId}
                                                        className="flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 rounded-md text-sm"
                                                    >
                                                        <span className="text-indigo-800 dark:text-indigo-200">{employee.fullName}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeSelectedEmployee(employeeId)}
                                                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 ml-1"
                                                            title="Bỏ chọn"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                    Gợi ý: Click vào tên nhân viên để chọn/bỏ chọn, có thể chọn nhiều nhân viên
                                </div>
                            </div>
                        ) : (
                            <div className="relative">
                                <User className="absolute left-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
                                <input 
                                    type="text" 
                                    value={newTaskAssignee}
                                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                                    placeholder="Tên nhân viên..."
                                    disabled={filterType === "assigned-tasks" && !editingTask}
                                    className="w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-white dark:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Loại việc</label>
                        <div className="rselative">
                            <Tag className="absolute left-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
                            <input 
                                type="text"
                                value={newTaskTag}
                                onChange={(e) => setNewTaskTag(e.target.value)}
                                placeholder="..."
                                disabled={filterType === "assigned-tasks" && !editingTask}
                                className="w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-white dark:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>
                </div>

                {/* Description Textarea */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Ghi chú chi tiết</label>
                    <textarea 
                        value={newTaskDesc}
                        onChange={(e) => setNewTaskDesc(e.target.value)}
                        placeholder="Mô tả cụ thể yêu cầu công việc..."
                        rows={4}
                        disabled={filterType === "assigned-tasks" && !editingTask}
                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none resize-none leading-relaxed text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-white dark:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    ></textarea>
                </div>

                {/* Deadline Input */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Thời hạn công việc đến bao giờ
                    </label>
                    <input 
                        type="date"
                        value={newTaskDeadline}
                        onChange={(e) => setNewTaskDeadline(e.target.value)}
                        disabled={filterType === "assigned-tasks" && !editingTask}
                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all text-slate-700 dark:text-slate-300 font-medium bg-white dark:bg-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {newTaskDeadline && (() => {
                        const today = new Date();
                        const deadlineDate = new Date(newTaskDeadline);
                        const daysDiff = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        if (daysDiff < 0) {
                            return (
                                <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Đã quá hạn {Math.abs(daysDiff)} ngày
                                </p>
                            );
                        }
                        if (daysDiff <= 1) {
                            return (
                                <p className="mt-1.5 text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Còn {daysDiff} ngày nữa là đến hạn
                                </p>
                            );
                        }
                        return (
                            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                                Còn {daysDiff} ngày nữa là đến hạn
                            </p>
                        );
                    })()}
                </div>

                {/* Progress Notes Textarea */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Ghi chú tiến độ công việc
                    </label>
                    <textarea 
                        value={newTaskProgressNotes}
                        onChange={(e) => setNewTaskProgressNotes(e.target.value)}
                        placeholder="Ghi chú về tiến độ, những việc đã làm, khó khăn gặp phải..."
                        rows={4}
                        disabled={filterType === "assigned-tasks" && !editingTask}
                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none resize-none leading-relaxed text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-white dark:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    ></textarea>
                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                        Có thể cập nhật ghi chú này nhiều lần để theo dõi tiến độ công việc
                    </p>
                </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 flex flex-col-reverse sm:flex-row justify-between items-center border-t border-slate-200 dark:border-slate-700 gap-3 sm:gap-0">
                {editingTask ? (
                    <button
                        type="button"
                        onClick={() => handleDeleteTask(editingTask.id)}
                        className="min-h-[44px] w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 active:bg-rose-100 dark:active:bg-rose-900/50 hover:text-rose-700 dark:hover:text-rose-300 rounded-xl transition-all active:scale-95 touch-manipulation"
                    >
                        <Trash2 className="w-4 h-4" /> <span className="sm:hidden">Xóa công việc</span><span className="hidden sm:inline">Xóa</span>
                    </button>
                ) : (
                    <div className="hidden sm:block"></div> /* Spacer */
                )}
                
                <div className="flex gap-3 w-full sm:w-auto">
                    <button
                        type="button"
                        onClick={() => {
                            setIsModalOpen(false);
                            resetForm();
                        }}
                        className="min-h-[44px] flex-1 sm:flex-none px-6 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-300 dark:active:bg-slate-600 rounded-xl transition-all active:scale-95 touch-manipulation"
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={handleSaveTask}
                        disabled={isSaving || (filterType === "assigned-tasks" && !editingTask)}
                        className="min-h-[44px] flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 active:bg-indigo-700 dark:active:bg-indigo-800 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Đang lưu...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                {editingTask ? "Cập nhật" : "Lưu mới"}
                            </>
                        )}
                    </button>
                </div>
            </div>

          </div>
        </div>
      )}

      {/* Task Detail View (Read-only) */}
      <TaskDetailView
        task={viewingTask}
        isOpen={isDetailViewOpen}
        onClose={() => {
          setIsDetailViewOpen(false);
          setViewingTask(null);
        }}
        onEdit={filterType !== "assigned-tasks" ? handleEditFromDetailView : undefined}
        onDelete={filterType !== "assigned-tasks" ? handleDeleteFromDetailView : undefined}
        filterType={filterType}
      />

    </div>
  );
}

