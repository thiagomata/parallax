import '../style/style.css';
import '../style/tutorial.css';
import {TUTORIALS} from "./tutorial_index_meta.ts";

function createTutorialIndex() {
    const root = document.getElementById('tutorial-root');
    if (!root) return;

    const index = document.createElement('div');
    index.className = 'tutorial-index';

    const header = document.createElement('div');
    header.className = 'tutorial-index-header';
    header.innerHTML = '<h1>Tutorials</h1><p>Step-by-step guide to building parallax scenes with the Parallax engine.</p>';
    index.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'tutorial-grid';

    for (const t of TUTORIALS) {
        const card = document.createElement('a');
        card.className = 'tutorial-card';
        card.href = t.path;

        const num = document.createElement('div');
        num.className = 'tutorial-num';
        num.textContent = String(t.num);

        const info = document.createElement('div');
        info.className = 'tutorial-info';

        const title = document.createElement('h3');
        title.textContent = t.title;

        info.appendChild(title);
        card.appendChild(num);
        card.appendChild(info);
        grid.appendChild(card);
    }

    index.appendChild(grid);
    root.appendChild(index);
}

createTutorialIndex();
