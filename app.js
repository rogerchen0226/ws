const STORAGE_KEY = "todo-app-items";
const THEME_STORAGE_KEY = "todo-app-theme";
const FILTER_OPTIONS = {
    all: "all",
    active: "active",
    completed: "completed",
};

const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");
const emptyState = document.getElementById("empty-state");
const remainingCount = document.getElementById("remaining-count");
const themeToggle = document.getElementById("theme-toggle");
const filterButtons = document.querySelectorAll(".filter-btn");

let todos = loadTodos();
let currentFilter = FILTER_OPTIONS.all;
let themeMode = resolveInitialThemeMode();

// 監聽作業系統主題切換，僅在未手動設定時生效
const systemThemeMedia = window.matchMedia("(prefers-color-scheme: dark)");

// 初始化主題與畫面
applyTheme(themeMode);
updateThemeToggleText(themeMode);
render();

if (typeof systemThemeMedia.addEventListener === "function") {
    systemThemeMedia.addEventListener("change", handleSystemThemeChange);
} else if (typeof systemThemeMedia.addListener === "function") {
    systemThemeMedia.addListener(handleSystemThemeChange);
}

form.addEventListener("submit", (event) => {
    event.preventDefault();

    const text = input.value.trim();

    // 避免新增空白內容
    if (!text) {
        input.focus();
        return;
    }

    todos.push({
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
        text,
        completed: false,
    });

    saveTodos();
    render();
    input.value = "";
    input.focus();
});

themeToggle.addEventListener("click", () => {
    const nextTheme = themeMode === "dark" ? "light" : "dark";
    setThemeMode(nextTheme, true);
});

filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const nextFilter = button.dataset.filter;
        if (!Object.values(FILTER_OPTIONS).includes(nextFilter)) {
            return;
        }

        currentFilter = nextFilter;
        updateFilterButtons();
        render();
    });
});

// 讀取 localStorage 並做基本資料防呆
function loadTodos() {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
        return [];
    }

    try {
        const parsed = JSON.parse(raw);

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed
            .filter((item) => item && typeof item.text === "string")
            .map((item) => ({
                id: String(item.id ?? Date.now() + Math.random()),
                text: item.text,
                completed: Boolean(item.completed),
            }));
    } catch {
        return [];
    }
}

function saveTodos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function render() {
    todoList.innerHTML = "";

    const visibleTodos = getVisibleTodos();

    visibleTodos.forEach((todo) => {
        const li = document.createElement("li");
        li.className = "todo-item";
        if (todo.completed) {
            li.classList.add("completed");
        }

        const main = document.createElement("div");
        main.className = "todo-main";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "todo-check";
        checkbox.checked = todo.completed;
        checkbox.setAttribute("aria-label", `切換待辦：${todo.text}`);
        checkbox.addEventListener("change", () => {
            todo.completed = checkbox.checked;
            saveTodos();
            render();
        });

        const text = document.createElement("span");
        text.className = "todo-text";
        text.textContent = todo.text;

        main.appendChild(checkbox);
        main.appendChild(text);

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "刪除";
        deleteBtn.setAttribute("aria-label", `刪除待辦：${todo.text}`);
        deleteBtn.addEventListener("click", () => {
            todos = todos.filter((item) => item.id !== todo.id);
            saveTodos();
            render();
        });

        li.appendChild(main);
        li.appendChild(deleteBtn);
        todoList.appendChild(li);
    });

    const unfinished = todos.filter((todo) => !todo.completed).length;
    remainingCount.textContent = `未完成：${unfinished} 項`;

    // 根據篩選結果決定提示文字
    emptyState.textContent = getEmptyStateMessage();
    emptyState.style.display = visibleTodos.length === 0 ? "block" : "none";
}

function getVisibleTodos() {
    if (currentFilter === FILTER_OPTIONS.active) {
        return todos.filter((todo) => !todo.completed);
    }

    if (currentFilter === FILTER_OPTIONS.completed) {
        return todos.filter((todo) => todo.completed);
    }

    return todos;
}

function getEmptyStateMessage() {
    if (todos.length === 0) {
        return "還沒有任何待辦事項,新增一個吧!";
    }

    if (currentFilter === FILTER_OPTIONS.active) {
        return "目前沒有未完成的待辦事項!";
    }

    if (currentFilter === FILTER_OPTIONS.completed) {
        return "目前沒有已完成的待辦事項!";
    }

    return "還沒有任何待辦事項,新增一個吧!";
}

function updateFilterButtons() {
    filterButtons.forEach((button) => {
        const isActive = button.dataset.filter === currentFilter;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    });
}

function resolveInitialThemeMode() {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark") {
        return saved;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function setThemeMode(mode, saveSelection) {
    themeMode = mode === "dark" ? "dark" : "light";
    applyTheme(themeMode);
    updateThemeToggleText(themeMode);

    if (saveSelection) {
        localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    }
}

function applyTheme(mode) {
    document.body.classList.toggle("theme-dark", mode === "dark");
}

function updateThemeToggleText(mode) {
    themeToggle.textContent = mode === "dark" ? "☀️ 淺色模式" : "🌙 深色模式";
}

function handleSystemThemeChange(event) {
    // 使用者手動切換後，就不再跟隨系統設定
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark") {
        return;
    }

    setThemeMode(event.matches ? "dark" : "light", false);
}
