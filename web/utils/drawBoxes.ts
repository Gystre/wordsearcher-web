import { Box } from "../Classes/Box";

export const drawBoxes = (canvas: HTMLCanvasElement, grid: Box[][]) => {
    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[i].length; j++) {
            const box = grid[i][j];
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            box.draw(ctx, "#FF9A00", box.klass);
        }
    }
};
