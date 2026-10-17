import { describe, it, expect } from 'vitest';
import { DEFAULT_EFFECTS } from './effects.ts';
import { LookAtEffect } from './look_at_effect.ts';
import { FollowEffect } from './follow_effect.ts';
import type { EffectLib } from '../types.ts';

describe('DEFAULT_EFFECTS', () => {
    it('should export DEFAULT_EFFECTS as an object', () => {
        expect(DEFAULT_EFFECTS).toBeDefined();
        expect(typeof DEFAULT_EFFECTS).toBe('object');
    });

    it('should contain look_at effect', () => {
        expect(DEFAULT_EFFECTS['look_at']).toBeDefined();
        expect(DEFAULT_EFFECTS['look_at']).toBe(LookAtEffect);
    });

    it('should be correctly typed as EffectLib', () => {
        const effects: EffectLib = DEFAULT_EFFECTS;
        expect(effects['look_at']).toBeDefined();
    });

    it('should have the correct structure for look_at effect', () => {
        const lookAtEffect = DEFAULT_EFFECTS['look_at'];
        
        expect(lookAtEffect.type).toBe('look_at');
        expect(lookAtEffect.targets).toBeDefined();
        expect(lookAtEffect.defaults).toBeDefined();
        expect(typeof lookAtEffect.apply).toBe('function');
    });

    it('should contain follow effect', () => {
        expect(DEFAULT_EFFECTS['follow']).toBeDefined();
        expect(DEFAULT_EFFECTS['follow']).toBe(FollowEffect);
    });

    it('should have the correct structure for follow effect', () => {
        const followEffect = DEFAULT_EFFECTS['follow'];

        expect(followEffect.type).toBe('follow');
        expect(followEffect.targets).toBeDefined();
        expect(followEffect.defaults).toBeDefined();
        expect(typeof followEffect.apply).toBe('function');
    });

    it('should not contain any unexpected effects', () => {
        const effectKeys = Object.keys(DEFAULT_EFFECTS);
        expect(effectKeys).toHaveLength(2);
        expect(effectKeys).toContain('look_at');
        expect(effectKeys).toContain('follow');
    });

    it('should maintain reference equality with LookAtEffect', () => {
        expect(DEFAULT_EFFECTS['look_at'] === LookAtEffect).toBe(true);
    });

    it('should maintain reference equality with FollowEffect', () => {
        expect(DEFAULT_EFFECTS['follow'] === FollowEffect).toBe(true);
    });
});