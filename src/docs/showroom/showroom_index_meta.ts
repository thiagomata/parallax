export interface ShowroomScene {
    id: string;
    title: string;
    description: string;
    path: string;
    /** The scene's loading-screen still (scripts/capture-loading.mjs), relative to the showroom index. */
    image: string;
}

export const SHOWROOM: ShowroomScene[] = [
    {
        id: 'airplane',
        title: '✈️ Airplane Flight',
        description: 'Steer a small airplane through the clouds with your head.',
        path: './airplane/index.html',
        image: '../../img/loading/airplane.jpg',
    },
    {
        id: 'emotion-game',
        title: '😃 Emotion Game',
        description: 'Make the face the game asks for - your emoji copies you.',
        path: './emotion-game/index.html',
        image: '../../img/loading/emotion-game.jpg',
    },
];
