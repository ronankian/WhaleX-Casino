import crypto from "crypto";

export function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt + ":" + derivedKey.toString("hex"));
    });
  });
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (!hash) {
      return resolve(false);
    }
    const [salt, key] = hash.split(":");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(key === derivedKey.toString("hex"));
    });
  });
}

export enum Method {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
}

export interface IRequest {
  method: Method;
  path: string;
  body?: any;
  user?: any;
}

export interface IResponse {
  statusCode: number;
  body: any;
}

export class Api {
  static ok(body: any): IResponse {
    return { statusCode: 200, body };
  }

  static badRequest(message: string): IResponse {
    return { statusCode: 400, body: { message } };
  }

  static unauthorized(): IResponse {
    return { statusCode: 401, body: { message: "Unauthorized" } };
  }

  static notFound(message: string): IResponse {
    return { statusCode: 404, body: { message } };
  }

  static internalError(message: string): IResponse {
    return { statusCode: 500, body: { message } };
  }
}

export interface IHandler {
  method?: Method;
  path?: string;
  canHandle(request: IRequest): boolean;
  handle(request: IRequest): Promise<IResponse>;
}

export function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
} 