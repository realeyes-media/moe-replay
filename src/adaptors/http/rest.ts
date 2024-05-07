import { RequestPromise } from "request-promise-native";
import * as request from "request";
import { Cookie } from "tough-cookie";

export interface CookieResponse {
  result: any;
  cookie: request.Cookie;
}
export abstract class Rest {
  public abstract async get(
    url: string,
    savePath: string,
    headers?: { [key: string]: any }
  ): Promise<RequestPromise>;
  public abstract async getWithCookie(
    url: string,
    savePath: string,
    cookie: request.Cookie[],
    headers?: { [key: string]: any }
  ): Promise<CookieResponse>;
  public abstract async post(
    url: string,
    data: any,
    headers?: { [key: string]: any }
  ): Promise<any>;
  public abstract async delete(
    url: string,
    headers?: { [key: string]: any }
  ): Promise<any>;
  public abstract async put(
    url: string,
    data: any,
    headers?: { [key: string]: any }
  ): Promise<any>;
  public abstract async patch(
    url: string,
    data: any,
    headers?: { [key: string]: any }
  ): Promise<any>;
  public abstract async head(
    url: string,
    headers?: { [key: string]: any }
  ): Promise<any>;
  public abstract async getStream(
    url: string,
    savePath: string,
    headers?: { [key: string]: any }
  ): Promise<string | Buffer>;
}
