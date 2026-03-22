import '../../style/style.css';
import '../../style/tutorial.css';
import {tutorial_billboard, billboard_explanation} from "./tutorial_billboard.ts";
import step7Source from './tutorial_billboard.ts?raw';
import {initTutorial} from "../tutorial_shared.ts";

initTutorial('tutorial-7', '7. Always Face Camera', tutorial_billboard, step7Source, billboard_explanation);
