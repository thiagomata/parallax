import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("tutorial_nav", () => {
    beforeEach(() => {
        vi.stubGlobal("window", {
            location: new URL("http://localhost/tutorial-3/index.html"),
        });
        document.body.innerHTML = "";
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("creates nav for first tutorial (shows next only)", async () => {
        vi.stubGlobal("window", {
            location: new URL("http://localhost/tutorial-1/index.html"),
        });
        document.body.innerHTML = "";

        const { initTutorialNav } = await import("./tutorial_nav.ts");
        initTutorialNav();

        const nav = document.querySelector("nav.tutorial-nav");
        expect(nav).toBeTruthy();
        const links = nav!.querySelectorAll("a");
        expect(links).toHaveLength(2);
        expect(links[0].getAttribute("href")).toBe("../index.html");
        expect(links[1].getAttribute("href")).toBe("../tutorial-2/index.html");
        expect(nav!.textContent).toContain("1 / 9");
    });

    it("creates nav for middle tutorial (shows prev and next)", async () => {
        vi.stubGlobal("window", {
            location: new URL("http://localhost/tutorial-5/index.html"),
        });
        document.body.innerHTML = "";

        const { initTutorialNav } = await import("./tutorial_nav.ts");
        initTutorialNav();

        const nav = document.querySelector("nav.tutorial-nav");
        expect(nav).toBeTruthy();
        const links = nav!.querySelectorAll("a");
        expect(links).toHaveLength(2);
        expect(links[0].getAttribute("href")).toBe("../tutorial-4/index.html");
        expect(links[1].getAttribute("href")).toBe("../tutorial-6/index.html");
    });

    it("creates nav for last tutorial (shows prev only)", async () => {
        vi.stubGlobal("window", {
            location: new URL("http://localhost/tutorial-9/index.html"),
        });
        document.body.innerHTML = "";

        const { initTutorialNav } = await import("./tutorial_nav.ts");
        initTutorialNav();

        const nav = document.querySelector("nav.tutorial-nav");
        expect(nav).toBeTruthy();
        const links = nav!.querySelectorAll("a");
        expect(links).toHaveLength(2);
        expect(links[0].getAttribute("href")).toBe("../tutorial-8/index.html");
        expect(links[1].getAttribute("href")).toBe("../index.html");
    });

    it("replaces existing nav when called twice", async () => {
        vi.stubGlobal("window", {
            location: new URL("http://localhost/tutorial-2/index.html"),
        });
        document.body.innerHTML = "<nav class='tutorial-nav'><span>Old</span></nav>";

        const { initTutorialNav } = await import("./tutorial_nav.ts");
        initTutorialNav();

        const navs = document.querySelectorAll("nav.tutorial-nav");
        expect(navs).toHaveLength(1);
        expect(navs[0].textContent).toContain("2 / 9");
    });
});
