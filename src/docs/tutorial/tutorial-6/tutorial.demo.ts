import '../../style/style.css';
import '../../style/tutorial.css';
import {tutorial_look_at, look_at_explanation} from "./tutorial_look_at.ts";
import step6Source from './tutorial_look_at.ts?raw';
import {initTutorial} from "../tutorial_shared.ts";

initTutorial('tutorial-6', '6. Objects Looking at Each Other', tutorial_look_at, step6Source, look_at_explanation);
