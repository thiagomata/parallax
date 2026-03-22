import '../../style/style.css';
import '../../style/tutorial.css';
import {tutorial_adding_elements, adding_elements_explanation} from "./tutorial_adding_elements.ts";
import step1Source from './tutorial_adding_elements.ts?raw';
import {initTutorial} from "../tutorial_shared.ts";

initTutorial('tutorial-1', '1. Adding Elements', tutorial_adding_elements, step1Source, adding_elements_explanation);
