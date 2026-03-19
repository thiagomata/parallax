import '../../style/style.css';
import '../../style/tutorial.css';
import {tutorial_observer_test, observer_test_explanation} from "../tutorial_observer_test.ts";
import step10Source from '../tutorial_observer_test.ts?raw';
import {initTutorial} from "../tutorial_shared.ts";

initTutorial('tutorial-10', '10. Camera Test', tutorial_observer_test, step10Source, observer_test_explanation);
