# Fix: Context Menu Edit Task Bug

## Root Cause (Nguyên nhân gốc rễ)

1. **Closure Stale Reference**: 
   - Khi context menu mở, `useTaskContextMenu` hook tạo closure `() => onEditTask(task)` 
   - Closure này capture `task` tại thời điểm hook được gọi
   - Nếu task list re-render hoặc update, closure vẫn giữ reference cũ → có thể dẫn đến mở sai task hoặc task không tồn tại

2. **Race Condition với Menu Unmount**:
   - Khi click "Sửa công việc", menu đóng ngay lập tức (Radix UI behavior)
   - Handler `entry.onSelect()` có thể chạy sau khi menu đã unmount
   - State update có thể bị mất hoặc không kịp apply

3. **Thiếu "Single Source of Truth"**:
   - Không có state tập trung để lưu task đang thao tác
   - Mỗi TaskCard tự quản lý closure riêng → không đồng bộ

## Solution (Giải pháp)

### 1. Thêm State `activeTaskId` (Nguồn sự thật tập trung)

```typescript
// Trong TaskCalendar
const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
```

- Lưu ID của task đang được right-click
- Set ngay khi context menu mở
- Reset sau khi edit modal mở hoặc menu đóng

### 2. Handler Edit dùng `activeTaskId` thay vì closure

```typescript
const handleEditFromActiveTaskId = useCallback(() => {
  if (activeTaskId === null) return;
  
  // Tìm task từ danh sách HIỆN TẠI (không dùng closure)
  const taskToEdit = tasks.find(t => t.id === activeTaskId);
  if (!taskToEdit) {
    toast.error("Không tìm thấy công việc để chỉnh sửa");
    return;
  }
  
  openEditModalForTask(taskToEdit);
}, [activeTaskId, tasks, openEditModalForTask]);
```

- Luôn tìm task từ `tasks` array hiện tại
- Đảm bảo dùng data mới nhất, không bị stale

### 3. Set `activeTaskId` khi menu mở

```typescript
// Trong TaskCard
<ContextMenu
  onOpenChange={(open) => {
    if (open) {
      onContextMenuOpen?.(task.id); // Set activeTaskId ngay lập tức
    } else {
      onContextMenuClose?.();
    }
  }}
>
```

### 4. Handler Edit từ context menu

```typescript
const handleEditFromContextMenu = useCallback(() => {
  if (filterType === "assigned-tasks") return;
  if (isDeleteDialogOpen) return;
  
  // Dùng activeTaskId để tìm task mới nhất
  handleEditFromActiveTaskId();
  
  // Reset sau khi modal mở
  setTimeout(() => {
    setActiveTaskId(null);
  }, 300);
}, [filterType, isDeleteDialogOpen, handleEditFromActiveTaskId]);
```

### 5. Đảm bảo handler chạy trước khi menu đóng

```typescript
// Trong TaskCard - ContextMenuItem
<ContextMenuItem
  onSelect={() => {
    // Chạy handler ngay lập tức (synchronous)
    entry.onSelect(); // Gọi handleEditFromContextMenu
    
    // Cập nhật ref sau khi handler chạy
    setTimeout(() => {
      isContextMenuOpenRef.current = false;
      setIsContextMenuOpen(false);
    }, 0);
  }}
>
```

## Files Changed (Các file đã sửa)

1. **`src/components/task-calendar.tsx`**:
   - Thêm state `activeTaskId`
   - Thêm `handleEditFromActiveTaskId()` - tìm task từ activeTaskId
   - Thêm `handleContextMenuOpen()` - set activeTaskId khi menu mở
   - Thêm `handleContextMenuClose()` - reset activeTaskId khi menu đóng
   - Thêm `handleEditFromContextMenu()` - handler edit từ context menu
   - Pass props mới vào TaskCard

2. **`src/components/tasks/TaskCard.tsx`**:
   - Thêm props: `onEditFromContextMenu`, `onContextMenuOpen`, `onContextMenuClose`
   - Update `useTaskContextMenu` để dùng `onEditFromContextMenu` thay vì closure
   - Set `activeTaskId` trong `onOpenChange` của ContextMenu
   - Đảm bảo handler chạy trước khi menu đóng

## Testing (Kiểm thử)

### Test Cases:
1. ✅ Right-click Task A → click "Sửa công việc" → Modal mở với đúng Task A
2. ✅ Right-click Task B → click "Sửa công việc" → Modal mở với đúng Task B (không bị Task A)
3. ✅ Right-click → menu mở → click ra ngoài → menu đóng, không có side effect
4. ✅ Right-click Task → click "Sửa công việc" → Form được prefill đầy đủ
5. ✅ Save → API update đúng ID → UI cập nhật

### Expected Behavior:
- Click "Sửa công việc" từ context menu **luôn** mở đúng task (10/10 lần)
- Không còn hiện tượng:
  - ❌ Mở sai task
  - ❌ Không mở modal
  - ❌ Click không có tác dụng
  - ❌ Console errors

## Key Improvements (Cải tiến chính)

1. **Single Source of Truth**: `activeTaskId` là nguồn sự thật duy nhất cho task đang thao tác
2. **No Stale Closures**: Luôn tìm task từ `tasks` array hiện tại, không dùng closure
3. **Synchronous State Updates**: Set state trước khi menu đóng
4. **Defensive Programming**: Check null/undefined và error handling

## Notes (Ghi chú)

- `activeTaskId` được reset sau 200-300ms để đảm bảo handler đã chạy xong
- Nếu edit modal mở, `activeTaskId` sẽ được reset trong `handleEditFromContextMenu`
- Nếu menu đóng mà không chọn action, `activeTaskId` sẽ được reset trong `handleContextMenuClose`
