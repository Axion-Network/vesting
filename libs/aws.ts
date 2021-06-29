// var AWSXRay = require('aws-xray-sdk');
var AWS = require('aws-sdk');

// if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'test') {
//     AWS = AWSXRay.captureAWS(AWS);
// }

AWS.config.update({ region: 'us-east-1' });
var credentials = new AWS.SharedIniFileCredentials({ profile: 'axion' });
AWS.config.credentials = credentials;

module.exports = AWS;
