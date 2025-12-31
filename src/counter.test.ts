import {beforeEach, describe, expect, it} from 'vitest';
import {setupCounter} from './counter';

describe('setupCounter', () => {
    let button: HTMLButtonElement;

    beforeEach(() => {
        // Create a fresh button for every test so they don't interfere
        button = document.createElement('button');
        document.body.appendChild(button);
    });

    it('should initialize the counter text to 0', () => {
        setupCounter(button);
        expect(button.innerHTML).toBe('count is 0');
    });

    it('should increment the counter when clicked', () => {
        setupCounter(button);

        // Simulate a user click
        button.click();
        expect(button.innerHTML).toBe('count is 1');

        // Click it again
        button.click();
        expect(button.innerHTML).toBe('count is 2');
    });
});