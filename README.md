# Kelvin, the thermometer

## Quickstart

Install AWS and CDK cli, configure your profile.

Replace all occurrences of my AccountId with yours -- yeah, I should probably replace that with a pseudo reference.

Run `npm run build`.

Run `cdk deploy --profile your_profile_name` to deploy stack/change sets.

## Changing stuff

Run `cdk diff --profile your_profile_name` to view changes you make in the infrastructure.

Remember to `npm run build` before deploying if you changed the code.

## Certificate shenanigans

I haven't been able to fully automate certificate generation for devices, sou you'll have to create the certs and manually attach them to the thing policy `ThermometerPolicy` and the thing itself via the AWS Console.

Once you do that, you'll be able to download 3 files that you need to copy over to yout IoT device:

1. The AWS IoT Root CA cert (you can also download it [here](https://docs.aws.amazon.com/iot/latest/developerguide/server-authentication.html#server-authentication-certs), get the 2048bit)
1. The device certificate
1. The device private key

Copy them over to your device, download the Python AWS IoT SDK, go over to the `samples/basicPubSub` folder and tinker with the `basicPubSub.py` file (I've added mine as a sample [here](device_src/basicPubSub.py) but it's definitely rough around the edges).

When invoking the `basicPubSub.py` you'll need to pass on the certs paths, something like this:

```
python basicPubSub.py -e a244zs5ytwtkpu-ats.iot.us-east-1.amazonaws.com -r ~/AmazonRootCA1.pem -c ~/6cfe34b0cf-certificate.pem.crt -k ~/6cfe34b0cf-private.pem.key -t 'thermometer/termo1/payload' -id Thermometer
```

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template
