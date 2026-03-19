import '../../style/style.css';
import '../../style/tutorial.css';
import {tutorial_animation, animation_explanation} from "../tutorial_animation.ts";
import step2Source from '../tutorial_animation.ts?raw';
import {initTutorial} from "../tutorial_shared.ts";

initTutorial('tutorial-2', '2. Animation Over Time', tutorial_animation, step2Source, animation_explanation);
