document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('board');
    const addColumnBtn = document.getElementById('add-column-btn');
    const trashZone = document.getElementById('trash-zone');
    const fontBtn = document.getElementById('font-btn');
    const themeBtn = document.getElementById('theme-btn');

    let data = {
        columns: [
            { id: 'col-1', title: 'To Do', cards: [] },
            { id: 'col-2', title: 'Doing', cards: [] },
            { id: 'col-3', title: 'Done', cards: [] }
        ]
    };

    // Load from local storage
    const savedData = localStorage.getItem('kaybee-data');
    if (savedData) {
        data = JSON.parse(savedData);
    }

    // Load font preference
    if (localStorage.getItem('kaybee-font') === 'readable') {
        document.body.classList.add('font-readable');
    }

    // Load theme preference
    if (localStorage.getItem('kaybee-theme') === 'dark') {
        document.body.classList.add('dark-mode');
        if (themeBtn) themeBtn.textContent = '☾';
    } else {
        if (themeBtn) themeBtn.textContent = '☀';
    }

    function saveData() {
        localStorage.setItem('kaybee-data', JSON.stringify(data));
    }

    // Font switcher
    if (fontBtn) {
        fontBtn.addEventListener('click', () => {
            document.body.classList.toggle('font-readable');
            const isReadable = document.body.classList.contains('font-readable');
            localStorage.setItem('kaybee-font', isReadable ? 'readable' : 'handwritten');
        });
    }

    // Theme switcher
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('kaybee-theme', isDark ? 'dark' : 'light');
            themeBtn.textContent = isDark ? '☾' : '☀';
        });
    }

    function renderBoard() {
        board.innerHTML = '';
        data.columns.forEach(column => {
            const colEl = createColumnElement(column);
            board.appendChild(colEl);
        });
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

    function createCardElement(card) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        cardDiv.draggable = true;
        cardDiv.dataset.id = card.id;
        cardDiv.style.backgroundColor = card.color || 'var(--card-yellow)';

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
                const color = dot.dataset.color;
                cardDiv.style.backgroundColor = color;
                card.color = color;
                saveData();
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
    document.addEventListener('keydown', (e) => {
        if (e.shiftKey && e.key.toLowerCase() === 'g') {
            document.body.classList.toggle('shooting-mode');
        }
    });

    document.addEventListener('click', (e) => {
        if (document.body.classList.contains('shooting-mode')) {
            const hole = document.createElement('div');
            hole.className = 'bullet-hole';
            hole.style.left = e.pageX + 'px';
            hole.style.top = e.pageY + 'px';
            document.body.appendChild(hole);

            // Play sound effect (optional, but requested "shoot holes")
            // Using a very short, synthesized "pop" could be fun, but for now just visual.

            // Remove after animation
            setTimeout(() => {
                hole.remove();
            }, 3500);
        }
    });

    renderBoard();
});
