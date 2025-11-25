const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'tasks.json');

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

// API: Get all tasks
app.get('/api/tasks', (req, res) => {
  const data = readTasks();
  res.json(data.tasks);
});

// API: Create a new task
app.post('/api/tasks', (req, res) => {
  const { title, description } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required' });
  }

  if (title.length > 100) {
    return res.status(400).json({ error: 'Title must be 100 characters or less' });
  }

  if (description && description.length > 500) {
    return res.status(400).json({ error: 'Description must be 500 characters or less' });
  }

  const data = readTasks();
  const newTask = {
    id: data.nextId,
    title: title.trim(),
    description: description ? description.trim() : '',
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  data.tasks.push(newTask);
  data.nextId++;
  writeTasks(data);

  res.status(201).json(newTask);
});

// API: Update a task
app.put('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { title, description, status } = req.body;

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
