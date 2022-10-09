const {
    runStubFunctionFromBindings,
    createHttpTrigger,
} = require("stub-azure-function-context");

import { run as identifySearch } from "../identifySearch";

/*
Jest testing before deploy could be very useful if I decide to use more azure functions in the future 
but right now it's too complicated and creates too many problems to fix in order to get working. Don't know how to get environment vars
to work with so just gonna give up for now :/
*/

describe("getSolve", () => {
    it("solves a search", async () => {
        const context = await runStubFunctionFromBindings(
            identifySearch,
            [
                {
                    type: "httpTrigger",
                    name: "req",
                    direction: "in",
                    data: createHttpTrigger(
                        "GET",
                        "http://example.com",
                        {},
                        {},
                        undefined,
                        {
                            url: "https://cdn.discordapp.com/attachments/200994742782132224/1025203856046567594/ButterflyWordSearch.png",
                        }
                    ),
                },
                { type: "http", name: "res", direction: "out" },
            ],
            new Date()
        );
        expect(context.res.body).toHaveProperty("error", 3);
    });
});
