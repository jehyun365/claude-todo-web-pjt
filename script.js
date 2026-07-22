const SUPABASE_URL = "https://admabxcqwuqofftjrsnu.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkbWFieGNxd3Vxb2ZmdGpyc251Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2ODQ2MTQsImV4cCI6MjEwMDI2MDYxNH0.dd-Iv4YpA92zPRvbmGk_waEcEaV6Z3JdBAkpD6OAM-8";
const TABLE_NAME = "todo_tbl";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CATEGORIES = ["개인", "공부", "업무", "취미"];
const THEME_KEY = "mytodo_theme";

let todos = [];
let currentFilter = "전체";
let editingId = null;
let currentUser = null; // { id, email }

function getPreferredTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const toggleBtn = document.getElementById("theme-toggle-btn");
  if (toggleBtn) toggleBtn.textContent = theme === "dark" ? "☀️" : "🌙";
}

function toggleTheme() {
  const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}

function translateAuthError(error) {
  const message = error?.message || "";

  if (message.includes("Invalid login credentials")) {
    return "이메일 또는 비밀번호가 올바르지 않습니다.";
  }
  if (message.includes("User already registered")) {
    return "이미 가입된 이메일입니다.";
  }
  if (message.includes("Password should be at least")) {
    return "비밀번호는 6자 이상이어야 합니다.";
  }
  if (message.includes("Unable to validate email address") || message.includes("invalid format")) {
    return "이메일 형식이 올바르지 않습니다.";
  }
  if (message.includes("Email not confirmed")) {
    return "이메일 인증이 필요합니다. 받은 편지함에서 인증 링크를 확인해주세요.";
  }

  return message || "요청 처리 중 오류가 발생했습니다.";
}

async function handleSignup(email, password) {
  const { data, error } = await supabaseClient.auth.signUp({ email, password });

  if (error) {
    return { ok: false, message: translateAuthError(error) };
  }

  if (data.session) {
    currentUser = { id: data.user.id, email: data.user.email };
    return { ok: true, autoLoggedIn: true };
  }

  return { ok: true, autoLoggedIn: false };
}

async function handleLogin(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    return { ok: false, message: translateAuthError(error) };
  }

  currentUser = { id: data.user.id, email: data.user.email };
  return { ok: true };
}

async function handleLogout() {
  await supabaseClient.auth.signOut();
  currentUser = null;
  todos = [];
  editingId = null;
  showAuthScreen();
}

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
  if (!trimmed || !currentUser) return;

  const { data, error } = await supabaseClient
    .from(TABLE_NAME)
    .insert({ text: trimmed, category, user_id: currentUser.id })
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

async function showTodoScreen() {
  document.getElementById("auth-section").hidden = true;
  document.getElementById("todo-app").hidden = false;

  const userBar = document.getElementById("user-bar");
  userBar.hidden = false;
  document.getElementById("current-user-label").textContent = `${currentUser.email}님`;

  todos = await loadTodos();
  currentFilter = "전체";
  editingId = null;
  document.querySelectorAll(".filter-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.filter === "전체");
  });
  renderTodos();
}

document.addEventListener("DOMContentLoaded", async () => {
  applyTheme(getPreferredTheme());
  document.getElementById("theme-toggle-btn").addEventListener("click", toggleTheme);

  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  if (session) {
    currentUser = { id: session.user.id, email: session.user.email };
    await showTodoScreen();
  } else {
    showAuthScreen();
  }

  document.querySelectorAll(".auth-tab").forEach((btn) => {
    btn.addEventListener("click", () => setAuthTab(btn.dataset.authTab));
  });

  document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const errorEl = document.getElementById("login-error");
    errorEl.hidden = true;

    const result = await handleLogin(email, password);
    if (!result.ok) {
      errorEl.textContent = result.message;
      errorEl.hidden = false;
      return;
    }

    await showTodoScreen();
  });

  document.getElementById("signup-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;
    const passwordConfirm = document.getElementById("signup-password-confirm").value;

    const errorEl = document.getElementById("signup-error");
    const successEl = document.getElementById("signup-success");
    errorEl.hidden = true;
    successEl.hidden = true;

    if (!email || !password) {
      errorEl.textContent = "이메일과 비밀번호를 입력해주세요.";
      errorEl.hidden = false;
      return;
    }

    if (password !== passwordConfirm) {
      errorEl.textContent = "비밀번호가 일치하지 않습니다.";
      errorEl.hidden = false;
      return;
    }

    const result = await handleSignup(email, password);
    if (!result.ok) {
      errorEl.textContent = result.message;
      errorEl.hidden = false;
      return;
    }

    document.getElementById("signup-form").reset();

    if (result.autoLoggedIn) {
      await showTodoScreen();
      return;
    }

    successEl.textContent = "회원가입이 완료되었습니다. 이메일함에서 인증 링크를 확인한 뒤 로그인해주세요.";
    successEl.hidden = false;
    setTimeout(() => {
      setAuthTab("login");
      document.getElementById("login-email").value = email;
      document.getElementById("login-password").focus();
    }, 1200);
  });

  document.getElementById("logout-btn").addEventListener("click", () => handleLogout());

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
