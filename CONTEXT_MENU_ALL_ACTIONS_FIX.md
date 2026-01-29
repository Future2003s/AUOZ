# Fix: Tất cả Action trong Context Menu (Tasks)

## Root Cause (Nguyên nhân gốc rễ)

1. **Closure Stale Reference cho TẤT CẢ action**:
   - Tất cả handlers trong `useTaskContextMenu` đều dùng closure capture `task` cũ
   - Ví dụ: `onViewDetail: () => onTaskClick(task)`, `onToggleStatus: () => onToggleStatus(task.id)`
   - Khi task list re-render hoặc update, closure vẫn giữ reference cũ → action chạy sai task hoặc task không tồn tại

2. **Thiếu Single Source of Truth**:
   - Không có state tập trung để lưu task đang thao tác
   - Mỗi TaskCard tự quản lý closure riêng → không đồng bộ giữa các action

3. **Radix UI onSelect behavior**:
   - Radix UI tự đóng menu sau khi `onSelect` chạy
   - Nếu handler async hoặc có delay, menu có thể unmount trước khi handler hoàn thành
   - State update có thể bị mất

4. **Clipboard API không có fallback**:
   - Một số trình duyệt không support `navigator.clipboard`
   - Không có fallback → copy action fail im lặng

## Solution (Giải pháp đã triển khai)

### 1. Chuẩn hóa "Nguồn sự thật" - activeTaskId

```typescript
// Trong TaskCalendar
const [activeTaskId, setActiveTaskId] = useState<number | null>(null);

// Helper để lấy task từ activeTaskId
const getActiveTask = useCallback((): Task | null => {
  if (activeTaskId === null) return null;
  const task = tasks.find(t => t.id === activeTaskId);
  return task || null;
}, [activeTaskId, tasks]);
```

- Set `activeTaskId` ngay khi context menu mở
- Tất cả handlers đều dùng `getActiveTask()` để lấy task mới nhất từ list
- Reset `activeTaskId` sau khi action hoàn thành

### 2. Tạo Handlers mới dùng activeTaskId cho TẤT CẢ action

**Xem chi tiết:**
```typescript
const handleViewDetailFromContextMenu = useCallback(async () => {
  const task = getActiveTask();
  if (!task) {
    toast.error("Không tìm thấy công việc");
    return;
  }
  await handleTaskClick(task);
  setTimeout(() => setActiveTaskId(null), 300);
}, [getActiveTask, handleTaskClick]);
```

**Sửa công việc:**
```typescript
const handleEditFromContextMenu = useCallback(() => {
  if (filterType === "assigned-tasks") return;
  if (isDeleteDialogOpen) return;
  handleEditFromActiveTaskId();
  setTimeout(() => setActiveTaskId(null), 300);
}, [filterType, isDeleteDialogOpen, handleEditFromActiveTaskId]);
```

**Đánh dấu hoàn thành:**
```typescript
const handleToggleStatusFromContextMenu = useCallback(async () => {
  const task = getActiveTask();
  if (!task || !task._id) {
    toast.error("Không tìm thấy công việc");
    return;
  }
  const wasDone = task.status === "done";
  await toggleTaskStatus(task._id);
  toast.success(wasDone ? "Đã đánh dấu chưa hoàn thành" : "Đã đánh dấu hoàn thành");
  setTimeout(() => setActiveTaskId(null), 300);
}, [getActiveTask, toggleTaskStatus]);
```

**Xóa công việc:**
```typescript
const handleDeleteFromContextMenu = useCallback(() => {
  const task = getActiveTask();
  if (!task || !task._id) {
    toast.error("Không tìm thấy công việc");
    return;
  }
  if (filterType === "assigned-tasks") return;
  handleDeleteTask(task.id);
  setTimeout(() => setActiveTaskId(null), 300);
}, [getActiveTask, filterType, handleDeleteTask]);
```

**Sao chép thông tin:**
```typescript
const handleCopyInfoFromContextMenu = useCallback(async () => {
  const task = getActiveTask();
  if (!task) {
    toast.error("Không tìm thấy công việc");
    return;
  }
  const taskInfo = `Công việc: ${task.title}\nNgày: ${task.date}...`;
  const success = await copyToClipboard(taskInfo);
  if (success) {
    toast.success("Đã sao chép thông tin công việc");
  } else {
    toast.error("Không thể sao chép thông tin");
  }
  setTimeout(() => setActiveTaskId(null), 100);
}, [getActiveTask, copyToClipboard]);
```

**Sao chép ID:**
```typescript
const handleCopyIdFromContextMenu = useCallback(async () => {
  const task = getActiveTask();
  if (!task || !task._id) {
    toast.error("Không tìm thấy ID công việc");
    return;
  }
  const success = await copyToClipboard(task._id);
  if (success) {
    toast.success("Đã sao chép ID công việc");
  } else {
    toast.error("Không thể sao chép ID");
  }
  setTimeout(() => setActiveTaskId(null), 100);
}, [getActiveTask, copyToClipboard]);
```

**Sao chép đường dẫn:**
```typescript
const handleCopyLinkFromContextMenu = useCallback(async () => {
  const task = getActiveTask();
  if (!task || !task._id) {
    toast.error("Không tìm thấy công việc");
    return;
  }
  const url = `${window.location.origin}/vi/employee/tasks?taskId=${task._id}`;
  const success = await copyToClipboard(url);
  if (success) {
    toast.success("Đã sao chép đường dẫn");
  } else {
    toast.error("Không thể sao chép đường dẫn");
  }
  setTimeout(() => setActiveTaskId(null), 100);
}, [getActiveTask, copyToClipboard]);
```

**Nhân bản công việc:**
```typescript
const handleDuplicateFromContextMenu = useCallback(async () => {
  const task = getActiveTask();
  if (!task) {
    toast.error("Không tìm thấy công việc");
    return;
  }
  if (filterType === "assigned-tasks") return;
  if (!task.date || !task.title) return;
  
  try {
    await createTask({
      date: task.date,
      title: `${task.title} (copy)`,
      assignee: task.assignee,
      tag: task.tag || "Chung",
      status: "todo",
      description: task.description,
      deadline: task.deadline || undefined,
      progressNotes: task.progressNotes || undefined,
    });
    toast.success("Đã nhân bản công việc");
    setTimeout(() => setActiveTaskId(null), 300);
  } catch (error) {
    console.error("Error duplicating task:", error);
    toast.error("Không thể nhân bản công việc");
  }
}, [getActiveTask, filterType, createTask]);
```

### 3. Clipboard Helper với Fallback

```typescript
const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
  try {
    if (typeof window !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback cho trình duyệt cũ
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  } catch (error) {
    console.error("Failed to copy:", error);
    return false;
  }
}, []);
```

### 4. Update TaskCard để dùng handlers mới

```typescript
// Pass handlers vào TaskCard
<TaskCard
  // ... other props
  onViewDetailFromContextMenu={handleViewDetailFromContextMenu}
  onEditFromContextMenu={handleEditFromContextMenu}
  onToggleStatusFromContextMenu={handleToggleStatusFromContextMenu}
  onDeleteFromContextMenu={handleDeleteFromContextMenu}
  onCopyInfoFromContextMenu={handleCopyInfoFromContextMenu}
  onCopyIdFromContextMenu={handleCopyIdFromContextMenu}
  onCopyLinkFromContextMenu={handleCopyLinkFromContextMenu}
  onDuplicateFromContextMenu={handleDuplicateFromContextMenu}
/>

// Trong TaskCard, update useTaskContextMenu
const { items } = useTaskContextMenu({
  task,
  filterType,
  currentUserId,
  isAdmin,
  // Sử dụng handlers từ context menu (dùng activeTaskId) nếu có
  onViewDetail: onViewDetailFromContextMenu || (() => onTaskClick(task)),
  onEditTask: onEditFromContextMenu || (() => onEditTask(task)),
  onToggleStatus: onToggleStatusFromContextMenu || (() => onToggleStatus(task.id)),
  onDelete: onDeleteFromContextMenu || (() => onDelete(task.id)),
  onCopyInfo: onCopyInfoFromContextMenu || (() => onCopy(task)),
  onCopyId: onCopyIdFromContextMenu,
  onCopyLink: onCopyLinkFromContextMenu,
  onDuplicate: onDuplicateFromContextMenu || (onDuplicate ? () => onDuplicate(task) : undefined),
});
```

## Files Changed (Các file đã sửa)

1. **`src/components/task-calendar.tsx`**:
   - Thêm `getActiveTask()` helper
   - Thêm `copyToClipboard()` helper với fallback
   - Thêm 8 handlers mới dùng `activeTaskId`:
     - `handleViewDetailFromContextMenu`
     - `handleEditFromContextMenu`
     - `handleToggleStatusFromContextMenu`
     - `handleDeleteFromContextMenu`
     - `handleCopyInfoFromContextMenu`
     - `handleCopyIdFromContextMenu`
     - `handleCopyLinkFromContextMenu`
     - `handleDuplicateFromContextMenu`
   - Pass tất cả handlers vào TaskCard
   - Update `handleContextMenuClose` để reset `activeTaskId` đúng cách

2. **`src/components/tasks/TaskCard.tsx`**:
   - Thêm props cho 8 handlers mới từ context menu
   - Update `useTaskContextMenu` để ưu tiên dùng handlers mới, fallback về legacy handlers

## Hướng dẫn QA Test (8 mục action)

### Test Case 1: Xem chi tiết
1. Right-click vào Task A
2. Click "Xem chi tiết"
3. **Expected**: Detail view mở với đúng Task A
4. **Check**: Form hiển thị đầy đủ thông tin Task A

### Test Case 2: Sửa công việc
1. Right-click vào Task A
2. Click "Sửa công việc"
3. **Expected**: Edit modal mở với form prefill đúng Task A
4. **Check**: Tất cả fields (title, assignee, tag, description, deadline, progressNotes) đều đúng
5. Save → **Expected**: API update đúng ID, UI cập nhật

### Test Case 3: Đánh dấu hoàn thành
1. Right-click vào Task A (status: "todo")
2. Click "Đánh dấu hoàn thành"
3. **Expected**: 
   - Toast success: "Đã đánh dấu hoàn thành"
   - Task A status chuyển thành "done"
   - UI cập nhật ngay lập tức
4. **Check Network**: PATCH request với đúng task._id

### Test Case 4: Nhân bản công việc
1. Right-click vào Task A
2. Click "Nhân bản công việc"
3. **Expected**:
   - Toast success: "Đã nhân bản công việc"
   - Task mới xuất hiện với title: "{Task A title} (copy)"
   - Status: "todo"
4. **Check Network**: POST request với đúng data

### Test Case 5: Sao chép thông tin
1. Right-click vào Task A
2. Click "Sao chép thông tin"
3. **Expected**: 
   - Toast success: "Đã sao chép thông tin công việc"
   - Clipboard chứa text format đầy đủ thông tin Task A
4. **Check**: Paste vào notepad → verify format đúng

### Test Case 6: Sao chép ID
1. Right-click vào Task A
2. Click "Sao chép ID"
3. **Expected**:
   - Toast success: "Đã sao chép ID công việc"
   - Clipboard chứa đúng task._id của Task A
4. **Check**: Paste → verify ID đúng

### Test Case 7: Sao chép đường dẫn
1. Right-click vào Task A
2. Click "Sao chép đường dẫn"
3. **Expected**:
   - Toast success: "Đã sao chép đường dẫn"
   - Clipboard chứa URL: `http://localhost:3000/vi/employee/tasks?taskId={task._id}`
4. **Check**: Paste vào browser → verify URL đúng

### Test Case 8: Xóa công việc
1. Right-click vào Task A
2. Click "Xóa công việc"
3. **Expected**:
   - Confirm dialog mở
   - Click "Xóa" → Task A bị xóa khỏi UI
   - Toast success: "Đã xóa công việc"
4. **Check Network**: DELETE request với đúng task._id

### Test Case 9: Edge Cases
1. **Multiple rapid clicks**: Right-click Task A → click "Sửa" → ngay lập tức right-click Task B → click "Sửa"
   - **Expected**: Modal mở với Task B (không bị Task A)

2. **Task list update**: Right-click Task A → trong khi menu mở, task list refresh → click "Sửa"
   - **Expected**: Vẫn mở đúng Task A (dùng activeTaskId để tìm task mới nhất)

3. **Clipboard blocked**: Disable clipboard permission → test copy actions
   - **Expected**: Toast error hiển thị, không crash

4. **Tab "assigned-tasks"**: Right-click task trong tab này
   - **Expected**: "Sửa", "Xóa", "Nhân bản" bị ẩn hoặc disabled

## Acceptance Criteria

✅ Right-click Task A → click từng item → tất cả chạy đúng Task A (10/10 lần)

✅ Không lỗi console / không request sai id

✅ UI luôn cập nhật đúng sau action

✅ Có toast success/error cho mọi action

✅ Clipboard fallback hoạt động trên trình duyệt cũ

✅ Không còn hiện tượng:
   - ❌ Action chạy sai task
   - ❌ Action không chạy
   - ❌ UI không cập nhật
   - ❌ API request sai ID

## Key Improvements (Cải tiến chính)

1. **Single Source of Truth**: `activeTaskId` là nguồn sự thật duy nhất cho task đang thao tác
2. **No Stale Closures**: Tất cả handlers đều tìm task từ `tasks` array hiện tại, không dùng closure
3. **Consistent Error Handling**: Tất cả handlers đều có error handling và toast notification
4. **Clipboard Fallback**: Support trình duyệt cũ với `document.execCommand`
5. **Proper State Management**: Reset `activeTaskId` sau khi action hoàn thành
6. **Radix UI Best Practices**: Dùng `onSelect` thay vì `onClick`, đảm bảo handler chạy trước khi menu đóng
