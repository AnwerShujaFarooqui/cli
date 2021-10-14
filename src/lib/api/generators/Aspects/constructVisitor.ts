import { CodeMaker } from "codemaker";
import { TypeScriptWriter } from '../../../../utils/typescriptWriter'
import { Imports } from "../../constructs/ConstructsImports";



class ConstructVisitor {
    constructor() {
    }

    async DefineConstructVisitor(code: CodeMaker) {
        const ts = new TypeScriptWriter(code);

        const imp = new Imports(code);

        imp.importIconstruct();
        imp.importIaspect();
        imp.importLambda();

        ts.writeBasicClassBlock({ name: "ConstructVisitor", export: true, implements: "IAspect" }, undefined, undefined, () => {
        },
            [{
                static: false, name: "visit", visibility: "public", outputType: "void", props: "node: IConstruct", content: () => {
                    code.openBlock("if (node instanceof lambda.Function)")
                    code.closeBlock();
                }
            }
            ]
        )



    }

}



export const defineConstructVisitor = async (
    code: CodeMaker
): Promise<void> => {
    const builder = new ConstructVisitor();
    await builder.DefineConstructVisitor(code);
};
