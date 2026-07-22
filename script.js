const SUPABASE_URL = "https://admabxcqwuqofftjrsnu.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkbWFieGNxd3Vxb2ZmdGpyc251Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2ODQ2MTQsImV4cCI6MjEwMDI2MDYxNH0.dd-Iv4YpA92zPRvbmGk_waEcEaV6Z3JdBAkpD6OAM-8";
const TABLE_NAME = "todo_tbl";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CATEGORIES = ["개인", "공부", "업무", "취미"];

let todos = [];
let currentFilter = "전체";
let editingId = null;

async function loadTodos() {
  const { data, error } = await supabaseClient
    .from(TABLE_NAME)
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load todos from Supabase:", error);
    return [];
  }

  return data;
}

async function addTodo(text, category) {
  const trimmed = text.trim();
  if (!trimmed) return;

  const { data, error } = await supabaseClient
    .from(TABLE_NAME)
    .insert({ text: trimmed, category })
    .select()
    .single();

  if (error) {
    console.error("Failed to add todo:", error);
    return;
  }

  todos.push(data);
  renderTodos();
}

async function deleteTodo(id) {
  const { error } = await supabaseClient.from(TABLE_NAME).delete().eq("id", id);

  if (error) {
    console.error("Failed to delete todo:", error);
    return;
  }

  todos = todos.filter((todo) => todo.id !== id);
  renderTodos();
}

async function toggleTodo(id) {
  const todo = todos.find((t) => t.id === id);
  if (!todo) return;

  const nextCompleted = !todo.completed;
  const { error } = await supabaseClient
    .from(TABLE_NAME)
    .update({ completed: nextCompleted })
    .eq("id", id);

  if (error) {
    console.error("Failed to update todo:", error);
    return;
  }

  todo.completed = nextCompleted;
  renderTodos();
}

function startEdit(id) {
  editingId = id;
  renderTodos();
}

function cancelEdit() {
  editingId = null;
  renderTodos();
}

async function saveEdit(id, text, category) {
  const trimmed = text.trim();
  if (!trimmed) return;

  const todo = todos.find((t) => t.id === id);
  if (!todo) return;

  const { error } = await supabaseClient
    .from(TABLE_NAME)
    .update({ text: trimmed, category })
    .eq("id", id);

  if (error) {
    console.error("Failed to save todo:", error);
    return;
  }

  todo.text = trimmed;
  todo.category = category;

  editingId = null;
  renderTodos();
}

function updateProgress() {
  const displayEl = document.getElementById("progress-display");
  const emptyEl = document.getElementById("progress-empty");
  const labelEl = document.getElementById("progress-label");
  const percentEl = document.getElementById("progress-percent");
  const fillEl = document.getElementById("progress-bar-fill");

  const total = todos.length;
  const completed = todos.filter((todo) => todo.completed).length;

  if (total === 0) {
    displayEl.hidden = true;
    emptyEl.hidden = false;
    return;
  }

  displayEl.hidden = false;
  emptyEl.hidden = true;

  const percent = Math.round((completed / total) * 100);
  labelEl.textContent = `${completed} / ${total} 완료`;
  percentEl.textContent = `${percent}%`;
  fillEl.style.width = `${percent}%`;
}

function getVisibleTodos() {
  const filtered =
    currentFilter === "전체"
      ? todos
      : todos.filter((todo) => todo.category === currentFilter);

  return [...filtered].sort((a, b) => Number(a.completed) - Number(b.completed));
}

function renderEditItem(li, todo) {
  li.classList.add("editing");

  const editInput = document.createElement("input");
  editInput.type = "text";
  editInput.className = "edit-input";
  editInput.value = todo.text;

  const editSelect = document.createElement("select");
  editSelect.className = "edit-category-select";
  CATEGORIES.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    if (cat === todo.category) option.selected = true;
    editSelect.appendChild(option);
  });

  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.className = "save-btn";
  saveBtn.textContent = "저장";
  saveBtn.addEventListener("click", () =>
    saveEdit(todo.id, editInput.value, editSelect.value)
  );

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "cancel-btn";
  cancelBtn.textContent = "취소";
  cancelBtn.addEventListener("click", () => cancelEdit());

  editInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveEdit(todo.id, editInput.value, editSelect.value);
    if (e.key === "Escape") cancelEdit();
  });

  li.appendChild(editInput);
  li.appendChild(editSelect);
  li.appendChild(saveBtn);
  li.appendChild(cancelBtn);
}

function renderViewItem(li, todo) {
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "todo-checkbox";
  checkbox.checked = todo.completed;
  checkbox.addEventListener("change", () => toggleTodo(todo.id));

  const categoryTag = document.createElement("span");
  categoryTag.className = `category-tag category-tag-${todo.category}`;
  categoryTag.textContent = todo.category;

  const textSpan = document.createElement("span");
  textSpan.className = "todo-text";
  if (todo.completed) textSpan.classList.add("completed");
  textSpan.textContent = todo.text;

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "edit-btn";
  editBtn.textContent = "✏️";
  editBtn.addEventListener("click", () => startEdit(todo.id));

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "delete-btn";
  deleteBtn.textContent = "🗑";
  deleteBtn.addEventListener("click", () => deleteTodo(todo.id));

  li.appendChild(checkbox);
  li.appendChild(categoryTag);
  li.appendChild(textSpan);
  li.appendChild(editBtn);
  li.appendChild(deleteBtn);
}

function renderTodos() {
  const listEl = document.getElementById("todo-list");
  listEl.innerHTML = "";

  getVisibleTodos().forEach((todo) => {
    const li = document.createElement("li");
    li.className = `todo-item category-${todo.category}`;
    li.dataset.id = todo.id;

    if (todo.id === editingId) {
      renderEditItem(li, todo);
    } else {
      renderViewItem(li, todo);
    }

    listEl.appendChild(li);
  });

  updateProgress();
}

function setFilter(filter) {
  currentFilter = filter;

  document.querySelectorAll(".filter-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.filter === filter);
  });

  renderTodos();
}

document.addEventListener("DOMContentLoaded", async () => {
  todos = await loadTodos();
  renderTodos();

  const input = document.getElementById("todo-input");
  const categorySelect = document.getElementById("category-select");
  const addBtn = document.getElementById("add-todo-btn");

  const handleAdd = () => {
    addTodo(input.value, categorySelect.value);
    input.value = "";
    input.focus();
  };

  addBtn.addEventListener("click", handleAdd);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleAdd();
  });

  document.querySelectorAll(".filter-tab").forEach((tab) => {
    tab.addEventListener("click", () => setFilter(tab.dataset.filter));
  });
});
