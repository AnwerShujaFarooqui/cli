import { startSpinner, stopSpinner } from "../../../spinner";

import { contextInfo, generatePanacloudConfig, updatePanacloudConfig } from "../../info";
import {
    Config,
    APITYPE,
    ApiModel,
    PanacloudconfigFile
    // LAMBDASTYLE,
} from "../../../../utils/constants";
import { generator } from "../../generators";
import { introspectionFromSchema, buildSchema } from "graphql";
import { buildSchemaToTypescript } from "../../buildSchemaToTypescript";
import { microServicesDirectiveFieldSplitter } from "../../../../utils/microServicesDirective";

const path = require("path");
const fs = require("fs");
const YAML = require("yamljs");
const exec = require("await-exec");
const fse = require("fs-extra");
const _ = require("lodash");


async function updateYourOwnApi(config: Config, spinner:any) {

    const workingDir = _.snakeCase(path.basename(process.cwd()));

    const model: ApiModel = {
        api: {
            ...config.api,
        },
        workingDir: workingDir,
    };

    let directivesPath = path.resolve(
        __dirname,
        "../../../../utils/awsAppsyncDirectives.graphql"
      );
  
      let scalarPath = path.resolve(
        __dirname,
        "../../../../utils/awsAppsyncScalars.graphql"
      );

    let schema = fs.readFileSync("custom_src/graphql/schema/schema.graphql", "utf8", (err: string) => {
        if (err) {
            stopSpinner(spinner, `Error: ${err}`, true);
            process.exit(1);
        }
    });

    let directives = fs.readFileSync(directivesPath, "utf8", (err: string) => {
        if (err) {
          stopSpinner(spinner, `Error: ${err}`, true);
          process.exit(1);
        }
      });
  
      let scalars = fs.readFileSync(scalarPath, "utf8", (err: string) => {
        if (err) {
          stopSpinner(spinner, `Error: ${err}`, true);
          process.exit(1);
        }
      });

    const gqlSchema = buildSchema(`${directives}\n${schema}`);

    // Model Config
    const queriesFields: any = gqlSchema.getQueryType()?.getFields();
    const mutationsFields: any = gqlSchema.getMutationType()?.getFields();
    model.api.schema = introspectionFromSchema(gqlSchema);
    model.api.queiresFields = [...Object.keys(queriesFields)];
    model.api.mutationFields = [...Object.keys(mutationsFields)];

   
    const fieldSplitterOutput = microServicesDirectiveFieldSplitter(queriesFields,mutationsFields);

        
    model.api.generalFields = fieldSplitterOutput.generalFields;
    model.api.microServiceFields = fieldSplitterOutput.microServiceFields;
    
    const updatedPanacloudConfig = await updatePanacloudConfig(
        model.api.generalFields,
        model.api.microServiceFields,
        spinner
    );

    // Codegenerator Function
    await generator(model, updatedPanacloudConfig);

}

export default updateYourOwnApi;
