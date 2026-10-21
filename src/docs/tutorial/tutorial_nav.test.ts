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
        const links = nav!.querySelectorAll(":scope > a"); // the ‹ › arrows
        expect(links).toHaveLength(2);
        expect(links[0].getAttribute("href")).toBe("../index.html");
        expect(links[1].getAttribute("href")).toBe("../tutorial-2/index.html");
        expect(nav!.textContent).toContain("1 / 11");
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
        const links = nav!.querySelectorAll(":scope > a"); // the ‹ › arrows
        expect(links).toHaveLength(2);
        expect(links[0].getAttribute("href")).toBe("../tutorial-4/index.html");
        expect(links[1].getAttribute("href")).toBe("../tutorial-6/index.html");
    });

    it("creates nav for last tutorial (shows prev only)", async () => {
        vi.stubGlobal("window", {
            location: new URL("http://localhost/tutorial-11/index.html"),
        });
        document.body.innerHTML = "";

        const { initTutorialNav } = await import("./tutorial_nav.ts");
        initTutorialNav();

        const nav = document.querySelector("nav.tutorial-nav");
        expect(nav).toBeTruthy();
        const links = nav!.querySelectorAll(":scope > a"); // the ‹ › arrows
        expect(links).toHaveLength(2);
        expect(links[0].getAttribute("href")).toBe("../tutorial-10/index.html");
        expect(links[1].getAttribute("href")).toBe("../index.html");
    });

    it("lists every tutorial in the N / 11 menu, marking the current one", async () => {
        vi.stubGlobal("window", {
            location: new URL("http://localhost/tutorial-5/index.html"),
        });
        document.body.innerHTML = "";

        const { initTutorialNav } = await import("./tutorial_nav.ts");
        initTutorialNav();

        const menu = document.querySelector("nav.tutorial-nav details.tutorial-menu")!;
        expect(menu.querySelector("summary")!.textContent).toContain("5 / 11");
        const items = [...menu.querySelectorAll("li:not(.tutorial-menu-all) a")];
        expect(items).toHaveLength(11);
        expect(items[0].getAttribute("href")).toBe("../tutorial-1/index.html");
        expect(items[0].textContent).toBe("1. Adding Elements");
        expect(items[4].getAttribute("aria-current")).toBe("page");
        expect(items.filter(item => item.hasAttribute("aria-current"))).toHaveLength(1);
        expect(menu.querySelector(".tutorial-menu-all a")!.getAttribute("href")).toBe("../index.html");
    });

    it("closes the menu on Escape or a click outside it", async () => {
        vi.stubGlobal("window", {
            location: new URL("http://localhost/tutorial-3/index.html"),
        });
        document.body.innerHTML = "<main></main>";

        const { initTutorialNav } = await import("./tutorial_nav.ts");
        initTutorialNav();
        const menu = document.querySelector("details.tutorial-menu") as HTMLDetailsElement;

        menu.open = true;
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        expect(menu.open).toBe(false);

        menu.open = true;
        menu.querySelector("ol")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(menu.open).toBe(true); // clicks inside the menu keep it open

        document.querySelector("main")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(menu.open).toBe(false);
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
        expect(navs[0].textContent).toContain("2 / 11");
    });
});
