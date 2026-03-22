import '../../style/style.css';
import '../../style/tutorial.css';
import {tutorial_observer, observer_explanation} from "../tutorial_observer.ts";
import step8Source from '../tutorial_observer.ts?raw';
import {initTutorial} from "../tutorial_shared.ts";

const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || navigator.maxTouchPoints > 0;
const faceConfig = isMobile ? undefined : { throttleThreshold: 0, videoWidth: 640, videoHeight: 480 };

initTutorial('tutorial-8', '8. The Observer', tutorial_observer, step8Source, observer_explanation, {}, faceConfig);
