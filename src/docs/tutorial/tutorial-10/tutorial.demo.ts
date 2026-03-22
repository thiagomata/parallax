import '../../style/style.css';
import '../../style/tutorial.css';
import {tutorial_observer_test, observer_test_explanation} from "../tutorial_observer_test.ts";
import step10Source from '../tutorial_observer_test.ts?raw';
import {initTutorial} from "../tutorial_shared.ts";

const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || navigator.maxTouchPoints > 0;
const faceConfig = isMobile ? undefined : { throttleThreshold: 0, videoWidth: 640, videoHeight: 480 };

initTutorial('tutorial-10', '10. Camera Test', tutorial_observer_test, step10Source, observer_test_explanation, {}, faceConfig);
