import '../../style/style.css';
import '../../style/tutorial.css';
import {tutorial_depth_map, depth_map_explanation} from "./tutorial_depth_map.ts";
import step11Source from './tutorial_depth_map.ts?raw';
import {initTutorial} from "../tutorial_shared.ts";

initTutorial('tutorial-11', '11. Depth Map Panels', tutorial_depth_map, step11Source, depth_map_explanation);
