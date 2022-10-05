import { Set } from "typescript";
import { Box } from "../Classes/Box";
import { TrieNode } from "../Classes/TrieNode";
import { cleanString } from "./cleanString";

interface Match {
    match: Box;
    word: string;
    start: Position;
    end: Position;
}

interface Position {
    colIdx: number;
    rowIdx: number;
}

type Displacement = Position;
const directions: Displacement[] = [
    { colIdx: -1, rowIdx: 1 }, // Top Left
    { colIdx: 0, rowIdx: 1 }, // Top Center
    { colIdx: 1, rowIdx: 1 }, // Top Right
    { colIdx: 1, rowIdx: 0 }, // Right Center
    { colIdx: 1, rowIdx: -1 }, // Bottom Right
    { colIdx: 0, rowIdx: -1 }, // Bottom Center
    { colIdx: -1, rowIdx: -1 }, // Bottom Left
    { colIdx: -1, rowIdx: 0 }, // Left Center
];

export const solveWordSearch = (
    debugCanvas: HTMLCanvasElement,
    tempCanvas: HTMLCanvasElement,
    grid: Box[][],
    words: string[] // whatever is modified here will be updated in the state
): Set<string> => {
    // redraw the image so can easily add more words and stuff
    const debugCtx = debugCanvas.getContext("2d");
    if (!debugCtx) return new Set<string>();
    debugCtx.drawImage(tempCanvas, 0, 0);

    const trie = new TrieNode();
    for (const w of words) {
        trie.add(cleanString(w));
    }

    const matches: Match[] = [];

    for (let startRowIdx = 0; startRowIdx < grid.length; startRowIdx++) {
        const row = grid[startRowIdx];
        for (let startColIdx = 0; startColIdx < row.length; startColIdx++) {
            for (const direction of directions) {
                let rowIdx = startRowIdx;
                let colIdx = startColIdx;

                let seen = "";

                while (
                    rowIdx >= 0 &&
                    rowIdx < grid.length &&
                    colIdx >= 0 &&
                    colIdx < grid[rowIdx].length
                ) {
                    const box = grid[rowIdx][colIdx];
                    seen += box.klass;

                    const result = trie.isPrefix(seen);

                    if (result === null) {
                        break;
                    }

                    if (result.isComplete) {
                        matches.push({
                            match: box,
                            word: seen,
                            start: {
                                rowIdx: startRowIdx,
                                colIdx: startColIdx,
                            },
                            end: { rowIdx, colIdx },
                        });
                    }

                    if (!result.hasMore) {
                        break;
                    }

                    rowIdx += direction.rowIdx;
                    colIdx += direction.colIdx;
                }
            }
        }
    }

    const ctx = debugCanvas.getContext("2d");
    if (!ctx) return new Set<string>();

    const ret = new Set<string>();
    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        ret.add(cleanString(match.word));
        const start = grid[match.start.rowIdx][match.start.colIdx];
        const end = grid[match.end.rowIdx][match.end.colIdx];
        start.draw(ctx, "green", match.word);
        start.drawLine(ctx, end, "green");
    }

    return ret;
};
