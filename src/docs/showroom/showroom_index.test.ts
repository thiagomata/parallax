import { describe, expect, it } from 'vitest';
import { SHOWROOM } from './showroom_index_meta.ts';

describe('Showroom index', () => {
    it('renders a card with the still, title and description of each scene', async () => {
        document.body.innerHTML = '<main id="tutorial-root"></main>';
        await import('./showroom_main_page.demo.ts');
        const cards = Array.from(document.querySelectorAll<HTMLAnchorElement>('.showroom-card'));

        expect(cards.map(card => card.getAttribute('href'))).toEqual(SHOWROOM.map(scene => scene.path));
        expect(cards[0].querySelector('img')?.getAttribute('src')).toBe(SHOWROOM[0].image);
        expect(cards[1].textContent).toContain('Emotion Game');
        expect(cards[1].textContent).toContain(SHOWROOM[1].description);
        expect(document.querySelector('.showroom-home a')?.getAttribute('href')).toBe('../../index.html');
    });
});
