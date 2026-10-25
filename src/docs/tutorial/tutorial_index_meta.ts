export interface TutorialMeta {
    id: string;
    num: number;
    title: string;
    path: string;
}

export const TUTORIALS: TutorialMeta[] = [
    { id: 'tutorial-1',  num: 1,  title: 'Adding Elements',              path: './tutorial-1/index.html' },
    { id: 'tutorial-2',  num: 2,  title: 'Animation Over Time',          path: './tutorial-2/index.html' },
    { id: 'tutorial-3',  num: 3,  title: 'Orbital Motion',               path: './tutorial-3/index.html' },
    { id: 'tutorial-4',  num: 4,  title: 'Camera Control',               path: './tutorial-4/index.html' },
    { id: 'tutorial-5',  num: 5,  title: 'Loading Textures',             path: './tutorial-5/index.html' },
    { id: 'tutorial-6',  num: 6,  title: 'Objects Looking at Each Other',path: './tutorial-6/index.html' },
    { id: 'tutorial-7',  num: 7,  title: 'Always Face Camera',           path: './tutorial-7/index.html' },
    { id: 'tutorial-8',  num: 8,  title: 'The Observer',                 path: './tutorial-8/index.html' },
    { id: 'tutorial-9',  num: 9,  title: '3D Parallax Depth',            path: './tutorial-9/index.html' },
    { id: 'tutorial-10', num: 10, title: 'Interactive Box Control',      path: './tutorial-10/index.html' },
    { id: 'tutorial-11', num: 11, title: 'Facial Expressions',           path: './tutorial-11/index.html' },
];
