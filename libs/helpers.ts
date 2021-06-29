const fs = require('fs');
const AWS_ = require('./aws');
const s3 = new AWS_.S3();
const dynamo = new AWS_.DynamoDB.DocumentClient();
const BN = require('bn.js');

const splitInteger = (number, parts) => {
  const remainder = number % parts;
  const baseValue = (number - remainder) / parts;

  return Array(parts)
    .fill(baseValue)
    .fill(baseValue + 1, parts - remainder);
};

const uniqueify = (a) =>
  [...new Set(a.map((o) => JSON.stringify(o)))].map((s) => JSON.parse(s as string));

const saveToFile = (fileName, data) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(fileName, JSON.stringify(data), (err) => {
      if (err) reject(err);
      else resolve(true);
    });
  });
};

const readFile = (fileName) => {
  return new Promise((resolve, reject) => {
    fs.readFile(fileName, 'utf-8', (err, data) => {
      if (err) return reject(err);
      else return resolve(JSON.parse(data));
    });
  });
};

const saveJsonToFileS3 = async (Key, data) => {
  try {
    await s3
      .putObject({
        Key,
        Bucket: process.env.FileBucket,
        Body: JSON.stringify(data),
        ContentType: 'application/json',
      })
      .promise();
  } catch (error) {
    console.log(error);
  }
};

const readJsonFileS3 = async (Key) => {
  try {
    const response = await s3
      .getObject({
        Bucket: process.env.FileBucket,
        Key,
      })
      .promise();
    const json = JSON.parse(response.Body.toString());
    return json;
  } catch (error) {
    console.log(error);
  }
};

const getDayKey = () => {
  const dateObj = new Date();
  const month = dateObj.getUTCMonth() + 1; //months from 1-12
  const day = dateObj.getUTCDate();
  const year = dateObj.getUTCFullYear();

  const key = year + '/' + month + '/' + day;
  return key;
};

const SaveToDynamo = async (table, pk, sk, data) => {
  console.log('Saving', pk, sk, 'to', table);
  await dynamo
    .put({
      TableName: table,
      Item: {
        ...data,
        pk,
        sk,
        lastUpdated: new Date().getTime(), // Last updated
      },
    })
    .promise();
};
const GetFromDynamo = async (table, pk, sk) => {
  return (
    await dynamo
      .get({
        TableName: table,
        Key: {
          pk,
          sk,
        },
      })
      .promise()
  ).Item;
};

const _QueryFromDynamo = async ({
  table,
  KeyConditionExpression,
  ExpressionAttributeValues,
  perPage = 1000,
  // index,
  ScanIndexForward = false,
  // ExclusiveStartKey,
  ExpressionAttributeNames,
  FilterExpression,
}) => {
  const params = {
    TableName: table,
    KeyConditionExpression,
    ExpressionAttributeValues,
    ScanIndexForward,
    Limit: perPage,
    ExpressionAttributeNames,
    FilterExpression,
  };
  // if (index) {
  //   params.IndexName = index;
  // }
  // if (ExclusiveStartKey) {
  //   params.ExclusiveStartKey = ExclusiveStartKey;
  // }

  return dynamo.query(params).promise();
};

/** Query no items */
const QueryFromDynamo = async ({
  table,
  KeyConditionExpression,
  ExpressionAttributeValues,
  perPage = 1000,
  // index,
  // ExclusiveStartKey,
}) => {
  const params = {
    TableName: table,
    KeyConditionExpression,
    ExpressionAttributeValues,
    ScanIndexForward: false,
    Limit: perPage,
  };
  // if (index) {
  //   params.index = index;
  // }
  // if (ExclusiveStartKey) {
  //   params.ExclusiveStartKey = ExclusiveStartKey;
  // }

  return (await dynamo.query(params).promise()).Items;
};

export {
  readJsonFileS3,
  saveJsonToFileS3,
  readFile,
  uniqueify,
  saveToFile,
  splitInteger,
  getDayKey,
  SaveToDynamo,
  GetFromDynamo,
  QueryFromDynamo,
  _QueryFromDynamo,
};
