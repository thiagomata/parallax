import '../../style/style.css';
import '../../style/tutorial.css';
import {tutorial_observer, observer_explanation} from "../tutorial_observer.ts";
import step8Source from '../tutorial_observer.ts?raw';
import {initTutorial} from "../tutorial_shared.ts";

// Heavy version: no throttling for desktop with webcam
const faceConfig = {
    throttleThreshold: 0,  // Disable throttling
    videoWidth: 640,
    videoHeight: 480
};

initTutorial('tutorial-8-heavy', '8. The Observer (Heavy)', tutorial_observer, step8Source, observer_explanation, {}, faceConfig);
