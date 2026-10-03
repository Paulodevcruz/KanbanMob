const columns = {
  todo: document.getElementById('todo'),
  doing: document.getElementById('doing'),
  done: document.getElementById('done')
};

const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const cancelTaskBtn = document.getElementById('cancelTaskBtn');

const STORAGE_KEY = 'kanbanmob.tasks';
const statusLabels = {
  todo: 'A fazer',
  doing: 'Em andamento',
  done: 'Concluído'
};

const defaultTasks = {
  todo: [
    { id: 'default-todo', text: 'Exemplo de tarefa' }
  ],
  doing: [
    { id: 'default-doing', text: 'Revisar design' }
  ],
  done: [
    { id: 'default-done', text: 'Publicar versão' }
  ]
};

let draggedTask = null;
let tasks = loadTasks();

function normalizeTask(task, fallbackText = '') {
  if (!task || typeof task !== 'object') {
    return { id: `${Date.now()}-${Math.random()}`, text: String(task ?? fallbackText).trim() };
  }

  return {
    id: task.id || `${Date.now()}-${Math.random()}`,
    text: String(task.text ?? fallbackText).trim()
  };
}

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved === 'object') {
      return {
        todo: Array.isArray(saved.todo) ? saved.todo.map((task) => normalizeTask(task, '')) : [],
        doing: Array.isArray(saved.doing) ? saved.doing.map((task) => normalizeTask(task, '')) : [],
        done: Array.isArray(saved.done) ? saved.done.map((task) => normalizeTask(task, '')) : []
      };
    }
  } catch (error) {
    console.warn('Não foi possível carregar as tarefas salvas.', error);
  }

  return JSON.parse(JSON.stringify(defaultTasks));
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function updateCounts() {
  Object.entries(columns).forEach(([status, element]) => {
    const count = tasks[status].length;
    document.getElementById(`count-${status}`).textContent = count;
  });
}

function createTaskCard(text, status, id) {
  const card = document.createElement('article');
  card.className = 'task-card';
  card.draggable = true;
  card.dataset.status = status;
  card.dataset.id = id;

  card.innerHTML = `
    <p class="task-text">${text}</p>
    <div class="task-actions">
      <span class="task-status">${statusLabels[status]}</span>
      <button class="delete-btn" type="button" aria-label="Excluir tarefa">Excluir</button>
    </div>
  `;

  card.addEventListener('dragstart', () => {
    draggedTask = { id, fromStatus: status };
    card.classList.add('dragging');
  });

  card.addEventListener('dragend', () => {
    draggedTask = null;
    card.classList.remove('dragging');
    document.querySelectorAll('.task-list').forEach((list) => list.classList.remove('drag-over'));
  });

  card.querySelector('.delete-btn').addEventListener('click', () => {
    tasks[status] = tasks[status].filter((task) => task.id !== id);
    saveTasks();
    renderBoard();
  });

  return card;
}

function renderBoard() {
  Object.entries(columns).forEach(([status, list]) => {
    list.innerHTML = '';

    tasks[status].forEach((task) => {
      list.appendChild(createTaskCard(task.text, status, task.id));
    });
  });

  updateCounts();
}

function addTaskToColumn(text, status) {
  const cleanText = text.trim();

  if (!cleanText) {
    return;
  }

  tasks[status].push({
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    text: cleanText
  });

  saveTasks();
  renderBoard();
}

addTaskBtn.addEventListener('click', () => {
  taskForm.classList.remove('hidden');
  taskInput.focus();
});

cancelTaskBtn.addEventListener('click', () => {
  taskForm.reset();
  taskForm.classList.add('hidden');
});

taskForm.addEventListener('submit', (event) => {
  event.preventDefault();
  addTaskToColumn(taskInput.value, 'todo');
  taskForm.reset();
  taskForm.classList.add('hidden');
});

Object.entries(columns).forEach(([status, list]) => {
  list.addEventListener('dragover', (event) => {
    event.preventDefault();
    list.classList.add('drag-over');
  });

  list.addEventListener('dragleave', () => {
    list.classList.remove('drag-over');
  });

  list.addEventListener('drop', (event) => {
    event.preventDefault();
    list.classList.remove('drag-over');

    if (!draggedTask) {
      return;
    }

    const targetStatus = status;
    const taskToMove = tasks[draggedTask.fromStatus].find((task) => task.id === draggedTask.id);

    if (!taskToMove || draggedTask.fromStatus === targetStatus) {
      return;
    }

    tasks[draggedTask.fromStatus] = tasks[draggedTask.fromStatus].filter((task) => task.id !== draggedTask.id);
    tasks[targetStatus].push({ ...taskToMove, text: taskToMove.text });

    saveTasks();
    renderBoard();
  });
});

renderBoard();
