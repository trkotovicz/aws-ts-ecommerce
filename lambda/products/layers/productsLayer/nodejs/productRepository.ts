import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { v4 as uuid } from 'uuid';

export interface Product {
  id: string;
  productName: string;
  code: string;
  price: number;
  model: string;
}

// Doc DynamoDB (Class: AWS.DynamoDB.DocumentClient)
// https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html

export class ProductRepository {
  private ddbClient: DocumentClient;
  private productsDdb: string;

  constructor(ddbClient: DocumentClient, productsDdb: string) {
    this.ddbClient = ddbClient;
    this.productsDdb = productsDdb;
  }

  async getAllProducts(): Promise<Product[]> {
    // o método scan retorna tudo, deve ser evitado ao máximo, pois se não vai gerar alto custo na aws
    const data = await this.ddbClient.scan({
      TableName: this.productsDdb
    }).promise();
    return data.Items as Product[];
  }

  async getProductById(productId: string): Promise<Product> {
    const data = await this.ddbClient.get({
      TableName: this.productsDdb,
      Key: {
        id: productId
      }
    }).promise();
    if (data.Item) return data.Item as Product;
    else throw new Error('Product not found');
  }

  async create(product: Product): Promise<Product> {
    product.id = uuid();
    await this.ddbClient.put({
      TableName: this.productsDdb,
      Item: product
    }).promise();
    return product;
  }

  async deleteProduct(productId: string): Promise<Product> {
    const data = await this.ddbClient.delete({
      TableName: this.productsDdb,
      Key: {
        id: productId
      },
      ReturnValues: 'ALL_OLD'
    }).promise();
    if (data.Attributes) return data.Attributes as Product;
    else throw new Error('Product not found');
  }

  async updateProduct(productId: string, product: Product): Promise<Product> {
    const data = await this.ddbClient.update({
      TableName: this.productsDdb,
      Key: {
        id: productId
      },
      ConditionExpression: 'attribute_exists(id)',
      ReturnValues: 'UPDATED_NEW',
      UpdateExpression: 'set productName = :n, code = :c, price = :p, model = :m',
      ExpressionAttributeValues: {
        ':n': product.productName,
        ':c': product.code,
        ':p': product.price,
        ':m': product.model,
      }
    }).promise();
    data.Attributes!.id = productId;
    return data.Attributes as Product;
  }
}