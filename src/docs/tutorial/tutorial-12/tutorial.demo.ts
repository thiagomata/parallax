import '../../style/style.css';
import '../../style/tutorial.css';
import {tutorial_emotion_game, emotion_game_explanation} from "./tutorial_emotion_game.ts";
import step12Source from './tutorial_emotion_game.ts?raw';
import {initTutorial} from "../tutorial_shared.ts";

const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || navigator.maxTouchPoints > 0;
const faceConfig = isMobile ? undefined : { throttleThreshold: 0, videoWidth: 640, videoHeight: 480 };

initTutorial('tutorial-12', '12. Emotion Game', tutorial_emotion_game, step12Source, emotion_game_explanation, {}, faceConfig);
