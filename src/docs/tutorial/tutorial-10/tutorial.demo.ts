import '../../style/style.css';
import '../../style/tutorial.css';
import {tutorial_interactive_box, tutorial_interactive_box_explanation} from "./tutorial_interactive_box.ts";
import step1Source from './tutorial_interactive_box.ts?raw';
import {initTutorial} from "../tutorial_shared.ts";

initTutorial('tutorial-10', '10. Interactive Box Control', tutorial_interactive_box, step1Source, tutorial_interactive_box_explanation);