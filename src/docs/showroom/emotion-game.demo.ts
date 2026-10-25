import {emotionGame, emotionGameExplanation} from "./emotion_game.ts";
import emotionGameCode from './emotion_game.ts?raw';
import { renderStep } from "../hero/showcase_step.ts";

renderStep('showroom-emotion-game', 'Emotion Game', emotionGame, emotionGameCode, emotionGameExplanation, { preserveDrawingBuffer: true }, 'img/loading/emotion-game.jpg');
