import '../../style/style.css';
import '../../style/tutorial.css';
import {tutorial_orbital_motion, orbital_motion_explanation} from "../tutorial_orbital_motion.ts";
import step3Source from '../tutorial_orbital_motion.ts?raw';
import {initTutorial} from "../tutorial_shared.ts";

initTutorial('tutorial-3', '3. Orbital Motion', tutorial_orbital_motion, step3Source, orbital_motion_explanation);
