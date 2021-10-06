import {
  CONSTRUCTS,
  APITYPE,
  DATABASE,
  ApiModel,
} from "../../../../utils/constants";
import { Cdk } from "../../constructs/Cdk";
import { Imports } from "../../constructs/ConstructsImports";
import { CodeMaker } from "codemaker";
import { Property } from "../../../../utils/typescriptWriter";
import {
  lambdaHandlerForAuroradb,
  lambdaHandlerForDynamodb,
  lambdaHandlerForNeptunedb,
  lambdaProperiesHandlerForAuroraDb,
  lambdaProperiesHandlerForDynoDb,
  lambdaProperiesHandlerForMockApi,
  lambdaProperiesHandlerForNeptuneDb,
  lambdaPropsHandlerForAuroradb,
  lambdaPropsHandlerForNeptunedb,
} from "./functions";
import { Lambda } from "../../constructs/Lambda";

type StackBuilderProps = {
  config: ApiModel;
};

class lambdaConstruct {
  outputFile: string = `index.ts`;
  outputDir: string = `lib/${CONSTRUCTS.lambda}`;
  config: ApiModel;
  code: CodeMaker;
  constructor(props: StackBuilderProps) {
    this.config = props.config;
    this.code = new CodeMaker();
  }

  async LambdaConstructFile() {
    const {
      api: { apiName, lambdaStyle, apiType, database , mockApi, architecture },
    } = this.config;
    let mutationsAndQueries: string[] = [];
    if (apiType === APITYPE.graphql) {
      const { queiresFields, mutationFields } = this.config.api;
      mutationsAndQueries = [...queiresFields!, ...mutationFields!];
    }
    let lambdaPropsWithName: string | undefined;
    let lambdaProps: { name: string; type: string }[] | undefined;
    let lambdaProperties: Property[] | undefined;
    this.code.openFile(this.outputFile);
    const cdk = new Cdk(this.code);
    const imp = new Imports(this.code);
    const lambda = new Lambda(this.code);
    imp.importLambda();

    if (mockApi) {
      lambdaProperties = lambdaProperiesHandlerForMockApi(
        apiName,
        apiType,
        lambdaStyle,
        architecture,
        mutationsAndQueries
      );
    }
    if (database === DATABASE.dynamoDB) {
      lambdaProps = [
        {
          name: "tableName",
          type: "string",
        },
      ];
      lambdaPropsWithName = "handlerProps";
      lambdaProperties = lambdaProperiesHandlerForDynoDb(
        lambdaStyle,
        apiName,
        apiType,
        architecture,
        mutationsAndQueries
      );
    }
    if (database === DATABASE.neptuneDB) {
      imp.importEc2();
      lambdaPropsWithName = "handlerProps";
      lambdaProps = lambdaPropsHandlerForNeptunedb();
      lambdaProperties = lambdaProperiesHandlerForNeptuneDb(
        apiName,
        apiType,
        lambdaStyle,
        architecture,
        mutationsAndQueries
      );
    }
    if (database === DATABASE.auroraDB) {
      imp.importEc2();
      imp.importIam();
      lambdaPropsWithName = "handlerProps";
      lambdaProps = lambdaPropsHandlerForAuroradb();
      lambdaProperties = lambdaProperiesHandlerForAuroraDb(
        apiName,
        apiType,
        lambdaStyle,
        architecture,
        mutationsAndQueries
      );
    }
    cdk.initializeConstruct(
      CONSTRUCTS.lambda,
      lambdaPropsWithName,
      () => {
        if (mockApi) {
          lambda.lambdaLayer(apiName);
          mutationsAndQueries.forEach((key: string) => {
            lambda.initializeLambda(apiName, lambdaStyle, mockApi , key);
            this.code.line();
            this.code.line(
              `this.${apiName}_lambdaFn_${key}Arn = ${apiName}_lambdaFn_${key}.functionArn`
            );
            this.code.line();
          });
        }
        if (database === DATABASE.dynamoDB) {
          lambdaHandlerForDynamodb(
            this.code,
            apiName,
            apiType,
            lambdaStyle,
            architecture,
            mutationsAndQueries,
            mockApi
          );
        }
        if (database === DATABASE.neptuneDB) {
          lambdaHandlerForNeptunedb(
            this.code,
            lambdaStyle,
            architecture,
            apiType,
            apiName,
            mutationsAndQueries,
            mockApi
          );
        }
        if (database === DATABASE.auroraDB) {
          lambdaHandlerForAuroradb(
            this.code,
            lambdaStyle,
            architecture,
            apiType,
            apiName,
            mutationsAndQueries,
            mockApi
          );
        }
      },
      lambdaProps,
      lambdaProperties
    );
    this.code.closeFile(this.outputFile);
    await this.code.save(this.outputDir);
  }
}

export const LambdaConstruct = async (
  props: StackBuilderProps
): Promise<void> => {
  const builder = new lambdaConstruct(props);
  await builder.LambdaConstructFile();
};
