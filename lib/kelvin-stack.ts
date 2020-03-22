import * as cdk from "@aws-cdk/core";
import {
  Effect,
  PolicyStatement,
  Role,
  ServicePrincipal,
  Policy
} from "@aws-cdk/aws-iam";
import * as cw from "@aws-cdk/aws-cloudwatch";
import * as sns from "@aws-cdk/aws-sns";
import * as sqs from "@aws-cdk/aws-sqs";
import {
  CfnThing,
  CfnCertificate,
  CfnPolicy,
  CfnTopicRule,
  CfnPolicyPrincipalAttachment,
  CfnThingPrincipalAttachment
} from "@aws-cdk/aws-iot";

import { readFileSync } from "fs";
import * as path from "path";

export class KelvinStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const thing = new CfnThing(this, "Thermometer", {
      thingName: "Thermometer"
    });

    const policyDocument: any = readFileSync(
      path.join(__dirname, "/policies/thermometer_policy.json"),
      "ascii"
    );

    new CfnPolicy(this, "ThermometerPolicy", {
      policyName: "ThermometerPolicy",
      policyDocument: JSON.parse(policyDocument)
    });

    const snsTopic = new sns.Topic(this, "ThermometerSnsTopic", {
      displayName: "ThermometerSnsTopic",
      topicName: "ThermometerSnsTopic"
    });

    const sqsDlq = new sqs.Queue(this, "ThermometerDlq", {
      queueName: "ThermometerDLQ"
    });

    const actionRole = new Role(this, "ThermometerActionRole", {
      assumedBy: new ServicePrincipal("iot.amazonaws.com")
    });

    actionRole.attachInlinePolicy(
      new Policy(this, "IotPublishToSnsPolicy", {
        statements: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ["sns:Publish"],
            resources: [snsTopic.topicArn]
          }),
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ["cloudwatch:PutMetricData"],
            resources: ["*"]
          }),
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ["sqs:SendMessage"],
            resources: [sqsDlq.queueArn]
          })
        ]
      })
    );

    const snsAction: CfnTopicRule.SnsActionProperty = {
      roleArn: actionRole.roleArn,
      targetArn: snsTopic.topicArn,
      messageFormat: "RAW"
    };

    const cloudWatchMetricAction: CfnTopicRule.CloudwatchMetricActionProperty = {
      roleArn: actionRole.roleArn,
      metricName: "temperature",
      metricNamespace: "IoTThermometer",
      metricUnit: "None",
      metricValue: "${temperature}",
      metricTimestamp: "${timestamp}"
    };

    new cdk.CfnInclude(this, "FeverAlarm", {
      template: JSON.parse(
        readFileSync(
          path.join(__dirname, "cfn_templates", "fever_alarm.json")
        ).toString()
      )
    });

    const sqsDlqAction: CfnTopicRule.SqsActionProperty = {
      roleArn: actionRole.roleArn,
      queueUrl: sqsDlq.queueUrl
    };

    new CfnTopicRule(this, "ThermometerSnsRule", {
      ruleName: "ThermometerSnsRule",
      topicRulePayload: {
        actions: [
          {
            sns: snsAction
          }
        ],
        ruleDisabled: false,
        sql: "SELECT * FROM 'thermometer/+/payload'",
        errorAction: {
          sqs: sqsDlqAction
        }
      }
    });

    new CfnTopicRule(this, "ThermometerCloudWatchMetricRule", {
      ruleName: "ThermometerCloudWatchRule",
      topicRulePayload: {
        actions: [
          {
            cloudwatchMetric: cloudWatchMetricAction
          }
        ],
        ruleDisabled: false,
        sql: "SELECT * FROM 'thermometer/+/payload'",
        errorAction: {
          sqs: sqsDlqAction
        }
      }
    });
  }
}
