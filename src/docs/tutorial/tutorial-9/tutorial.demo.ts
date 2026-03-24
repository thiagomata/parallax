import '../../style/style.css';
import '../../style/tutorial.css';
import {tutorial_parallax, parallax_explanation} from "./tutorial_parallax.ts";
import step9Source from './tutorial_parallax.ts?raw';
import {initTutorial} from "../tutorial_shared.ts";

const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || navigator.maxTouchPoints > 0;
const faceConfig = isMobile ? undefined : { throttleThreshold: 0, videoWidth: 640, videoHeight: 480 };

initTutorial('tutorial-9', '9. 3D Parallax Depth', tutorial_parallax, step9Source, parallax_explanation, {}, faceConfig);
