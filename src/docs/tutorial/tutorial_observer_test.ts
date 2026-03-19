import p5 from 'p5';
import { DEFAULT_SKETCH_CONFIG, type SketchConfig } from "./sketch_config.ts";

export const observer_test_explanation = `
<div class="concept">
<p>This tutorial tests if your camera is working. If you see yourself on the screen, camera access is granted!</p>
</div>

<h3>What to expect</h3>
<ol>
<li>The browser will ask for camera permission</li>
<li>If granted, you should see yourself in the preview</li>
<li>If denied, you'll see a gray placeholder</li>
</ol>
`;

export async function tutorial_observer_test(
    p: p5,
    config: SketchConfig = DEFAULT_SKETCH_CONFIG
): Promise<any> {
    let videoElement: any = null;
    
    p.setup = () => {
        p.createCanvas(config.width, config.height);
        videoElement = p.createCapture(p.VIDEO);
        videoElement.size(320, 240);
        (videoElement.elt as HTMLVideoElement).setAttribute('playsinline', '');
    };
    
    p.draw = () => {
        p.background(50);
        if (videoElement && videoElement.elt && videoElement.elt.readyState >= 2) {
            p.image(videoElement, 0, 0);
            p.fill(0, 255, 0);
            p.text('Camera active!', 10, 25);
        } else {
            p.fill(255, 100, 100);
            p.text('Waiting for camera permission...', 10, 25);
        }
    };
    
    return null;
}
