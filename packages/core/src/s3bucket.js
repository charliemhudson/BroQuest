// s3Interface.js
import AWS from "aws-sdk";

const s3 = new AWS.S3();

export default {
  getObject: (params) => s3.getObject(params).promise(),
  putObject: (params) => s3.upload(params).promise(),
  listObjects: (params) => s3.listObjectsV2(params).promise(),
  deleteObject: (params) => s3.deleteObject(params).promise(),
  copyObject: (params) => s3.copyObject(params).promise(),
};
