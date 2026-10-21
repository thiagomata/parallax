import {heroParallax, heroParallaxExplanation} from "./hero_parallax.ts";
import heroCode from './hero_parallax.ts?raw';
import { renderStep } from "./showcase_step.ts";

renderStep('hero-demo-1', 'Living Parallax', heroParallax, heroCode, heroParallaxExplanation);
