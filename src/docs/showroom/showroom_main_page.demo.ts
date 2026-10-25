import '../style/style.css';
import '../style/tutorial.css';
import {SHOWROOM} from "./showroom_index_meta.ts";

function createShowroomIndex() {
    const root = document.getElementById('tutorial-root');
    if (!root) return;

    const index = document.createElement('div');
    index.className = 'tutorial-index';

    const header = document.createElement('div');
    header.className = 'tutorial-index-header';
    header.innerHTML = '<p class="showroom-home"><a href="../../index.html">← Parallax Engine</a></p>'
        + '<h1>Showroom</h1><p>Bigger scenes built with the Parallax engine and head tracking.</p>';
    index.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'tutorial-grid showroom-grid';

    for (const scene of SHOWROOM) {
        const card = document.createElement('a');
        card.className = 'tutorial-card showroom-card';
        card.href = scene.path;

        const image = document.createElement('img');
        image.className = 'showroom-image';
        image.src = scene.image;
        image.alt = '';
        image.loading = 'lazy';

        const info = document.createElement('div');
        info.className = 'tutorial-info';

        const title = document.createElement('h3');
        title.textContent = scene.title;
        const description = document.createElement('p');
        description.textContent = scene.description;

        info.appendChild(title);
        info.appendChild(description);
        card.appendChild(image);
        card.appendChild(info);
        grid.appendChild(card);
    }

    index.appendChild(grid);
    root.appendChild(index);
}

createShowroomIndex();
