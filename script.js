/* =================================
   Forgeon - Main Application
   ================================= */

// ============================================
// Data Store & State Management
// ============================================
const AppState = {
    currentSection: 'dashboard',
    tasks: [],
    assets: [],
    milestones: [],
    notes: '',
    theme: 'light',
    classes: [],
    mechanics: [],
    story: { acts: [] },
    
    // Initialize from localStorage
    init() {
        const savedState = localStorage.getItem('forgeonState');
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                this.tasks = parsed.tasks || [];
                this.assets = parsed.assets || [];
                this.milestones = parsed.milestones || [];
                this.notes = parsed.notes || '';
                this.theme = parsed.theme || 'light';
                this.classes = parsed.classes || [];
                this.mechanics = parsed.mechanics || [];
                this.story = parsed.story || { acts: [] };
            } catch (e) {
                console.error('Error loading saved state:', e);
            }
        }
        this.applyTheme();
    },
    
    // Save to localStorage
    save() {
        const stateToSave = {
            tasks: this.tasks,
            assets: this.assets,
            milestones: this.milestones,
            notes: this.notes,
            theme: this.theme,
            classes: this.classes,
            mechanics: this.mechanics,
            story: this.story
        };
        localStorage.setItem('forgeonState', JSON.stringify(stateToSave));
    },
    
    // Theme management
    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        this.save();
    },
    
    applyTheme() {
        document.body.setAttribute('data-theme', this.theme);
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.src = this.theme === 'light' ? 'icons/theme/moon.svg' : 'icons/theme/sun.svg';
        }
    }
};

// ============================================
// Utility Functions
// ============================================
const Utils = {
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    },
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    parseMarkdown(text) {
        let html = this.escapeHtml(text);
        
        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        
        // Bold and Italic
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        
        // Lists
        html = html.replace(/^\- (.+)$/gim, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        
        // Paragraphs
        html = html.replace(/\n\n/g, '</p><p>');
        html = '<p>' + html + '</p>';
        
        return html;
    },
    
    // Generate icon HTML for SVG icons
    icon(path, size = 'medium', altText = '') {
        const sizes = {
            small: 16,
            medium: 20,
            large: 24,
            xlarge: 32
        };
        const dimension = sizes[size] || 20;
        return `<img src="icons/${path}.svg" alt="${altText}" class="icon ${size}" width="${dimension}" height="${dimension}">`;
    }
};

// ============================================
// File Storage (IndexedDB)
// ============================================
const FileStorage = {
    dbName: 'ForgeonDB',
    dbVersion: 1,
    db: null,
    
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB initialized successfully');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object store for files if it doesn't exist
                if (!db.objectStoreNames.contains('files')) {
                    const objectStore = db.createObjectStore('files', { keyPath: 'id' });
                    objectStore.createIndex('assetId', 'assetId', { unique: false });
                    console.log('Created files object store');
                }
            };
        });
    },
    
    async saveFile(assetId, file) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['files'], 'readwrite');
            const objectStore = transaction.objectStore('files');
            
            const fileData = {
                id: assetId,
                assetId: assetId,
                file: file,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                uploadDate: new Date().toISOString()
            };
            
            const request = objectStore.put(fileData);
            
            request.onsuccess = () => resolve(fileData);
            request.onerror = () => reject(request.error);
        });
    },
    
    async getFile(assetId) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['files'], 'readonly');
            const objectStore = transaction.objectStore('files');
            const request = objectStore.get(assetId);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    
    async deleteFile(assetId) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['files'], 'readwrite');
            const objectStore = transaction.objectStore('files');
            const request = objectStore.delete(assetId);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },
    
    async createThumbnail(file) {
        if (!file.type.startsWith('image/')) return null;
        
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Create thumbnail (max 200x200)
                    const maxSize = 200;
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > height) {
                        if (width > maxSize) {
                            height *= maxSize / width;
                            width = maxSize;
                        }
                    } else {
                        if (height > maxSize) {
                            width *= maxSize / height;
                            height = maxSize;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    },
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
};

// ============================================
// Navigation System
// ============================================
const Navigation = {
    init() {
        const navButtons = document.querySelectorAll('.nav-item');
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.currentTarget.getAttribute('data-section');
                this.switchSection(section);
            });
        });
    },
    
    switchSection(sectionName) {
        // Update nav buttons
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.remove('active');
            btn.removeAttribute('aria-current');
        });
        
        const activeBtn = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.setAttribute('aria-current', 'page');
        }
        
        // Update sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        const activeSection = document.getElementById(sectionName);
        if (activeSection) {
            activeSection.classList.add('active');
        }
        
        AppState.currentSection = sectionName;
        
        // Refresh section data
        if (sectionName === 'dashboard') Dashboard.refresh();
    }
};

// ============================================
// Modal System
// ============================================
const Modal = {
    overlay: null,
    body: null,
    
    init() {
        this.overlay = document.getElementById('modalOverlay');
        this.body = document.getElementById('modalBody');
        
        // Close button
        document.getElementById('modalClose').addEventListener('click', () => this.close());
        
        // Click outside to close
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });
        
        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
                this.close();
            }
        });
    },
    
    open(content) {
        this.body.innerHTML = content;
        this.overlay.classList.add('active');
        this.overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    },
    
    close() {
        this.overlay.classList.remove('active');
        this.overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        this.body.innerHTML = '';
    }
};

// ============================================
// Dashboard
// ============================================
const Dashboard = {
    refresh() {
        // Update statistics
        const activeTasks = AppState.tasks.filter(t => !t.completed).length;
        const overdueTasks = AppState.tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length;
        document.getElementById('activeTasks').textContent = activeTasks;
        if (overdueTasks > 0) {
            document.getElementById('activeTasks').innerHTML = `${activeTasks} <span style="color: var(--danger-color); font-size: 0.8em;">(${overdueTasks} overdue)</span>`;
        }
        
        document.getElementById('totalAssets').textContent = AppState.assets.length;
        document.getElementById('totalMilestones').textContent = AppState.milestones.length;
        
        // Calculate overall progress
        const totalTasks = AppState.tasks.length;
        const completedTasks = AppState.tasks.filter(t => t.completed).length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        document.getElementById('overallProgress').textContent = `${progress}%`;
        
        // Update productivity stats
        this.updateProductivityStats();
        
        // Recent tasks
        this.updateRecentTasks();
        
        // Upcoming milestones
        this.updateUpcomingMilestones();
    },
    
    updateProductivityStats() {
        const statsContainer = document.getElementById('productivityStats');
        if (!statsContainer) return;
        
        // Calculate completion rate (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentTasks = AppState.tasks.filter(t => new Date(t.createdAt) >= sevenDaysAgo);
        const recentCompleted = recentTasks.filter(t => t.completed).length;
        const weeklyCompletionRate = recentTasks.length > 0 ? Math.round((recentCompleted / recentTasks.length) * 100) : 0;
        
        // Task breakdown by priority
        const highPriority = AppState.tasks.filter(t => t.priority === 'high' && !t.completed).length;
        const mediumPriority = AppState.tasks.filter(t => t.priority === 'medium' && !t.completed).length;
        const lowPriority = AppState.tasks.filter(t => t.priority === 'low' && !t.completed).length;
        
        // Task breakdown by category
        const categories = {};
        AppState.tasks.filter(t => !t.completed).forEach(task => {
            const cat = task.category || 'other';
            categories[cat] = (categories[cat] || 0) + 1;
        });
        
        statsContainer.innerHTML = `
            <h3>Productivity Overview</h3>
            <div class="stat-row">
                <span>Weekly Completion Rate:</span>
                <strong>${weeklyCompletionRate}%</strong>
            </div>
            <div class="stat-row">
                <span>Tasks Created (7 days):</span>
                <strong>${recentTasks.length}</strong>
            </div>
            <div class="stat-row">
                <span>High Priority Tasks:</span>
                <strong style="color: var(--danger-color);">${highPriority}</strong>
            </div>
            ${Object.keys(categories).length > 0 ? `
                <div class="category-breakdown">
                    <strong>By Category:</strong>
                    ${Object.entries(categories).map(([cat, count]) => 
                        `<div class="category-item"><span>${cat}:</span> <span>${count}</span></div>`
                    ).join('')}
                </div>
            ` : ''}
        `;
    },
    
    updateRecentTasks() {
        const list = document.getElementById('recentTasksList');
        const recentTasks = AppState.tasks
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
        
        list.innerHTML = '';
        if (recentTasks.length === 0) {
            list.innerHTML = '<li style="opacity: 0.6;">No tasks yet. Create your first task!</li>';
            return;
        }
        
        recentTasks.forEach(task => {
            const li = document.createElement('li');
            const statusIcon = task.completed ? Utils.icon('actions/success', 'small') : (task.dueDate && new Date(task.dueDate) < new Date() ? Utils.icon('actions/warning', 'small') : Utils.icon('misc/hourglass', 'small'));
            li.innerHTML = `${statusIcon} ${Utils.escapeHtml(task.title)}`;
            if (task.completed) {
                li.style.opacity = '0.6';
            }
            li.style.cursor = 'pointer';
            li.onclick = () => {
                Navigation.switchSection('tasks');
                TaskManager.render();
            };
            list.appendChild(li);
        });
    },
    
    updateUpcomingMilestones() {
        const list = document.getElementById('upcomingMilestonesList');
        const upcoming = AppState.milestones
            .filter(m => m.progress < 100)
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .slice(0, 5);
        
        list.innerHTML = '';
        if (upcoming.length === 0) {
            list.innerHTML = '<li style="opacity: 0.6;">No upcoming milestones</li>';
            return;
        }
        
        upcoming.forEach(milestone => {
            const li = document.createElement('li');
            const daysUntil = Math.ceil((new Date(milestone.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
            const daysText = daysUntil > 0 ? `${daysUntil} days` : `${Math.abs(daysUntil)} days overdue`;
            li.innerHTML = `${Utils.icon('navigation/milestones', 'small')} ${Utils.escapeHtml(milestone.title)} <span style="opacity: 0.7; font-size: 0.9em;">(${milestone.progress}% - ${daysText})</span>`;
            li.style.cursor = 'pointer';
            li.onclick = () => {
                Navigation.switchSection('milestones');
                MilestonePlanner.render();
            };
            list.appendChild(li);
        });
    }
};

// ============================================
// Task Manager
// ============================================
const TaskManager = {
    currentFilter: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    
    init() {
        document.getElementById('addTaskBtn').addEventListener('click', () => this.openAddModal());
        
        // Filter buttons
        document.querySelectorAll('#tasks .filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('#tasks .filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.getAttribute('data-filter');
                this.render();
            });
        });
        
        // Sort dropdown
        const sortDropdown = document.getElementById('taskSortBy');
        if (sortDropdown) {
            sortDropdown.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.render();
            });
        }
        
        this.render();
    },
    
    openAddModal(taskToEdit = null) {
        const isEdit = taskToEdit !== null;
        const formHtml = `
            <form class="modal-form" id="taskForm">
                <h3>${isEdit ? 'Edit Task' : 'Add New Task'}</h3>
                
                <div class="form-group">
                    <label for="taskTitle">Task Title *</label>
                    <input type="text" id="taskTitle" required value="${isEdit ? Utils.escapeHtml(taskToEdit.title) : ''}" placeholder="Enter task title">
                </div>
                
                <div class="form-group">
                    <label for="taskDescription">Description</label>
                    <textarea id="taskDescription" rows="3" placeholder="Add details about the task">${isEdit ? Utils.escapeHtml(taskToEdit.description) : ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label for="taskPriority">Priority</label>
                    <select id="taskPriority">
                        <option value="low" ${isEdit && taskToEdit.priority === 'low' ? 'selected' : ''}>Low</option>
                        <option value="medium" ${isEdit && taskToEdit.priority === 'medium' ? 'selected' : 'selected'}>Medium</option>
                        <option value="high" ${isEdit && taskToEdit.priority === 'high' ? 'selected' : ''}>High</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="taskCategory">Category</label>
                    <select id="taskCategory">
                        <option value="design" ${isEdit && taskToEdit.category === 'design' ? 'selected' : ''}>Design</option>
                        <option value="development" ${isEdit && taskToEdit.category === 'development' ? 'selected' : 'selected'}>Development</option>
                        <option value="testing" ${isEdit && taskToEdit.category === 'testing' ? 'selected' : ''}>Testing</option>
                        <option value="documentation" ${isEdit && taskToEdit.category === 'documentation' ? 'selected' : ''}>Documentation</option>
                        <option value="other" ${isEdit && taskToEdit.category === 'other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="taskDueDate">Due Date</label>
                    <input type="date" id="taskDueDate" value="${isEdit && taskToEdit.dueDate ? taskToEdit.dueDate : ''}">
                </div>
                
                <div class="form-group">
                    <label for="taskTags">Tags (comma-separated)</label>
                    <input type="text" id="taskTags" placeholder="e.g., gameplay, ui, multiplayer" value="${isEdit && taskToEdit.tags ? taskToEdit.tags.join(', ') : ''}">
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" id="cancelBtn">Cancel</button>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Add'} Task</button>
                </div>
            </form>
        `;
        
        Modal.open(formHtml);
        
        // Form submission
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const taskData = {
                id: isEdit ? taskToEdit.id : Utils.generateId(),
                title: document.getElementById('taskTitle').value.trim(),
                description: document.getElementById('taskDescription').value.trim(),
                priority: document.getElementById('taskPriority').value,
                category: document.getElementById('taskCategory').value,
                dueDate: document.getElementById('taskDueDate').value,
                tags: document.getElementById('taskTags').value.split(',').map(t => t.trim()).filter(t => t),
                completed: isEdit ? taskToEdit.completed : false,
                createdAt: isEdit ? taskToEdit.createdAt : new Date().toISOString()
            };
            
            if (isEdit) {
                const index = AppState.tasks.findIndex(t => t.id === taskToEdit.id);
                AppState.tasks[index] = taskData;
            } else {
                AppState.tasks.push(taskData);
            }
            
            AppState.save();
            this.render();
            Dashboard.refresh();
            Modal.close();
        });
        
        // Cancel button
        document.getElementById('cancelBtn').addEventListener('click', () => Modal.close());
    },
    
    toggleComplete(taskId) {
        const task = AppState.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            AppState.save();
            this.render();
            Dashboard.refresh();
        }
    },
    
    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            AppState.tasks = AppState.tasks.filter(t => t.id !== taskId);
            AppState.save();
            this.render();
            Dashboard.refresh();
        }
    },
    
    render() {
        const container = document.getElementById('tasksList');
        let tasksToShow = [...AppState.tasks];
        
        // Apply filter
        if (this.currentFilter === 'active') {
            tasksToShow = tasksToShow.filter(t => !t.completed);
        } else if (this.currentFilter === 'completed') {
            tasksToShow = tasksToShow.filter(t => t.completed);
        }
        
        // Apply sorting
        tasksToShow.sort((a, b) => {
            let comparison = 0;
            if (this.sortBy === 'priority') {
                const priorities = { high: 3, medium: 2, low: 1 };
                comparison = (priorities[b.priority] || 0) - (priorities[a.priority] || 0);
            } else if (this.sortBy === 'dueDate') {
                const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
                const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
                comparison = dateA - dateB;
            } else if (this.sortBy === 'title') {
                comparison = a.title.localeCompare(b.title);
            } else {
                comparison = new Date(b.createdAt) - new Date(a.createdAt);
            }
            return this.sortOrder === 'asc' ? -comparison : comparison;
        });
        
        if (tasksToShow.length === 0) {
            container.innerHTML = '';
            return;
        }
        
        container.innerHTML = tasksToShow.map(task => {
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
            return `
            <div class="item-card ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}">
                <input type="checkbox" 
                       class="item-checkbox" 
                       ${task.completed ? 'checked' : ''}
                       onchange="TaskManager.toggleComplete('${task.id}')"
                       aria-label="Mark task as ${task.completed ? 'incomplete' : 'complete'}">
                
                <div class="item-content">
                    <div class="item-title">${Utils.escapeHtml(task.title)}</div>
                    ${task.description ? `<div class="item-description">${Utils.escapeHtml(task.description)}</div>` : ''}
                    <div class="item-meta">
                        <span class="item-tag priority-${task.priority}">${task.priority} priority</span>
                        ${task.category ? `<span class="item-tag">${task.category}</span>` : ''}
                        ${task.dueDate ? `<span class="item-tag ${isOverdue ? 'overdue-tag' : ''}">${isOverdue ? Utils.icon('actions/warning', 'small') + ' ' : Utils.icon('misc/calendar', 'small') + ' '}${Utils.formatDate(task.dueDate)}</span>` : ''}
                        ${task.tags && task.tags.length > 0 ? task.tags.map(tag => `<span class="item-tag tag-badge">#${tag}</span>`).join('') : ''}
                    </div>
                </div>
                
                <div class="item-actions">
                    <button class="btn btn-small btn-secondary" onclick="TaskManager.openAddModal(AppState.tasks.find(t => t.id === '${task.id}'))">Edit</button>
                    <button class="btn btn-small btn-danger" onclick="TaskManager.deleteTask('${task.id}')">Delete</button>
                </div>
            </div>
        `}).join('');
    }
};

// ============================================
// Asset Tracker
// ============================================
const AssetTracker = {
    currentFilter: 'all',
    
    init() {
        document.getElementById('addAssetBtn').addEventListener('click', () => this.openAddModal());
        
        // Filter buttons
        document.querySelectorAll('#assets .filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('#assets .filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.getAttribute('data-filter');
                this.render();
            });
        });
        
        this.render();
    },
    
    openAddModal(assetToEdit = null) {
        const isEdit = assetToEdit !== null;
        const formHtml = `
            <form class="modal-form" id="assetForm">
                <h3>${isEdit ? 'Edit Asset' : 'Add New Asset'}</h3>
                
                <div class="form-group">
                    <label for="assetName">Asset Name *</label>
                    <input type="text" id="assetName" required value="${isEdit ? Utils.escapeHtml(assetToEdit.name) : ''}" placeholder="Enter asset name">
                </div>
                
                <div class="form-group">
                    <label for="assetType">Type</label>
                    <select id="assetType">
                        <option value="image" ${isEdit && assetToEdit.type === 'image' ? 'selected' : ''}>Image</option>
                        <option value="audio" ${isEdit && assetToEdit.type === 'audio' ? 'selected' : ''}>Audio</option>
                        <option value="video" ${isEdit && assetToEdit.type === 'video' ? 'selected' : ''}>Video</option>
                        <option value="model" ${isEdit && assetToEdit.type === 'model' ? 'selected' : ''}>3D Model</option>
                        <option value="document" ${isEdit && assetToEdit.type === 'document' ? 'selected' : ''}>Document</option>
                        <option value="script" ${isEdit && assetToEdit.type === 'script' ? 'selected' : ''}>Script</option>
                        <option value="other" ${isEdit && assetToEdit.type === 'other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="assetStatus">Status</label>
                    <select id="assetStatus">
                        <option value="pending" ${isEdit && assetToEdit.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="in-progress" ${isEdit && assetToEdit.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                        <option value="completed" ${isEdit && assetToEdit.status === 'completed' ? 'selected' : ''}>Completed</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="assetFile">Upload File</label>
                    <input type="file" id="assetFile" accept="image/*,audio/*,video/*,.pdf,.txt,.glb,.gltf,.fbx">
                    <small class="form-hint">Max file size: 50MB. Supported: Images, Audio, Video, 3D Models, Documents</small>
                    ${isEdit && assetToEdit.hasFile ? `<div class="current-file">Current file: ${assetToEdit.fileName || 'Uploaded'} (${FileStorage.formatFileSize(assetToEdit.fileSize || 0)})</div>` : ''}
                </div>
                
                <div class="form-group">
                    <label for="assetDescription">Description</label>
                    <textarea id="assetDescription" rows="3" placeholder="Add notes or description">${isEdit && assetToEdit.description ? Utils.escapeHtml(assetToEdit.description) : ''}</textarea>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" id="cancelAssetBtn">Cancel</button>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Add'} Asset</button>
                </div>
            </form>
        `;
        
        Modal.open(formHtml);
        
        document.getElementById('assetForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const fileInput = document.getElementById('assetFile');
            const file = fileInput.files[0];
            
            // Validate file size (50MB limit)
            if (file && file.size > 50 * 1024 * 1024) {
                alert('File size too large! Maximum 50MB allowed.');
                return;
            }
            
            const assetData = {
                id: isEdit ? assetToEdit.id : Utils.generateId(),
                name: document.getElementById('assetName').value.trim(),
                type: document.getElementById('assetType').value,
                status: document.getElementById('assetStatus').value,
                description: document.getElementById('assetDescription').value.trim(),
                hasFile: file ? true : (isEdit && assetToEdit.hasFile),
                fileName: file ? file.name : (isEdit ? assetToEdit.fileName : null),
                fileType: file ? file.type : (isEdit ? assetToEdit.fileType : null),
                fileSize: file ? file.size : (isEdit ? assetToEdit.fileSize : null),
                thumbnail: isEdit ? assetToEdit.thumbnail : null,
                createdAt: isEdit ? assetToEdit.createdAt : new Date().toISOString()
            };
            
            try {
                // Save file to IndexedDB if uploaded
                if (file) {
                    await FileStorage.saveFile(assetData.id, file);
                    
                    // Generate thumbnail for images
                    if (file.type.startsWith('image/')) {
                        assetData.thumbnail = await FileStorage.createThumbnail(file);
                    }
                }
                
                if (isEdit) {
                    const index = AppState.assets.findIndex(a => a.id === assetToEdit.id);
                    AppState.assets[index] = assetData;
                } else {
                    AppState.assets.push(assetData);
                }
                
                AppState.save();
                this.render();
                Dashboard.refresh();
                Modal.close();
                
                NotesManager.showNotification(isEdit ? 'Asset updated!' : 'Asset added!');
            } catch (error) {
                console.error('Error saving asset:', error);
                alert('Error saving file. Please try again.');
            }
        });
        
        document.getElementById('cancelAssetBtn').addEventListener('click', () => Modal.close());
    },
    
    async deleteAsset(assetId) {
        if (confirm('Are you sure you want to delete this asset? This will also delete any uploaded files.')) {
            // Delete file from IndexedDB
            try {
                await FileStorage.deleteFile(assetId);
            } catch (error) {
                console.error('Error deleting file:', error);
            }
            
            // Delete asset from state
            AppState.assets = AppState.assets.filter(a => a.id !== assetId);
            AppState.save();
            this.render();
            Dashboard.refresh();
        }
    },
    
    render() {
        const container = document.getElementById('assetsList');
        let assetsToShow = AppState.assets;
        
        // Apply filter
        if (this.currentFilter !== 'all') {
            assetsToShow = assetsToShow.filter(a => a.type === this.currentFilter);
        }
        
        if (assetsToShow.length === 0) {
            container.innerHTML = '<div class="empty-state">No assets yet. Add your first asset!</div>';
            return;
        }
        
        const typeIcons = {
            image: Utils.icon('asset/sprite', 'large'),
            audio: Utils.icon('asset/audio', 'large'),
            video: Utils.icon('asset/video', 'large'),
            model: Utils.icon('asset/model', 'large'),
            document: Utils.icon('asset/file', 'large'),
            script: Utils.icon('asset/file', 'large'),
            other: Utils.icon('asset/file', 'large')
        };
        
        container.innerHTML = assetsToShow.map(asset => `
            <div class="item-card asset-card">
                ${asset.thumbnail ? `
                    <div class="asset-thumbnail" onclick="AssetTracker.previewAsset('${asset.id}')">
                        <img src="${asset.thumbnail}" alt="${Utils.escapeHtml(asset.name)}">
                    </div>
                ` : `
                    <div class="asset-icon" onclick="${asset.hasFile ? `AssetTracker.previewAsset('${asset.id}')` : ''}">${typeIcons[asset.type] || '📦'}</div>
                `}
                
                <div class="item-content">
                    <div class="item-title">${Utils.escapeHtml(asset.name)}</div>
                    ${asset.description ? `<div class="item-description">${Utils.escapeHtml(asset.description)}</div>` : ''}
                    <div class="item-meta">
                        <span class="item-tag status-${asset.status}">${asset.status}</span>
                        <span class="item-tag">${asset.type}</span>
                        ${asset.fileSize ? `<span class="item-tag">${Utils.icon('asset/file', 'small')} ${FileStorage.formatFileSize(asset.fileSize)}</span>` : ''}
                    </div>
                </div>
                
                <div class="item-actions">
                    ${asset.hasFile ? `<button class="btn btn-small btn-success" onclick="AssetTracker.previewAsset('${asset.id}')" title="Preview/Play">${Utils.icon('status/review', 'small')} View</button>` : ''}
                    ${asset.hasFile ? `<button class="btn btn-small btn-secondary" onclick="AssetTracker.downloadAsset('${asset.id}')" title="Download">${Utils.icon('actions/download', 'small')}</button>` : ''}
                    <button class="btn btn-small btn-secondary" onclick="AssetTracker.openAddModal(AppState.assets.find(a => a.id === '${asset.id}'))">Edit</button>
                    <button class="btn btn-small btn-danger" onclick="AssetTracker.deleteAsset('${asset.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    },
    
    async previewAsset(assetId) {
        const asset = AppState.assets.find(a => a.id === assetId);
        if (!asset || !asset.hasFile) return;
        
        try {
            const fileData = await FileStorage.getFile(assetId);
            if (!fileData) {
                alert('File not found');
                return;
            }
            
            const file = fileData.file;
            const fileURL = URL.createObjectURL(file);
            
            let previewHtml = '';
            
            // Generate preview based on file type
            if (file.type.startsWith('image/')) {
                previewHtml = `
                    <div class="preview-container">
                        <h3>${Utils.escapeHtml(asset.name)}</h3>
                        <div class="image-preview">
                            <img src="${fileURL}" alt="${Utils.escapeHtml(asset.name)}" style="max-width: 100%; max-height: 70vh;">
                        </div>
                        <div class="preview-info">
                            <p><strong>Type:</strong> ${file.type}</p>
                            <p><strong>Size:</strong> ${FileStorage.formatFileSize(file.size)}</p>
                        </div>
                    </div>
                `;
            } else if (file.type.startsWith('audio/')) {
                previewHtml = `
                    <div class="preview-container">
                        <h3>🎵 ${Utils.escapeHtml(asset.name)}</h3>
                        <div class="audio-preview">
                            <audio controls autoplay style="width: 100%; margin: 2rem 0;">
                                <source src="${fileURL}" type="${file.type}">
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                        <div class="preview-info">
                            <p><strong>Type:</strong> ${file.type}</p>
                            <p><strong>Size:</strong> ${FileStorage.formatFileSize(file.size)}</p>
                            <p><strong>Status:</strong> ${asset.status}</p>
                        </div>
                    </div>
                `;
            } else if (file.type.startsWith('video/')) {
                previewHtml = `
                    <div class="preview-container">
                        <h3>🎬 ${Utils.escapeHtml(asset.name)}</h3>
                        <div class="video-preview">
                            <video controls style="max-width: 100%; max-height: 60vh;">
                                <source src="${fileURL}" type="${file.type}">
                                Your browser does not support the video element.
                            </video>
                        </div>
                        <div class="preview-info">
                            <p><strong>Type:</strong> ${file.type}</p>
                            <p><strong>Size:</strong> ${FileStorage.formatFileSize(file.size)}</p>
                        </div>
                    </div>
                `;
            } else if (file.type === 'application/pdf') {
                previewHtml = `
                    <div class="preview-container">
                        <h3>📄 ${Utils.escapeHtml(asset.name)}</h3>
                        <div class="pdf-preview">
                            <iframe src="${fileURL}" style="width: 100%; height: 70vh; border: none;"></iframe>
                        </div>
                        <div class="preview-info">
                            <p><strong>Size:</strong> ${FileStorage.formatFileSize(file.size)}</p>
                        </div>
                    </div>
                `;
            } else if (this.isTextDocument(file.type, asset.fileName)) {
                // Text-based documents and scripts
                const reader = new FileReader();
                await new Promise((resolve) => {
                    reader.onload = async (e) => {
                        const content = e.target.result;
                        const extension = asset.fileName.split('.').pop().toLowerCase();
                        const language = this.getLanguageForFile(extension);
                        
                        previewHtml = `
                            <div class="preview-container">
                                <h3>📄 ${Utils.escapeHtml(asset.name)}</h3>
                                <div class="document-preview-controls">
                                    <button class="zoom-btn" onclick="AssetTracker.zoomDocument(-0.1)" title="Zoom Out">
                                        <img src="icons/actions/zoom-out.svg" alt="Zoom Out" width="20" height="20">
                                    </button>
                                    <span class="zoom-level">100%</span>
                                    <button class="zoom-btn" onclick="AssetTracker.zoomDocument(0.1)" title="Zoom In">
                                        <img src="icons/actions/zoom-in.svg" alt="Zoom In" width="20" height="20">
                                    </button>
                                    <button class="zoom-btn" onclick="AssetTracker.resetZoom()" title="Reset Zoom">
                                        <img src="icons/actions/reset.svg" alt="Reset" width="20" height="20">
                                    </button>
                                </div>
                                <div class="document-preview" id="documentPreview">
                                    <pre style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 8px; overflow: auto; max-height: 60vh; font-family: 'Courier New', monospace; line-height: 1.5; transition: font-size 0.2s ease;" id="documentPreviewContent"><code class="language-${language}">${Utils.escapeHtml(content)}</code></pre>
                                </div>
                                <div class="preview-info">
                                    <p><strong>Type:</strong> ${extension.toUpperCase()} ${language ? `(${language})` : ''}</p>
                                    <p><strong>Size:</strong> ${FileStorage.formatFileSize(file.size)}</p>
                                    <p><strong>Lines:</strong> ${content.split('\n').length}</p>
                                </div>
                            </div>
                        `;
                        resolve();
                    };
                    reader.readAsText(file);
                });
            } else {
                previewHtml = `
                    <div class="preview-container">
                        <h3>📦 ${Utils.escapeHtml(asset.name)}</h3>
                        <div class="file-info">
                            <p>Preview not available for this file type.</p>
                            <p><strong>Type:</strong> ${file.type || 'Unknown'}</p>
                            <p><strong>Size:</strong> ${FileStorage.formatFileSize(file.size)}</p>
                            <button class="btn btn-primary" onclick="AssetTracker.downloadAsset('${assetId}')">${Utils.icon('actions/download', 'small')} Download File</button>
                        </div>
                    </div>
                `;
            }
            
            Modal.open(previewHtml);
            
            // Cleanup URL when modal closes
            const originalClose = Modal.close;
            Modal.close = function() {
                URL.revokeObjectURL(fileURL);
                Modal.close = originalClose;
                originalClose.call(Modal);
            };
            
        } catch (error) {
            console.error('Error previewing asset:', error);
            alert('Error loading file preview');
        }
    },
    
    isTextDocument(mimeType, fileName) {
        if (!fileName) return false;
        const extension = fileName.split('.').pop().toLowerCase();
        const textExtensions = [
            'txt', 'md', 'json', 'xml', 'csv', 'log',
            'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'sass',
            'c', 'cpp', 'h', 'hpp', 'cs', 'java', 'py', 'rb', 'php',
            'go', 'rs', 'swift', 'kt', 'sh', 'bat', 'ps1',
            'sql', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf'
        ];
        return textExtensions.includes(extension) || 
               mimeType?.startsWith('text/') || 
               mimeType === 'application/json' ||
               mimeType === 'application/xml';
    },
    
    getLanguageForFile(extension) {
        const languageMap = {
            'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript',
            'html': 'html', 'htm': 'html', 'xml': 'xml',
            'css': 'css', 'scss': 'scss', 'sass': 'sass',
            'json': 'json', 'md': 'markdown',
            'py': 'python', 'rb': 'ruby', 'php': 'php',
            'java': 'java', 'c': 'c', 'cpp': 'cpp', 'cs': 'csharp',
            'go': 'go', 'rs': 'rust', 'swift': 'swift', 'kt': 'kotlin',
            'sh': 'bash', 'bat': 'batch', 'ps1': 'powershell',
            'sql': 'sql', 'yaml': 'yaml', 'yml': 'yaml'
        };
        return languageMap[extension.toLowerCase()] || 'plaintext';
    },
    
    zoomDocument(delta) {
        const preview = document.querySelector('#documentPreviewContent');
        const zoomLevel = document.querySelector('.zoom-level');
        if (!preview || !zoomLevel) return;
        
        // Get current font size or default to 0.9rem (14.4px)
        const currentFontSize = parseFloat(window.getComputedStyle(preview).fontSize);
        const baseFontSize = 14.4; // 0.9rem at 16px base
        
        // Calculate current scale
        const currentScale = currentFontSize / baseFontSize;
        
        // Calculate new scale (min 0.5, max 3.0)
        const newScale = Math.max(0.5, Math.min(3.0, currentScale + delta));
        
        // Apply new font size
        preview.style.fontSize = `${baseFontSize * newScale}px`;
        zoomLevel.textContent = `${Math.round(newScale * 100)}%`;
    },
    
    resetZoom() {
        const preview = document.querySelector('#documentPreviewContent');
        const zoomLevel = document.querySelector('.zoom-level');
        if (!preview || !zoomLevel) return;
        
        preview.style.fontSize = '0.9rem';
        zoomLevel.textContent = '100%';
    },
    
    async downloadAsset(assetId) {
        const asset = AppState.assets.find(a => a.id === assetId);
        if (!asset || !asset.hasFile) return;
        
        try {
            const fileData = await FileStorage.getFile(assetId);
            if (!fileData) {
                alert('File not found');
                return;
            }
            
            const file = fileData.file;
            const url = URL.createObjectURL(file);
            const a = document.createElement('a');
            a.href = url;
            a.download = asset.fileName || asset.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            NotesManager.showNotification('Download started!');
        } catch (error) {
            console.error('Error downloading asset:', error);
            alert('Error downloading file');
        }
    }
};

// ============================================
// Classes Manager
// ============================================
const ClassesManager = {
    init() {
        document.getElementById('addClassBtn').addEventListener('click', () => this.openAddModal());
        this.render();
    },
    
    openAddModal(classToEdit = null) {
        const isEdit = classToEdit !== null;
        
        // Get list of potential parent classes (exclude current class if editing)
        const parentOptions = AppState.classes
            .filter(c => !isEdit || c.id !== classToEdit.id)
            .map(c => `<option value="${c.id}">${Utils.escapeHtml(c.name)}</option>`)
            .join('');
        
        const formHtml = `
            <form class="modal-form" id="classForm">
                <h3>${isEdit ? 'Edit Class' : 'Add New Class'}</h3>
                
                <div class="form-group">
                    <label for="className">Class Name *</label>
                    <input type="text" id="className" required value="${isEdit ? Utils.escapeHtml(classToEdit.name) : ''}" placeholder="e.g., Character, Weapon, Enemy">
                </div>
                
                <div class="form-group">
                    <label for="classParent">Parent Class (optional)</label>
                    <select id="classParent">
                        <option value="">None (Root Class)</option>
                        ${parentOptions}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="classProperties">Properties (one per line)</label>
                    <textarea id="classProperties" rows="5" placeholder="health: 100&#10;speed: 5.0&#10;name: string">${isEdit && classToEdit.properties ? classToEdit.properties.join('\n') : ''}</textarea>
                    <small class="form-hint">Format: propertyName: value or propertyName: type</small>
                </div>
                
                <div class="form-group">
                    <label for="classDescription">Description</label>
                    <textarea id="classDescription" rows="3" placeholder="Describe this class...">${isEdit && classToEdit.description ? Utils.escapeHtml(classToEdit.description) : ''}</textarea>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" id="cancelClassBtn">Cancel</button>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Add'} Class</button>
                </div>
            </form>
        `;
        
        Modal.open(formHtml);
        
        // Set parent if editing
        if (isEdit && classToEdit.parentId) {
            document.getElementById('classParent').value = classToEdit.parentId;
        }
        
        document.getElementById('classForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const propertiesText = document.getElementById('classProperties').value.trim();
            const properties = propertiesText ? propertiesText.split('\n').map(p => p.trim()).filter(p => p) : [];
            
            const classData = {
                id: isEdit ? classToEdit.id : Utils.generateId(),
                name: document.getElementById('className').value.trim(),
                parentId: document.getElementById('classParent').value || null,
                properties: properties,
                description: document.getElementById('classDescription').value.trim(),
                createdAt: isEdit ? classToEdit.createdAt : new Date().toISOString()
            };
            
            if (isEdit) {
                const index = AppState.classes.findIndex(c => c.id === classToEdit.id);
                AppState.classes[index] = classData;
            } else {
                AppState.classes.push(classData);
            }
            
            AppState.save();
            this.render();
            Modal.close();
        });
        
        document.getElementById('cancelClassBtn').addEventListener('click', () => Modal.close());
    },
    
    deleteClass(classId) {
        const classToDelete = AppState.classes.find(c => c.id === classId);
        const children = AppState.classes.filter(c => c.parentId === classId);
        
        let confirmMsg = `Are you sure you want to delete the class "${classToDelete.name}"?`;
        if (children.length > 0) {
            confirmMsg += `\n\nThis class has ${children.length} child class(es). They will become root classes.`;
        }
        
        if (confirm(confirmMsg)) {
            // Remove parent reference from children
            children.forEach(child => {
                child.parentId = null;
            });
            
            AppState.classes = AppState.classes.filter(c => c.id !== classId);
            AppState.save();
            this.render();
        }
    },
    
    render() {
        const container = document.getElementById('classesList');
        
        if (AppState.classes.length === 0) {
            container.innerHTML = '<div class="empty-state">No classes yet. Create your first class!</div>';
            return;
        }
        
        // Build hierarchy
        const rootClasses = AppState.classes.filter(c => !c.parentId);
        
        const renderClassHierarchy = (classObj, depth = 0) => {
            const children = AppState.classes.filter(c => c.parentId === classObj.id);
            const indent = depth * 2;
            
            let html = `
                <div class="class-item" style="margin-left: ${indent}rem;">
                    <div class="class-header">
                        <div class="class-info">
                            <div class="class-name">
                                ${depth > 0 ? '<span class="inheritance-arrow">↳</span>' : ''}
                                <strong>${Utils.escapeHtml(classObj.name)}</strong>
                                ${classObj.parentId ? '<span class="class-badge">Child Class</span>' : '<span class="class-badge root">Root Class</span>'}
                            </div>
                            ${classObj.description ? `<div class="class-description">${Utils.escapeHtml(classObj.description)}</div>` : ''}
                        </div>
                        <div class="class-actions">
                            <button class="btn btn-small btn-secondary" onclick="ClassesManager.openAddModal(AppState.classes.find(c => c.id === '${classObj.id}'))">Edit</button>
                            <button class="btn btn-small btn-danger" onclick="ClassesManager.deleteClass('${classObj.id}')">Delete</button>
                        </div>
                    </div>
                    ${classObj.properties.length > 0 ? `
                        <div class="class-properties">
                            <strong>Properties:</strong>
                            <ul class="properties-list">
                                ${classObj.properties.map(prop => `<li><code>${Utils.escapeHtml(prop)}</code></li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            `;
            
            // Recursively render children
            if (children.length > 0) {
                children.forEach(child => {
                    html += renderClassHierarchy(child, depth + 1);
                });
            }
            
            return html;
        };
        
        let html = '<div class="classes-hierarchy">';
        rootClasses.forEach(rootClass => {
            html += renderClassHierarchy(rootClass);
        });
        html += '</div>';
        
        container.innerHTML = html;
    }
};

// ============================================
// Game Mechanics Manager
// ============================================
const MechanicsManager = {
    init() {
        document.getElementById('addMechanicBtn').addEventListener('click', () => this.openAddModal());
        this.render();
    },
    
    openAddModal(mechanicToEdit = null) {
        const isEdit = mechanicToEdit !== null;
        
        const formHtml = `
            <form class="modal-form" id="mechanicForm">
                <h3>${isEdit ? 'Edit Mechanic' : 'Add New Mechanic'}</h3>
                
                <div class="form-group">
                    <label for="mechanicName">Mechanic Name *</label>
                    <input type="text" id="mechanicName" required value="${isEdit ? Utils.escapeHtml(mechanicToEdit.name) : ''}" placeholder="e.g., Jump System, Combat">
                </div>
                
                <div class="form-group">
                    <label for="mechanicCategory">Category</label>
                    <select id="mechanicCategory">
                        <option value="movement" ${isEdit && mechanicToEdit.category === 'movement' ? 'selected' : ''}>Movement</option>
                        <option value="combat" ${isEdit && mechanicToEdit.category === 'combat' ? 'selected' : ''}>Combat</option>
                        <option value="ui" ${isEdit && mechanicToEdit.category === 'ui' ? 'selected' : ''}>UI/UX</option>
                        <option value="gameplay" ${isEdit && mechanicToEdit.category === 'gameplay' ? 'selected' : ''}>Gameplay</option>
                        <option value="ai" ${isEdit && mechanicToEdit.category === 'ai' ? 'selected' : ''}>AI</option>
                        <option value="physics" ${isEdit && mechanicToEdit.category === 'physics' ? 'selected' : ''}>Physics</option>
                        <option value="audio" ${isEdit && mechanicToEdit.category === 'audio' ? 'selected' : ''}>Audio</option>
                        <option value="other" ${isEdit && mechanicToEdit.category === 'other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="mechanicStatus">Implementation Status</label>
                    <select id="mechanicStatus">
                        <option value="planned" ${isEdit && mechanicToEdit.status === 'planned' ? 'selected' : ''}>Planned</option>
                        <option value="in-progress" ${isEdit && mechanicToEdit.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                        <option value="implemented" ${isEdit && mechanicToEdit.status === 'implemented' ? 'selected' : ''}>Implemented</option>
                        <option value="testing" ${isEdit && mechanicToEdit.status === 'testing' ? 'selected' : ''}>Testing</option>
                        <option value="complete" ${isEdit && mechanicToEdit.status === 'complete' ? 'selected' : ''}>Complete</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="mechanicDescription">Description *</label>
                    <textarea id="mechanicDescription" rows="4" required placeholder="Describe how this mechanic works...">${isEdit && mechanicToEdit.description ? Utils.escapeHtml(mechanicToEdit.description) : ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label for="mechanicImplementation">Implementation Notes</label>
                    <textarea id="mechanicImplementation" rows="4" placeholder="Technical details, code snippets, algorithms...">${isEdit && mechanicToEdit.implementation ? Utils.escapeHtml(mechanicToEdit.implementation) : ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label for="mechanicRelatedClasses">Related Classes (comma-separated)</label>
                    <input type="text" id="mechanicRelatedClasses" placeholder="e.g., Player, Enemy, Weapon" value="${isEdit && mechanicToEdit.relatedClasses ? mechanicToEdit.relatedClasses.join(', ') : ''}">
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" id="cancelMechanicBtn">Cancel</button>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Add'} Mechanic</button>
                </div>
            </form>
        `;
        
        Modal.open(formHtml);
        
        document.getElementById('mechanicForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const relatedClasses = document.getElementById('mechanicRelatedClasses').value
                .split(',')
                .map(c => c.trim())
                .filter(c => c);
            
            const mechanicData = {
                id: isEdit ? mechanicToEdit.id : Utils.generateId(),
                name: document.getElementById('mechanicName').value.trim(),
                category: document.getElementById('mechanicCategory').value,
                status: document.getElementById('mechanicStatus').value,
                description: document.getElementById('mechanicDescription').value.trim(),
                implementation: document.getElementById('mechanicImplementation').value.trim(),
                relatedClasses: relatedClasses,
                createdAt: isEdit ? mechanicToEdit.createdAt : new Date().toISOString()
            };
            
            if (isEdit) {
                const index = AppState.mechanics.findIndex(m => m.id === mechanicToEdit.id);
                AppState.mechanics[index] = mechanicData;
            } else {
                AppState.mechanics.push(mechanicData);
            }
            
            AppState.save();
            this.render();
            Modal.close();
        });
        
        document.getElementById('cancelMechanicBtn').addEventListener('click', () => Modal.close());
    },
    
    deleteMechanic(mechanicId) {
        if (confirm('Are you sure you want to delete this mechanic?')) {
            AppState.mechanics = AppState.mechanics.filter(m => m.id !== mechanicId);
            AppState.save();
            this.render();
        }
    },
    
    render() {
        const container = document.getElementById('mechanicsList');
        
        if (AppState.mechanics.length === 0) {
            container.innerHTML = '<div class="empty-state">No mechanics yet. Document your first game mechanic!</div>';
            return;
        }
        
        // Group by category
        const categories = {
            movement: [],
            combat: [],
            ui: [],
            gameplay: [],
            ai: [],
            physics: [],
            audio: [],
            other: []
        };
        
        AppState.mechanics.forEach(mechanic => {
            if (categories[mechanic.category]) {
                categories[mechanic.category].push(mechanic);
            } else {
                categories.other.push(mechanic);
            }
        });
        
        const categoryIcons = {
            movement: '🏃',
            combat: '⚔️',
            ui: '🖥️',
            gameplay: '🎮',
            ai: '🤖',
            physics: '🌍',
            audio: '🔊',
            other: '📦'
        };
        
        const categoryNames = {
            movement: 'Movement',
            combat: 'Combat',
            ui: 'UI/UX',
            gameplay: 'Gameplay',
            ai: 'AI',
            physics: 'Physics',
            audio: 'Audio',
            other: 'Other'
        };
        
        let html = '';
        
        Object.keys(categories).forEach(category => {
            if (categories[category].length > 0) {
                html += `
                    <div class="mechanics-category">
                        <h3 class="category-title">${categoryIcons[category]} ${categoryNames[category]} (${categories[category].length})</h3>
                        <div class="mechanics-grid">
                `;
                
                categories[category].forEach(mechanic => {
                    html += `
                        <div class="mechanic-card">
                            <div class="mechanic-header">
                                <h4 class="mechanic-name">${Utils.escapeHtml(mechanic.name)}</h4>
                                <span class="mechanic-status status-${mechanic.status}">${mechanic.status}</span>
                            </div>
                            <div class="mechanic-description">${Utils.escapeHtml(mechanic.description)}</div>
                            ${mechanic.implementation ? `
                                <details class="mechanic-implementation">
                                    <summary>Implementation Notes</summary>
                                    <pre>${Utils.escapeHtml(mechanic.implementation)}</pre>
                                </details>
                            ` : ''}
                            ${mechanic.relatedClasses.length > 0 ? `
                                <div class="mechanic-classes">
                                    <strong>Related:</strong> ${mechanic.relatedClasses.map(c => `<span class="class-tag">${Utils.escapeHtml(c)}</span>`).join(' ')}
                                </div>
                            ` : ''}
                            <div class="mechanic-actions">
                                <button class="btn btn-small btn-secondary" onclick="MechanicsManager.openAddModal(AppState.mechanics.find(m => m.id === '${mechanic.id}'))">Edit</button>
                                <button class="btn btn-small btn-danger" onclick="MechanicsManager.deleteMechanic('${mechanic.id}')">Delete</button>
                            </div>
                        </div>
                    `;
                });
                
                html += `
                        </div>
                    </div>
                `;
            }
        });
        
        container.innerHTML = html;
    }
};

// ============================================
// Milestone Planner
// ============================================
const MilestonePlanner = {
    init() {
        document.getElementById('addMilestoneBtn').addEventListener('click', () => this.openAddModal());
        this.render();
    },
    
    openAddModal(milestoneToEdit = null) {
        const isEdit = milestoneToEdit !== null;
        const formHtml = `
            <form class="modal-form" id="milestoneForm">
                <h3>${isEdit ? 'Edit Milestone' : 'Add New Milestone'}</h3>
                
                <div class="form-group">
                    <label for="milestoneTitle">Title *</label>
                    <input type="text" id="milestoneTitle" required value="${isEdit ? Utils.escapeHtml(milestoneToEdit.title) : ''}">
                </div>
                
                <div class="form-group">
                    <label for="milestoneDescription">Description</label>
                    <textarea id="milestoneDescription">${isEdit ? Utils.escapeHtml(milestoneToEdit.description) : ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label for="milestoneDueDate">Due Date</label>
                    <input type="date" id="milestoneDueDate" value="${isEdit ? milestoneToEdit.dueDate : ''}">
                </div>
                
                <div class="form-group">
                    <label for="milestoneProgress">Progress (%)</label>
                    <input type="number" id="milestoneProgress" min="0" max="100" value="${isEdit ? milestoneToEdit.progress : 0}">
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Add'} Milestone</button>
                </div>
            </form>
        `;
        
        Modal.open(formHtml);
        
        document.getElementById('milestoneForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const milestoneData = {
                id: isEdit ? milestoneToEdit.id : Utils.generateId(),
                title: document.getElementById('milestoneTitle').value.trim(),
                description: document.getElementById('milestoneDescription').value.trim(),
                dueDate: document.getElementById('milestoneDueDate').value,
                progress: parseInt(document.getElementById('milestoneProgress').value),
                createdAt: isEdit ? milestoneToEdit.createdAt : new Date().toISOString()
            };
            
            if (isEdit) {
                const index = AppState.milestones.findIndex(m => m.id === milestoneToEdit.id);
                AppState.milestones[index] = milestoneData;
            } else {
                AppState.milestones.push(milestoneData);
            }
            
            AppState.save();
            this.render();
            Dashboard.refresh();
            Modal.close();
        });
    },
    
    deleteMilestone(milestoneId) {
        if (confirm('Are you sure you want to delete this milestone?')) {
            AppState.milestones = AppState.milestones.filter(m => m.id !== milestoneId);
            AppState.save();
            this.render();
            Dashboard.refresh();
        }
    },
    
    render() {
        const container = document.getElementById('milestonesList');
        
        if (AppState.milestones.length === 0) {
            container.innerHTML = '';
            return;
        }
        
        // Sort by due date
        const sortedMilestones = [...AppState.milestones].sort((a, b) => 
            new Date(a.dueDate) - new Date(b.dueDate)
        );
        
        container.innerHTML = sortedMilestones.map(milestone => `
            <div class="milestone-card">
                <div class="milestone-header">
                    <div>
                        <div class="milestone-title">${Utils.escapeHtml(milestone.title)}</div>
                        <div class="milestone-date">Due: ${Utils.formatDate(milestone.dueDate)}</div>
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-small btn-secondary" onclick="MilestonePlanner.openAddModal(AppState.milestones.find(m => m.id === '${milestone.id}'))">Edit</button>
                        <button class="btn btn-small btn-danger" onclick="MilestonePlanner.deleteMilestone('${milestone.id}')">Delete</button>
                    </div>
                </div>
                
                ${milestone.description ? `<div class="milestone-description">${Utils.escapeHtml(milestone.description)}</div>` : ''}
                
                <div class="progress-bar-container">
                    <div class="progress-label">
                        <span>Progress</span>
                        <span><strong>${milestone.progress}%</strong></span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${milestone.progress}%"></div>
                    </div>
                </div>
            </div>
        `).join('');
    }
};

// ============================================
// Notes Manager
// ============================================
const NotesManager = {
    previewVisible: false,
    
    init() {
        const textarea = document.getElementById('notesTextarea');
        const saveBtn = document.getElementById('saveNotesBtn');
        const toggleBtn = document.getElementById('togglePreviewBtn');
        const preview = document.getElementById('notesPreview');
        
        // Load saved notes
        textarea.value = AppState.notes;
        
        // Save notes
        saveBtn.addEventListener('click', () => {
            AppState.notes = textarea.value;
            AppState.save();
            this.showNotification('Notes saved successfully!');
        });
        
        // Toggle preview
        toggleBtn.addEventListener('click', () => {
            this.previewVisible = !this.previewVisible;
            const editor = document.querySelector('.notes-editor');
            
            if (this.previewVisible) {
                editor.classList.add('split');
                preview.classList.add('visible');
                preview.innerHTML = Utils.parseMarkdown(textarea.value);
                toggleBtn.textContent = 'Hide Preview';
            } else {
                editor.classList.remove('split');
                preview.classList.remove('visible');
                toggleBtn.textContent = 'Show Preview';
            }
        });
        
        // Auto-update preview
        textarea.addEventListener('input', () => {
            if (this.previewVisible) {
                preview.innerHTML = Utils.parseMarkdown(textarea.value);
            }
        });
    },
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: var(--success-color);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: var(--shadow-lg);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
};

// ============================================
// Story/Narrative Manager
// ============================================
const StoryManager = {
    init() {
        document.getElementById('addActBtn').addEventListener('click', () => this.openAddActModal());
        this.render();
    },
    
    openAddActModal(actToEdit = null) {
        const isEdit = actToEdit !== null;
        
        const formHtml = `
            <form class="modal-form" id="actForm">
                <h3>${isEdit ? 'Edit Act' : 'Add New Act'}</h3>
                
                <div class="form-group">
                    <label for="actTitle">Act Title *</label>
                    <input type="text" id="actTitle" required value="${isEdit ? Utils.escapeHtml(actToEdit.title) : ''}" placeholder="e.g., Act 1: The Beginning">
                </div>
                
                <div class="form-group">
                    <label for="actDescription">Description</label>
                    <textarea id="actDescription" rows="4" placeholder="Describe what happens in this act...">${isEdit && actToEdit.description ? Utils.escapeHtml(actToEdit.description) : ''}</textarea>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" id="cancelActBtn">Cancel</button>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Add'} Act</button>
                </div>
            </form>
        `;
        
        Modal.open(formHtml);
        
        document.getElementById('actForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const actData = {
                id: isEdit ? actToEdit.id : Utils.generateId(),
                title: document.getElementById('actTitle').value.trim(),
                description: document.getElementById('actDescription').value.trim(),
                scenes: isEdit ? actToEdit.scenes : [],
                createdAt: isEdit ? actToEdit.createdAt : new Date().toISOString()
            };
            
            if (isEdit) {
                const index = AppState.story.acts.findIndex(a => a.id === actToEdit.id);
                AppState.story.acts[index] = actData;
            } else {
                AppState.story.acts.push(actData);
            }
            
            AppState.save();
            this.render();
            Modal.close();
        });
        
        document.getElementById('cancelActBtn').addEventListener('click', () => Modal.close());
    },
    
    openAddSceneModal(actId, sceneToEdit = null) {
        const act = AppState.story.acts.find(a => a.id === actId);
        if (!act) return;
        
        const isEdit = sceneToEdit !== null;
        
        const formHtml = `
            <form class="modal-form" id="sceneForm">
                <h3>${isEdit ? 'Edit Scene' : 'Add New Scene'} (${Utils.escapeHtml(act.title)})</h3>
                
                <div class="form-group">
                    <label for="sceneTitle">Scene Title *</label>
                    <input type="text" id="sceneTitle" required value="${isEdit ? Utils.escapeHtml(sceneToEdit.title) : ''}" placeholder="e.g., Opening Cutscene">
                </div>
                
                <div class="form-group">
                    <label for="sceneDescription">Description</label>
                    <textarea id="sceneDescription" rows="4" placeholder="What happens in this scene...">${isEdit && sceneToEdit.description ? Utils.escapeHtml(sceneToEdit.description) : ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label for="sceneDialogue">Dialogue/Notes</label>
                    <textarea id="sceneDialogue" rows="6" placeholder="Character dialogue, important beats, decisions...">${isEdit && sceneToEdit.dialogue ? Utils.escapeHtml(sceneToEdit.dialogue) : ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label for="sceneLocation">Location</label>
                    <input type="text" id="sceneLocation" placeholder="e.g., Village Square, Forest Path" value="${isEdit && sceneToEdit.location ? Utils.escapeHtml(sceneToEdit.location) : ''}">
                </div>
                
                <div class="form-group">
                    <label for="sceneCharacters">Characters (comma-separated)</label>
                    <input type="text" id="sceneCharacters" placeholder="e.g., Hero, Mentor, Villain" value="${isEdit && sceneToEdit.characters ? sceneToEdit.characters.join(', ') : ''}">
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" id="cancelSceneBtn">Cancel</button>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Add'} Scene</button>
                </div>
            </form>
        `;
        
        Modal.open(formHtml);
        
        document.getElementById('sceneForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const characters = document.getElementById('sceneCharacters').value
                .split(',')
                .map(c => c.trim())
                .filter(c => c);
            
            const sceneData = {
                id: isEdit ? sceneToEdit.id : Utils.generateId(),
                title: document.getElementById('sceneTitle').value.trim(),
                description: document.getElementById('sceneDescription').value.trim(),
                dialogue: document.getElementById('sceneDialogue').value.trim(),
                location: document.getElementById('sceneLocation').value.trim(),
                characters: characters,
                createdAt: isEdit ? sceneToEdit.createdAt : new Date().toISOString()
            };
            
            if (isEdit) {
                const sceneIndex = act.scenes.findIndex(s => s.id === sceneToEdit.id);
                act.scenes[sceneIndex] = sceneData;
            } else {
                act.scenes.push(sceneData);
            }
            
            AppState.save();
            this.render();
            Modal.close();
        });
        
        document.getElementById('cancelSceneBtn').addEventListener('click', () => Modal.close());
    },
    
    deleteAct(actId) {
        const act = AppState.story.acts.find(a => a.id === actId);
        const confirmMsg = `Are you sure you want to delete "${act.title}"?\n\nThis will also delete all ${act.scenes.length} scene(s) in this act.`;
        
        if (confirm(confirmMsg)) {
            AppState.story.acts = AppState.story.acts.filter(a => a.id !== actId);
            AppState.save();
            this.render();
        }
    },
    
    deleteScene(actId, sceneId) {
        const act = AppState.story.acts.find(a => a.id === actId);
        if (!act) return;
        
        if (confirm('Are you sure you want to delete this scene?')) {
            act.scenes = act.scenes.filter(s => s.id !== sceneId);
            AppState.save();
            this.render();
        }
    },
    
    moveScene(actId, sceneId, direction) {
        const act = AppState.story.acts.find(a => a.id === actId);
        if (!act) return;
        
        const sceneIndex = act.scenes.findIndex(s => s.id === sceneId);
        if (sceneIndex === -1) return;
        
        if (direction === 'up' && sceneIndex > 0) {
            [act.scenes[sceneIndex], act.scenes[sceneIndex - 1]] = [act.scenes[sceneIndex - 1], act.scenes[sceneIndex]];
        } else if (direction === 'down' && sceneIndex < act.scenes.length - 1) {
            [act.scenes[sceneIndex], act.scenes[sceneIndex + 1]] = [act.scenes[sceneIndex + 1], act.scenes[sceneIndex]];
        }
        
        AppState.save();
        this.render();
    },
    
    render() {
        const container = document.getElementById('storyList');
        
        if (!AppState.story.acts || AppState.story.acts.length === 0) {
            container.innerHTML = '<div class="empty-state">No acts yet. Start building your story!</div>';
            return;
        }
        
        let html = '<div class="story-acts">';
        
        AppState.story.acts.forEach((act, actIndex) => {
            html += `
                <div class="act-container">
                    <div class="act-header">
                        <div class="act-info">
                            <h3 class="act-title">${Utils.escapeHtml(act.title)}</h3>
                            ${act.description ? `<p class="act-description">${Utils.escapeHtml(act.description)}</p>` : ''}
                            <span class="scene-count">${act.scenes.length} scene${act.scenes.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div class="act-actions">
                            <button class="btn btn-small btn-primary" onclick="StoryManager.openAddSceneModal('${act.id}')">+ Add Scene</button>
                            <button class="btn btn-small btn-secondary" onclick="StoryManager.openAddActModal(AppState.story.acts.find(a => a.id === '${act.id}'))">Edit</button>
                            <button class="btn btn-small btn-danger" onclick="StoryManager.deleteAct('${act.id}')">Delete</button>
                        </div>
                    </div>
                    
                    ${act.scenes.length > 0 ? `
                        <div class="scenes-list">
                            ${act.scenes.map((scene, sceneIndex) => `
                                <div class="scene-card">
                                    <div class="scene-header">
                                        <div class="scene-order">Scene ${sceneIndex + 1}</div>
                                        <h4 class="scene-title">${Utils.escapeHtml(scene.title)}</h4>
                                        <div class="scene-actions">
                                            ${sceneIndex > 0 ? `<button class="btn btn-icon" onclick="StoryManager.moveScene('${act.id}', '${scene.id}', 'up')" title="Move Up">▲</button>` : ''}
                                            ${sceneIndex < act.scenes.length - 1 ? `<button class="btn btn-icon" onclick="StoryManager.moveScene('${act.id}', '${scene.id}', 'down')" title="Move Down">▼</button>` : ''}
                                            <button class="btn btn-small btn-secondary" onclick="StoryManager.openAddSceneModal('${act.id}', AppState.story.acts.find(a => a.id === '${act.id}').scenes.find(s => s.id === '${scene.id}'))">Edit</button>
                                            <button class="btn btn-small btn-danger" onclick="StoryManager.deleteScene('${act.id}', '${scene.id}')">Delete</button>
                                        </div>
                                    </div>
                                    ${scene.description ? `<p class="scene-description">${Utils.escapeHtml(scene.description)}</p>` : ''}
                                    ${scene.location ? `<div class="scene-meta"><strong>📍 Location:</strong> ${Utils.escapeHtml(scene.location)}</div>` : ''}
                                    ${scene.characters.length > 0 ? `<div class="scene-meta"><strong>👥 Characters:</strong> ${scene.characters.map(c => `<span class="character-tag">${Utils.escapeHtml(c)}</span>`).join(' ')}</div>` : ''}
                                    ${scene.dialogue ? `
                                        <details class="scene-dialogue">
                                            <summary>Dialogue/Notes</summary>
                                            <pre>${Utils.escapeHtml(scene.dialogue)}</pre>
                                        </details>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : '<div class="empty-scenes">No scenes yet in this act.</div>'}
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }
};

// ============================================
// Search System
// ============================================
const Search = {
    currentResults: null,
    selectedIndex: -1,
    resultItems: [],

    init() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;

        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.performSearch(e.target.value);
            }, 300); // Debounce search
        });

        // Clear search button
        const clearBtn = document.getElementById('clearSearchBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                searchInput.value = '';
                this.clearResults();
            });
        }

        // Keyboard navigation
        searchInput.addEventListener('keydown', (e) => {
            const resultsContainer = document.getElementById('searchResults');
            if (!resultsContainer || resultsContainer.style.display === 'none') return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateResults(1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateResults(-1);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                this.activateSelectedResult();
            } else if (e.key === 'Escape') {
                this.clearResults();
            }
        });
    },

    navigateResults(direction) {
        if (this.resultItems.length === 0) return;

        // Remove previous selection
        if (this.selectedIndex >= 0 && this.selectedIndex < this.resultItems.length) {
            this.resultItems[this.selectedIndex].classList.remove('selected');
        }

        // Update index
        this.selectedIndex += direction;
        if (this.selectedIndex < 0) this.selectedIndex = this.resultItems.length - 1;
        if (this.selectedIndex >= this.resultItems.length) this.selectedIndex = 0;

        // Add new selection
        const selectedItem = this.resultItems[this.selectedIndex];
        selectedItem.classList.add('selected');
        selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },

    activateSelectedResult() {
        if (this.selectedIndex >= 0 && this.selectedIndex < this.resultItems.length) {
            this.resultItems[this.selectedIndex].click();
        }
    },

    performSearch(query) {
        if (!query || query.trim().length === 0) {
            this.clearResults();
            return;
        }

        const q = query.toLowerCase().trim();

        // Helper function to calculate match score
        const calculateScore = (item, titleField, descField, tagsField = null) => {
            let score = 0;
            const title = item[titleField] || '';
            const desc = item[descField] || '';
            
            // Exact title match (highest priority)
            if (title.toLowerCase() === q) score += 1000;
            // Title starts with query
            else if (title.toLowerCase().startsWith(q)) score += 500;
            // Title contains query
            else if (title.toLowerCase().includes(q)) score += 100;
            
            // Description contains query
            if (desc && desc.toLowerCase().includes(q)) score += 50;
            
            // Tags/properties contain query
            if (tagsField && item[tagsField]) {
                if (Array.isArray(item[tagsField])) {
                    if (item[tagsField].some(t => t.toLowerCase() === q)) score += 200;
                    else if (item[tagsField].some(t => t.toLowerCase().includes(q))) score += 75;
                }
            }
            
            return score;
        };

        // Search through various data sets with scoring
        const results = {
            tasks: AppState.tasks
                .map(t => ({ item: t, score: calculateScore(t, 'title', 'description', 'tags') }))
                .filter(r => r.score > 0)
                .sort((a, b) => b.score - a.score)
                .map(r => r.item),
            
            assets: AppState.assets
                .map(a => ({ item: a, score: calculateScore(a, 'name', 'description') }))
                .filter(r => r.score > 0)
                .sort((a, b) => b.score - a.score)
                .map(r => r.item),
            
            milestones: AppState.milestones
                .map(m => ({ item: m, score: calculateScore(m, 'title', 'description') }))
                .filter(r => r.score > 0)
                .sort((a, b) => b.score - a.score)
                .map(r => r.item),
            
            classes: AppState.classes
                .map(c => ({ 
                    item: c, 
                    score: calculateScore(c, 'name', 'description', 'properties') 
                }))
                .filter(r => r.score > 0)
                .sort((a, b) => b.score - a.score)
                .map(r => r.item),
            
            mechanics: AppState.mechanics
                .map(m => {
                    let score = calculateScore(m, 'name', 'description', 'relatedClasses');
                    if (m.implementation && m.implementation.toLowerCase().includes(q)) score += 50;
                    return { item: m, score };
                })
                .filter(r => r.score > 0)
                .sort((a, b) => b.score - a.score)
                .map(r => r.item),
            
            acts: (AppState.story && AppState.story.acts ? AppState.story.acts
                .map(a => ({ item: a, score: calculateScore(a, 'title', 'description') }))
                .filter(r => r.score > 0)
                .sort((a, b) => b.score - a.score)
                .map(r => r.item)
            : []),
            
            scenes: [],
            notes: (AppState.notes && AppState.notes.toLowerCase().includes(q)) ? [AppState.notes] : []
        };

        // Search scenes separately (need act context)
        if (AppState.story && Array.isArray(AppState.story.acts)) {
            const sceneResults = [];
            AppState.story.acts.forEach(act => {
                (act.scenes || []).forEach(scene => {
                    const hay = [scene.title, scene.description, scene.dialogue, scene.location, (scene.characters || []).join(' ')].filter(Boolean).join(' ').toLowerCase();
                    if (hay.includes(q)) {
                        let score = 0;
                        if (scene.title && scene.title.toLowerCase() === q) score += 1000;
                        else if (scene.title && scene.title.toLowerCase().startsWith(q)) score += 500;
                        else if (scene.title && scene.title.toLowerCase().includes(q)) score += 100;
                        else score += 50;
                        
                        sceneResults.push({ 
                            data: { actId: act.id, actTitle: act.title, scene },
                            score 
                        });
                    }
                });
            });
            results.scenes = sceneResults
                .sort((a, b) => b.score - a.score)
                .map(r => r.data);
        }

        this.currentResults = results;
        this.displayResults(results, query);
    },

    displayResults(results, query) {
        const resultsContainer = document.getElementById('searchResults');
        if (!resultsContainer) return;

        const total = results.tasks.length + results.assets.length + results.milestones.length + results.classes.length + results.mechanics.length + results.acts.length + results.scenes.length + results.notes.length;

        // Reset selection state
        this.selectedIndex = -1;
        this.resultItems = [];

        if (total === 0) {
            resultsContainer.innerHTML = `<div class="search-no-results">No results found for "${Utils.escapeHtml(query)}"</div>`;
            resultsContainer.style.display = 'block';
            return;
        }

        let html = `<div class="search-results-header">Found ${total} result${total !== 1 ? 's' : ''} for "${Utils.escapeHtml(query)}"</div>`;

        const renderGroup = (title, itemsHtml) => `
            <div class="search-category">
                <h4>${title}</h4>
                <div class="search-items">${itemsHtml}</div>
            </div>
        `;

        if (results.tasks.length > 0) {
            const items = results.tasks.map(t => `
                <div class="search-item" data-type="task" data-id="${t.id}">
                    ${Utils.icon('navigation/tasks', 'small')}
                    <div class="search-item-content">
                        <div class="search-item-title">${Utils.escapeHtml(t.title)}</div>
                        ${t.description ? `<div class="search-item-desc">${Utils.escapeHtml((t.description || '').substring(0, 120))}${(t.description || '').length > 120 ? '...' : ''}</div>` : ''}
                    </div>
                </div>
            `).join('');
            html += renderGroup(`Tasks (${results.tasks.length})`, items);
        }

        if (results.assets.length > 0) {
            const items = results.assets.map(a => `
                <div class="search-item" data-type="asset" data-id="${a.id}">
                    <span class="search-icon">🎨</span>
                    <div class="search-item-content">
                        <div class="search-item-title">${Utils.escapeHtml(a.name)}</div>
                        <div class="search-item-desc">${Utils.escapeHtml(a.type || '')}${a.fileName ? ` • ${Utils.escapeHtml(a.fileName)}` : ''}</div>
                    </div>
                </div>
            `).join('');
            html += renderGroup(`Assets (${results.assets.length})`, items);
        }

        if (results.milestones.length > 0) {
            const items = results.milestones.map(m => `
                <div class="search-item" data-type="milestone" data-id="${m.id}">
                    <span class="search-icon">🎯</span>
                    <div class="search-item-content">
                        <div class="search-item-title">${Utils.escapeHtml(m.title)}</div>
                        ${m.dueDate ? `<div class="search-item-desc">Due: ${Utils.formatDate(m.dueDate)}</div>` : ''}
                    </div>
                </div>
            `).join('');
            html += renderGroup(`Milestones (${results.milestones.length})`, items);
        }

        if (results.classes.length > 0) {
            const items = results.classes.map(c => `
                <div class="search-item" data-type="class" data-id="${c.id}">
                    <span class="search-icon">🏷️</span>
                    <div class="search-item-content">
                        <div class="search-item-title">${Utils.escapeHtml(c.name)}</div>
                        ${c.description ? `<div class="search-item-desc">${Utils.escapeHtml((c.description || '').substring(0, 120))}${(c.description || '').length > 120 ? '...' : ''}</div>` : ''}
                    </div>
                </div>
            `).join('');
            html += renderGroup(`Classes (${results.classes.length})`, items);
        }

        if (results.mechanics.length > 0) {
            const items = results.mechanics.map(mec => `
                <div class="search-item" data-type="mechanic" data-id="${mec.id}">
                    <span class="search-icon">⚙️</span>
                    <div class="search-item-content">
                        <div class="search-item-title">${Utils.escapeHtml(mec.name)}</div>
                        ${mec.category ? `<div class="search-item-desc">${Utils.escapeHtml(mec.category)}</div>` : ''}
                    </div>
                </div>
            `).join('');
            html += renderGroup(`Mechanics (${results.mechanics.length})`, items);
        }

        if (results.acts.length > 0) {
            const items = results.acts.map(a => `
                <div class="search-item" data-type="act" data-id="${a.id}">
                    <span class="search-icon">🎭</span>
                    <div class="search-item-content">
                        <div class="search-item-title">${Utils.escapeHtml(a.title)}</div>
                        ${a.description ? `<div class="search-item-desc">${Utils.escapeHtml((a.description || '').substring(0, 120))}${(a.description || '').length > 120 ? '...' : ''}</div>` : ''}
                    </div>
                </div>
            `).join('');
            html += renderGroup(`Acts (${results.acts.length})`, items);
        }

        if (results.scenes.length > 0) {
            const items = results.scenes.map(s => `
                <div class="search-item" data-type="scene" data-act-id="${s.actId}" data-id="${s.scene.id}">
                    <span class="search-icon">📜</span>
                    <div class="search-item-content">
                        <div class="search-item-title">${Utils.escapeHtml(s.scene.title)} <small style="opacity:0.7;">in ${Utils.escapeHtml(s.actTitle || '')}</small></div>
                        ${s.scene.description ? `<div class="search-item-desc">${Utils.escapeHtml((s.scene.description || '').substring(0, 120))}${(s.scene.description || '').length > 120 ? '...' : ''}</div>` : ''}
                    </div>
                </div>
            `).join('');
            html += renderGroup(`Scenes (${results.scenes.length})`, items);
        }

        if (results.notes.length > 0) {
            const notePreview = Utils.escapeHtml((AppState.notes || '').substring(0, 200));
            const items = `
                <div class="search-item" data-type="notes">
                    <span class="search-icon">📝</span>
                    <div class="search-item-content">
                        <div class="search-item-title">Notes</div>
                        <div class="search-item-desc">${notePreview}${(AppState.notes || '').length > 200 ? '...' : ''}</div>
                    </div>
                </div>
            `;
            html += renderGroup(`Notes`, items);
        }

        resultsContainer.innerHTML = html;
        resultsContainer.style.display = 'block';

        // Attach click handlers and store references
        this.resultItems = Array.from(resultsContainer.querySelectorAll('.search-item'));
        this.resultItems.forEach(item => {
            item.addEventListener('click', () => {
                const type = item.getAttribute('data-type');
                const id = item.getAttribute('data-id');
                const actId = item.getAttribute('data-act-id');
                
                if (type === 'task') this.openTask(id);
                else if (type === 'asset') this.openAsset(id);
                else if (type === 'milestone') this.openMilestone(id);
                else if (type === 'class') this.openClass(id);
                else if (type === 'mechanic') this.openMechanic(id);
                else if (type === 'act') this.openAct(id);
                else if (type === 'scene') this.openScene(actId, id);
                else if (type === 'notes') this.openNotes();
            });
        });
    },

    clearResults() {
        const resultsContainer = document.getElementById('searchResults');
        if (resultsContainer) {
            resultsContainer.style.display = 'none';
            resultsContainer.innerHTML = '';
        }
        this.currentResults = null;
        this.selectedIndex = -1;
        this.resultItems = [];
    },

    // Action helpers to open items
    openTask(taskId) {
        const task = AppState.tasks.find(t => t.id === taskId);
        if (!task) return;
        Navigation.switchSection('tasks');
        TaskManager.render();
        // Open edit modal for quick view
        setTimeout(() => TaskManager.openAddModal(task), 50);
        this.clearResults();
    },

    openAsset(assetId) {
        const asset = AppState.assets.find(a => a.id === assetId);
        if (!asset) return;
        Navigation.switchSection('assets');
        AssetTracker.render();
        setTimeout(() => AssetTracker.previewAsset(assetId), 100);
        this.clearResults();
    },

    openMilestone(milestoneId) {
        const m = AppState.milestones.find(x => x.id === milestoneId);
        if (!m) return;
        Navigation.switchSection('milestones');
        MilestonePlanner.render();
        setTimeout(() => MilestonePlanner.openAddModal(m), 50);
        this.clearResults();
    },

    openClass(classId) {
        const c = AppState.classes.find(x => x.id === classId);
        if (!c) return;
        Navigation.switchSection('classes');
        ClassesManager.render();
        setTimeout(() => ClassesManager.openAddModal(c), 50);
        this.clearResults();
    },

    openMechanic(mechanicId) {
        const m = AppState.mechanics.find(x => x.id === mechanicId);
        if (!m) return;
        Navigation.switchSection('mechanics');
        MechanicsManager.render();
        setTimeout(() => MechanicsManager.openAddModal(m), 50);
        this.clearResults();
    },

    openAct(actId) {
        const a = (AppState.story && AppState.story.acts || []).find(x => x.id === actId);
        if (!a) return;
        Navigation.switchSection('story');
        StoryManager.render();
        setTimeout(() => StoryManager.openAddActModal(a), 50);
        this.clearResults();
    },

    openScene(actId, sceneId) {
        const act = (AppState.story && AppState.story.acts || []).find(a => a.id === actId);
        if (!act) return;
        const scene = (act.scenes || []).find(s => s.id === sceneId);
        if (!scene) return;
        Navigation.switchSection('story');
        StoryManager.render();
        setTimeout(() => StoryManager.openAddSceneModal(actId, scene), 80);
        this.clearResults();
    },

    openNotes() {
        Navigation.switchSection('notes');
        const textarea = document.getElementById('notesTextarea');
        if (textarea) {
            textarea.focus();
        }
        this.clearResults();
    }
};

// ============================================
// Data Manager (Export/Import)
// ============================================
const DataManager = {
    init() {
        const exportBtn = document.getElementById('exportDataBtn');
        const importBtn = document.getElementById('importDataBtn');
        const importFileInput = document.getElementById('importFileInput');
        
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }
        
        if (importBtn && importFileInput) {
            importBtn.addEventListener('click', () => importFileInput.click());
            importFileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    this.importData(e.target.files[0]);
                }
            });
        }
    },
    
    async exportData() {
        try {
            // Show loading notification
            const loadingNotif = this.showLoadingNotification('Preparing export...');
            
            // Create ZIP file
            const zip = new JSZip();
            
            // Add metadata JSON
            const metadata = {
                version: '2.0',
                exportDate: new Date().toISOString(),
                appName: 'Forgeon',
                tasks: AppState.tasks,
                assets: AppState.assets,
                milestones: AppState.milestones,
                notes: AppState.notes,
                theme: AppState.theme,
                classes: AppState.classes,
                mechanics: AppState.mechanics,
                story: AppState.story
            };
            
            zip.file('project-data.json', JSON.stringify(metadata, null, 2));
            
            // Add all uploaded files from IndexedDB
            const assetsWithFiles = AppState.assets.filter(a => a.hasFile);
            
            if (assetsWithFiles.length > 0) {
                loadingNotif.textContent = `Exporting ${assetsWithFiles.length} files...`;
                
                const filesFolder = zip.folder('files');
                
                for (let i = 0; i < assetsWithFiles.length; i++) {
                    const asset = assetsWithFiles[i];
                    loadingNotif.textContent = `Exporting file ${i + 1}/${assetsWithFiles.length}...`;
                    
                    try {
                        const fileData = await FileStorage.getFile(asset.id);
                        if (fileData && fileData.file) {
                            // Store file with asset ID as filename to maintain reference
                            const extension = fileData.fileName.split('.').pop();
                            filesFolder.file(`${asset.id}.${extension}`, fileData.file);
                        }
                    } catch (error) {
                        console.error(`Error exporting file for asset ${asset.id}:`, error);
                    }
                }
            }
            
            // Generate ZIP file
            loadingNotif.textContent = 'Creating archive...';
            const blob = await zip.generateAsync({ 
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            });
            
            // Download ZIP
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const timestamp = new Date().toISOString().split('T')[0];
            a.download = `Forgeon-Backup-${timestamp}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Remove loading notification
            loadingNotif.remove();
            
            // Show success
            NotesManager.showNotification(`✅ Export complete! (${assetsWithFiles.length} files included)`);
            
        } catch (error) {
            console.error('Export error:', error);
            alert('Error creating export: ' + error.message);
        }
    },
    
    async importData(file) {
        try {
            // Check if it's a ZIP file
            const isZip = file.name.toLowerCase().endsWith('.zip');
            
            if (!isZip) {
                // Legacy JSON import
                this.importLegacyJSON(file);
                return;
            }
            
            // Show loading notification
            const loadingNotif = this.showLoadingNotification('Reading archive...');
            
            // Read ZIP file
            const zip = await JSZip.loadAsync(file);
            
            // Extract metadata
            const metadataFile = zip.file('project-data.json');
            if (!metadataFile) {
                throw new Error('Invalid backup file: project-data.json not found');
            }
            
            const metadataText = await metadataFile.async('text');
            const data = JSON.parse(metadataText);
            
            // Validate data
            if (!data.tasks || !Array.isArray(data.tasks)) {
                throw new Error('Invalid data format');
            }
            
            // Confirm with user
            const assetsWithFiles = data.assets.filter(a => a.hasFile).length;
            const classesCount = (data.classes || []).length;
            const mechanicsCount = (data.mechanics || []).length;
            const storyActsCount = (data.story && data.story.acts) ? data.story.acts.length : 0;
            const storyScenesCount = (data.story && data.story.acts) ? 
                data.story.acts.reduce((sum, act) => sum + (act.scenes || []).length, 0) : 0;
            
            // Count assets by type
            const assetsByType = data.assets.reduce((counts, asset) => {
                counts[asset.type] = (counts[asset.type] || 0) + 1;
                return counts;
            }, {});
            const assetTypesList = Object.entries(assetsByType)
                .map(([type, count]) => `${count} ${type}`)
                .join(', ');
            
            const confirmMessage = `⚠️ This will replace all current data.\n\n` +
                `Import contains:\n` +
                `• ${data.tasks.length} tasks\n` +
                `• ${data.assets.length} assets (${assetsWithFiles} with files)\n` +
                `  ${assetTypesList ? '  → ' + assetTypesList : ''}\n` +
                `• ${data.milestones.length} milestones\n` +
                `• ${classesCount} classes\n` +
                `• ${mechanicsCount} mechanics\n` +
                `• ${storyActsCount} story acts (${storyScenesCount} scenes)\n\n` +
                `Current data will be lost if you haven't exported it.\n\n` +
                `Continue?`;
            
            if (!confirm(confirmMessage)) {
                loadingNotif.remove();
                document.getElementById('importFileInput').value = '';
                return;
            }
            
            // Clear existing files from IndexedDB
            loadingNotif.textContent = 'Clearing old files...';
            for (const asset of AppState.assets) {
                if (asset.hasFile) {
                    try {
                        await FileStorage.deleteFile(asset.id);
                    } catch (error) {
                        console.error('Error deleting old file:', error);
                    }
                }
            }
            
            // Import metadata
            AppState.tasks = data.tasks || [];
            AppState.assets = data.assets || [];
            AppState.milestones = data.milestones || [];
            AppState.notes = data.notes || '';
            AppState.theme = data.theme || 'light';
            AppState.classes = data.classes || [];
            AppState.mechanics = data.mechanics || [];
            AppState.story = data.story || { acts: [] };
            AppState.save();
            AppState.applyTheme();
            
            // Import files from ZIP
            let filesImported = 0;
            const filesFolder = zip.folder('files');
            if (filesFolder) {
                const fileEntries = [];
                filesFolder.forEach((relativePath, file) => {
                    fileEntries.push({ relativePath, file });
                });
                
                for (let i = 0; i < fileEntries.length; i++) {
                    const entry = fileEntries[i];
                    loadingNotif.textContent = `Importing file ${i + 1}/${fileEntries.length}...`;
                    
                    try {
                        // Extract asset ID from filename (e.g., "abc123.png" -> "abc123")
                        const assetId = entry.relativePath.split('.')[0];
                        const asset = AppState.assets.find(a => a.id === assetId);
                        
                        if (asset && asset.hasFile) {
                            // Get file blob from ZIP
                            const blob = await entry.file.async('blob');
                            
                            // Create File object with proper name and type
                            const restoredFile = new File([blob], asset.fileName, { 
                                type: asset.fileType 
                            });
                            
                            // Save to IndexedDB
                            await FileStorage.saveFile(assetId, restoredFile);
                            
                            // Regenerate thumbnail if it's an image
                            if (asset.fileType && asset.fileType.startsWith('image/')) {
                                asset.thumbnail = await FileStorage.createThumbnail(restoredFile);
                            }
                            
                            filesImported++;
                        }
                    } catch (error) {
                        console.error(`Error importing file ${entry.relativePath}:`, error);
                    }
                }
            }
            
            // Save updated assets with thumbnails
            AppState.save();
            
            // Refresh all views
            loadingNotif.textContent = 'Refreshing interface...';
            TaskManager.render();
            AssetTracker.render();
            MilestonePlanner.render();
            ClassesManager.render();
            MechanicsManager.render();
            StoryManager.render();
            Dashboard.refresh();
            
            const textarea = document.getElementById('notesTextarea');
            if (textarea) textarea.value = AppState.notes;
            
            // Remove loading notification
            loadingNotif.remove();
            
            // Show success
            NotesManager.showNotification(`✅ Import complete! (${filesImported} files restored)`);
            
        } catch (error) {
            console.error('Import error:', error);
            alert('Error importing data: ' + error.message);
        }
        
        // Reset file input
        document.getElementById('importFileInput').value = '';
    },
    
    importLegacyJSON(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // Validate data structure
                if (!data.tasks || !Array.isArray(data.tasks)) {
                    throw new Error('Invalid data format');
                }
                
                if (confirm('⚠️ This is a legacy JSON export (no files included).\n\nThis will replace all current metadata.\n\nContinue?')) {
                    AppState.tasks = data.tasks || [];
                    AppState.assets = data.assets || [];
                    AppState.milestones = data.milestones || [];
                    AppState.notes = data.notes || '';
                    AppState.theme = data.theme || 'light';
                    AppState.classes = data.classes || [];
                    AppState.mechanics = data.mechanics || [];
                    AppState.story = data.story || { acts: [] };
                    AppState.save();
                    AppState.applyTheme();
                    
                    // Refresh all views
                    TaskManager.render();
                    AssetTracker.render();
                    MilestonePlanner.render();
                    ClassesManager.render();
                    MechanicsManager.render();
                    StoryManager.render();
                    Dashboard.refresh();
                    
                    const textarea = document.getElementById('notesTextarea');
                    if (textarea) textarea.value = AppState.notes;
                    
                    NotesManager.showNotification('Legacy data imported (files not included)');
                }
            } catch (error) {
                alert('Error importing data: Invalid file format.\n\n' + error.message);
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        document.getElementById('importFileInput').value = '';
    },
    
    showLoadingNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: var(--bg-primary);
            color: var(--text-primary);
            padding: 2rem 3rem;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            z-index: 10001;
            font-size: 1.1rem;
            font-weight: 600;
            text-align: center;
            min-width: 300px;
            border: 2px solid var(--primary-color);
        `;
        notification.innerHTML = `
            <div style="margin-bottom: 1rem;">${Utils.icon('misc/hourglass', 'xlarge')}</div>
            <div>${message}</div>
        `;
        document.body.appendChild(notification);
        return notification;
    }
};

// ============================================
// Application Initialization
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize IndexedDB first
    try {
        await FileStorage.init();
        console.log('File storage ready');
    } catch (error) {
        console.error('Error initializing file storage:', error);
    }
    
    // Initialize state
    AppState.init();
    
    // Initialize components
    Navigation.init();
    Modal.init();
    TaskManager.init();
    AssetTracker.init();
    MilestonePlanner.init();
    NotesManager.init();
    ClassesManager.init();
    MechanicsManager.init();
    StoryManager.init();
    Search.init();
    DataManager.init();
    Dashboard.refresh();
    
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', () => {
        AppState.toggleTheme();
    });
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    console.log('🎮 Forgeon initialized successfully!');
});
