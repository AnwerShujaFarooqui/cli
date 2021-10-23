import { CodeMaker } from "codemaker";
import {ApiModel,APITYPE,CONSTRUCTS,DATABASE} from "../../../../utils/constants";
import { apiManager } from "../../constructs/ApiManager";
import { Appsync } from "../../constructs/Appsync";
import { AuroraServerless } from "../../constructs/AuroraServerless";
import { Cdk } from "../../constructs/Cdk";
import { DynamoDB } from "../../constructs/Dynamodb";
import { Lambda } from "../../constructs/Lambda";
import { Neptune } from "../../constructs/Neptune";
import {
  importHandlerForStack,
  LambdaAccessHandler,
  propsHandlerForApiGatewayConstruct,
} from "./functions";
const _ = require("lodash");

type StackBuilderProps = {
  config: ApiModel;
};

export class CdkStack {
  outputFile: string = `index.ts`;
  outputDir: string = `lib`;
  config: ApiModel;
  code: CodeMaker;

  constructor(props: StackBuilderProps) {
    this.config = props.config;
    this.code = new CodeMaker();
  }

  async CdkStackFile() {
    this.outputFile = `${this.config.workingDir}-stack.ts`;
    this.code.openFile(this.outputFile);
    const { apiName, database, lambdaStyle, apiType , schema } = this.config.api;
    let mutations = {};
    let queries = {};
    if (apiType === APITYPE.graphql) {
      mutations = schema.type.Mutation ? schema.type.Mutation : {};
      queries = schema.type.Query ? schema.type.Query : {};
    }
    const mutationsAndQueries = { ...mutations, ...queries };
    const cdk = new Cdk(this.code);
    const manager = new apiManager(this.code);
    const dynamodb = new DynamoDB(this.code);
    const neptune = new Neptune(this.code);
    const aurora = new AuroraServerless(this.code);
    const lambda = new Lambda(this.code);
    const appsync = new Appsync(this.code);
    importHandlerForStack(database, apiType, this.code);
    this.code.line();

    cdk.initializeStack(
      `${_.upperFirst(_.camelCase(this.config.workingDir))}`,
      () => {
        manager.apiManagerInitializer(apiName);
        this.code.line();
        if (database == DATABASE.dynamoDB) {
          dynamodb.dynmaodbConstructInitializer(apiName, this.code);
          this.code.line();
        } else if (database == DATABASE.neptuneDB) {
          neptune.neptunedbConstructInitializer(apiName, this.code);
          this.code.line();
        } else if (database == DATABASE.auroraDB) {
          aurora.auroradbConstructInitializer(apiName, this.code);
          this.code.line();
        }
        if (lambdaStyle || apiType === APITYPE.rest) {
          lambda.lambdaConstructInitializer(apiName, database, this.code);
        }
        database === DATABASE.dynamoDB &&
          LambdaAccessHandler(
            this.code,
            apiName,
            lambdaStyle,
            apiType,
            mutationsAndQueries
          );

        if (apiType === APITYPE.graphql) {
          appsync.appsyncConstructInitializer(
            apiName,
            lambdaStyle,
            database,
            mutationsAndQueries,
            this.code
          );
        }
        if (apiType === APITYPE.rest) {
          this.code.line(
            `const ${apiName} = new ${CONSTRUCTS.apigateway}(this,"${apiName}${CONSTRUCTS.apigateway}",{`
          );
          propsHandlerForApiGatewayConstruct(this.code, apiName);
          this.code.line("})");
        }
      }
    );

    this.code.closeFile(this.outputFile);
    await this.code.save(this.outputDir);
  }
}

export const CdkStackClass = async (
  props: StackBuilderProps
): Promise<void> => {
  const builder = new CdkStack(props);
  await builder.CdkStackFile();
};