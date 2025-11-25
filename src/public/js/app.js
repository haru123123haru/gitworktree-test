// Task Manager Application

const API_URL = '/api/tasks';

// DOM Elements
const tasksContainer = document.getElementById('tasks');
const createTaskForm = document.getElementById('createTaskForm');
const editModal = document.getElementById('editModal');
const editTaskForm = document.getElementById('editTaskForm');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadTasks();
  setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
  createTaskForm.addEventListener('submit', handleCreateTask);
  editTaskForm.addEventListener('submit', handleEditTask);
}

// Load all tasks
async function loadTasks() {
  try {
    const response = await fetch(API_URL);
    const tasks = await response.json();
    renderTasks(tasks);
  } catch (error) {
    console.error('Failed to load tasks:', error);
    tasksContainer.innerHTML = '<p class="empty-state">Failed to load tasks</p>';
  }
}

// Render tasks
function renderTasks(tasks) {
  if (tasks.length === 0) {
    tasksContainer.innerHTML = '<p class="empty-state">No tasks yet. Create one!</p>';
    return;
  }

  tasksContainer.innerHTML = tasks.map(task => `
    <div class="task-item ${task.status === 'completed' ? 'completed' : ''}" data-id="${task.id}">
      <div class="task-content">
        <div class="task-title">${escapeHtml(task.title)}</div>
        ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
        <div class="task-meta">
          <span class="task-status status-${task.status}">${formatStatus(task.status)}</span>
          <span> | Created: ${formatDate(task.createdAt)}</span>
        </div>
      </div>
      <div class="task-actions">
        <button class="btn btn-secondary btn-small" onclick="openEditModal(${task.id})">Edit</button>
        <button class="btn btn-danger btn-small" onclick="deleteTask(${task.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

// Create task
async function handleCreateTask(e) {
  e.preventDefault();

  const title = document.getElementById('title').value;
  const description = document.getElementById('description').value;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description })
    });

    if (!response.ok) {
      const error = await response.json();
      alert(error.error);
      return;
    }

    createTaskForm.reset();
    loadTasks();
  } catch (error) {
    console.error('Failed to create task:', error);
    alert('Failed to create task');
  }
}

// Open edit modal
async function openEditModal(id) {
  try {
    const response = await fetch(API_URL);
    const tasks = await response.json();
    const task = tasks.find(t => t.id === id);

    if (!task) {
      alert('Task not found');
      return;
    }

    document.getElementById('editId').value = task.id;
    document.getElementById('editTitle').value = task.title;
    document.getElementById('editDescription').value = task.description;
    document.getElementById('editStatus').value = task.status;

    editModal.classList.add('active');
  } catch (error) {
    console.error('Failed to load task:', error);
    alert('Failed to load task');
  }
}

// Close modal
function closeModal() {
  editModal.classList.remove('active');
}

// Edit task
async function handleEditTask(e) {
  e.preventDefault();

  const id = document.getElementById('editId').value;
  const title = document.getElementById('editTitle').value;
  const description = document.getElementById('editDescription').value;
  const status = document.getElementById('editStatus').value;

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, status })
    });

    if (!response.ok) {
      const error = await response.json();
      alert(error.error);
      return;
    }

    closeModal();
    loadTasks();
  } catch (error) {
    console.error('Failed to update task:', error);
    alert('Failed to update task');
  }
}

// Delete task
async function deleteTask(id) {
  if (!confirm('Are you sure you want to delete this task?')) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json();
      alert(error.error);
      return;
    }

    loadTasks();
  } catch (error) {
    console.error('Failed to delete task:', error);
    alert('Failed to delete task');
  }
}

// Helper: Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Helper: Format status
function formatStatus(status) {
  const statusMap = {
    'pending': 'Pending',
    'in_progress': 'In Progress',
    'completed': 'Completed'
  };
  return statusMap[status] || status;
}

// Helper: Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP');
}
