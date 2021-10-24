import {
  ApiModel,
  APITYPE,
  DATABASE,
  ARCHITECTURE,
  PanacloudconfigFile,
} from "../../../utils/constants";
import { ApiGatewayConstruct } from "./ApiGateway";
import { AppsyncApiConstruct } from "./Appsync";
import { auroraDBConstruct } from "./AuroraServerless";
import { CdkAppClass } from "./bin";
import { AppsyncConstructTest } from "./CdkTests/Appsync";
import { auroraDBConstructTest } from "./CdkTests/AuroraServerless";
import { dynamodbConstructTest } from "./CdkTests/Dynamodb";
import { lambdaConstructTest } from "./CdkTests/Lambda";
import { neptuneDBConstructTest } from "./CdkTests/Neptune";
import { dynamoDBConstruct } from "./DynamoDB";
import { multipleLambda } from "./Lambda/multipleLambda";
import { customLambda } from "./Lambda/customLambda";
import { singleLambda } from "./Lambda/singleLambda";
import { mockApiTestCollections } from "./MockApi";
import { EditableMockApiTestCollections } from "./MockApi/editableMockApi";
import { neptuneDBConstruct } from "./Neptune";
import { CdkStackClass } from "./Stack";
import { eventBridgeConstruct } from "./EventBridge";

export const generator = async (config: ApiModel, panacloudConfig: PanacloudconfigFile, type: string) => {
  // bin file
  CdkAppClass({ config });

  // stack
  CdkStackClass({ config, panacloudConfig });

  // Appsync or Apigateway && Lambda Files
  if (config.api.apiType === APITYPE.graphql) {
    AppsyncApiConstruct({ config });
    // AppsyncConstructTest({ config });

  } else if (config.api.apiType === APITYPE.rest) {
    ApiGatewayConstruct({ config });
  }

  // Databases
  if (config.api.database === DATABASE.auroraDB) {
    auroraDBConstruct({ config });
    // auroraDBConstructTest({ config });
  }
  if (config.api.database === DATABASE.neptuneDB) {
    neptuneDBConstruct({ config });
    // neptuneDBConstructTest({ config });
  }
  if (config.api.database === DATABASE.dynamoDB) {
    dynamoDBConstruct({ config });
    // dynamodbConstructTest({ config });
  }

  // lambda Test
  // lambdaConstructTest({ config });
  // lambda Construct



  // Single or Multi
  if (config.api.apiType === APITYPE.rest) {
<<<<<<< HEAD
    singleLambda({ config });
=======
      singleLambda({ config });
>>>>>>> 11808cd032eb8288ae3bbf552b7c7fecb14e36e9
  }
  else if (config.api.apiType === APITYPE.graphql) {
    multipleLambda({ config });
    await mockApiTestCollections({ config });
    if (type !== "update") {
      await EditableMockApiTestCollections({ config })
      customLambda({ config });
    }
  }

  if (config.api.architecture === ARCHITECTURE.eventDriven) {
    eventBridgeConstruct({ config })
  }

};
