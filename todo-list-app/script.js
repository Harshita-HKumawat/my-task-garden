let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = "all";
let searchQuery = "";

const taskInput = document.getElementById('taskInput');
const prioritySelect = document.getElementById('prioritySelect');
const dueDateInput = document.getElementById('dueDateInput');
const recurringSelect = document.getElementById('recurringSelect');
const addTaskBtn = document.getElementById('addTaskBtn');
const searchInput = document.getElementById('searchInput');
const taskList = document.getElementById('taskList');
const filterButtons = document.querySelectorAll('.filter-btn');
const progressStats = document.getElementById('progressStats');
const themeToggle = document.getElementById('themeToggle');
const iconSpan = document.querySelector(".theme-toggle .icon");
const voiceInputBtn = document.getElementById("voiceInputBtn");

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function checkAllSubtasksComplete(subtasks) {
  return subtasks.every(sub => sub.completed);
}

function renderTasks() {
  taskList.innerHTML = '';
  const filtered = tasks.filter(task => {
    const matchesFilter =
      currentFilter === "all" ||
      (currentFilter === "active" && !task.completed) ||
      (currentFilter === "completed" && task.completed);
    const matchesSearch = task.text.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  filtered.forEach((task, index) => {
    const item = document.createElement('div');
    item.className = 'task-item';
    if (task.completed) item.classList.add('completed');
    if (task.dueDate && new Date(task.dueDate) < new Date() && !task.completed) {
      item.classList.add('overdue');
    }

    const text = document.createElement('span');
    text.className = 'task-text';
    text.textContent = task.text;
    if (task.completed) text.classList.add('completed');

    const due = document.createElement('span');
    due.className = 'task-date';
    if (task.dueDate) due.textContent = `Due: ${task.dueDate}`;

    const del = document.createElement('button');
    del.className = 'delete-btn';
    del.textContent = '❌';
    del.onclick = () => {
      tasks.splice(index, 1);
      saveTasks();
      renderTasks();
    };

    const subtaskContainer = document.createElement('div');
    subtaskContainer.className = 'subtask-container';

    const subtaskList = document.createElement('ul');
    subtaskList.className = 'subtask-list';

    task.subtasks = task.subtasks || [];

    task.subtasks.forEach((sub, subIndex) => {
      const li = document.createElement('li');
      li.className = 'subtask-item';
      if (sub.completed) li.classList.add('completed');

      const label = document.createElement('span');
      label.textContent = sub.text;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = sub.completed;
      checkbox.onchange = () => {
        sub.completed = checkbox.checked;
        task.completed = checkAllSubtasksComplete(task.subtasks);
        saveTasks();
        renderTasks();
      };

      li.prepend(checkbox);
      li.append(label);
      subtaskList.appendChild(li);
    });

    const subInputWrapper = document.createElement('div');
    subInputWrapper.className = 'subtask-input-wrapper';

    const subInput = document.createElement('input');
    subInput.placeholder = 'Add subtask...';

    const subBtn = document.createElement('button');
    subBtn.textContent = '+';
    subBtn.onclick = () => {
      if (subInput.value.trim()) {
        task.subtasks.push({ text: subInput.value.trim(), completed: false });
        task.completed = false;
        subInput.value = '';
        saveTasks();
        renderTasks();
      }
    };

    subInputWrapper.appendChild(subInput);
    subInputWrapper.appendChild(subBtn);
    subtaskContainer.appendChild(subtaskList);
    subtaskContainer.appendChild(subInputWrapper);

    text.addEventListener('click', () => {
      if (!task.subtasks.length) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
      }
    });

    item.append(text, due, del, subtaskContainer);
    taskList.appendChild(item);
  });

  updateProgressStats();
}

function updateProgressStats() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const active = total - completed;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  progressStats.innerHTML = `✅ ${completed} / ${total} completed (${percent}%) | 📌 Active: ${active}`;
}

addTaskBtn.addEventListener('click', () => {
  const taskText = taskInput.value.trim();
  if (!taskText) return alert("Please enter a task");

  tasks.push({
    text: taskText,
    completed: false,
    priority: prioritySelect.value,
    dueDate: dueDateInput.value,
    recurring: recurringSelect.value,
    subtasks: []
  });

  saveTasks();
  renderTasks();
  taskInput.value = '';
  prioritySelect.value = 'low';
  dueDateInput.value = '';
  recurringSelect.value = '';
});

searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value;
  renderTasks();
});

filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelector('.filter-btn.active').classList.remove('active');
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  themeToggle.checked = true;
  iconSpan.textContent = "☀️";
}

themeToggle.addEventListener("change", () => {
  const isDark = themeToggle.checked;
  document.body.classList.toggle("dark", isDark);
  localStorage.setItem("theme", isDark ? "dark" : "light");
  iconSpan.textContent = isDark ? "☀️" : "🌙";
});

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-IN';
  recognition.continuous = false;

  voiceInputBtn.addEventListener('click', () => {
    voiceInputBtn.textContent = '🎙️ Listening...';
    recognition.start();
  });

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    taskInput.value = transcript;
    voiceInputBtn.textContent = '🎤';
  };

  recognition.onerror = () => {
    alert("Voice input failed");
    voiceInputBtn.textContent = '🎤';
  };

  recognition.onend = () => {
    voiceInputBtn.textContent = '🎤';
  };
} else {
  voiceInputBtn.disabled = true;
  voiceInputBtn.title = "Not supported";
}

renderTasks();
