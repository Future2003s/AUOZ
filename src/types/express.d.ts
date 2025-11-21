declare module "express" {
  export interface Request {
    [key: string]: any;
  }

  export interface Response {
    status: (code: number) => Response;
    json: (body: any) => Response;
    [key: string]: any;
  }

  export type NextFunction = (...args: any[]) => void;
}

