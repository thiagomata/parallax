import {airplaneFlight, airplaneFlightExplanation} from "./airplane_flight.ts";
import airplaneCode from './airplane_flight.ts?raw';
import { renderStep } from "../hero/showcase_step.ts";

renderStep('showroom-airplane', 'Airplane Flight', airplaneFlight, airplaneCode, airplaneFlightExplanation, {}, 'img/loading/airplane.jpg');
