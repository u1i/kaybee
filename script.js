document.addEventListener('DOMContentLoaded', () => {
    const APP_VERSION = 'v1.2.2-nuclear';
    console.log('Kaybee Loaded:', APP_VERSION);

    // GLOBAL ERROR TRAP - For diagnosing silent failures in file://
    window.onerror = function (msg, url, line, col, error) {
        alert(`CRITICAL ERROR:\n${msg}\nLine: ${line}\nURL: ${url}`);
        return false;
    };

    // Safe Storage Wrapper
    const safeStorage = {
        _memory: {},
        _isAvailable: null,

        isAvailable() {
            if (this._isAvailable !== null) return this._isAvailable;
            try {
                const test = '__storage_test__';
                localStorage.setItem(test, test);
                localStorage.removeItem(test);
                this._isAvailable = true;
            } catch (e) {
                console.warn('localStorage access denied/failed. Falling back to memory.', e);
                this._isAvailable = false;
            }
            return this._isAvailable;
        },

        getItem(key) {
            if (this.isAvailable()) return localStorage.getItem(key);
            return this._memory[key] || null;
        },

        setItem(key, value) {
            if (this.isAvailable()) {
                localStorage.setItem(key, value);
            } else {
                this._memory[key] = value;
            }
        },

        removeItem(key) {
            if (this.isAvailable()) {
                localStorage.removeItem(key);
            } else {
                delete this._memory[key];
            }
        }
    };

    const board = document.getElementById('board');
    const addColumnBtn = document.getElementById('add-column-btn');
    const trashZone = document.getElementById('trash-zone');
    const fontBtn = document.getElementById('font-btn');
    const themeBtn = document.getElementById('theme-btn');

    let currentBoardId = '1';
    // Use safeStorage instead of direct localStorage
    let boardsMeta = JSON.parse(safeStorage.getItem('kaybee-boards-meta') || '[]');

    // Initialize/Migrate
    function init() {
        // Handle URL Hash
        const hash = window.location.hash.substring(1);
        if (hash) {
            currentBoardId = hash;
        } else {
            window.location.hash = '1';
            currentBoardId = '1';
        }

        // Migration: If board 1 is empty but legacy data exists
        if (currentBoardId === '1' && !safeStorage.getItem('kaybee-board-1')) {
            const legacyData = safeStorage.getItem('kaybee-data');
            if (legacyData) {
                safeStorage.setItem('kaybee-board-1', legacyData);
                safeStorage.removeItem('kaybee-data'); // Clean up
            }
        }

        // Initialize Meta if empty
        if (boardsMeta.length === 0) {
            boardsMeta = [{ id: '1', name: 'Board 1' }];
            saveMeta();
        } else {
            // Ensure current board exists in meta
            if (!boardsMeta.find(b => b.id === currentBoardId)) {
                boardsMeta.push({ id: currentBoardId, name: `Board ${currentBoardId}` });
                saveMeta();
            }
        }

        loadBoardData();
        renderBoardSwitcher();
    }

    function loadBoardData() {
        const savedData = safeStorage.getItem(`kaybee-board-${currentBoardId}`);
        if (savedData) {
            data = JSON.parse(savedData);
        } else {
            // Default empty board structure
            data = {
                columns: [
                    { id: 'col-1', title: 'To Do', cards: [] },
                    { id: 'col-2', title: 'Doing', cards: [] },
                    { id: 'col-3', title: 'Done', cards: [] }
                ]
            };
            saveData();
        }
    }

    function saveData() {
        safeStorage.setItem(`kaybee-board-${currentBoardId}`, JSON.stringify(data));
    }

    function saveMeta() {
        safeStorage.setItem('kaybee-boards-meta', JSON.stringify(boardsMeta));
    }

    // Hash Change Listener
    window.addEventListener('hashchange', () => {
        const newHash = window.location.hash.substring(1);
        if (newHash && newHash !== currentBoardId) {
            currentBoardId = newHash;
            // Ensure exists in meta
            if (!boardsMeta.find(b => b.id === currentBoardId)) {
                boardsMeta.push({ id: currentBoardId, name: `Board ${currentBoardId}` });
                saveMeta();
            }
            loadBoardData();
            renderBoard(); // Re-render main board
            renderBoardSwitcher(); // Re-render switcher to update active state
        }
    });

    function renderBoardSwitcher() {
        const container = document.getElementById('board-switcher');
        if (!container) return;

        container.innerHTML = '';

        // Dropdown/Select approach for simplicity
        const select = document.createElement('select');
        select.className = 'board-select';

        boardsMeta.forEach(b => {
            const option = document.createElement('option');
            option.value = b.id;
            option.textContent = b.name; // Could implement renaming later
            if (b.id === currentBoardId) option.selected = true;
            select.appendChild(option);
        });

        select.addEventListener('change', (e) => {
            window.location.hash = e.target.value;
        });

        const addBtn = document.createElement('button');
        addBtn.className = 'add-board-btn';
        addBtn.textContent = '+';
        addBtn.title = 'New Board';
        addBtn.addEventListener('click', () => {
            // Find next available ID
            const ids = boardsMeta.map(b => parseInt(b.id)).sort((a, b) => a - b);
            const nextId = (ids[ids.length - 1] || 0) + 1;
            window.location.hash = nextId;
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-board-btn';
        deleteBtn.textContent = '×';
        deleteBtn.title = 'Delete Current Board';
        deleteBtn.addEventListener('click', () => {
            if (confirm(`Are you sure you want to delete "${boardsMeta.find(b => b.id === currentBoardId)?.name}"? This action cannot be undone.`)) {
                deleteCurrentBoard();
            }
        });

        container.appendChild(select);
        container.appendChild(addBtn);
        // Only show delete if it's not the last board, or handle the reset case
        container.appendChild(deleteBtn);
    }

    function deleteCurrentBoard() {
        // Remove data
        safeStorage.removeItem(`kaybee-board-${currentBoardId}`);

        // Update meta
        const index = boardsMeta.findIndex(b => b.id === currentBoardId);
        if (index > -1) {
            boardsMeta.splice(index, 1);
            saveMeta();
        }

        // Redirect
        if (boardsMeta.length > 0) {
            window.location.hash = boardsMeta[0].id;
        } else {
            // Deleted last board, reset to #1
            window.location.hash = '1';
            location.reload(); // Force full reload to init #1
        }
    }

    // Start
    init();

    // Load font preference
    if (safeStorage.getItem('kaybee-font') === 'readable') {
        document.body.classList.add('font-readable');
    }

    // Load theme preference
    if (safeStorage.getItem('kaybee-theme') === 'dark') {
        document.body.classList.add('dark-mode');
        if (themeBtn) themeBtn.textContent = '☾';
    } else {
        if (themeBtn) themeBtn.textContent = '☀';
    }

    // Font switcher
    if (fontBtn) {
        fontBtn.addEventListener('click', () => {
            document.body.classList.toggle('font-readable');
            const isReadable = document.body.classList.contains('font-readable');
            safeStorage.setItem('kaybee-font', isReadable ? 'readable' : 'handwritten');
        });
    }

    // Theme switcher
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            safeStorage.setItem('kaybee-theme', isDark ? 'dark' : 'light');
            themeBtn.textContent = isDark ? '☾' : '☀';
        });
    }

    let activeFilterColor = null;

    // Expose for inline onclick to bypass listener attachment issues
    window.toggleFilter = function (color) {
        // alert('Debug: Toggle Filter Clicked: ' + color); // Uncomment if desperate
        console.log('toggleFilter called with:', color);
        if (activeFilterColor === activeFilterColor && activeFilterColor === color) {
            activeFilterColor = null; // Toggle off
            console.log('Filter deactivated');
        } else {
            activeFilterColor = color; // Set new filter
            console.log('Filter activated for:', activeFilterColor);
        }
        applyFilter();
    }

    function applyFilter() {
        console.log('applyFilter running. Active:', activeFilterColor);
        const dots = document.querySelectorAll('.filter-dot');

        // Update UI state of dots
        dots.forEach(dot => {
            if (dot.dataset.color === activeFilterColor) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });

        // Update Board State
        const liveBoard = document.getElementById('board'); // Re-query purely for safety
        if (activeFilterColor) {
            liveBoard.classList.add('board-filtering');
            console.log('Class board-filtering added to LIVE board', liveBoard.className);
        } else {
            liveBoard.classList.remove('board-filtering');
            console.log('Class board-filtering removed from LIVE board', liveBoard.className);
        }

        // Helper to normalize color strings (handles both 'yellow' and 'var(--card-yellow)')
        function normalizeColor(color) {
            if (!color) return '';
            // Strip 'var(--card-' and ')'
            return color.replace('var(--card-', '').replace(')', '').trim();
        }

        // Update Cards - NUCLEAR OPTION (Direct Style Manipulation)
        const cards = document.querySelectorAll('.card');
        console.log(`Checking ${cards.length} cards...`);
        cards.forEach(card => {
            const cardColor = card.dataset.color;
            const isMatch = (cardColor === activeFilterColor) ||
                (normalizeColor(cardColor) === normalizeColor(activeFilterColor));

            console.log(`Card ${card.dataset.id} color: ${cardColor} | Active: ${activeFilterColor} | Match: ${isMatch}`);

            if (activeFilterColor) {
                // Filtering IS active
                if (isMatch) {
                    card.style.opacity = '1';
                    card.style.filter = 'none';
                    card.style.pointerEvents = 'auto'; // Ensure clickable
                } else {
                    card.style.opacity = '0.1';
                    card.style.filter = 'grayscale(100%)';
                    card.style.pointerEvents = 'none'; // Prevent clicks
                }
            } else {
                // Filtering is OFF - Reset to CSS defaults
                card.style.opacity = '';
                card.style.filter = '';
                card.style.pointerEvents = '';
            }
        });
    }

    // Filter Listeners
    document.querySelectorAll('.filter-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            toggleFilter(dot.dataset.color);
        });
    });

    function renderBoard() {
        board.innerHTML = '';
        data.columns.forEach(column => {
            const colEl = createColumnElement(column);
            board.appendChild(colEl);
        });
        // Re-apply filter if active (needed because we just cleared the board)
        if (activeFilterColor) {
            applyFilter();
        }
    }

    function createColumnElement(column) {
        const colDiv = document.createElement('div');
        colDiv.className = 'column';
        colDiv.dataset.id = column.id;

        colDiv.innerHTML = `
            <div class="column-header">
                <input type="text" class="column-title" value="${column.title}">
                <button class="add-card-btn" title="Add Card">+</button>
                <button class="delete-column-btn" title="Delete Column">×</button>
            </div>
            <div class="card-list"></div>
        `;

        const titleInput = colDiv.querySelector('.column-title');
        titleInput.addEventListener('change', (e) => {
            column.title = e.target.value;
            saveData();
        });

        const addCardBtn = colDiv.querySelector('.add-card-btn');
        addCardBtn.addEventListener('click', () => {
            addCard(column.id);
        });

        const deleteColumnBtn = colDiv.querySelector('.delete-column-btn');
        deleteColumnBtn.addEventListener('click', () => {
            if (confirm('Delete this column and all its cards?')) {
                deleteColumn(column.id);
            }
        });

        const cardList = colDiv.querySelector('.card-list');
        column.cards.forEach(card => {
            cardList.appendChild(createCardElement(card));
        });

        // Drag and Drop for cards (simplified for now, using HTML5 DnD)
        colDiv.addEventListener('dragover', e => {
            e.preventDefault();
            colDiv.classList.add('drag-over');
        });

        colDiv.addEventListener('dragleave', () => {
            colDiv.classList.remove('drag-over');
        });

        colDiv.addEventListener('drop', e => {
            e.preventDefault();
            colDiv.classList.remove('drag-over');
            const cardId = e.dataTransfer.getData('text/plain');
            const sourceColId = e.dataTransfer.getData('source-col-id');

            if (cardId) {
                moveCard(cardId, sourceColId, column.id);
            }
        });

        return colDiv;
    }

    // const COLOR_MAP = { ... }; // REMOVED: Using raw strings as per original working version
    // function getSimpleColorKey(cssVar) { ... } // REMOVED

    function createCardElement(card) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        cardDiv.draggable = true;
        cardDiv.dataset.id = card.id;

        // Use raw color directly (e.g. 'var(--card-yellow)')
        const cssColor = card.color || 'var(--card-yellow)';

        cardDiv.dataset.color = cssColor;
        cardDiv.style.backgroundColor = cssColor;

        cardDiv.innerHTML = `
            <div class="card-content" contenteditable="true">${card.text}</div>
            <div class="card-controls">
                <div class="color-dot" style="background: var(--card-yellow)" data-color="var(--card-yellow)"></div>
                <div class="color-dot" style="background: var(--card-blue)" data-color="var(--card-blue)"></div>
                <div class="color-dot" style="background: var(--card-green)" data-color="var(--card-green)"></div>
                <div class="color-dot" style="background: var(--card-pink)" data-color="var(--card-pink)"></div>
            </div>
        `;

        const content = cardDiv.querySelector('.card-content');
        content.addEventListener('input', () => {
            card.text = content.innerText;
            saveData();
        });

        // Color picker
        cardDiv.querySelectorAll('.color-dot').forEach(dot => {
            dot.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent drag start
                const cssVar = dot.dataset.color; // RAW string: 'var(--card-yellow)'

                cardDiv.style.backgroundColor = cssVar;
                cardDiv.dataset.color = cssVar;

                card.color = cssVar;
                saveData();

                // Re-apply filter if active to immediately hide/show if color changed
                if (activeFilterColor) applyFilter();
            });
        });

        // Drag events
        cardDiv.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', card.id);
            // Find parent column id
            const colId = cardDiv.closest('.column').dataset.id;
            e.dataTransfer.setData('source-col-id', colId);
            trashZone.style.display = 'block';
            setTimeout(() => cardDiv.style.opacity = '0.5', 0);
        });

        cardDiv.addEventListener('dragend', () => {
            cardDiv.style.opacity = '1';
            trashZone.style.display = 'none';
        });

        return cardDiv;
    }


    function addCard(columnId) {
        const column = data.columns.find(c => c.id === columnId);
        if (column) {
            // Raw strings
            const colors = [
                'var(--card-yellow)',
                'var(--card-blue)',
                'var(--card-green)',
                'var(--card-pink)'
            ];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];

            const newCard = {
                id: 'card-' + Date.now(),
                text: 'New Card',
                color: randomColor
            };
            column.cards.push(newCard);
            saveData();
            renderBoard();
        }
    }

    function moveCard(cardId, sourceColId, targetColId) {
        const targetCol = data.columns.find(c => c.id === targetColId);

        if (targetCol) {
            const cardData = data.columns.flatMap(c => c.cards).find(c => c.id === cardId);
            if (!cardData) return; // Card not found

            // Remove from old column
            data.columns.forEach(c => {
                c.cards = c.cards.filter(card => card.id !== cardId);
            });
            // Add to new column
            targetCol.cards.push(cardData);
            saveData();
            renderBoard();

            // Trigger confetti if dropped in "Done" column
            if (targetColId === 'col-3') {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
        }
    }

    addColumnBtn.addEventListener('click', () => {
        const newCol = {
            id: 'col-' + Date.now(),
            title: 'New Column',
            cards: []
        };
        data.columns.push(newCol);
        saveData();
        renderBoard();
    });

    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the board? This cannot be undone.')) {
                data = {
                    columns: [
                        { id: 'col-1', title: 'To Do', cards: [] },
                        { id: 'col-2', title: 'Doing', cards: [] },
                        { id: 'col-3', title: 'Done', cards: [] }
                    ]
                };
                saveData();
                renderBoard();
            }
        });
    }

    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            let markdown = '# Kaybee Board Export\n\n';
            data.columns.forEach(column => {
                markdown += `## ${column.title}\n`;
                if (column.cards.length === 0) {
                    markdown += '(No cards)\n';
                } else {
                    column.cards.forEach(card => {
                        markdown += `- ${card.text}\n`;
                    });
                }
                markdown += '\n';
            });

            const blob = new Blob([markdown], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `kaybee_${Date.now()}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    // Trash zone
    trashZone.addEventListener('dragover', e => {
        e.preventDefault();
        trashZone.classList.add('drag-over');
    });

    trashZone.addEventListener('dragleave', () => {
        trashZone.classList.remove('drag-over');
    });

    trashZone.addEventListener('drop', e => {
        e.preventDefault();
        trashZone.classList.remove('drag-over');
        const cardId = e.dataTransfer.getData('text/plain');
        const sourceColId = e.dataTransfer.getData('source-col-id');

        if (cardId && sourceColId) {
            deleteCard(cardId, sourceColId);
        }
    });

    function deleteCard(cardId, columnId) {
        const column = data.columns.find(c => c.id === columnId);
        if (column) {
            const cardIndex = column.cards.findIndex(c => c.id === cardId);
            if (cardIndex > -1) {
                column.cards.splice(cardIndex, 1);
                saveData();
                renderBoard();
            }
        }
    }

    function deleteColumn(columnId) {
        const columnIndex = data.columns.findIndex(c => c.id === columnId);
        if (columnIndex > -1) {
            data.columns.splice(columnIndex, 1);
            saveData();
            renderBoard();
        }
    }

    // Shooting Mode Easter Egg
    // Shooting Mode Easter Egg
    document.addEventListener('keydown', (e) => {
        // Prevent trigger while typing in inputs
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) || document.activeElement.isContentEditable) {
            return;
        }

        // Universal hotkey: Cmd/Ctrl + Shift + K
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === 'KeyK') {
            document.body.classList.toggle('shooting-mode');
        }
    });

    document.addEventListener('click', (e) => {
        if (document.body.classList.contains('shooting-mode')) {
            // Screen Shake
            const app = document.getElementById('app');
            app.classList.add('shake');
            setTimeout(() => {
                app.classList.remove('shake');
            }, 200);

            // Paint Splat spread
            const splatCount = Math.floor(Math.random() * 3) + 3;

            for (let i = 0; i < splatCount; i++) {
                const splat = document.createElement('div');
                splat.className = 'paint-splat';

                // Random spread
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * 40;
                const offsetX = Math.cos(angle) * radius;
                const offsetY = Math.sin(angle) * radius;

                splat.style.left = (e.pageX + offsetX) + 'px';
                splat.style.top = (e.pageY + offsetY) + 'px';

                // Random size and shape variation
                const size = Math.random() * 10 + 10;
                splat.style.width = size + 'px';
                splat.style.height = size + 'px';

                // Randomize border radius for blob shape
                const r1 = Math.floor(Math.random() * 40) + 30;
                const r2 = Math.floor(Math.random() * 40) + 30;
                const r3 = Math.floor(Math.random() * 40) + 30;
                const r4 = Math.floor(Math.random() * 40) + 30;
                splat.style.borderRadius = `${r1}% ${r2}% ${r3}% ${r4}%`;

                document.body.appendChild(splat);

                // Remove after animation
                setTimeout(() => {
                    splat.remove();
                }, 3500);
            }
        }
    });

    // Filter Listeners
    document.querySelectorAll('.filter-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            toggleFilter(dot.dataset.color);
        });
    });

    renderBoard();
});
