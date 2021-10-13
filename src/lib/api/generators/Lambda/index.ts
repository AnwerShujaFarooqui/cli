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
  lambdaProperiesHandlerForNeptuneDb,
  lambdaProperiesHandlerForNestedResolver,
  lambdaPropsHandlerForAuroradb,
  lambdaPropsHandlerForNeptunedb,
} from "./functions/index";
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
    const {api: { apiName, apiType, database,nestedResolver,schemaTypes }} = this.config;
    let mutationsAndQueries: string[] = [];
    if (apiType === APITYPE.graphql) {
      const { queiresFields, mutationFields } = this.config.api;
      mutationsAndQueries = [...queiresFields!, ...mutationFields!];
    }
    let lambdaPropsWithName: string | undefined;
    let lambdaProps: { name: string; type: string }[] | undefined;
    let lambdaProperties: Property[] | undefined = [];
    this.code.openFile(this.outputFile);
    const cdk = new Cdk(this.code);
    const imp = new Imports(this.code);
    const lambda = new Lambda(this.code);
    imp.importLambda();

    if(nestedResolver){
      lambdaProperties = [...lambdaProperties,...lambdaProperiesHandlerForNestedResolver(apiName,apiType,schemaTypes!,database)]
    }
   
    if (!database) {
      mutationsAndQueries.forEach((key)=>{
        lambdaProperties?.push({
          name: `${apiName}_lambdaFn_${key}Arn`,
          typeName: "string",
          accessModifier: "public",
          isReadonly: true,
        })
      })
    }
    else if (database === DATABASE.dynamoDB) {
      lambdaProps = [
        {
          name: "tableName",
          type: "string",
        },
      ];
      lambdaPropsWithName = "handlerProps";
      lambdaProperties = [...lambdaProperties,...lambdaProperiesHandlerForDynoDb(
        apiName,
        apiType,
        mutationsAndQueries,
      )];
    }
    else if (database === DATABASE.neptuneDB) {
      imp.importEc2();
      lambdaPropsWithName = "handlerProps";
      lambdaProps = lambdaPropsHandlerForNeptunedb();
      lambdaProperties = [...lambdaProperties,...lambdaProperiesHandlerForNeptuneDb(
        apiName,
        apiType,
        mutationsAndQueries,
      )];
    }
    else if (database === DATABASE.auroraDB) {
      imp.importEc2();
      imp.importIam();
      lambdaPropsWithName = "handlerProps";
      lambdaProps = lambdaPropsHandlerForAuroradb();
      lambdaProperties=[...lambdaProperties,...lambdaProperiesHandlerForAuroraDb(
        apiName,
        apiType,
        mutationsAndQueries,
      )]
    }
  
    cdk.initializeConstruct(
      CONSTRUCTS.lambda,
      lambdaPropsWithName,
      () => {
        if (!database) {
          lambda.lambdaLayer(apiName)
          mutationsAndQueries.forEach((key: string) => {
            lambda.initializeLambda(apiName , key);
            this.code.line();
            this.code.line(
              `this.${apiName}_lambdaFn_${key}Arn = ${apiName}_lambdaFn_${key}.functionArn`
            );
            this.code.line();
          });
        }
        else if (database === DATABASE.dynamoDB) {
          lambdaHandlerForDynamodb(
            this.code,
            apiName,
            apiType,
            mutationsAndQueries,
            nestedResolver!,
            schemaTypes!
          );
        }
        else if (database === DATABASE.neptuneDB) {
          lambdaHandlerForNeptunedb(
            this.code,
            apiType,
            apiName,
            mutationsAndQueries,
            nestedResolver!,
            schemaTypes!
          );
        }
        else if (database === DATABASE.auroraDB) {
          lambdaHandlerForAuroradb(
            this.code,
            apiType,
            apiName,
            mutationsAndQueries,
            nestedResolver!,
            schemaTypes!
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