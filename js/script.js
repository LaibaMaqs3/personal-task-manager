console.log("Task Manager Dashboard loaded successfully.");

// Task Manager Application

class TaskManager {
  constructor() {
    this.tasks = [];
    this.currentFilter = 'all';
    this.searchTerm = '';
    this.currentSort = 'created-desc';
    this.init();
  }

  init() {
    this.loadTasks();
    this.setupEventListeners();
    this.fetchQuote();
    this.render();
  }


  // API Integration - Fetch Quote
  async fetchQuote() {
    try {
      const response = await fetch('https://dummyjson.com/quotes/random');
      const data = await response.json();
      document.getElementById('quote-text').textContent = `"${data.quote}"`;
      document.getElementById('quote-author').textContent = `— ${data.author}`;
    } catch (error) {
      console.error('Error fetching quote:', error);
      document.getElementById('quote-text').textContent =
        '"The only way to do great work is to love what you do." ';
      document.getElementById('quote-author').textContent = '— Steve Jobs';
    }
  }
  // LocalStorage Management
  loadTasks() {
    const stored = localStorage.getItem('tasks');
    this.tasks = stored ? JSON.parse(stored) : [];
  }

  saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(this.tasks));
    this.updateStats();
    this.render();
  }

  // Event Listeners Setup
  setupEventListeners() {
    // Form submission
    document.getElementById('task-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.addTask();
    });

    // Search input
    document.getElementById('search-input').addEventListener('input', (e) => {
      this.searchTerm = e.target.value.toLowerCase();
      this.render();
    });

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
        e.target.classList.add('active');
        this.currentFilter = e.target.dataset.filter;
        this.render();
      });
    });

    // Sort select
    document.getElementById('sort-select').addEventListener('change', (e) => {
      this.currentSort = e.target.value;
      this.render();
    });
  }

  // Task Management Methods
  addTask() {
    const title = document.getElementById('task-title').value.trim();
    const description = document.getElementById('task-description').value.trim();
    const priority = document.getElementById('task-priority').value;
    const dueDate = document.getElementById('task-due-date').value;

    if (!title) {
      alert('Please enter a task title');
      return;
    }

    const task = {
      id: Date.now(),
      title,
      description,
      priority,
      dueDate,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.tasks.push(task);
    this.saveTasks();
    this.clearForm();
  }

  deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.tasks = this.tasks.filter((task) => task.id !== id);
      this.saveTasks();
    }
  }

  toggleTaskStatus(id) {
    const task = this.tasks.find((t) => t.id === id);
    if (task) {
      task.status = task.status === 'completed' ? 'pending' : 'completed';
      this.saveTasks();
    }
  }

  editTask(id) {
    const task = this.tasks.find((t) => t.id === id);
    if (task) {
      document.getElementById('task-title').value = task.title;
      document.getElementById('task-description').value = task.description;
      document.getElementById('task-priority').value = task.priority;
      document.getElementById('task-due-date').value = task.dueDate;

      this.deleteTask(id);
      document.getElementById('task-form').scrollIntoView({ behavior: 'smooth' });
      document.getElementById('task-title').focus();
    }
  }

  clearForm() {
    document.getElementById('task-form').reset();
  }

  // Filtering and Sorting
  getFilteredTasks() {
    let filtered = this.tasks.filter((task) => {
      // Search filter
      const matchesSearch =
        this.searchTerm === '' ||
        task.title.toLowerCase().includes(this.searchTerm) ||
        task.description.toLowerCase().includes(this.searchTerm);

      // Status and priority filters
      const matchesFilter =
        this.currentFilter === 'all' ||
        this.currentFilter === task.status ||
        this.currentFilter === task.priority.toLowerCase();

      return matchesSearch && matchesFilter;
    });

    // Sort tasks
    filtered = this.sortTasks(filtered);
    return filtered;
  }

  sortTasks(tasks) {
    const sorted = [...tasks];

    switch (this.currentSort) {
      case 'created-asc':
        sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'created-desc':
        sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'due-date':
        sorted.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        });
        break;
      case 'priority':
        const priorityOrder = { High: 0, Medium: 1, Low: 2 };
        sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        break;
      default:
        break;
    }

    return sorted;
  }

  // Statistics
  updateStats() {
    const total = this.tasks.length;
    const completed = this.tasks.filter((t) => t.status === 'completed').length;
    const pending = total - completed;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    document.getElementById('total-tasks').textContent = total;
    document.getElementById('completed-tasks').textContent = completed;
    document.getElementById('pending-tasks').textContent = pending;
    document.getElementById('completion-percentage').textContent = `${percentage}%`;
  }

  // Rendering
  render() {
    this.renderTaskList();
    this.updateStats();
  }

  renderTaskList() {
    const taskList = document.getElementById('task-list');
    const filteredTasks = this.getFilteredTasks();

    if (filteredTasks.length === 0) {
      taskList.innerHTML = '<p class="empty-state">No tasks found. Try adjusting your filters or add a new task!</p>';
      return;
    }

    taskList.innerHTML = filteredTasks
      .map((task) => this.createTaskCardHTML(task))
      .join('');

    // Attach event listeners to task cards
    taskList.querySelectorAll('.btn-delete').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.deleteTask(parseInt(btn.dataset.id));
      });
    });

    taskList.querySelectorAll('.btn-complete').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.toggleTaskStatus(parseInt(btn.dataset.id));
      });
    });

    taskList.querySelectorAll('.btn-edit').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.editTask(parseInt(btn.dataset.id));
      });
    });
  }

  createTaskCardHTML(task) {
    const statusText = task.status === 'completed' ? 'Mark as Pending' : 'Mark as Complete';
    const statusBtnClass = task.status === 'completed' ? 'btn-secondary' : 'btn-success';
    const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
    const createdDate = new Date(task.createdAt).toLocaleDateString();

    return `
      <div class="task-card ${task.status}">
        <div class="task-header">
          <h3 class="task-title">${this.escapeHtml(task.title)}</h3>
          <span class="task-priority priority-${task.priority.toLowerCase()}">
            ${task.priority}
          </span>
        </div>
        ${
          task.description
            ? `<p class="task-description">${this.escapeHtml(task.description)}</p>`
            : ''
        }
        <div class="task-meta">
          <div class="task-meta-item">
            <strong>Due Date:</strong> ${dueDate}
          </div>
          <div class="task-meta-item">
            <strong>Status:</strong> ${task.status.charAt(0).toUpperCase() + task.status.slice(1)}
          </div>
          <div class="task-meta-item">
            <strong>Created:</strong> ${createdDate}
          </div>
        </div>
        <div class="task-actions">
          <button class="btn btn-edit" data-id="${task.id}">Edit</button>
          <button class="btn ${statusBtnClass} btn-complete" data-id="${task.id}">
            ${statusText}
          </button>
          <button class="btn btn-danger btn-delete" data-id="${task.id}">Delete</button>
        </div>
      </div>
    `;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize the Task Manager
document.addEventListener('DOMContentLoaded', () => {
  window.taskManager = new TaskManager();
});