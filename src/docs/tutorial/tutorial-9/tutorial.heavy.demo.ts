import '../../style/style.css';
import '../../style/tutorial.css';
import {tutorial_parallax, parallax_explanation} from "../tutorial_parallax.ts";
import step9Source from '../tutorial_parallax.ts?raw';
import {initTutorial} from "../tutorial_shared.ts";

// Heavy version: no throttling for desktop with webcam
const faceConfig = {
    throttleThreshold: 0,  // Disable throttling
    videoWidth: 640,
    videoHeight: 480
};

initTutorial('tutorial-9-heavy', '9. 3D Parallax Depth (Heavy)', tutorial_parallax, step9Source, parallax_explanation, {}, faceConfig);
