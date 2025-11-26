const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'tasks.json');
const CATEGORIES_FILE = path.join(__dirname, 'data', 'categories.json');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper: Read tasks from file
function readTasks() {
  const data = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(data);
}

// Helper: Write tasks to file
function writeTasks(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ================================
// Categories API (categories)
// ================================

// Helper: Read categories from file
function readCategories() {
  const data = fs.readFileSync(CATEGORIES_FILE, 'utf-8');
  return JSON.parse(data);
}

// Helper: Write categories to file
function writeCategories(data) {
  fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(data, null, 2));
}

// API: Get all categories
app.get('/api/categories', (req, res) => {
  const data = readCategories();
  res.json(data.categories);
});

// API: Create a new category
app.post('/api/categories', (req, res) => {
  const { name, color } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Name is required' });
  }

  if (name.length > 50) {
    return res.status(400).json({ error: 'Name must be 50 characters or less' });
  }

  const data = readCategories();

  // Check for duplicate name
  const duplicate = data.categories.find(c => c.name.toLowerCase() === name.trim().toLowerCase());
  if (duplicate) {
    return res.status(400).json({ error: 'Category name already exists' });
  }

  const newCategory = {
    id: data.nextId,
    name: name.trim(),
    color: color || '#3498db',
    createdAt: new Date().toISOString()
  };

  data.categories.push(newCategory);
  data.nextId++;
  writeCategories(data);

  res.status(201).json(newCategory);
});

// API: Update a category
app.put('/api/categories/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { name, color } = req.body;

  const data = readCategories();
  const categoryIndex = data.categories.findIndex(c => c.id === id);

  if (categoryIndex === -1) {
    return res.status(404).json({ error: 'Category not found' });
  }

  if (name !== undefined) {
    if (name.trim() === '') {
      return res.status(400).json({ error: 'Name cannot be empty' });
    }
    if (name.length > 50) {
      return res.status(400).json({ error: 'Name must be 50 characters or less' });
    }
    // Check for duplicate name (excluding current category)
    const duplicate = data.categories.find(c => c.id !== id && c.name.toLowerCase() === name.trim().toLowerCase());
    if (duplicate) {
      return res.status(400).json({ error: 'Category name already exists' });
    }
    data.categories[categoryIndex].name = name.trim();
  }

  if (color !== undefined) {
    data.categories[categoryIndex].color = color;
  }

  writeCategories(data);
  res.json(data.categories[categoryIndex]);
});

// API: Delete a category
app.delete('/api/categories/:id', (req, res) => {
  const id = parseInt(req.params.id);

  const categoriesData = readCategories();
  const categoryIndex = categoriesData.categories.findIndex(c => c.id === id);

  if (categoryIndex === -1) {
    return res.status(404).json({ error: 'Category not found' });
  }

  // Remove category from all tasks
  const tasksData = readTasks();
  tasksData.tasks.forEach(task => {
    if (task.categoryIds) {
      task.categoryIds = task.categoryIds.filter(cId => cId !== id);
    }
  });
  writeTasks(tasksData);

  categoriesData.categories.splice(categoryIndex, 1);
  writeCategories(categoriesData);

  res.json({ message: 'Category deleted successfully' });
});

// ================================
// Tasks API
// → categories: categoryIds フィールド追加
// ================================

// API: Get all tasks
app.get('/api/tasks', (req, res) => {
  const data = readTasks();
  let tasks = data.tasks;

  // categories: Filter by category
  const categoryParam = req.query.category;
  if (categoryParam) {
    const categoryIds = categoryParam.split(',').map(id => parseInt(id));
    tasks = tasks.filter(task => {
      if (!task.categoryIds || task.categoryIds.length === 0) {
        return categoryIds.includes(0); // 0 means "no category"
      }
      return task.categoryIds.some(cId => categoryIds.includes(cId));
    });
  }

  // deadline feature: Sort functionality
  const { sort, order } = req.query;
  if (sort) {
    const sortOrder = order === 'desc' ? -1 : 1;
    tasks = [...tasks].sort((a, b) => {
      if (sort === 'deadline') {
        // null deadlines go to the end
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return sortOrder * (new Date(a.deadline) - new Date(b.deadline));
      } else if (sort === 'createdAt') {
        return sortOrder * (new Date(a.createdAt) - new Date(b.createdAt));
      } else if (sort === 'status') {
        const statusOrder = { pending: 0, in_progress: 1, completed: 2 };
        return sortOrder * (statusOrder[a.status] - statusOrder[b.status]);
      }
      return 0;
    });
  }

  res.json(tasks);
});

// API: Create a new task
app.post('/api/tasks', (req, res) => {
  const { title, description, categoryIds, deadline } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required' });
  }

  if (title.length > 100) {
    return res.status(400).json({ error: 'Title must be 100 characters or less' });
  }

  if (description && description.length > 500) {
    return res.status(400).json({ error: 'Description must be 500 characters or less' });
  }

  // deadline feature: Validate deadline
  let parsedDeadline = null;
  if (deadline) {
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      return res.status(400).json({ error: 'Invalid deadline date' });
    }
    parsedDeadline = deadlineDate.toISOString();
  }

  const data = readTasks();
  const newTask = {
    id: data.nextId,
    title: title.trim(),
    description: description ? description.trim() : '',
    status: 'pending',
    createdAt: new Date().toISOString(),
    categoryIds: Array.isArray(categoryIds) ? categoryIds : [],
    deadline: parsedDeadline
  };

  data.tasks.push(newTask);
  data.nextId++;
  writeTasks(data);

  res.status(201).json(newTask);
});

// API: Update a task
app.put('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { title, description, status, categoryIds, deadline } = req.body;

  const data = readTasks();
  const taskIndex = data.tasks.findIndex(t => t.id === id);

  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  if (title !== undefined) {
    if (title.trim() === '') {
      return res.status(400).json({ error: 'Title cannot be empty' });
    }
    if (title.length > 100) {
      return res.status(400).json({ error: 'Title must be 100 characters or less' });
    }
    data.tasks[taskIndex].title = title.trim();
  }

  if (description !== undefined) {
    if (description.length > 500) {
      return res.status(400).json({ error: 'Description must be 500 characters or less' });
    }
    data.tasks[taskIndex].description = description.trim();
  }

  if (status !== undefined) {
    const validStatuses = ['pending', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    data.tasks[taskIndex].status = status;
  }

  // categories: Update categoryIds
  if (categoryIds !== undefined) {
    data.tasks[taskIndex].categoryIds = Array.isArray(categoryIds) ? categoryIds : [];
  }

  // deadline feature: Update deadline
  if (deadline !== undefined) {
    if (deadline === null || deadline === '') {
      data.tasks[taskIndex].deadline = null;
    } else {
      const deadlineDate = new Date(deadline);
      if (isNaN(deadlineDate.getTime())) {
        return res.status(400).json({ error: 'Invalid deadline date' });
      }
      data.tasks[taskIndex].deadline = deadlineDate.toISOString();
    }
  }

  writeTasks(data);
  res.json(data.tasks[taskIndex]);
});

// API: Delete a task
app.delete('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);

  const data = readTasks();
  const taskIndex = data.tasks.findIndex(t => t.id === id);

  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  data.tasks.splice(taskIndex, 1);
  writeTasks(data);

  res.json({ message: 'Task deleted successfully' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Task Manager running at http://localhost:${PORT}`);
});
