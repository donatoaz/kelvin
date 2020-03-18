import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import Kelvin = require('../lib/kelvin-stack');

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new Kelvin.KelvinStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
