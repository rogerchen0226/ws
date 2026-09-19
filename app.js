const STORAGE_KEY = "todo-app-items";

const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");
const emptyState = document.getElementById("empty-state");
const remainingCount = document.getElementById("remaining-count");

let todos = loadTodos();

// 初始化畫面
render();

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

    todos.forEach((todo) => {
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

    // 根據清單是否為空決定提示文字顯示
    emptyState.style.display = todos.length === 0 ? "block" : "none";
}
