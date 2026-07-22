const USERS_KEY = "mytodo_users";
const SESSION_KEY = "mytodo_session";

const CATEGORIES = ["개인", "공부", "업무", "취미"];

let todos = [];
let currentFilter = "전체";
let editingId = null;
let currentUser = null;

function todoStorageKey(username) {
  return `mytodo_items_${username}`;
}

function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to load users from localStorage:", err);
    return [];
  }
}

function saveUsers(users) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.error("Failed to save users to localStorage:", err);
  }
}

function loadSession() {
  return localStorage.getItem(SESSION_KEY);
}

function saveSession(username) {
  localStorage.setItem(SESSION_KEY, username);
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function signup(username, password) {
  const users = loadUsers();
  if (users.some((u) => u.username === username)) {
    return { ok: false, message: "이미 존재하는 아이디입니다." };
  }

  users.push({ username, password });
  saveUsers(users);
  return { ok: true };
}

function login(username, password) {
  const users = loadUsers();
  const user = users.find((u) => u.username === username && u.password === password);
  if (!user) {
    return { ok: false, message: "아이디 또는 비밀번호가 올바르지 않습니다." };
  }

  saveSession(username);
  return { ok: true };
}

function logout() {
  clearSession();
  currentUser = null;
  todos = [];
  editingId = null;
  showAuthScreen();
}

function loadTodos() {
  try {
    const raw = localStorage.getItem(todoStorageKey(currentUser));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to load todos from localStorage:", err);
    return [];
  }
}

function saveTodos() {
  try {
    localStorage.setItem(todoStorageKey(currentUser), JSON.stringify(todos));
  } catch (err) {
    console.error("Failed to save todos to localStorage:", err);
  }
}

function addTodo(text, category) {
  const trimmed = text.trim();
  if (!trimmed) return;

  todos.push({
    id: String(Date.now()),
    text: trimmed,
    category,
    completed: false,
    createdAt: Date.now(),
  });

  saveTodos();
  renderTodos();
}

function deleteTodo(id) {
  todos = todos.filter((todo) => todo.id !== id);
  saveTodos();
  renderTodos();
}

function toggleTodo(id) {
  const todo = todos.find((t) => t.id === id);
  if (!todo) return;
  todo.completed = !todo.completed;
  saveTodos();
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

function saveEdit(id, text, category) {
  const trimmed = text.trim();
  if (!trimmed) return;

  const todo = todos.find((t) => t.id === id);
  if (!todo) return;

  todo.text = trimmed;
  todo.category = category;

  editingId = null;
  saveTodos();
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

function setAuthTab(tab) {
  document.querySelectorAll(".auth-tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.authTab === tab);
  });

  document.getElementById("login-form").hidden = tab !== "login";
  document.getElementById("signup-form").hidden = tab !== "signup";
  hideAuthMessages();
}

function hideAuthMessages() {
  document.getElementById("login-error").hidden = true;
  document.getElementById("signup-error").hidden = true;
  document.getElementById("signup-success").hidden = true;
}

function showAuthScreen() {
  document.getElementById("auth-section").hidden = false;
  document.getElementById("todo-app").hidden = true;
  document.getElementById("user-bar").hidden = true;

  document.getElementById("login-form").reset();
  document.getElementById("signup-form").reset();
  hideAuthMessages();
  setAuthTab("login");
}

function showTodoScreen() {
  document.getElementById("auth-section").hidden = true;
  document.getElementById("todo-app").hidden = false;

  const userBar = document.getElementById("user-bar");
  userBar.hidden = false;
  document.getElementById("current-user-label").textContent = `${currentUser}님`;

  todos = loadTodos();
  currentFilter = "전체";
  editingId = null;
  document.querySelectorAll(".filter-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.filter === "전체");
  });
  renderTodos();
}

document.addEventListener("DOMContentLoaded", () => {
  const session = loadSession();
  if (session) {
    currentUser = session;
    showTodoScreen();
  } else {
    showAuthScreen();
  }

  document.querySelectorAll(".auth-tab").forEach((btn) => {
    btn.addEventListener("click", () => setAuthTab(btn.dataset.authTab));
  });

  document.getElementById("login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;

    const result = login(username, password);
    const errorEl = document.getElementById("login-error");

    if (!result.ok) {
      errorEl.textContent = result.message;
      errorEl.hidden = false;
      return;
    }

    currentUser = username;
    showTodoScreen();
  });

  document.getElementById("signup-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("signup-username").value.trim();
    const password = document.getElementById("signup-password").value;
    const passwordConfirm = document.getElementById("signup-password-confirm").value;

    const errorEl = document.getElementById("signup-error");
    const successEl = document.getElementById("signup-success");
    errorEl.hidden = true;
    successEl.hidden = true;

    if (!username || !password) {
      errorEl.textContent = "아이디와 비밀번호를 입력해주세요.";
      errorEl.hidden = false;
      return;
    }

    if (password !== passwordConfirm) {
      errorEl.textContent = "비밀번호가 일치하지 않습니다.";
      errorEl.hidden = false;
      return;
    }

    const result = signup(username, password);
    if (!result.ok) {
      errorEl.textContent = result.message;
      errorEl.hidden = false;
      return;
    }

    document.getElementById("signup-form").reset();
    successEl.textContent = "회원가입이 완료되었습니다. 로그인해주세요.";
    successEl.hidden = false;
    setTimeout(() => {
      setAuthTab("login");
      document.getElementById("login-username").value = username;
      document.getElementById("login-password").focus();
    }, 800);
  });

  document.getElementById("logout-btn").addEventListener("click", () => logout());

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
