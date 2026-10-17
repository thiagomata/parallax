import {LookAtEffect} from "./look_at_effect.ts";
import {FollowEffect} from "./follow_effect.ts";
import type {EffectLib} from "../types.ts";

export const DEFAULT_EFFECTS = {
    'look_at': LookAtEffect,
    'follow': FollowEffect,
} as EffectLib;