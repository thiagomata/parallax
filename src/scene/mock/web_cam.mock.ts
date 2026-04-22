import { WebCamDataProvider } from '../providers/web_cam_data_provider.ts';
import type { VideoSourceRef, TrackingStatus, FailableResult } from '../types.ts';

export class MockWebCamDataProvider extends WebCamDataProvider {
    private mockNode: any = null;
    private mockStatus: TrackingStatus = "READY";

    constructor(node?: any) {
        const mockP5 = {
            createCapture: (_type: string) => {
                this.mockNode = node ?? { 
                    elt: { 
                        readyState: 4, 
                        onloadedmetadata: null, 
                        onerror: null,
                        play: () => {},
                    },
                    size: () => {},
                    hide: () => {},
                    play: () => {},
                };
                return this.mockNode;
            },
        } as any;
        
        super(mockP5 as any, 640, 480);
        this.mockNode = node ?? { 
            elt: { 
                readyState: 4, 
                onloadedmetadata: null, 
                onerror: null,
            },
        };
    }

    getStatus(): TrackingStatus {
        return this.mockStatus;
    }

    getData(): VideoSourceRef | null {
        if (this.mockStatus !== "READY") return null;
        return { kind: "webCam", node: this.mockNode };
    }

    getVideo(): FailableResult<VideoSourceRef> {
        if (this.mockStatus !== "READY") {
            return { success: false, error: "Video not ready" };
        }
        return { success: true, value: { kind: "webCam", node: this.mockNode } };
    }

    getDataResult(): FailableResult<VideoSourceRef> {
        return this.getVideo();
    }

    setReady(status: TrackingStatus) {
        this.mockStatus = status;
    }

    setNode(node: any) {
        this.mockNode = node;
    }
}

export function createMockWebCam(node?: any): WebCamDataProvider {
    return new MockWebCamDataProvider(node);
}