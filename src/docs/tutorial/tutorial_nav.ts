const TOTAL_TUTORIALS = 9;

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
        <span>${current} / ${TOTAL_TUTORIALS}</span>
        ${nextUrl 
            ? `<a href="${nextUrl}" class="icon-btn" title="Next">${icons.next}</a>`
            : `<a href="${homeUrl}" class="icon-btn" title="All Tutorials">${icons.home}</a>`
        }
    `;

    const existingNav = document.querySelector('nav.tutorial-nav');
    if (existingNav) {
        existingNav.replaceWith(nav);
    } else {
        document.body.insertBefore(nav, document.body.firstChild);
    }
}
