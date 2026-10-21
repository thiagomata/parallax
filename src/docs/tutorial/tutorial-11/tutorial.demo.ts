import '../../style/style.css';
import '../../style/tutorial.css';
import {tutorial_expressions, expressions_explanation} from "./tutorial_expressions.ts";
import step11Source from './tutorial_expressions.ts?raw';
import {initTutorial} from "../tutorial_shared.ts";

const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || navigator.maxTouchPoints > 0;
const faceConfig = isMobile ? undefined : { throttleThreshold: 0, videoWidth: 640, videoHeight: 480 };

initTutorial('tutorial-11', '11. Facial Expressions', tutorial_expressions, step11Source, expressions_explanation, {}, faceConfig);
