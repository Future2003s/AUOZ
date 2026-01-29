import { describe, it, expect } from "vitest";
import { useTaskContextMenu } from "../useTaskContextMenu";
import type { Task } from "../useTasks";

// NOTE: useTaskContextMenu không dùng hook React nội bộ,
// nên có thể gọi trực tiếp trong unit test như hàm thuần.

const baseTask: Task = {
  id: 1,
  _id: "task-id",
  date: "2025-01-01",
  title: "Test task",
  assignee: "User A",
  tag: "Chung",
  status: "todo",
};

describe("useTaskContextMenu", () => {
  it("ẩn nút xoá với employee không phải owner", () => {
    const { items } = useTaskContextMenu({
      task: { ...baseTask, createdBy: "owner-id" },
      filterType: "my-tasks",
      currentUserId: "other-id",
      isAdmin: false,
      onViewDetail: () => {},
      onEditTask: () => {},
      onToggleStatus: () => {},
      onDelete: () => {},
      onCopyInfo: () => {},
    });

    const hasDelete = items.some((item) => item.type === "item" && item.id === "delete");
    expect(hasDelete).toBe(false);
  });

  it("hiện nút xoá cho admin", () => {
    const { items } = useTaskContextMenu({
      task: { ...baseTask, createdBy: "owner-id" },
      filterType: "my-tasks",
      currentUserId: "other-id",
      isAdmin: true,
      onViewDetail: () => {},
      onEditTask: () => {},
      onToggleStatus: () => {},
      onDelete: () => {},
      onCopyInfo: () => {},
    });

    const hasDelete = items.some((item) => item.type === "item" && item.id === "delete");
    expect(hasDelete).toBe(true);
  });

  it("không cho sửa hoặc xoá trong tab assigned-tasks", () => {
    const { items } = useTaskContextMenu({
      task: { ...baseTask, createdBy: "owner-id" },
      filterType: "assigned-tasks",
      currentUserId: "owner-id",
      isAdmin: false,
      onViewDetail: () => {},
      onEditTask: () => {},
      onToggleStatus: () => {},
      onDelete: () => {},
      onCopyInfo: () => {},
    });

    const hasEdit = items.some((item) => item.type === "item" && item.id === "edit");
    const hasDelete = items.some((item) => item.type === "item" && item.id === "delete");
    expect(hasEdit).toBe(false);
    expect(hasDelete).toBe(false);
  });
});

