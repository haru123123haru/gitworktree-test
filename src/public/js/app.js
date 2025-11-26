// Task Manager Application

const API_URL = '/api/tasks';
const CATEGORIES_API_URL = '/api/categories';

// State
let allTasks = [];
let currentFilter = 'all';
let allCategories = [];
let currentCategoryFilter = null;

// DOM Elements
const tasksContainer = document.getElementById('tasks');
const createTaskForm = document.getElementById('createTaskForm');
const editModal = document.getElementById('editModal');
const editTaskForm = document.getElementById('editTaskForm');
const filterList = document.getElementById('filterList');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadCategories();
  loadTasks();
  setupEventListeners();
  setupCategoryEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
  createTaskForm.addEventListener('submit', handleCreateTask);
  editTaskForm.addEventListener('submit', handleEditTask);

  // Filter click handlers
  if (filterList) {
    filterList.addEventListener('click', (e) => {
      const filterItem = e.target.closest('.filter-item');
      if (filterItem) {
        const filter = filterItem.dataset.filter;
        setFilter(filter);
      }
    });
  }
}

// Set active filter
function setFilter(filter) {
  currentFilter = filter;

  // Update active class
  document.querySelectorAll('.filter-item').forEach(item => {
    item.classList.toggle('active', item.dataset.filter === filter);
  });

  // Re-render tasks with filter
  renderTasks(getFilteredTasks());
}

// Get filtered tasks
function getFilteredTasks() {
  if (currentFilter === 'all') {
    return allTasks;
  }
  return allTasks.filter(task => task.status === currentFilter);
}

// Update task counts in sidebar
function updateTaskCounts() {
  const counts = {
    all: allTasks.length,
    pending: allTasks.filter(t => t.status === 'pending').length,
    in_progress: allTasks.filter(t => t.status === 'in_progress').length,
    completed: allTasks.filter(t => t.status === 'completed').length
  };

  // Update count badges
  const countAll = document.getElementById('countAll');
  const countPending = document.getElementById('countPending');
  const countInProgress = document.getElementById('countInProgress');
  const countCompleted = document.getElementById('countCompleted');

  if (countAll) countAll.textContent = counts.all;
  if (countPending) countPending.textContent = counts.pending;
  if (countInProgress) countInProgress.textContent = counts.in_progress;
  if (countCompleted) countCompleted.textContent = counts.completed;
}

// Load all tasks
async function loadTasks() {
  try {
    const response = await fetch(API_URL);
    const tasks = await response.json();
    allTasks = tasks;
    updateTaskCounts();
    renderTasks(getFilteredTasks());
  } catch (error) {
    console.error('Failed to load tasks:', error);
    tasksContainer.innerHTML = '<p class="empty-state">Failed to load tasks</p>';
  }
}

// Render tasks
function renderTasks(tasks) {
  if (tasks.length === 0) {
    const message = currentFilter === 'all'
      ? 'No tasks yet. Create one!'
      : `No ${formatStatus(currentFilter).toLowerCase()} tasks.`;
    tasksContainer.innerHTML = `<p class="empty-state">${message}</p>`;
    return;
  }

  tasksContainer.innerHTML = tasks.map(task => `
    <div class="task-item ${task.status === 'completed' ? 'completed' : ''}" data-id="${task.id}">
      <div class="task-content">
        <div class="task-title">${escapeHtml(task.title)}</div>
        ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
        ${renderCategoryBadges(task.categoryIds)}
        <div class="task-meta">
          <span class="task-status status-${task.status}">${formatStatus(task.status)}</span>
          <span>Created: ${formatDate(task.createdAt)}</span>
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
  const categoryIds = getSelectedCategoryIds('categoryCheckboxes');

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, categoryIds })
    });

    if (!response.ok) {
      const error = await response.json();
      alert(error.error);
      return;
    }

    createTaskForm.reset();
    clearCategoryCheckboxes('categoryCheckboxes');
    loadTasks();
  } catch (error) {
    console.error('Failed to create task:', error);
    alert('Failed to create task');
  }
}

// Open edit modal
async function openEditModal(id) {
  const task = allTasks.find(t => t.id === id);

  if (!task) {
    alert('Task not found');
    return;
  }

  document.getElementById('editId').value = task.id;
  document.getElementById('editTitle').value = task.title;
  document.getElementById('editDescription').value = task.description;
  document.getElementById('editStatus').value = task.status;

  // categories: Render and set category checkboxes
  renderCategoryCheckboxes('editCategoryCheckboxes', task.categoryIds || []);

  editModal.classList.add('active');
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
  const categoryIds = getSelectedCategoryIds('editCategoryCheckboxes');

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, status, categoryIds })
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

// Close modal when clicking outside or pressing Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && editModal.classList.contains('active')) {
    closeModal();
  }
});

// ================================
// categories functions
// ================================

// Load all categories
async function loadCategories() {
  try {
    const response = await fetch(CATEGORIES_API_URL);
    const categories = await response.json();
    allCategories = categories;
    renderCategories();
    renderCategoryCheckboxes('categoryCheckboxes', []);
  } catch (error) {
    console.error('Failed to load categories:', error);
  }
}

// Render categories in sidebar
function renderCategories() {
  const categoryList = document.getElementById('categoryList');
  if (!categoryList) return;

  if (allCategories.length === 0) {
    categoryList.innerHTML = '<li class="category-item empty-state">No categories yet</li>';
    return;
  }

  categoryList.innerHTML = `
    <li class="category-item ${currentCategoryFilter === null ? 'active' : ''}" data-category-filter="all">
      <span class="category-color" style="background-color: transparent; border: 2px solid var(--color-border);"></span>
      <span class="category-name">All</span>
    </li>
    <li class="category-item ${currentCategoryFilter === 0 ? 'active' : ''}" data-category-filter="none">
      <span class="category-color" style="background-color: transparent; border: 2px dashed var(--color-border);"></span>
      <span class="category-name">No Category</span>
    </li>
    ${allCategories.map(category => `
      <li class="category-item ${currentCategoryFilter === category.id ? 'active' : ''}" data-category-filter="${category.id}">
        <span class="category-color" style="background-color: ${category.color};"></span>
        <span class="category-name">${escapeHtml(category.name)}</span>
        <div class="category-actions">
          <button class="btn-icon-tiny" onclick="editCategory(${category.id}, event)" title="Edit">✎</button>
          <button class="btn-icon-tiny" onclick="deleteCategory(${category.id}, event)" title="Delete">×</button>
        </div>
      </li>
    `).join('')}
  `;
}

// Render category checkboxes for task forms
function renderCategoryCheckboxes(containerId, selectedIds = []) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (allCategories.length === 0) {
    container.innerHTML = '<span class="no-categories">No categories available</span>';
    return;
  }

  container.innerHTML = allCategories.map(category => `
    <label class="category-checkbox">
      <input type="checkbox" value="${category.id}" ${selectedIds.includes(category.id) ? 'checked' : ''}>
      <span class="category-badge" style="background-color: ${category.color};">${escapeHtml(category.name)}</span>
    </label>
  `).join('');
}

// Get selected category IDs from checkboxes
function getSelectedCategoryIds(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return [];

  const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');
  return Array.from(checkboxes).map(cb => parseInt(cb.value));
}

// Clear category checkboxes
function clearCategoryCheckboxes(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const checkboxes = container.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => cb.checked = false);
}

// Render category badges for a task
function renderCategoryBadges(categoryIds) {
  if (!categoryIds || categoryIds.length === 0) return '';

  const badges = categoryIds.map(id => {
    const category = allCategories.find(c => c.id === id);
    if (!category) return '';
    return `<span class="category-badge" style="background-color: ${category.color};">${escapeHtml(category.name)}</span>`;
  }).filter(b => b).join('');

  return badges ? `<div class="task-categories">${badges}</div>` : '';
}

// Setup category event listeners
function setupCategoryEventListeners() {
  const addCategoryBtn = document.getElementById('addCategoryBtn');
  const cancelCategoryBtn = document.getElementById('cancelCategoryBtn');
  const saveCategoryBtn = document.getElementById('saveCategoryBtn');
  const categoryList = document.getElementById('categoryList');
  const colorPicker = document.getElementById('colorPicker');

  if (addCategoryBtn) {
    addCategoryBtn.addEventListener('click', showCategoryForm);
  }

  if (cancelCategoryBtn) {
    cancelCategoryBtn.addEventListener('click', hideCategoryForm);
  }

  if (saveCategoryBtn) {
    saveCategoryBtn.addEventListener('click', saveCategory);
  }

  if (categoryList) {
    categoryList.addEventListener('click', (e) => {
      const categoryItem = e.target.closest('.category-item');
      if (categoryItem && !e.target.closest('.category-actions')) {
        const filter = categoryItem.dataset.categoryFilter;
        setCategoryFilter(filter);
      }
    });
  }

  if (colorPicker) {
    colorPicker.addEventListener('click', (e) => {
      const colorOption = e.target.closest('.color-option');
      if (colorOption) {
        colorPicker.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
        colorOption.classList.add('selected');
      }
    });
  }
}

// Show category form
function showCategoryForm() {
  const categoryForm = document.getElementById('categoryForm');
  const categoryNameInput = document.getElementById('categoryName');
  if (categoryForm) {
    categoryForm.style.display = 'block';
    categoryForm.dataset.editId = '';
    categoryNameInput.value = '';
    // Reset color selection to default blue
    const colorPicker = document.getElementById('colorPicker');
    colorPicker.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
    colorPicker.querySelector('[data-color="#3498db"]').classList.add('selected');
    categoryNameInput.focus();
  }
}

// Hide category form
function hideCategoryForm() {
  const categoryForm = document.getElementById('categoryForm');
  if (categoryForm) {
    categoryForm.style.display = 'none';
    categoryForm.dataset.editId = '';
  }
}

// Save category (create or update)
async function saveCategory() {
  const categoryForm = document.getElementById('categoryForm');
  const categoryNameInput = document.getElementById('categoryName');
  const selectedColor = document.querySelector('#colorPicker .color-option.selected');

  const name = categoryNameInput.value.trim();
  const color = selectedColor ? selectedColor.dataset.color : '#3498db';
  const editId = categoryForm.dataset.editId;

  if (!name) {
    alert('Please enter a category name');
    return;
  }

  try {
    let response;
    if (editId) {
      // Update existing category
      response = await fetch(`${CATEGORIES_API_URL}/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color })
      });
    } else {
      // Create new category
      response = await fetch(CATEGORIES_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color })
      });
    }

    if (!response.ok) {
      const error = await response.json();
      alert(error.error);
      return;
    }

    hideCategoryForm();
    loadCategories();
  } catch (error) {
    console.error('Failed to save category:', error);
    alert('Failed to save category');
  }
}

// Edit category
function editCategory(id, event) {
  event.stopPropagation();

  const category = allCategories.find(c => c.id === id);
  if (!category) return;

  const categoryForm = document.getElementById('categoryForm');
  const categoryNameInput = document.getElementById('categoryName');
  const colorPicker = document.getElementById('colorPicker');

  categoryForm.style.display = 'block';
  categoryForm.dataset.editId = id;
  categoryNameInput.value = category.name;

  // Select the current color
  colorPicker.querySelectorAll('.color-option').forEach(opt => {
    opt.classList.toggle('selected', opt.dataset.color === category.color);
  });

  categoryNameInput.focus();
}

// Delete category
async function deleteCategory(id, event) {
  event.stopPropagation();

  const category = allCategories.find(c => c.id === id);
  if (!category) return;

  if (!confirm(`Are you sure you want to delete "${category.name}"? This will remove the category from all tasks.`)) {
    return;
  }

  try {
    const response = await fetch(`${CATEGORIES_API_URL}/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json();
      alert(error.error);
      return;
    }

    // Reset filter if the deleted category was the current filter
    if (currentCategoryFilter === id) {
      currentCategoryFilter = null;
    }

    loadCategories();
    loadTasks();
  } catch (error) {
    console.error('Failed to delete category:', error);
    alert('Failed to delete category');
  }
}

// Set category filter
function setCategoryFilter(filter) {
  if (filter === 'all') {
    currentCategoryFilter = null;
  } else if (filter === 'none') {
    currentCategoryFilter = 0;
  } else {
    currentCategoryFilter = parseInt(filter);
  }

  renderCategories();
  loadTasksWithCategoryFilter();
}

// Load tasks with category filter
async function loadTasksWithCategoryFilter() {
  try {
    let url = API_URL;
    if (currentCategoryFilter !== null) {
      url += `?category=${currentCategoryFilter}`;
    }

    const response = await fetch(url);
    const tasks = await response.json();
    allTasks = tasks;
    updateTaskCounts();
    renderTasks(getFilteredTasks());
  } catch (error) {
    console.error('Failed to load tasks:', error);
    tasksContainer.innerHTML = '<p class="empty-state">Failed to load tasks</p>';
  }
}
