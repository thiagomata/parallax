import '../../style/style.css';
import '../../style/tutorial.css';
import {tutorial_camera_control, camera_control_explanation} from "./tutorial_camera_control.ts";
import step4Source from './tutorial_camera_control.ts?raw';
import {initTutorial} from "../tutorial_shared.ts";

initTutorial('tutorial-4', '4. Camera Control', tutorial_camera_control, step4Source, camera_control_explanation);
