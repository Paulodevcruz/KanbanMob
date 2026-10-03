const columns = {
  todo: document.getElementById('todo'),
  doing: document.getElementById('doing'),
  done: document.getElementById('done')
};

const boardList = document.getElementById('boardList');
const boardForm = document.getElementById('boardForm');
const boardNameInput = document.getElementById('boardNameInput');
const boardDescriptionInput = document.getElementById('boardDescriptionInput');
const boardPermissionInput = document.getElementById('boardPermissionInput');
const userSelector = document.getElementById('userSelector');
const logoutBtn = document.getElementById('logoutBtn');
const selectedBoardSummary = document.getElementById('selectedBoardSummary');
const boardEmptyState = document.getElementById('boardEmptyState');
const newBoardBtn = document.getElementById('newBoardBtn');
const cancelBoardBtn = document.getElementById('cancelBoardBtn');
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const cancelTaskBtn = document.getElementById('cancelTaskBtn');
const loginScreen = document.getElementById('loginScreen');
const loginForm = document.getElementById('loginForm');
const loginUserInput = document.getElementById('loginUser');
const loginPasswordInput = document.getElementById('loginPassword');
const loginError = document.getElementById('loginError');
const addTaskBtn = document.createElement('button');
addTaskBtn.id = 'addTaskBtn';
addTaskBtn.className = 'primary-btn';
addTaskBtn.type = 'button';
addTaskBtn.textContent = '+ Nova tarefa';

const STORAGE_KEYS = {
  boards: 'kanbanmob.boards',
  currentUser: 'kanbanmob.currentUser',
  authUser: 'kanbanmob.auth.user'
};

const statusLabels = {
  todo: 'A fazer',
  doing: 'Em andamento',
  done: 'Concluído'
};

const userProfiles = {
  ana: { name: 'Ana', role: 'admin', password: '123456' },
  bruno: { name: 'Bruno', role: 'member', password: '123456' },
  carla: { name: 'Carla', role: 'viewer', password: '123456' }
};

let draggedTask = null;
let currentUser = loadCurrentUser();
let currentBoardId = null;
let boards = loadBoards();
let tasks = createEmptyTaskState();

function createEmptyTaskState() {
  return {
    todo: [],
    doing: [],
    done: []
  };
}

function normalizeTask(task, fallbackText = '') {
  if (!task || typeof task !== 'object') {
    return { id: `${Date.now()}-${Math.random()}`, text: String(task ?? fallbackText).trim() };
  }

  return {
    id: task.id || `${Date.now()}-${Math.random()}`,
    text: String(task.text ?? fallbackText).trim()
  };
}

function normalizeBoardTasks(tasksState) {
  return {
    todo: Array.isArray(tasksState?.todo) ? tasksState.todo.map((task) => normalizeTask(task, '')) : [],
    doing: Array.isArray(tasksState?.doing) ? tasksState.doing.map((task) => normalizeTask(task, '')) : [],
    done: Array.isArray(tasksState?.done) ? tasksState.done.map((task) => normalizeTask(task, '')) : []
  };
}

function loadCurrentUser() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.authUser) || localStorage.getItem(STORAGE_KEYS.currentUser);
    if (saved && userProfiles[saved]) {
      return saved;
    }
  } catch (error) {
    console.warn('Não foi possível carregar usuário atual.', error);
  }

  return null;
}

function renderAuthState() {
  const hasSession = Boolean(currentUser);
  if (loginScreen) {
    loginScreen.classList.toggle('hidden', hasSession);
  }

  const appContainer = document.querySelector('.app');
  if (appContainer) {
    appContainer.classList.toggle('hidden', !hasSession);
  }

  if (userSelector) {
    userSelector.value = currentUser || 'ana';
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function defaultBoardState() {
  return {
    todo: [{ id: 'default-board-todo', text: 'Planejar sprint' }],
    doing: [{ id: 'default-board-doing', text: 'Revisar backlog' }],
    done: [{ id: 'default-board-done', text: 'Definir metas' }]
  };
}

function createDefaultBoards() {
  const now = new Date().toISOString();

  return [
    {
      id: 'board-ana-1',
      name: 'Operações',
      description: 'Acompanhamento de rotina e tarefas da operação.',
      owner: 'ana',
      createdAt: now,
      updatedAt: now,
      status: 'active',
      accessByUser: {
        ana: 'owner',
        bruno: 'editor'
      },
      tasks: defaultBoardState()
    },
    {
      id: 'board-bruno-1',
      name: 'Marketing',
      description: 'Campanhas, conteúdo e lançamento.',
      owner: 'bruno',
      createdAt: now,
      updatedAt: now,
      status: 'active',
      accessByUser: {
        bruno: 'owner',
        ana: 'viewer'
      },
      tasks: {
        todo: [{ id: 'board-bruno-todo', text: 'Validar campanha' }],
        doing: [{ id: 'board-bruno-doing', text: 'Revisar criativos' }],
        done: []
      }
    },
    {
      id: 'board-carla-1',
      name: 'Financeiro',
      description: 'Controle financeiro e pagamentos.',
      owner: 'carla',
      createdAt: now,
      updatedAt: now,
      status: 'archived',
      accessByUser: {
        carla: 'owner'
      },
      tasks: {
        todo: [],
        doing: [],
        done: [{ id: 'archived-board-done', text: 'Pagamentos do mês' }]
      }
    }
  ];
}

function loadBoards() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.boards));
    if (Array.isArray(saved) && saved.length > 0) {
      return saved.map((board) => ({
        id: board.id || `board-${Date.now()}-${Math.random()}`,
        name: String(board.name || 'Quadro sem nome'),
        description: String(board.description || ''),
        owner: board.owner || currentUser,
        createdAt: board.createdAt || new Date().toISOString(),
        updatedAt: board.updatedAt || new Date().toISOString(),
        status: board.status === 'archived' ? 'archived' : 'active',
        accessByUser: board.accessByUser && typeof board.accessByUser === 'object' ? board.accessByUser : { [board.owner || currentUser]: 'owner' },
        tasks: normalizeBoardTasks(board.tasks || createEmptyTaskState())
      }));
    }
  } catch (error) {
    console.warn('Não foi possível carregar os quadros salvos.', error);
  }

  return createDefaultBoards();
}

function saveBoards() {
  localStorage.setItem(STORAGE_KEYS.boards, JSON.stringify(boards));
}

function getBoardPermissionForUser(board, userId = currentUser) {
  if (!board || typeof board !== 'object') {
    return null;
  }

  if (board.owner === userId) {
    return 'owner';
  }

  return board.accessByUser?.[userId] || null;
}

function canUserEditBoard(board) {
  const permission = getBoardPermissionForUser(board);
  return permission === 'owner' || permission === 'editor';
}

function visibleBoardsForUser() {
  return boards.filter((board) => board.status !== 'archived' && Boolean(getBoardPermissionForUser(board)));
}

function formatPermission(permission) {
  const labels = {
    owner: 'Proprietário',
    editor: 'Editor',
    viewer: 'Visualizador'
  };

  return labels[permission] || 'Sem acesso';
}

function ensureBoardSelection() {
  const visible = visibleBoardsForUser();

  if (!visible.length) {
    currentBoardId = null;
    return;
  }

  const selectedExists = visible.some((board) => board.id === currentBoardId);
  currentBoardId = selectedExists ? currentBoardId : visible[0].id;
}

function getSelectedBoard() {
  return boards.find((board) => board.id === currentBoardId) || null;
}

function renderSelectedBoardSummary() {
  const board = getSelectedBoard();

  if (!board) {
    selectedBoardSummary.innerHTML = '';
    return;
  }

  const permission = getBoardPermissionForUser(board);
  const userName = userProfiles[currentUser]?.name || 'Usuário';

  selectedBoardSummary.innerHTML = `
    <div class="selected-board-header">
      <div>
        <p class="eyebrow">Quadro ativo</p>
        <h2>${escapeHtml(board.name)}</h2>
      </div>
      <span class="permission-badge ${permission}">${formatPermission(permission)}</span>
    </div>
    <div class="selected-board-meta">
      <span>Responsável: ${escapeHtml(board.owner)}</span>
      <span>Usuário atual: ${userName}</span>
      <span>Atualizado em: ${new Date(board.updatedAt).toLocaleDateString('pt-BR')}</span>
    </div>
    ${board.description ? `<p class="board-description">${escapeHtml(board.description)}</p>` : ''}
  `;
}

function renderBoardList() {
  const visibleBoards = visibleBoardsForUser();

  if (!visibleBoards.length) {
    boardList.innerHTML = '<div class="board-list-empty">Nenhum quadro disponível para este perfil.</div>';
    return;
  }

  boardList.innerHTML = visibleBoards
    .map((board) => {
      const permission = getBoardPermissionForUser(board);
      const selected = board.id === currentBoardId ? 'selected' : '';

      return `
        <button type="button" class="board-item ${selected}" data-board-id="${board.id}">
          <span class="board-item-name">${escapeHtml(board.name)}</span>
          <span class="board-item-description">${escapeHtml(board.description || 'Sem descrição')}</span>
          <span class="board-item-meta">
            <span class="permission-badge ${permission}">${formatPermission(permission)}</span>
          </span>
        </button>
      `;
    })
    .join('');

  boardList.querySelectorAll('.board-item').forEach((button) => {
    button.addEventListener('click', () => {
      currentBoardId = button.dataset.boardId;
      render();
    });
  });
}

function persistCurrentBoardState() {
  const board = getSelectedBoard();
  if (!board) {
    return;
  }

  board.tasks = tasks;
  board.updatedAt = new Date().toISOString();
  saveBoards();
}

function updateCounts() {
  const board = getSelectedBoard();
  if (!board) {
    return;
  }

  Object.entries(columns).forEach(([status, element]) => {
    const count = tasks[status].length;
    document.getElementById(`count-${status}`).textContent = count;
    element.dataset.count = String(count);
  });
}

function createTaskCard(text, status, id, canEditTask) {
  const card = document.createElement('article');
  card.className = 'task-card';
  card.draggable = canEditTask;
  card.dataset.status = status;
  card.dataset.id = id;

  card.innerHTML = `
    <p class="task-text">${escapeHtml(text)}</p>
    <div class="task-actions">
      <span class="task-status">${statusLabels[status]}</span>
      <button class="delete-btn" type="button" aria-label="Excluir tarefa" ${canEditTask ? '' : 'disabled'}>Excluir</button>
    </div>
  `;

  if (!canEditTask) {
    return card;
  }

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
    persistCurrentBoardState();
    renderBoard();
  });

  return card;
}

function renderBoard() {
  ensureBoardSelection();
  const board = getSelectedBoard();

  renderBoardList();
  renderSelectedBoardSummary();

  if (!board) {
    boardEmptyState.classList.remove('hidden');
    Object.entries(columns).forEach(([status, list]) => {
      list.innerHTML = '';
      document.getElementById(`count-${status}`).textContent = '0';
    });
    taskForm.classList.add('hidden');
    return;
  }

  boardEmptyState.classList.add('hidden');
  tasks = board.tasks || createEmptyTaskState();

  const canEdit = canUserEditBoard(board);
  taskForm.classList.toggle('hidden', !canEdit);

  Object.entries(columns).forEach(([status, list]) => {
    list.innerHTML = '';

    tasks[status].forEach((task) => {
      list.appendChild(createTaskCard(task.text, status, task.id, canEdit));
    });
  });

  updateCounts();
}

function addTaskToColumn(text, status) {
  const cleanText = text.trim();
  const board = getSelectedBoard();

  if (!cleanText || !board || !canUserEditBoard(board)) {
    return;
  }

  tasks[status].push({
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    text: cleanText
  });

  persistCurrentBoardState();
  renderBoard();
}

newBoardBtn.addEventListener('click', () => {
  boardForm.classList.remove('hidden');
  boardNameInput.focus();
});

cancelBoardBtn.addEventListener('click', () => {
  boardForm.reset();
  boardForm.classList.add('hidden');
});

boardForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const name = boardNameInput.value.trim();
  if (!name) {
    return;
  }

  const description = boardDescriptionInput.value.trim();
  const permission = boardPermissionInput.value || 'editor';

  const newBoard = {
    id: `board-${Date.now()}-${Math.random()}`,
    name,
    description,
    owner: currentUser,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'active',
    accessByUser: {
      [currentUser]: permission === 'owner' ? 'owner' : permission
    },
    tasks: createEmptyTaskState()
  };

  boards.unshift(newBoard);
  saveBoards();
  currentBoardId = newBoard.id;
  boardForm.reset();
  boardForm.classList.add('hidden');
  render();
});

userSelector.value = currentUser || 'ana';
userSelector.addEventListener('change', (event) => {
  currentUser = event.target.value;
  localStorage.setItem(STORAGE_KEYS.currentUser, currentUser);
  localStorage.setItem(STORAGE_KEYS.authUser, currentUser);
  render();
});

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const username = loginUserInput.value.trim().toLowerCase();
  const password = loginPasswordInput.value;
  const user = userProfiles[username];

  if (!user || user.password !== password) {
    loginError.classList.remove('hidden');
    return;
  }

  currentUser = username;
  localStorage.setItem(STORAGE_KEYS.currentUser, currentUser);
  localStorage.setItem(STORAGE_KEYS.authUser, currentUser);
  loginError.classList.add('hidden');
  loginForm.reset();
  render();
});

logoutBtn.addEventListener('click', () => {
  currentUser = null;
  localStorage.removeItem(STORAGE_KEYS.authUser);
  localStorage.removeItem(STORAGE_KEYS.currentUser);
  loginForm.reset();
  render();
});

addTaskBtn.textContent = '+ Nova tarefa';
addTaskBtn.classList.add('primary-btn');
addTaskBtn.type = 'button';
addTaskBtn.addEventListener('click', () => {
  const board = getSelectedBoard();
  if (!board || !canUserEditBoard(board)) {
    return;
  }

  taskForm.classList.remove('hidden');
  taskInput.focus();
});

const topbarActions = document.querySelector('.topbar-actions');
if (topbarActions) {
  topbarActions.appendChild(addTaskBtn);
}

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
    const board = getSelectedBoard();
    if (!board || !canUserEditBoard(board)) {
      return;
    }

    event.preventDefault();
    list.classList.add('drag-over');
  });

  list.addEventListener('dragleave', () => {
    list.classList.remove('drag-over');
  });

  list.addEventListener('drop', (event) => {
    const board = getSelectedBoard();
    if (!board || !canUserEditBoard(board)) {
      return;
    }

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

    persistCurrentBoardState();
    renderBoard();
  });
});

function render() {
  renderAuthState();

  if (!currentUser) {
    return;
  }

  ensureBoardSelection();
  renderBoard();
}

render();
