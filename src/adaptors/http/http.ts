import * as rp from "request-promise-native";
import { URL } from "url";
import * as request from "request";
import promisify = require("promisify-node");
import * as config from "../../config/config";
import { WriteStream } from "fs";
import { Rest, CookieResponse } from "./rest";
import * as tough from "tough-cookie";

const fs = promisify("fs");

export const type = "rest";
export const name = "http";
export class Http extends Rest {
  constructor() {
    super();
  }

  public async get(
    url: string,
    savePath: string,
    headers: { [key: string]: any } = {}
  ): Promise<rp.RequestPromise> {
    const options: rp.RequestPromiseOptions = {
      headers: headers,
      resolveWithFullResponse: true
    };
    return await rp.get(url, options);
  }

  public async getWithCookie(
    url: string,
    savePath: string,
    cookie: request.Cookie[],
    headers: { [key: string]: any } = {}
  ): Promise<CookieResponse> {
    const toughcookie = tough.Cookie;
    const cookieString = cookie.toString();
    const myCookie = toughcookie.parse(cookieString);
    const cookies = [];
    if (cookie) {
      cookie.forEach(cook => {
        cookies.push(toughcookie.parse(cook.toString()));
      });
    }
    const urlObject = new URL(url);
    const requestCookie = request.cookie(`${myCookie.key}=${myCookie.value}`);
    const cookieUrl = `${urlObject.protocol}//${myCookie.domain}`;
    const cookieJar = rp.jar();
    cookieJar.setCookie(requestCookie, cookieUrl);
    const options: rp.RequestPromiseOptions = {
      headers: headers,
      resolveWithFullResponse: true,
      jar: cookieJar
    };
    const response = await rp.get(url, options);
    return {
      result: response,
      cookie: requestCookie
    };
  }

  public async post(
    url: string,
    data: any,
    headers: { [key: string]: any } = {}
  ): Promise<rp.RequestPromise> {
    const options: rp.RequestPromiseOptions = {
      form: {
        data: data
      },
      headers: headers
    };
    return await rp.post(url, options);
  }

  public async delete(
    url: string,
    headers: { [key: string]: any } = {}
  ): Promise<rp.RequestPromise> {
    const options: rp.RequestPromiseOptions = {
      headers: headers
    };
    return await rp.delete(url);
  }

  public async put(
    url: string,
    data: any,
    headers: { [key: string]: any } = {}
  ): Promise<rp.RequestPromise> {
    const options: rp.RequestPromiseOptions = {
      formData: {
        data: data
      },
      headers: headers
    };
    return await rp.put(url, options);
  }

  public async patch(
    url: string,
    data: any,
    headers: { [key: string]: any } = {}
  ): Promise<rp.RequestPromise> {
    const options: rp.RequestPromiseOptions = {
      formData: {
        data: data
      },
      headers: headers
    };
    return await rp.patch(url, options);
  }

  public async head(
    url: string,
    headers: { [key: string]: any } = {}
  ): Promise<rp.RequestPromise> {
    const options: rp.RequestPromiseOptions = {
      headers: headers
    };
    return await rp.head(url);
  }

  public async getStream(
    url: string,
    savePath: string,
    headers: { [key: string]: any } = {}
  ): Promise<string | Buffer> {
    const downloadStream: WriteStream = request(url).pipe(
      fs.createWriteStream(savePath)
    );

    return this.downloadedFile(downloadStream);
  }

  private downloadedFile(writeStream: WriteStream): Promise<string | Buffer> {
    return new Promise((resolve, reject) => {
      writeStream
        .on("finish", () => {
          resolve(writeStream.path);
        })
        .on("error", error => {
          reject(error);
        });
    });
  }
}

export function create() {
  return new Http();
}
