import { ApiModel, APITYPE, DATABASE, TEMPLATE } from "../../../utils/constants";
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
import { LambdaConstruct } from "./Lambda";
import { handlers } from "./Lambda/handler";
import { lambdaHandlers } from "./Lambda/lambdaHandlers";
import { mockApiTestCollections } from "./MockApi";
import { neptuneDBConstruct } from "./Neptune";
import { CdkStackClass } from "./Stack";

export const generator = async (config: ApiModel) => {
  // bin file
  CdkAppClass({ config });

  // stack
  CdkStackClass({ config });

  // Appsync or Apigateway
  if (config.api.apiType === APITYPE.graphql) {
    AppsyncApiConstruct({ config });
    AppsyncConstructTest({ config });
  } else if (config.api.apiType === APITYPE.rest) {
    ApiGatewayConstruct({ config });
  }

  // Databases
  if (config.api.database === DATABASE.auroraDB) {
    auroraDBConstruct({ config });
    auroraDBConstructTest({ config });
  }
  if (config.api.database === DATABASE.neptuneDB) {
    neptuneDBConstruct({ config });
    neptuneDBConstructTest({ config });
  }
  if (config.api.database === DATABASE.dynamoDB) {
    dynamoDBConstruct({ config });
    dynamodbConstructTest({ config });
  }

  // lambda Test
  lambdaConstructTest({ config });
  // lambda Construct
  LambdaConstruct({ config });

  // handlers
  handlers({ config });
  lambdaHandlers({ config });

  if(config.api.template === TEMPLATE.mockApi){
    mockApiTestCollections({ config })
  }
};
