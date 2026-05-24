import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { otpConfig } from './config.js';

let snsClient;

function getClient() {
  if (!snsClient) {
    snsClient = new SNSClient({ region: otpConfig.awsRegion });
  }
  return snsClient;
}

export async function sendOtpSms(mobileE164, code) {
  const message = `Your Sakal Maratha verification code is ${code}. Valid for ${otpConfig.expiryMinutes} minutes. Do not share this code.`;

  if (otpConfig.devLogCode) {
    console.info(`[OTP dev] ${mobileE164} → ${code}`);
    return;
  }

  await getClient().send(
    new PublishCommand({
      PhoneNumber: mobileE164,
      Message: message,
      MessageAttributes: {
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional',
        },
      },
    })
  );
}
