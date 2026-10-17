import { TUTORIALS } from "./tutorial_index_meta.ts";

const TOTAL_TUTORIALS = TUTORIALS.length;

const icons = {
    home: '<i class="fas fa-list"></i>',
    prev: '<i class="fas fa-chevron-left"></i>',
    next: '<i class="fas fa-chevron-right"></i>',
};

function getTutorialNumber(): number {
    const match = window.location.pathname.match(/tutorial-(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
}

export function initTutorialNav() {
    const current = getTutorialNumber();
    
    const homeUrl = '../index.html';
    const prevUrl = current > 1 ? `../tutorial-${current - 1}/index.html` : null;
    const nextUrl = current < TOTAL_TUTORIALS ? `../tutorial-${current + 1}/index.html` : null;

    const nav = document.createElement('nav');
    nav.className = 'tutorial-nav';
    nav.innerHTML = `
        ${prevUrl 
            ? `<a href="${prevUrl}" class="icon-btn" title="Previous">${icons.prev}</a>`
            : `<a href="${homeUrl}" class="icon-btn" title="All Tutorials">${icons.home}</a>`
        }
        <details class="tutorial-menu">
            <summary title="All tutorials">${current} / ${TOTAL_TUTORIALS}</summary>
            <ol>
                ${TUTORIALS.map(tutorial => `
                <li><a href="../${tutorial.id}/index.html"${tutorial.num === current ? ' aria-current="page"' : ''}>${tutorial.num}. ${tutorial.title}</a></li>`).join('')}
                <li class="tutorial-menu-all"><a href="${homeUrl}">${icons.home} All tutorials</a></li>
            </ol>
        </details>
        ${nextUrl 
            ? `<a href="${nextUrl}" class="icon-btn" title="Next">${icons.next}</a>`
            : `<a href="${homeUrl}" class="icon-btn" title="All Tutorials">${icons.home}</a>`
        }
    `;

    // Close the tutorial menu on a click outside it or on Escape.
    const menu = nav.querySelector('details.tutorial-menu') as HTMLDetailsElement;
    document.addEventListener('click', event => {
        if (!menu.contains(event.target as Node)) menu.open = false;
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') menu.open = false;
    });

    const existingNav = document.querySelector('nav.tutorial-nav');
    if (existingNav) {
        existingNav.replaceWith(nav);
    } else {
        document.body.insertBefore(nav, document.body.firstChild);
    }
}
