import '../../style/style.css';
import '../../style/tutorial.css';
import {tutorial_textures, textures_explanation} from "./tutorial_textures.ts";
import step5Source from './tutorial_textures.ts?raw';
import {initTutorial} from "../tutorial_shared.ts";

initTutorial('tutorial-5', '5. Loading Textures', tutorial_textures, step5Source, textures_explanation);
