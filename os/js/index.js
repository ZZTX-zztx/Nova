const Desktop = {
    windows: [],
    activeWindow: null,
    zIndex: 100,
    minimizedWindows: [],
    currentWallpaper: 'blue',
    fileSystem: {
        '/': {
            type: 'folder',
            children: {
                '文档': { type: 'folder', children: { '笔记.txt': { type: 'file', content: '欢迎使用 Nova OS' } } },
                '图片': { type: 'folder', children: {} },
                '音乐': { type: 'folder', children: {} },
                '视频': { type: 'folder', children: {} },
                '下载': { type: 'folder', children: {} },
                '说明.txt': { type: 'file', content: '这是 Nova OS 的说明文件' }
            }
        }
    },
    currentPath: '/',

    init() {
        this.bindEvents();
        this.updateClock();
        this.updateDate();
        setInterval(() => this.updateClock(), 1000);
        setInterval(() => this.updateDate(), 60000);
        this.initContextMenu();
        this.initTerminal();
        this.initSettings();
        this.initDesktopIcons();
    },

    bindEvents() {
        const startBtn = document.getElementById('start-btn');
        const startMenu = document.getElementById('start-menu');

        startBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            startMenu.classList.toggle('hidden');
        });

        document.addEventListener('click', (e) => {
            if (!startMenu.contains(e.target) && e.target !== startBtn) {
                startMenu.classList.add('hidden');
            }
        });

        document.querySelectorAll('.desktop-icon').forEach(icon => {
            icon.addEventListener('click', (e) => {
                if (this.selectionJustEnded) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
                const app = icon.dataset.app;
                if (app) this.openApp(app);
            });
        });

        document.addEventListener('click', (e) => {
            const startApp = e.target.closest('.start-app');
            if (startApp) {
                const app = startApp.dataset.app;
                if (app === 'shutdown') {
                    window.close();
                    window.location.href = './shutdown';
                    return;
                }
                if (app === 'restart') {
                    window.close();
                    window.location.href = './restart';
                    return;
                }
                if (app) this.openApp(app);
                startMenu.classList.add('hidden');
            }
        });

        document.addEventListener('click', (e) => {
            const taskbarApp = e.target.closest('.taskbar-app');
            if (taskbarApp) {
                const windowId = taskbarApp.dataset.windowId;
                const windowEl = document.getElementById(windowId);
                if (windowEl) {
                    if (windowEl.style.display === 'none') {
                        windowEl.style.display = 'flex';
                        this.focusWindow(windowEl);
                    } else if (this.activeWindow === windowEl) {
                        windowEl.style.display = 'none';
                    } else {
                        this.focusWindow(windowEl);
                    }
                }
            }
        });
    },

    initContextMenu() {
        const desktop = document.getElementById('desktop');

        desktop.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.removeContextMenu();

            const menu = document.createElement('div');
            menu.id = 'context-menu';
            menu.className = 'context-menu';
            menu.innerHTML = `
                <div class="context-item has-submenu" data-action="new">
                    <span class="context-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></span>新建
                    <svg class="submenu-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                    <div class="submenu">
                        <div class="context-item" data-action="newfolder"><span class="context-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg></span>文件夹</div>
                        <div class="context-item" data-action="newfile"><span class="context-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg></span>文本文件</div>
                    </div>
                </div>
                <div class="context-divider"></div>
                <div class="context-item" data-action="refresh"><span class="context-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg></span>刷新</div>
                <div class="context-divider"></div>
                <div class="context-item" data-action="settings"><span class="context-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg></span>设置</div>
                <div class="context-item" data-action="terminal"><span class="context-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg></span>打开终端</div>
                <div class="context-divider"></div>
                <div class="context-item" data-action="about"><span class="context-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></span>关于 Nova OS</div>
            `;

            menu.style.left = e.clientX + 'px';
            menu.style.top = e.clientY + 'px';
            document.body.appendChild(menu);

            const menuRect = menu.getBoundingClientRect();
            if (menuRect.right > window.innerWidth) {
                menu.style.left = (window.innerWidth - menuRect.width - 10) + 'px';
            }
            if (menuRect.bottom > window.innerHeight) {
                menu.style.top = (window.innerHeight - menuRect.height - 10) + 'px';
            }

            menu.querySelectorAll('.context-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = item.dataset.action;
                    if (action && action !== 'new') {
                        this.handleContextAction(action);
                        this.removeContextMenu();
                    }
                });
            });

            setTimeout(() => {
                document.addEventListener('click', () => this.removeContextMenu(), { once: true });
            }, 0);
        });

        this.initSelectionBox(desktop);
    },

    initSelectionBox(desktop) {
        let isSelecting = false;
        let startX, startY;
        let selectionBox = null;
        let hasDragged = false;

        desktop.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            if (e.target.closest('.desktop-icon')) return;
            if (e.target.closest('.context-menu')) return;
            if (e.target.closest('.window')) return;

            isSelecting = true;
            hasDragged = false;
            startX = e.pageX;
            startY = e.pageY;

            selectionBox = document.createElement('div');
            selectionBox.id = 'selection-box';
            selectionBox.style.cssText = `
                position: absolute;
                border: 1px solid rgba(100, 150, 255, 0.6);
                background: rgba(100, 150, 255, 0.15);
                pointer-events: none;
                z-index: 500;
                border-radius: 4px;
            `;
            desktop.appendChild(selectionBox);

            desktop.querySelectorAll('.desktop-icon').forEach(icon => {
                icon.classList.remove('selected');
            });
        });

        document.addEventListener('mousemove', (e) => {
            if (!isSelecting || !selectionBox) return;

            const currentX = e.pageX;
            const currentY = e.pageY;

            const dragDistance = Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2));
            if (dragDistance > 5) {
                hasDragged = true;
            }

            const left = Math.min(startX, currentX);
            const top = Math.min(startY, currentY);
            const width = Math.abs(currentX - startX);
            const height = Math.abs(currentY - startY);

            selectionBox.style.left = left + 'px';
            selectionBox.style.top = top + 'px';
            selectionBox.style.width = width + 'px';
            selectionBox.style.height = height + 'px';

            desktop.querySelectorAll('.desktop-icon').forEach(icon => {
                const rect = icon.getBoundingClientRect();
                const desktopRect = desktop.getBoundingClientRect();
                
                const iconLeft = rect.left - desktopRect.left + desktop.scrollLeft;
                const iconTop = rect.top - desktopRect.top + desktop.scrollTop;
                const iconRight = iconLeft + rect.width;
                const iconBottom = iconTop + rect.height;

                const isSelected = !(
                    iconRight < left ||
                    iconLeft > left + width ||
                    iconBottom < top ||
                    iconTop > top + height
                );
                icon.classList.toggle('selected', isSelected);
            });
        });

        document.addEventListener('mouseup', (e) => {
            if (!isSelecting) return;
            isSelecting = false;

            if (selectionBox) {
                selectionBox.remove();
                selectionBox = null;
            }

            if (hasDragged) {
                this.selectionJustEnded = true;
                setTimeout(() => { this.selectionJustEnded = false; }, 100);
            }
        });
    },

    removeContextMenu() {
        const menu = document.getElementById('context-menu');
        if (menu) menu.remove();
    },

    handleContextAction(action) {
        switch (action) {
            case 'refresh':
                location.reload();
                break;
            case 'newfolder':
                this.createDesktopItem('img/folder.png', '新建文件夹');
                break;
            case 'newfile':
                this.createDesktopItem('img/file.png', '新建文件.txt');
                break;
            case 'calculator':
                this.openApp('calculator');
                break;
            case 'screenshot':
                this.takeScreenshot();
                break;
            case 'settings':
                this.openApp('settings');
                break;
            case 'terminal':
                this.openApp('terminal');
                break;
            case 'about':
                this.showAbout();
                break;
            case 'view-large':
                document.documentElement.style.setProperty('--icon-size', '64px');
                break;
            case 'view-medium':
                document.documentElement.style.setProperty('--icon-size', '48px');
                break;
            case 'view-small':
                document.documentElement.style.setProperty('--icon-size', '32px');
                break;
            case 'sort-name':
                this.sortIconsByName();
                break;
            case 'sort-type':
                this.sortIconsByType();
                break;
            case 'notepad':
                this.openApp('notepad');
                break;
        }
    },

    sortIconsByName() {
        const desktop = document.getElementById('desktop');
        const icons = Array.from(desktop.querySelectorAll('.desktop-icon'));
        icons.sort((a, b) => {
            const nameA = a.querySelector('span').textContent;
            const nameB = b.querySelector('span').textContent;
            return nameA.localeCompare(nameB, 'zh');
        });
        icons.forEach(icon => desktop.appendChild(icon));
    },

    sortIconsByType() {
        const desktop = document.getElementById('desktop');
        const icons = Array.from(desktop.querySelectorAll('.desktop-icon'));
        icons.sort((a, b) => {
            const typeA = a.dataset.app || 'folder';
            const typeB = b.dataset.app || 'folder';
            return typeA.localeCompare(typeB);
        });
        icons.forEach(icon => desktop.appendChild(icon));
    },

    takeScreenshot() {
        const canvas = document.createElement('canvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#1e3c72';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Nova OS 截图', canvas.width / 2, canvas.height / 2);
        const link = document.createElement('a');
        link.download = 'nova-screenshot.png';
        link.href = canvas.toDataURL();
        link.click();
    },

    createDesktopItem(icon, name) {
        const desktop = document.getElementById('desktop');
        const item = document.createElement('div');
        item.className = 'desktop-icon';
        
        const isImage = icon.endsWith('.png') || icon.endsWith('.jpg') || icon.endsWith('.svg');
        const iconHtml = isImage 
            ? `<img src="${icon}" alt="${name}" class="icon-img">`
            : `<div class="icon-img">${icon}</div>`;
        
        item.innerHTML = `
            ${iconHtml}
            <span>${name}</span>
        `;
        
        const gridSize = 80;
        const existingIcons = desktop.querySelectorAll('.desktop-icon');
        const occupiedPositions = new Set();
        
        existingIcons.forEach(existingIcon => {
            const left = parseInt(existingIcon.style.left) || 0;
            const top = parseInt(existingIcon.style.top) || 0;
            const col = Math.round((left - 15) / gridSize);
            const row = Math.round((top - 15) / gridSize);
            occupiedPositions.add(`${col},${row}`);
        });
        
        let col = 0;
        let row = 0;
        while (occupiedPositions.has(`${col},${row}`)) {
            row++;
            if (row > 20) {
                row = 0;
                col++;
            }
        }
        
        item.style.position = 'absolute';
        item.style.left = (col * gridSize + 15) + 'px';
        item.style.top = (row * gridSize + 15) + 'px';
        item.style.margin = '0';
        
        desktop.appendChild(item);
    },

    initDesktopIcons() {
        const desktop = document.getElementById('desktop');
        const icons = Array.from(desktop.querySelectorAll('.desktop-icon'));
        const gridSize = 80;
        const iconPositions = new Map();

        // 初始化图标位置
        icons.forEach((icon, index) => {
            const col = 0;
            const row = index;
            icon.style.position = 'absolute';
            icon.style.left = (col * gridSize + 15) + 'px';
            icon.style.top = (row * gridSize + 15) + 'px';
            icon.style.margin = '0';
            iconPositions.set(icon, { col, row });
        });

        icons.forEach(icon => {
            let isDragging = false;
            let startX, startY, origLeft, origTop;

            icon.addEventListener('mousedown', (e) => {
                if (e.button !== 0) return;
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                const rect = icon.getBoundingClientRect();
                origLeft = rect.left;
                origTop = rect.top;
                icon.style.zIndex = 100;
                icon.style.transition = 'none';
                e.stopPropagation();
                e.preventDefault();
            });

            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                const newX = origLeft + e.clientX - startX;
                const newY = origTop + e.clientY - startY;
                icon.style.left = newX + 'px';
                icon.style.top = newY + 'px';
            });

            document.addEventListener('mouseup', (e) => {
                if (!isDragging) return;
                isDragging = false;
                icon.style.zIndex = '';
                icon.style.transition = '';

                const finalX = parseInt(icon.style.left);
                const finalY = parseInt(icon.style.top);

                const col = Math.max(0, Math.round((finalX - 15) / gridSize));
                const row = Math.max(0, Math.round((finalY - 15) / gridSize));

                // 找到最近的空位
                let targetRow = row;
                let targetCol = col;
                let found = false;

                for (let r = row; r < 50 && !found; r++) {
                    for (let c = 0; c < 20 && !found; c++) {
                        let isOccupied = false;
                        iconPositions.forEach((p, otherIcon) => {
                            if (otherIcon !== icon && p.col === c && p.row === r) {
                                isOccupied = true;
                            }
                        });
                        if (!isOccupied) {
                            targetCol = c;
                            targetRow = r;
                            found = true;
                        }
                    }
                }

                iconPositions.set(icon, { col: targetCol, row: targetRow });
                icon.style.left = (targetCol * gridSize + 15) + 'px';
                icon.style.top = (targetRow * gridSize + 15) + 'px';
            });
        });
    },

    showAbout() {
        const aboutWindow = this.createWindow({
            title: '关于 Nova OS',
            width: 400,
            height: 320,
            content: `
                <div class="about-content">
                    <div class="about-logo">🌟</div>
                    <h2>Nova OS</h2>
                    <p class="about-version">版本 1.0.0</p>
                    <p class="about-desc">基于 Web 的模拟操作系统</p>
                    <div class="about-info">
                        <div class="about-info-item">
                            <span class="label">内核</span>
                            <span class="value">Web/HTML5</span>
                        </div>
                        <div class="about-info-item">
                            <span class="label">分辨率</span>
                            <span class="value">${window.innerWidth} × ${window.innerHeight}</span>
                        </div>
                        <div class="about-info-item">
                            <span class="label">语言</span>
                            <span class="value">JavaScript</span>
                        </div>
                    </div>
                    <p class="about-copyright">© 2026 Nova OS Team</p>
                </div>
            `
        });
        document.body.appendChild(aboutWindow);
        this.windows.push(aboutWindow);
        this.focusWindow(aboutWindow);
        this.makeDraggable(aboutWindow);
    },

    initTerminal() {
        this.terminalHistory = [];
        this.terminalHistoryIndex = -1;
        this.terminalCommands = {
            help: () => `可用命令:\n  help      - 显示帮助\n  clear     - 清屏\n  date      - 显示日期\n  echo      - 输出文本\n  whoami    - 显示用户\n  ls        - 列出文件\n  pwd       - 显示路径\n  cd        - 切换目录\n  cat       - 查看文件\n  mkdir     - 创建目录\n  touch     - 创建文件\n  neofetch  - 系统信息\n  calc      - 计算器`,
            clear: () => '__CLEAR__',
            date: () => new Date().toLocaleString('zh-CN'),
            whoami: () => 'nova',
            pwd: () => this.currentPath,
            ls: (args) => {
                const path = args[0] || this.currentPath;
                const dir = this.getDir(path);
                if (!dir) return `目录不存在: ${path}`;
                return Object.keys(dir.children || {}).join('  ') || '(空目录)';
            },
            cd: (args) => {
                if (!args[0] || args[0] === '~') {
                    this.currentPath = '/';
                    return '';
                }
                if (args[0] === '..') {
                    const parts = this.currentPath.split('/').filter(p => p);
                    parts.pop();
                    this.currentPath = '/' + parts.join('/');
                    if (!this.currentPath.startsWith('/')) this.currentPath = '/';
                    return '';
                }
                const newPath = this.currentPath === '/' ? '/' + args[0] : this.currentPath + '/' + args[0];
                const dir = this.getDir(newPath);
                if (dir && dir.type === 'folder') {
                    this.currentPath = newPath;
                    return '';
                }
                return `目录不存在: ${args[0]}`;
            },
            cat: (args) => {
                if (!args[0]) return '用法: cat <文件名>';
                const filePath = this.currentPath === '/' ? '/' + args[0] : this.currentPath + '/' + args[0];
                const file = this.getDir(filePath);
                if (file && file.type === 'file') {
                    return file.content || '(空文件)';
                }
                return `文件不存在: ${args[0]}`;
            },
            mkdir: (args) => {
                if (!args[0]) return '用法: mkdir <目录名>';
                const dir = this.getDir(this.currentPath);
                if (dir) {
                    dir.children[args[0]] = { type: 'folder', children: {} };
                    return `已创建目录: ${args[0]}`;
                }
                return '创建失败';
            },
            touch: (args) => {
                if (!args[0]) return '用法: touch <文件名>';
                const dir = this.getDir(this.currentPath);
                if (dir) {
                    dir.children[args[0]] = { type: 'file', content: '' };
                    return `已创建文件: ${args[0]}`;
                }
                return '创建失败';
            },
            echo: (args) => args.join(' '),
            calc: (args) => {
                try {
                    const expr = args.join(' ');
                    const result = Function('"use strict"; return (' + expr + ')')();
                    return `${expr} = ${result}`;
                } catch (e) {
                    return '计算错误: 请输入有效的表达式，如 calc 2 + 3';
                }
            },
            neofetch: () => `
   ╭──────────╮      nova@nova-os
   │  Nova OS │      ─────────────
   │   🌟     │      OS: Nova OS 1.0
   ──────────╯      Kernel: Web/HTML5
                     Shell: Nova Terminal
                     Resolution: ${window.innerWidth}x${window.innerHeight}
                     Theme: Dark
                     CPU: Web Engine
                     Memory: ${navigator.deviceMemory || '?'}GB
            `
        };
    },

    getDir(path) {
        const parts = path.split('/').filter(p => p);
        let current = this.fileSystem['/'];
        for (const part of parts) {
            if (current.children && current.children[part]) {
                current = current.children[part];
            } else {
                return null;
            }
        }
        return current;
    },

    openApp(appName) {
        const appConfig = this.getAppConfig(appName);
        if (!appConfig) return;

        const windowEl = this.createWindow(appConfig);
        document.body.appendChild(windowEl);
        this.windows.push(windowEl);
        this.focusWindow(windowEl);
        this.makeDraggable(windowEl);
        this.makeResizable(windowEl);
        this.addTaskbarApp(windowEl, appConfig.title);

        if (appName === 'terminal') {
            this.initTerminalWindow(windowEl);
        }
        if (appName === 'notepad') {
            this.initNotepadWindow(windowEl);
        }
        if (appName === 'calculator') {
            this.initCalculatorWindow(windowEl);
        }
        if (appName === 'explorer') {
            this.initExplorerWindow(windowEl);
        }
        if (appName === 'browser') {
            this.initBrowserWindow(windowEl);
        }
    },

    initExplorerWindow(windowEl) {
        this.renderExplorer(windowEl, '/');
        this.initExplorerSelection(windowEl);

        windowEl.addEventListener('click', (e) => {
            const fileItem = e.target.closest('.file-item');
            if (fileItem) {
                const path = fileItem.dataset.path;
                const type = fileItem.dataset.type;
                if (type === 'folder') {
                    this.renderExplorer(windowEl, path);
                    this.initExplorerSelection(windowEl);
                } else if (type === 'file') {
                    const file = this.getDir(path);
                    if (file) {
                        this.openFileInNotepad(file.content || '', path.split('/').pop());
                    }
                }
            }

            const backBtn = e.target.closest('.explorer-back');
            if (backBtn) {
                const currentPath = windowEl.querySelector('.explorer-path').textContent;
                const parts = currentPath.split('/').filter(p => p);
                parts.pop();
                const parentPath = '/' + parts.join('/');
                this.renderExplorer(windowEl, parentPath || '/');
            }
        });
    },

    initExplorerSelection(windowEl) {
        const contentEl = windowEl.querySelector('.explorer-content');
        if (!contentEl) return;

        let isSelecting = false;
        let startX, startY;
        let selectionBox = null;

        contentEl.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            if (e.target.closest('.file-item')) return;

            isSelecting = true;
            startX = e.clientX;
            startY = e.clientY;

            selectionBox = document.createElement('div');
            selectionBox.className = 'explorer-selection-box';
            selectionBox.style.cssText = `
                position: fixed;
                border: 1px solid rgba(100, 150, 255, 0.6);
                background: rgba(100, 150, 255, 0.15);
                pointer-events: none;
                z-index: 1000;
                border-radius: 4px;
            `;
            document.body.appendChild(selectionBox);

            contentEl.querySelectorAll('.file-item').forEach(item => {
                item.classList.remove('selected');
            });
        });

        document.addEventListener('mousemove', (e) => {
            if (!isSelecting || !selectionBox) return;

            const currentX = e.clientX;
            const currentY = e.clientY;

            const left = Math.min(startX, currentX);
            const top = Math.min(startY, currentY);
            const width = Math.abs(currentX - startX);
            const height = Math.abs(currentY - startY);

            selectionBox.style.left = left + 'px';
            selectionBox.style.top = top + 'px';
            selectionBox.style.width = width + 'px';
            selectionBox.style.height = height + 'px';

            contentEl.querySelectorAll('.file-item').forEach(item => {
                const rect = item.getBoundingClientRect();
                const isSelected = !(
                    rect.right < left ||
                    rect.left > left + width ||
                    rect.bottom < top ||
                    rect.top > top + height
                );
                item.classList.toggle('selected', isSelected);
            });
        });

        document.addEventListener('mouseup', () => {
            if (!isSelecting) return;
            isSelecting = false;

            if (selectionBox) {
                selectionBox.remove();
                selectionBox = null;
            }

            const selectedItems = contentEl.querySelectorAll('.file-item.selected');
            if (selectedItems.length === 1) {
                const path = selectedItems[0].dataset.path;
                const type = selectedItems[0].dataset.type;
                if (type === 'folder') {
                    this.renderExplorer(windowEl, path);
                    this.initExplorerSelection(windowEl);
                } else if (type === 'file') {
                    const file = this.getDir(path);
                    if (file) {
                        this.openFileInNotepad(file.content || '', path.split('/').pop());
                    }
                }
            }

            contentEl.querySelectorAll('.file-item').forEach(item => {
                item.classList.remove('selected');
            });
        });

        this.initFileItemDrag(contentEl);
        this.initExplorerContextMenu(windowEl, contentEl);
    },

    initFileItemDrag(contentEl) {
        const fileItems = contentEl.querySelectorAll('.file-item');
        fileItems.forEach(item => {
            let isDragging = false;
            let startX, startY, offsetX, offsetY;
            let hasMoved = false;

            item.addEventListener('mousedown', (e) => {
                if (e.button !== 0) return;
                isDragging = true;
                hasMoved = false;
                startX = e.clientX;
                startY = e.clientY;
                
                const rect = item.getBoundingClientRect();
                offsetX = e.clientX - rect.left;
                offsetY = e.clientY - rect.top;
            });

            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                
                const moveDistance = Math.sqrt(Math.pow(e.clientX - startX, 2) + Math.pow(e.clientY - startY, 2));
                if (moveDistance > 5 && !hasMoved) {
                    hasMoved = true;
                    const rect = item.getBoundingClientRect();
                    item.style.position = 'fixed';
                    item.style.left = rect.left + 'px';
                    item.style.top = rect.top + 'px';
                    item.style.width = rect.width + 'px';
                    item.style.zIndex = 1000;
                    item.style.background = 'rgba(100, 150, 255, 0.3)';
                    item.style.margin = '0';
                }
                
                if (hasMoved) {
                    item.style.left = (e.clientX - offsetX) + 'px';
                    item.style.top = (e.clientY - offsetY) + 'px';
                }
            });

            document.addEventListener('mouseup', (e) => {
                if (!isDragging) return;
                isDragging = false;
                
                if (hasMoved) {
                    item.style.position = '';
                    item.style.left = '';
                    item.style.top = '';
                    item.style.width = '';
                    item.style.zIndex = '';
                    item.style.background = '';
                    item.style.margin = '';
                }
            });
        });
    },

    initExplorerContextMenu(windowEl, contentEl) {
        contentEl.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.removeContextMenu();

            const fileItem = e.target.closest('.file-item');
            let menuHTML = '';

            if (fileItem) {
                const name = fileItem.querySelector('span').textContent;
                const type = fileItem.dataset.type;
                fileItem.classList.add('selected');

                menuHTML = `
                    <div class="context-item" data-action="open">📂 打开</div>
                    <div class="context-divider"></div>
                    <div class="context-item" data-action="rename">✏️ 重命名</div>
                    <div class="context-item" data-action="delete">🗑️ 删除</div>
                    <div class="context-divider"></div>
                    <div class="context-item" data-action="properties">ℹ️ 属性</div>
                `;
            } else {
                menuHTML = `
                    <div class="context-item" data-action="view-large">🔲 大图标</div>
                    <div class="context-item" data-action="view-medium">🔳 中等图标</div>
                    <div class="context-item" data-action="view-small">▪️ 小图标</div>
                    <div class="context-divider"></div>
                    <div class="context-item" data-action="sort-name">🔤 按名称排序</div>
                    <div class="context-item" data-action="sort-type">📋 按类型排序</div>
                    <div class="context-divider"></div>
                    <div class="context-item" data-action="newfolder">📁 新建文件夹</div>
                    <div class="context-item" data-action="newfile">📄 新建文件</div>
                    <div class="context-divider"></div>
                    <div class="context-item" data-action="refresh">🔄 刷新</div>
                `;
            }

            const menu = document.createElement('div');
            menu.id = 'context-menu';
            menu.className = 'context-menu';
            menu.innerHTML = menuHTML;

            menu.style.left = e.clientX + 'px';
            menu.style.top = e.clientY + 'px';
            document.body.appendChild(menu);

            const menuRect = menu.getBoundingClientRect();
            if (menuRect.right > window.innerWidth) {
                menu.style.left = (window.innerWidth - menuRect.width - 10) + 'px';
            }
            if (menuRect.bottom > window.innerHeight) {
                menu.style.top = (window.innerHeight - menuRect.height - 10) + 'px';
            }

            menu.querySelectorAll('.context-item').forEach(item => {
                item.addEventListener('click', () => {
                    const action = item.dataset.action;
                    this.handleExplorerAction(action, windowEl, fileItem);
                    this.removeContextMenu();
                });
            });

            setTimeout(() => {
                document.addEventListener('click', () => this.removeContextMenu(), { once: true });
            }, 0);
        });
    },

    handleExplorerAction(action, windowEl, fileItem) {
        const pathEl = windowEl.querySelector('.explorer-path');
        const currentPath = pathEl ? pathEl.textContent : '/';

        switch (action) {
            case 'open':
                if (fileItem) {
                    const path = fileItem.dataset.path;
                    const type = fileItem.dataset.type;
                    if (type === 'folder') {
                        this.renderExplorer(windowEl, path);
                        this.initExplorerSelection(windowEl);
                    } else if (type === 'file') {
                        const file = this.getDir(path);
                        if (file) {
                            this.openFileInNotepad(file.content || '', path.split('/').pop());
                        }
                    }
                }
                break;
            case 'rename':
                if (fileItem) {
                    const name = fileItem.querySelector('span').textContent;
                    const newName = prompt('请输入新名称:', name);
                    if (newName && newName !== name) {
                        const oldPath = fileItem.dataset.path;
                        const parentPath = oldPath.substring(0, oldPath.lastIndexOf('/')) || '/';
                        const parentDir = this.getDir(parentPath);
                        if (parentDir && parentDir.children) {
                            parentDir.children[newName] = parentDir.children[name];
                            delete parentDir.children[name];
                            this.renderExplorer(windowEl, currentPath);
                            this.initExplorerSelection(windowEl);
                        }
                    }
                }
                break;
            case 'delete':
                if (fileItem) {
                    const name = fileItem.querySelector('span').textContent;
                    if (confirm(`确定要删除 "${name}" 吗？`)) {
                        const path = fileItem.dataset.path;
                        const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
                        const parentDir = this.getDir(parentPath);
                        if (parentDir && parentDir.children) {
                            delete parentDir.children[name];
                            this.renderExplorer(windowEl, currentPath);
                            this.initExplorerSelection(windowEl);
                        }
                    }
                }
                break;
            case 'properties':
                if (fileItem) {
                    const name = fileItem.querySelector('span').textContent;
                    const type = fileItem.dataset.type;
                    const path = fileItem.dataset.path;
                    const file = this.getDir(path);
                    let info = `名称: ${name}\n类型: ${type === 'folder' ? '文件夹' : '文件'}\n路径: ${path}`;
                    if (file && file.type === 'file') {
                        info += `\n大小: ${file.content ? file.content.length : 0} 字符`;
                    }
                    alert(info);
                }
                break;
            case 'newfolder':
                const folderName = prompt('请输入文件夹名称:', '新建文件夹');
                if (folderName) {
                    const dir = this.getDir(currentPath);
                    if (dir) {
                        dir.children[folderName] = { type: 'folder', children: {} };
                        this.renderExplorer(windowEl, currentPath);
                        this.initExplorerSelection(windowEl);
                    }
                }
                break;
            case 'newfile':
                const fileName = prompt('请输入文件名称:', '新建文件.txt');
                if (fileName) {
                    const dir = this.getDir(currentPath);
                    if (dir) {
                        dir.children[fileName] = { type: 'file', content: '' };
                        this.renderExplorer(windowEl, currentPath);
                        this.initExplorerSelection(windowEl);
                    }
                }
                break;
            case 'refresh':
                this.renderExplorer(windowEl, currentPath);
                this.initExplorerSelection(windowEl);
                break;
            case 'view-large':
                const contentEl1 = windowEl.querySelector('.explorer-content');
                if (contentEl1) contentEl1.style.gridTemplateColumns = 'repeat(auto-fill, minmax(100px, 1fr))';
                break;
            case 'view-medium':
                const contentEl2 = windowEl.querySelector('.explorer-content');
                if (contentEl2) contentEl2.style.gridTemplateColumns = 'repeat(auto-fill, minmax(80px, 1fr))';
                break;
            case 'view-small':
                const contentEl3 = windowEl.querySelector('.explorer-content');
                if (contentEl3) contentEl3.style.gridTemplateColumns = 'repeat(auto-fill, minmax(60px, 1fr))';
                break;
            case 'sort-name':
                this.sortExplorerItems(windowEl, currentPath, 'name');
                break;
            case 'sort-type':
                this.sortExplorerItems(windowEl, currentPath, 'type');
                break;
        }
    },

    sortExplorerItems(windowEl, path, sortBy) {
        const dir = this.getDir(path);
        if (!dir || !dir.children) return;

        const items = Object.entries(dir.children);
        items.sort((a, b) => {
            if (sortBy === 'name') {
                return a[0].localeCompare(b[0], 'zh');
            } else {
                if (a[1].type !== b[1].type) {
                    return a[1].type === 'folder' ? -1 : 1;
                }
                return a[0].localeCompare(b[0], 'zh');
            }
        });

        dir.children = Object.fromEntries(items);
        this.renderExplorer(windowEl, path);
        this.initExplorerSelection(windowEl);
    },

    renderExplorer(windowEl, path) {
        const dir = this.getDir(path);
        if (!dir) return;

        const contentEl = windowEl.querySelector('.window-content');
        const items = Object.entries(dir.children || {});

        let html = `
            <div class="explorer">
                <div class="explorer-toolbar">
                    <button class="explorer-back">← 返回</button>
                    <span class="explorer-path">${path}</span>
                </div>
                <div class="explorer-content">
        `;

        if (items.length === 0) {
            html += '<div class="explorer-empty">此文件夹为空</div>';
        } else {
            items.forEach(([name, item]) => {
                const icon = item.type === 'folder' ? '📁' : '📄';
                const fullPath = path === '/' ? '/' + name : path + '/' + name;
                html += `
                    <div class="file-item" data-path="${fullPath}" data-type="${item.type}">
                        <div class="file-icon">${icon}</div>
                        <span>${name}</span>
                    </div>
                `;
            });
        }

        html += '</div></div>';
        contentEl.innerHTML = html;
    },

    openFileInNotepad(content, filename) {
        const notepadWindow = this.createWindow({
            title: filename + ' - 记事本',
            width: 500,
            height: 350,
            content: `
                <div class="notepad">
                    <div class="notepad-toolbar">
                        <button class="notepad-save">保存</button>
                    </div>
                    <textarea class="notepad-textarea">${content}</textarea>
                    <div class="notepad-status">行数: 1 | 字符: ${content.length}</div>
                </div>
            `
        });
        document.body.appendChild(notepadWindow);
        this.windows.push(notepadWindow);
        this.focusWindow(notepadWindow);
        this.makeDraggable(notepadWindow);
        this.addTaskbarApp(notepadWindow, filename + ' - 记事本');
        this.initNotepadWindow(notepadWindow);
    },

    initBrowserWindow(windowEl) {
        const urlInput = windowEl.querySelector('.browser-url');
        const contentEl = windowEl.querySelector('.browser-content');
        const goBtn = windowEl.querySelector('.browser-go');

        const navigate = () => {
            let url = urlInput.value.trim();
            if (!url) return;
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            urlInput.value = url;
            contentEl.innerHTML = `<iframe src="${url}" style="width:100%;height:100%;border:none;" sandbox="allow-same-origin allow-scripts allow-forms"></iframe>`;
        };

        goBtn.addEventListener('click', navigate);
        urlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') navigate();
        });
    },

    initTerminalWindow(windowEl) {
        const input = windowEl.querySelector('.terminal-input');
        const output = windowEl.querySelector('.terminal-output');

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const cmd = input.value.trim();
                if (cmd) {
                    this.terminalHistory.push(cmd);
                    this.terminalHistoryIndex = this.terminalHistory.length;

                    const cmdLine = document.createElement('div');
                    cmdLine.innerHTML = `<span style="color:#0f0;">nova@os:${this.currentPath}$ </span>${cmd}`;
                    output.appendChild(cmdLine);

                    const parts = cmd.split(' ');
                    const command = parts[0].toLowerCase();
                    const args = parts.slice(1);

                    if (command === 'exit') {
                        windowEl.remove();
                        this.windows = this.windows.filter(w => w !== windowEl);
                        const taskbarApp = document.querySelector(`.taskbar-app[data-window-id="${windowEl.id}"]`);
                        if (taskbarApp) taskbarApp.remove();
                        return;
                    } else if (this.terminalCommands[command]) {
                        const result = this.terminalCommands[command](args);
                        if (result === '__CLEAR__') {
                            output.innerHTML = '';
                        } else if (result) {
                            const resultLine = document.createElement('div');
                            resultLine.style.whiteSpace = 'pre-wrap';
                            resultLine.textContent = result;
                            output.appendChild(resultLine);
                        }
                    } else if (cmd) {
                        const errorLine = document.createElement('div');
                        errorLine.style.color = '#f55';
                        errorLine.textContent = `命令未找到: ${command}`;
                        output.appendChild(errorLine);
                    }

                    input.value = '';
                    output.scrollTop = output.scrollHeight;
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (this.terminalHistoryIndex > 0) {
                    this.terminalHistoryIndex--;
                    input.value = this.terminalHistory[this.terminalHistoryIndex];
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (this.terminalHistoryIndex < this.terminalHistory.length - 1) {
                    this.terminalHistoryIndex++;
                    input.value = this.terminalHistory[this.terminalHistoryIndex];
                } else {
                    this.terminalHistoryIndex = this.terminalHistory.length;
                    input.value = '';
                }
            }
        });

        input.focus();
    },

    initCalculatorWindow(windowEl) {
        let display = windowEl.querySelector('.calc-display');
        let currentInput = '0';
        let previousInput = '';
        let operation = null;
        let shouldResetDisplay = false;

        const updateDisplay = () => {
            display.textContent = currentInput;
        };

        windowEl.addEventListener('click', (e) => {
            const btn = e.target.closest('.calc-btn');
            if (!btn) return;

            const value = btn.dataset.value;
            const type = btn.dataset.type;

            if (type === 'number') {
                if (shouldResetDisplay) {
                    currentInput = value;
                    shouldResetDisplay = false;
                } else {
                    currentInput = currentInput === '0' ? value : currentInput + value;
                }
            } else if (type === 'operator') {
                if (operation && !shouldResetDisplay) {
                    currentInput = this.calculate(previousInput, currentInput, operation).toString();
                }
                previousInput = currentInput;
                operation = value;
                shouldResetDisplay = true;
            } else if (type === 'equals') {
                if (operation) {
                    currentInput = this.calculate(previousInput, currentInput, operation).toString();
                    operation = null;
                    previousInput = '';
                    shouldResetDisplay = true;
                }
            } else if (type === 'clear') {
                currentInput = '0';
                previousInput = '';
                operation = null;
            } else if (type === 'delete') {
                currentInput = currentInput.length > 1 ? currentInput.slice(0, -1) : '0';
            } else if (type === 'decimal') {
                if (!currentInput.includes('.')) {
                    currentInput += '.';
                }
            }

            updateDisplay();
        });
    },

    calculate(a, b, op) {
        a = parseFloat(a);
        b = parseFloat(b);
        switch (op) {
            case '+': return a + b;
            case '-': return a - b;
            case '×': return a * b;
            case '÷': return b !== 0 ? a / b : '错误';
            default: return b;
        }
    },

    initNotepadWindow(windowEl) {
        const textarea = windowEl.querySelector('.notepad-textarea');
        const statusbar = windowEl.querySelector('.notepad-status');

        if (textarea && statusbar) {
            textarea.addEventListener('input', () => {
                const lines = textarea.value.split('\n').length;
                const chars = textarea.value.length;
                statusbar.textContent = `行数: ${lines} | 字符: ${chars}`;
            });
        }

        const saveBtn = windowEl.querySelector('.notepad-save');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                if (textarea) this.saveNotepad(textarea.value);
            });
        }
    },

    saveNotepad(content) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'untitled.txt';
        a.click();
        URL.revokeObjectURL(url);
    },

    initSettings() {
        document.addEventListener('change', (e) => {
            if (e.target.id === 'wallpaper-select') {
                this.changeWallpaper(e.target.value);
            }
        });
    },

    changeWallpaper(type) {
        const desktop = document.getElementById('desktop');
        const wallpapers = {
            blue: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
            purple: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            green: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            dark: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
            sunset: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
        };
        if (wallpapers[type]) {
            desktop.style.background = wallpapers[type];
            this.currentWallpaper = type;
        }
    },

    getAppConfig(appName) {
        const apps = {
            explorer: {
                title: '文件管理器',
                width: 650,
                height: 450,
                content: '<div class="explorer"><div class="explorer-toolbar"><button class="explorer-back">← 返回</button><span class="explorer-path">/</span></div><div class="explorer-content"></div></div>'
            },
            notepad: {
                title: '记事本',
                width: 500,
                height: 350,
                content: `
                    <div class="notepad">
                        <div class="notepad-toolbar">
                            <button class="notepad-save">💾 保存</button>
                        </div>
                        <textarea class="notepad-textarea" placeholder="在此输入文本..."></textarea>
                        <div class="notepad-status">行数: 1 | 字符: 0</div>
                    </div>
                `
            },
            browser: {
                title: '浏览器',
                width: 750,
                height: 500,
                content: `
                    <div class="browser">
                        <div class="browser-bar">
                            <input type="text" class="browser-url" placeholder="输入网址..." value="">
                            <button class="browser-go">访问</button>
                        </div>
                        <div class="browser-content">
                            <div class="browser-home">
                                <h2>🌐 Nova 浏览器</h2>
                                <p>输入网址开始浏览</p>
                            </div>
                        </div>
                    </div>
                `
            },
            settings: {
                title: '设置',
                width: 450,
                height: 420,
                content: `
                    <div class="settings">
                        <h3>⚙️ 系统设置</h3>
                        <div class="setting-item">
                            <label>壁纸</label>
                            <select id="wallpaper-select">
                                <option value="blue">蓝色渐变</option>
                                <option value="purple">紫色渐变</option>
                                <option value="green">绿色渐变</option>
                                <option value="dark">深色渐变</option>
                                <option value="sunset">日落渐变</option>
                            </select>
                        </div>
                        <div class="setting-item">
                            <label>系统信息</label>
                            <span>Nova OS v1.0</span>
                        </div>
                        <div class="setting-item">
                            <label>分辨率</label>
                            <span>${window.innerWidth} × ${window.innerHeight}</span>
                        </div>
                        <div class="setting-item">
                            <label>浏览器</label>
                            <span>${navigator.userAgent.split(' ').pop()}</span>
                        </div>
                    </div>
                `
            },
            terminal: {
                title: '终端',
                width: 600,
                height: 400,
                content: `
                    <div class="terminal">
                        <div class="terminal-output">
                            <div style="color:#0af;">══════════════════════════════╗</div>
                            <div style="color:#0af;">║     Nova OS Terminal v1.0     ║</div>
                            <div style="color:#0af;">╚══════════════════════════════╝</div>
                            <div>输入 'help' 查看可用命令</div>
                            <div>─────────────────────────────────</div>
                        </div>
                        <div class="terminal-input-line">
                            <span>nova@os:/$ </span>
                            <input type="text" class="terminal-input" autofocus>
                        </div>
                    </div>
                `
            },
            calculator: {
                title: '计算器',
                width: 320,
                height: 420,
                content: `
                    <div class="calculator">
                        <div class="calc-display">0</div>
                        <div class="calc-buttons">
                            <button class="calc-btn" data-type="clear" data-value="C">C</button>
                            <button class="calc-btn" data-type="delete" data-value="">⌫</button>
                            <button class="calc-btn" data-type="operator" data-value="÷">÷</button>
                            <button class="calc-btn" data-type="operator" data-value="×">×</button>
                            <button class="calc-btn" data-type="number" data-value="7">7</button>
                            <button class="calc-btn" data-type="number" data-value="8">8</button>
                            <button class="calc-btn" data-type="number" data-value="9">9</button>
                            <button class="calc-btn" data-type="operator" data-value="-">-</button>
                            <button class="calc-btn" data-type="number" data-value="4">4</button>
                            <button class="calc-btn" data-type="number" data-value="5">5</button>
                            <button class="calc-btn" data-type="number" data-value="6">6</button>
                            <button class="calc-btn" data-type="operator" data-value="+">+</button>
                            <button class="calc-btn" data-type="number" data-value="1">1</button>
                            <button class="calc-btn" data-type="number" data-value="2">2</button>
                            <button class="calc-btn" data-type="number" data-value="3">3</button>
                            <button class="calc-btn" data-type="equals" data-value="=" rowspan="2">=</button>
                            <button class="calc-btn" data-type="number" data-value="0" style="grid-column: span 2;">0</button>
                            <button class="calc-btn" data-type="decimal" data-value=".">.</button>
                        </div>
                    </div>
                `
            }
        };
        return apps[appName];
    },

    createWindow(config) {
        const windowId = 'window-' + Date.now();
        const windowEl = document.createElement('div');
        windowEl.id = windowId;
        windowEl.className = 'window';
        windowEl.style.width = config.width + 'px';
        windowEl.style.height = config.height + 'px';
        windowEl.style.left = (100 + Math.random() * 200) + 'px';
        windowEl.style.top = (50 + Math.random() * 100) + 'px';

        const headerEl = document.createElement('div');
        headerEl.className = 'window-header';
        headerEl.innerHTML = `
            <span class="window-title">${config.title}</span>
            <div class="window-controls">
                <button class="window-btn btn-minimize" title="最小化"></button>
                <button class="window-btn btn-maximize" title="最大化"></button>
                <button class="window-btn btn-close" title="关闭"></button>
            </div>
        `;

        const contentEl = document.createElement('div');
        contentEl.className = 'window-content';
        contentEl.innerHTML = config.content;

        windowEl.appendChild(headerEl);
        windowEl.appendChild(contentEl);

        windowEl.querySelector('.btn-close').addEventListener('click', () => {
            windowEl.remove();
            this.windows = this.windows.filter(w => w !== windowEl);
            const taskbarApp = document.querySelector(`.taskbar-app[data-window-id="${windowId}"]`);
            if (taskbarApp) taskbarApp.remove();
        });

        windowEl.querySelector('.btn-minimize').addEventListener('click', () => {
            windowEl.style.display = 'none';
        });

        windowEl.querySelector('.btn-maximize').addEventListener('click', () => {
            if (windowEl.dataset.maximized === 'true') {
                windowEl.style.width = config.width + 'px';
                windowEl.style.height = config.height + 'px';
                windowEl.style.left = windowEl.dataset.origLeft;
                windowEl.style.top = windowEl.dataset.origTop;
                windowEl.dataset.maximized = 'false';
            } else {
                windowEl.dataset.origLeft = windowEl.style.left;
                windowEl.dataset.origTop = windowEl.style.top;
                windowEl.style.width = '100vw';
                windowEl.style.height = 'calc(100vh - 45px)';
                windowEl.style.left = '0';
                windowEl.style.top = '0';
                windowEl.dataset.maximized = 'true';
            }
        });

        windowEl.addEventListener('mousedown', () => this.focusWindow(windowEl));

        return windowEl;
    },

    makeResizable(windowEl) {
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        windowEl.appendChild(resizeHandle);

        let isResizing = false;
        let startX, startY, startWidth, startHeight;

        resizeHandle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = windowEl.offsetWidth;
            startHeight = windowEl.offsetHeight;
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const newWidth = Math.max(300, startWidth + e.clientX - startX);
            const newHeight = Math.max(200, startHeight + e.clientY - startY);
            windowEl.style.width = newWidth + 'px';
            windowEl.style.height = newHeight + 'px';
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
        });
    },

    addTaskbarApp(windowEl, title) {
        const taskbarApps = document.getElementById('taskbar-apps');
        const appEl = document.createElement('div');
        appEl.className = 'taskbar-app';
        appEl.dataset.windowId = windowEl.id;
        appEl.textContent = title;
        taskbarApps.appendChild(appEl);
    },

    focusWindow(windowEl) {
        this.zIndex++;
        windowEl.style.zIndex = this.zIndex;
        this.activeWindow = windowEl;

        document.querySelectorAll('.taskbar-app').forEach(app => {
            app.style.background = app.dataset.windowId === windowEl.id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)';
        });
    },

    makeDraggable(windowEl) {
        const header = windowEl.querySelector('.window-header');
        let isDragging = false;
        let startX, startY, startLeft, startTop;

        header.addEventListener('mousedown', (e) => {
            if (windowEl.dataset.maximized === 'true') return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = windowEl.offsetLeft;
            startTop = windowEl.offsetTop;
            windowEl.style.transition = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            windowEl.style.left = (startLeft + e.clientX - startX) + 'px';
            windowEl.style.top = (startTop + e.clientY - startY) + 'px';
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            windowEl.style.transition = '';
        });

        header.addEventListener('dblclick', () => {
            windowEl.querySelector('.btn-maximize').click();
        });
    },

    updateClock() {
        const clock = document.getElementById('clock');
        if (clock) {
            const now = new Date();
            clock.textContent = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        }
    },

    updateDate() {
        const dateEl = document.getElementById('date');
        if (dateEl) {
            const now = new Date();
            dateEl.textContent = now.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
        }
    }
};

document.addEventListener('DOMContentLoaded', () => Desktop.init());