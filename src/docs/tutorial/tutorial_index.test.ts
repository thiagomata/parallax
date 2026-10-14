import { describe, expect, it } from 'vitest';
import { TUTORIALS } from './tutorial_index_meta.ts';

describe('Tutorial index', () => {
    it('renders a link to each available tutorial', async () => {
        document.body.innerHTML = '<main id="tutorial-root"></main>';
        await import('./tutorial_main_page.demo.ts');
        const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.tutorial-card'));
        expect(links).toHaveLength(10);
        expect(links.map(link => link.getAttribute('href'))).toEqual(TUTORIALS.map(tutorial => tutorial.path));
        expect(links[7].textContent).toContain('The Observer');
        expect(links[8].textContent).toContain('3D Parallax Depth');
    });
});
